// ABOUTME: Server actions for the whole-book preview page.
// ABOUTME: Loads chapters, front matter, and publication profile for client-side rendering.

'use server';

import type { FrontMatterData } from '@/domain/interfaces/DocumentExporter';
import type { PublicationProfileId } from '@/domain/value-objects/PublicationProfile';
import {
  type ActionResult,
  getAuthenticatedUserId,
  getRepository,
  getMetadataRepo,
  getProjectSettingsRepo,
  withErrorHandling,
} from './utils';

export interface BookPreviewChapter {
  readonly id: string;
  readonly title: string;
  /** Stringified TipTap JSON content. */
  readonly content: string;
  readonly order: number;
}

export interface BookPreviewData {
  readonly projectTitle: string;
  readonly chapters: BookPreviewChapter[];
  readonly frontMatter: FrontMatterData;
  readonly profileId: PublicationProfileId;
}

export async function getBookPreviewDataAction(
  projectId: string,
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

    const profileId: PublicationProfileId = settings?.getPublicationProfileId() ?? 'kdp-6x9';

    const chapters: BookPreviewChapter[] = project
      .getChapters()
      .map((ch) => ({
        id: ch.getId(),
        title: ch.getTitle(),
        content: ch.getContent(),
        order: ch.getOrder(),
      }))
      .sort((a, b) => a.order - b.order);

    return {
      projectTitle: project.getTitle(),
      chapters,
      frontMatter,
      profileId,
    };
  });
}
