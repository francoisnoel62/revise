// ABOUTME: Server actions for cockpit dashboard data fetching
// ABOUTME: Provides project statistics and cockpit-related operations

'use server';

import { auth } from '@/infrastructure/auth/auth-config';
import { getRepository } from './utils';
import { formatReadingTime } from '@/lib/utils';

export interface ProjectStats {
  wordCount: number;
  characterCount: number;
  chapterCount: number;
  readingTime: string;
  createdAt: string;
  updatedAt: string;
  title: string;
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

    return {
      success: true,
      stats: {
        wordCount,
        characterCount,
        chapterCount,
        readingTime: formatReadingTime(wordCount),
        createdAt: project.getCreatedAt().toISOString(),
        updatedAt: project.getUpdatedAt().toISOString(),
        title: project.getTitle(),
      },
    };
  } catch (error) {
    console.error('Error loading project stats:', error);
    return { success: false, error: 'Erreur lors du chargement des statistiques' };
  }
}
