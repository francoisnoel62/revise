// ABOUTME: Server action for the whole-book preview: lazily generates and caches the export PDF.
// ABOUTME: Returns navigation metrics (chapter page offsets, counts); the PDF bytes are served by a route.

'use server';

import type { JSONContent } from '@tiptap/core';
import type { FrontMatterData } from '@/domain/interfaces/DocumentExporter';
import { PublicationProfile, type PublicationProfileId } from '@/domain/value-objects/PublicationProfile';
import { computeBookPreviewContentHash } from '@/application/services/bookPreviewContentHash';
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

    const [settings, dedicationMeta, copyrightMeta, epigraphMeta] = await Promise.all([
      settingsRepo.findByProjectId(auth.userId, projectId),
      metadataRepo.findByProjectAndType(auth.userId, projectId, 'dedication'),
      metadataRepo.findByProjectAndType(auth.userId, projectId, 'copyright'),
      metadataRepo.findByProjectAndType(auth.userId, projectId, 'epigraph'),
    ]);

    const authorContributor = settings?.getContributors().find((c) => c.role === 'author');
    const frontMatter: FrontMatterData = {
      title: settings?.getTitle() ?? project.getTitle(),
      subtitle: settings?.getSubtitle(),
      authorName: authorContributor?.name,
      isbn: settings?.getIsbn(),
      dedicationContent: dedicationMeta?.getContent() || undefined,
      copyrightContent: copyrightMeta?.getContent() || undefined,
      epigraphContent: epigraphMeta?.getContent() || undefined,
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

    const orderedChapters = project
      .getChapters()
      .slice()
      .sort((a, b) => a.getOrder() - b.getOrder());

    const contentHash = computeBookPreviewContentHash({
      chapters: orderedChapters.map((ch) => ({ id: ch.getId(), content: ch.getContent() })),
      frontMatter,
    });

    const cacheRepo = await getBookPreviewCacheRepo();
    let entry = await cacheRepo.loadMetrics(projectId, profileId, auth.userId);

    if (!entry || entry.getContentHash() !== contentHash) {
      const assetBaseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';
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
        contentHash,
        assetBaseUrl,
      });
      await cacheRepo.save(computed, pdf);
      entry = computed;
    }

    const titleById = new Map(orderedChapters.map((ch) => [ch.getId(), ch.getTitle()]));
    const chapters: BookPreviewChapterNav[] = entry.getChapterOffsets().map((offset) => ({
      id: offset.chapterId,
      title: titleById.get(offset.chapterId) ?? '',
      pageNumber: offset.pageNumber,
    }));

    return {
      projectTitle: project.getTitle(),
      profileId,
      isPasserelle: false,
      availableProfiles: BOOK_PREVIEW_PROFILES,
      chapters,
      totalPageCount: entry.getTotalPageCount(),
      frontMatterPageCount: entry.getFrontMatterPageCount(),
    };
  });
}
