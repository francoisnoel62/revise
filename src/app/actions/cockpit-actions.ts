// ABOUTME: Server actions for cockpit dashboard data fetching
// ABOUTME: Provides project statistics and cockpit-related operations

'use server';

import { getRepository, getWritingGoalRepo, getWritingQuotaRepo, getWordCountSnapshotRepo, getCharacterRepo, getProjectTaskRepo, getAuthenticatedUserId } from './utils';
import { formatReadingTime } from '@/lib/utils';
import { GetActiveWritingGoalUseCase } from '@/application/use-cases/GetActiveWritingGoalUseCase';
import { GetWorkflowMetricsUseCase, WorkflowMetrics } from '@/application/use-cases/GetWorkflowMetricsUseCase';

export interface ProjectStats {
  wordCount: number;
  characterCount: number;
  chapterCount: number;
  fictionalCharacterCount: number;
  readingTime: string;
  createdAt: string;
  updatedAt: string;
  title: string;
  activeGoal: {
    targetWords: number;
    deadline: string | null;
  } | null;
}

export async function getProjectStatsAction(
  projectId: string
): Promise<
  { success: true; stats: ProjectStats } | { success: false; error: string }
> {
  try {
    const authResult = await getAuthenticatedUserId();
    if ('error' in authResult) {
      return { success: false, error: 'Non authentifié' };
    }

    const repository = await getRepository();
    const project = await repository.loadProject(authResult.userId, projectId);

    if (!project) {
      return { success: false, error: 'Projet non trouvé' };
    }

    const wordCount = project.getTotalWordCount();
    const characterCount = project.getTotalCharacterCount();
    const chapterCount = project.getChapterCount();

    // Get active goal and character count in parallel
    const [activeGoal, fictionalCharacterCount] = await Promise.all([
      new GetActiveWritingGoalUseCase(await getWritingGoalRepo()).execute({
        userId: authResult.userId,
        projectId,
      }),
      (await getCharacterRepo()).countByProjectId(authResult.userId, projectId),
    ]);

    return {
      success: true,
      stats: {
        wordCount,
        characterCount,
        chapterCount,
        fictionalCharacterCount,
        readingTime: formatReadingTime(wordCount),
        createdAt: project.getCreatedAt().toISOString(),
        updatedAt: project.getUpdatedAt().toISOString(),
        title: project.getTitle(),
        activeGoal: activeGoal
          ? {
              targetWords: activeGoal.getTargetWords(),
              deadline: activeGoal.getDeadline()?.toISOString() ?? null,
            }
          : null,
      },
    };
  } catch (error) {
    console.error('Error loading project stats:', error);
    return { success: false, error: 'Erreur lors du chargement des statistiques' };
  }
}

export async function getWorkflowMetricsAction(
  projectId: string,
  timeZone: string = 'UTC'
): Promise<
  { success: true; metrics: WorkflowMetrics } | { success: false; error: string }
> {
  try {
    const authResult = await getAuthenticatedUserId();
    if ('error' in authResult) {
      return { success: false, error: 'Non authentifié' };
    }

    const repository = await getRepository();
    const project = await repository.loadProject(authResult.userId, projectId);

    if (!project) {
      return { success: false, error: 'Projet non trouvé' };
    }

    const useCase = new GetWorkflowMetricsUseCase(
      await getWordCountSnapshotRepo(),
      await getWritingGoalRepo(),
      await getWritingQuotaRepo()
    );

    const metrics = await useCase.execute({
      userId: authResult.userId,
      projectId,
      currentWordCount: project.getTotalWordCount(),
      timeZone,
    });

    return { success: true, metrics };
  } catch (error) {
    console.error('Error loading workflow metrics:', error);
    return { success: false, error: 'Erreur lors du chargement des métriques' };
  }
}

export interface LastEditedChapter {
  chapterId: string;
  chapterTitle: string;
}

export async function getLastEditedChapterAction(
  projectId: string
): Promise<{ success: true; chapter: LastEditedChapter | null } | { success: false; error: string }> {
  try {
    const authResult = await getAuthenticatedUserId();
    if ('error' in authResult) {
      return { success: false, error: 'Non authentifié' };
    }

    const repository = await getRepository();
    const project = await repository.loadProject(authResult.userId, projectId);

    if (!project) {
      return { success: false, error: 'Projet non trouvé' };
    }

    const chapters = project.getChapters();
    if (chapters.length === 0) {
      return { success: true, chapter: null };
    }

    const sortedChapters = [...chapters].sort((a, b) => {
      const aTime = a.getMetadata().lastEdited.getTime();
      const bTime = b.getMetadata().lastEdited.getTime();
      return bTime - aTime;
    });

    const lastEdited = sortedChapters[0];

    return {
      success: true,
      chapter: {
        chapterId: lastEdited.getId(),
        chapterTitle: lastEdited.getTitle(),
      },
    };
  } catch (error) {
    console.error('Error getting last edited chapter:', error);
    return { success: false, error: 'Erreur lors du chargement' };
  }
}

export async function getOverdueTaskCountAction(
  projectId: string
): Promise<{ success: true; count: number } | { success: false; error: string }> {
  try {
    const authResult = await getAuthenticatedUserId();
    if ('error' in authResult) {
      return { success: false, error: 'Non authentifié' };
    }

    const taskRepo = await getProjectTaskRepo();
    const tasks = await taskRepo.findByProjectId(authResult.userId, projectId);

    const overdueCount = tasks.filter(task => task.isOverdue()).length;

    return { success: true, count: overdueCount };
  } catch (error) {
    console.error('Error getting overdue task count:', error);
    return { success: false, error: 'Erreur lors du chargement' };
  }
}
