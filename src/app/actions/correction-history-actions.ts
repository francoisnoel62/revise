// ABOUTME: Server Actions for Correction History CRUD operations.
// ABOUTME: Delegates to Application layer Use Cases for business logic.

'use server';

import { CorrectionHistory } from '@/domain/entities/CorrectionHistory';
import { SaveCorrectionHistoryUseCase } from '@/application/use-cases/SaveCorrectionHistoryUseCase';
import { ListCorrectionHistoryUseCase } from '@/application/use-cases/ListCorrectionHistoryUseCase';
import { DeleteCorrectionHistoryUseCase } from '@/application/use-cases/DeleteCorrectionHistoryUseCase';
import {
  ActionResult,
  getAuthenticatedUserId,
  getRepository,
  getCorrectionHistoryRepo,
  getIdGenerator,
  withErrorHandling,
} from './utils';

/**
 * Serialized correction history for client transport.
 */
export interface SerializedCorrectionHistory {
  id: string;
  projectId: string;
  chapterId: string;
  chapterTitle: string; // Enriched from project data
  selectedText: string;
  proposals: string[];
  createdAt: string;
}

/**
 * Correction history list item for table display.
 */
export interface CorrectionHistoryListItem {
  id: string;
  chapterId: string;
  chapterTitle: string;
  selectedText: string;
  proposals: string[];
  createdAt: string;
}

// === Serialization Helpers ===

function serializeHistory(
  history: CorrectionHistory,
  chapterTitle: string
): SerializedCorrectionHistory {
  return {
    id: history.getId(),
    projectId: history.getProjectId(),
    chapterId: history.getChapterId(),
    chapterTitle,
    selectedText: history.getSelectedText(),
    proposals: history.getProposals(),
    createdAt: history.getCreatedAt().toISOString(),
  };
}

function serializeHistoryListItem(
  history: CorrectionHistory,
  chapterTitle: string
): CorrectionHistoryListItem {
  return {
    id: history.getId(),
    chapterId: history.getChapterId(),
    chapterTitle,
    selectedText: history.getSelectedText(),
    proposals: history.getProposals(),
    createdAt: history.getCreatedAt().toISOString(),
  };
}

// === Server Actions ===

/**
 * Save a new correction history entry.
 * Called automatically after AI rewrite generates proposals.
 */
export async function saveCorrectionHistoryAction(
  projectId: string,
  chapterId: string,
  selectedText: string,
  proposals: string[]
): Promise<ActionResult<SerializedCorrectionHistory>> {
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) return auth.error;

  return withErrorHandling(async () => {
    const useCase = new SaveCorrectionHistoryUseCase(
      await getCorrectionHistoryRepo(),
      await getRepository(),
      await getIdGenerator()
    );

    const result = await useCase.execute({
      ownerId: auth.userId,
      projectId,
      chapterId,
      selectedText,
      proposals,
    });

    // Get chapter title for serialization
    const projectRepo = await getRepository();
    const project = await projectRepo.loadProject(auth.userId, projectId);
    const chapter = project?.getChapters().find((c) => c.getId() === chapterId);
    const chapterTitle = chapter?.getTitle() ?? 'Unknown Chapter';

    return serializeHistory(result.history, chapterTitle);
  });
}

/**
 * List all correction history for a project.
 * Returns entries sorted by createdAt descending (newest first).
 */
export async function listCorrectionHistoryAction(
  projectId: string
): Promise<ActionResult<CorrectionHistoryListItem[]>> {
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) return auth.error;

  return withErrorHandling(async () => {
    const useCase = new ListCorrectionHistoryUseCase(
      await getCorrectionHistoryRepo(),
      await getRepository()
    );

    const result = await useCase.execute({
      ownerId: auth.userId,
      projectId,
    });

    // Get project to enrich with chapter titles
    const projectRepo = await getRepository();
    const project = await projectRepo.loadProject(auth.userId, projectId);
    const chapters = project?.getChapters() ?? [];

    // Create a map of chapter IDs to titles
    const chapterTitles = new Map<string, string>();
    for (const chapter of chapters) {
      chapterTitles.set(chapter.getId(), chapter.getTitle());
    }

    return result.history.map((h) =>
      serializeHistoryListItem(
        h,
        chapterTitles.get(h.getChapterId()) ?? 'Chapitre supprimé'
      )
    );
  });
}

/**
 * List correction history for a specific chapter.
 * Returns entries sorted by createdAt descending (newest first).
 */
export async function listCorrectionHistoryByChapterAction(
  projectId: string,
  chapterId: string
): Promise<ActionResult<CorrectionHistoryListItem[]>> {
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) return auth.error;

  return withErrorHandling(async () => {
    const historyRepo = await getCorrectionHistoryRepo();
    const projectRepo = await getRepository();

    // Verify project ownership
    const project = await projectRepo.loadProject(auth.userId, projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    // Find history for this chapter
    const history = await historyRepo.findByChapterId(auth.userId, chapterId);

    // Get chapter title
    const chapter = project.getChapters().find((c) => c.getId() === chapterId);
    const chapterTitle = chapter?.getTitle() ?? 'Chapitre supprimé';

    return history.map((h) => serializeHistoryListItem(h, chapterTitle));
  });
}

/**
 * Delete a correction history entry.
 */
export async function deleteCorrectionHistoryAction(
  historyId: string
): Promise<ActionResult<{ deleted: true }>> {
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) return auth.error;

  return withErrorHandling(async () => {
    const useCase = new DeleteCorrectionHistoryUseCase(
      await getCorrectionHistoryRepo()
    );

    await useCase.execute({
      ownerId: auth.userId,
      historyId,
    });

    return { deleted: true };
  });
}
