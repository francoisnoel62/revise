// ABOUTME: Server action for the whole-book preview: lazily generates and caches the export PDF.
// ABOUTME: Returns navigation metrics (chapter page offsets, counts); the PDF bytes are served by a route.

'use server';

import type { JSONContent } from '@tiptap/core';
import type { BackMatterData, FrontMatterData } from '@/domain/interfaces/DocumentExporter';
import type { BookPreviewCacheEntry } from '@/domain/entities/BookPreviewCacheEntry';
import { PublicationProfile, type PublicationProfileId } from '@/domain/value-objects/PublicationProfile';
import { DEFAULT_TOC_PREFERENCES } from '@/domain/value-objects/TocPreferences';
import { computeBookPreviewContentHash } from '@/application/services/bookPreviewContentHash';
import { tagSubtitleHeadings } from '@/application/services/subtitleAnchors';
import { config } from '@/infrastructure/config/env';
import {
  BOOK_PREVIEW_PROFILES,
  type BookPreviewProfileId,
  type BookPreviewChapterNav,
  type BookPreviewData,
} from './book-preview-types';
import {
  type ActionResult,
  getAuthenticatedUserId,
  getRepository,
  getMetadataRepo,
  getProjectSettingsRepo,
  getBookPreviewCacheRepo,
  getBookPreviewCacheComputer,
  withErrorHandling,
} from './utils';

function isPreviewProfile(id: PublicationProfileId): id is BookPreviewProfileId {
  return (BOOK_PREVIEW_PROFILES as readonly string[]).includes(id);
}

export async function getBookPreviewDataAction(
  projectId: string,
  requestedProfileId?: BookPreviewProfileId,
): Promise<ActionResult<BookPreviewData>> {
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) return auth.error;

  return withErrorHandling(async () => {
    const repository = await getRepository();
    const project = await repository.loadProject(auth.userId, projectId);
    if (!project) throw new Error('Projet non trouvé');

    const settingsRepo = await getProjectSettingsRepo();
    const metadataRepo = await getMetadataRepo();

    const [settings, dedicationMeta, epigraphMeta, legalNoticeMeta, legacyCopyrightMeta] = await Promise.all([
      settingsRepo.findByProjectId(auth.userId, projectId),
      metadataRepo.findByProjectAndType(auth.userId, projectId, 'dedication'),
      metadataRepo.findByProjectAndType(auth.userId, projectId, 'epigraph'),
      metadataRepo.findByProjectAndType(auth.userId, projectId, 'legal-notice'),
      // Legacy fallback: legal mentions used to live under the 'copyright' type.
      metadataRepo.findByProjectAndType(auth.userId, projectId, 'copyright'),
    ]);

    const authorContributor = settings?.getContributors().find((c) => c.role === 'author');
    const frontMatter: FrontMatterData = {
      title: settings?.getTitle() ?? project.getTitle(),
      subtitle: settings?.getSubtitle(),
      authorName: authorContributor?.name,
      dedicationContent: dedicationMeta?.getContent() || undefined,
      epigraphContent: epigraphMeta?.getContent() || undefined,
    };
    const backMatter: BackMatterData = {
      legalNoticeContent:
        legalNoticeMeta?.getContent() || legacyCopyrightMeta?.getContent() || undefined,
      isbn: settings?.getIsbn(),
    };

    const activeProfileId: PublicationProfileId = settings?.getPublicationProfileId() ?? 'kdp-6x9';

    // passerelle has no paginated whole-book preview (share/DOCX target).
    if (!requestedProfileId && activeProfileId === 'passerelle') {
      return {
        projectTitle: project.getTitle(),
        profileId: 'passerelle',
        isPasserelle: true,
        availableProfiles: BOOK_PREVIEW_PROFILES,
        chapters: [],
        totalPageCount: 0,
        frontMatterPageCount: 0,
      };
    }

    const profileId: BookPreviewProfileId =
      requestedProfileId ?? (isPreviewProfile(activeProfileId) ? activeProfileId : 'kdp-6x9');
    const levelStyles = settings?.getLevelStyleSet(profileId)?.values;
    const tocPreferences = settings?.getTocPreferences() ?? DEFAULT_TOC_PREFERENCES;

    const orderedChapters = project
      .getChapters()
      .slice()
      .sort((a, b) => a.getOrder() - b.getOrder());

    const contentHash = computeBookPreviewContentHash({
      chapters: orderedChapters.map((ch) => ({ id: ch.getId(), content: ch.getContent() })),
      frontMatter,
      backMatter,
      levelStyles,
      tocDepth: tocPreferences.depth,
      tocStyle: tocPreferences.style,
    });

    const cacheRepo = await getBookPreviewCacheRepo();
    let entry = await cacheRepo.loadMetrics(projectId, profileId, auth.userId);

    if (!entry || entry.getContentHash() !== contentHash) {
      const assetBaseUrl = config.app.baseUrl;
      const computer = await getBookPreviewCacheComputer();
      const { entry: computed, pdf } = await computer.compute({
        projectId,
        ownerId: auth.userId,
        profile: PublicationProfile.fromId(profileId),
        chapters: orderedChapters.map((ch) => ({
          id: ch.getId(),
          title: ch.getTitle(),
          content: JSON.parse(ch.getContent()) as JSONContent,
        })),
        frontMatter,
        backMatter,
        contentHash,
        levelStyles,
        tocDepth: tocPreferences.depth,
        tocStyle: tocPreferences.style,
        assetBaseUrl,
      });
      await cacheRepo.save(computed, pdf);
      entry = computed;
    }

    const resolvedEntry = entry;
    const titleById = new Map(orderedChapters.map((ch) => [ch.getId(), ch.getTitle()]));
    const contentById = new Map(orderedChapters.map((ch) => [ch.getId(), ch.getContent()]));
    const chapters: BookPreviewChapterNav[] = resolvedEntry.getChapterOffsets().map((offset) => {
      const subEntries =
        tocPreferences.depth === 'chapters-and-subtitles'
          ? buildSubtitleNav(resolvedEntry, contentById.get(offset.chapterId), offset.chapterId)
          : [];
      return {
        id: offset.chapterId,
        title: titleById.get(offset.chapterId) ?? '',
        pageNumber: offset.pageNumber,
        ...(subEntries.length > 0 ? { subEntries } : {}),
      };
    });

    return {
      projectTitle: project.getTitle(),
      profileId,
      isPasserelle: false,
      availableProfiles: BOOK_PREVIEW_PROFILES,
      chapters,
      totalPageCount: resolvedEntry.getTotalPageCount(),
      frontMatterPageCount: resolvedEntry.getFrontMatterPageCount(),
    };
  });
}

/** Sous-titre nav entries for a chapter, with resolved page numbers; empty when unresolved or absent. */
function buildSubtitleNav(
  entry: BookPreviewCacheEntry,
  content: string | undefined,
  chapterId: string,
): Array<{ anchorId: string; title: string; pageNumber: number }> {
  if (!content) return [];
  const { subEntries } = tagSubtitleHeadings(JSON.parse(content) as JSONContent, `chapter-${chapterId}`);

  return subEntries.flatMap((sub) => {
    const pageNumber = entry.pageForSubtitle(sub.anchorId);
    return pageNumber === null ? [] : [{ anchorId: sub.anchorId, title: sub.title, pageNumber }];
  });
}
