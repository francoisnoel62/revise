// ABOUTME: Server actions for cockpit dashboard data fetching
// ABOUTME: Provides project statistics and cockpit-related operations

'use server';

import { auth } from '@/infrastructure/auth/auth-config';
import { getRepository, getWritingGoalRepo, getCharacterRepo } from './utils';
import { formatReadingTime } from '@/lib/utils';
import { GetActiveWritingGoalUseCase } from '@/application/use-cases/GetActiveWritingGoalUseCase';

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
    type: string;
    deadline: string | null;
  } | null;
}

export async function getProjectStatsAction(
  projectId: string
): Promise<
  { success: true; stats: ProjectStats } | { success: false; error: string }
> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Non authentifié' };
    }

    const repository = await getRepository();
    const project = await repository.loadProject(session.user.id, projectId);

    if (!project) {
      return { success: false, error: 'Projet non trouvé' };
    }

    const wordCount = project.getTotalWordCount();
    const characterCount = project.getTotalCharacterCount();
    const chapterCount = project.getChapterCount();

    // Get active goal and character count in parallel
    const [activeGoal, fictionalCharacterCount] = await Promise.all([
      new GetActiveWritingGoalUseCase(await getWritingGoalRepo()).execute({
        userId: session.user.id,
        projectId,
      }),
      (await getCharacterRepo()).countByProjectId(session.user.id, projectId),
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
              type: activeGoal.getType(),
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
