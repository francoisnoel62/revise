// ABOUTME: Server Actions for user data management
// ABOUTME: Implements RGPD data portability (Article 20)

'use server';

import {
  ActionResult,
  getAuthenticatedUserId,
  getUserRepo,
  getRepository,
  getProviderRepo,
  getMetadataRepo,
  getCorrectionHistoryRepo,
} from './utils';

export interface UserDataExport {
  exportDate: string;
  user: {
    email: string;
    name?: string;
    createdAt: string;
    termsAcceptedAt?: string;
    privacyAcceptedAt?: string;
  };
  projects: Array<{
    id: string;
    title: string;
    createdAt: string;
    updatedAt: string;
    chapters: Array<{
      id: string;
      title: string;
      content: unknown;
      order: number;
    }>;
  }>;
  metadata: Array<{
    id: string;
    projectId: string;
    type: string;
    title: string;
    content: unknown;
    lastEdited: string;
  }>;
  correctionHistory: Array<{
    id: string;
    projectId: string;
    chapterId: string;
    originalText: string;
    selectedProposal: string;
    proposalStyle: string;
    createdAt: string;
  }>;
  providers: Array<{
    id: string;
    name: string;
    type: string;
    model: string;
    createdAt: string;
  }>;
}

/**
 * Export all user data in JSON format.
 * RGPD right to data portability (Article 20).
 */
export async function exportUserDataAction(): Promise<ActionResult<UserDataExport>> {
  try {
    // Verify authentication
    const auth = await getAuthenticatedUserId();
    if ('error' in auth) {
      return auth.error;
    }

    const userId = auth.userId;

    // Get all repositories
    const userRepo = await getUserRepo();
    const projectRepo = await getRepository();
    const providerRepo = await getProviderRepo();
    const metadataRepo = await getMetadataRepo();
    const correctionHistoryRepo = await getCorrectionHistoryRepo();

    // Fetch user data
    const user = await userRepo.findById(userId);
    if (!user) {
      return { success: false, error: 'Utilisateur non trouvé' };
    }

    // Fetch all projects
    const projects = await projectRepo.listProjects(userId);

    // Fetch all metadata for all projects
    const allMetadata: UserDataExport['metadata'] = [];
    const allCorrectionHistory: UserDataExport['correctionHistory'] = [];

    for (const project of projects) {
      const projectMetadata = await metadataRepo.findByProjectId(userId, project.getId());
      for (const meta of projectMetadata) {
        allMetadata.push({
          id: meta.getId(),
          projectId: meta.getProjectId(),
          type: meta.getTypeKey(),
          title: meta.getTitle(),
          content: meta.getContent(),
          lastEdited: meta.getProperties().lastEdited.toISOString(),
        });
      }

      const projectHistory = await correctionHistoryRepo.findByProjectId(userId, project.getId());
      for (const history of projectHistory) {
        allCorrectionHistory.push({
          id: history.getId(),
          projectId: history.getProjectId(),
          chapterId: history.getChapterId(),
          originalText: history.getOriginalText(),
          selectedProposal: history.getSelectedProposal(),
          proposalStyle: history.getProposalStyle(),
          createdAt: history.getCreatedAt().toISOString(),
        });
      }
    }

    // Fetch all providers (without API keys for security)
    const providers = await providerRepo.listProviders(userId);

    // Build export data
    const exportData: UserDataExport = {
      exportDate: new Date().toISOString(),
      user: {
        email: user.email,
        name: user.name,
        createdAt: user.createdAt.toISOString(),
        termsAcceptedAt: user.termsAcceptedAt?.toISOString(),
        privacyAcceptedAt: user.privacyAcceptedAt?.toISOString(),
      },
      projects: projects.map((project) => ({
        id: project.getId(),
        title: project.getTitle(),
        createdAt: project.getCreatedAt().toISOString(),
        updatedAt: project.getUpdatedAt().toISOString(),
        chapters: project.getChapters().map((chapter) => ({
          id: chapter.getId(),
          title: chapter.getTitle(),
          content: chapter.getContent(),
          order: chapter.getOrder(),
        })),
      })),
      metadata: allMetadata,
      correctionHistory: allCorrectionHistory,
      providers: providers.map((provider) => ({
        id: provider.getId(),
        name: provider.getName(),
        type: provider.getType(),
        model: provider.getModel(),
        createdAt: provider.getCreatedAt().toISOString(),
      })),
    };

    return { success: true, data: exportData };
  } catch (error) {
    console.error('Data export error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'L\'export des données a échoué',
    };
  }
}
