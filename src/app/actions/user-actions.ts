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
  getAIExchangeRepo,
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
    selectedText: string;
    proposals: string[];
    createdAt: string;
  }>;
  providers: Array<{
    id: string;
    name: string;
    type: string;
    model: string;
    createdAt: string;
  }>;
  aiExchanges: Array<{
    id: string;
    projectId: string;
    operation: string;
    provider: string;
    model: string;
    systemPrompt: string;
    input: string;
    output: string;
    costEur: number | null;
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
          selectedText: history.getSelectedText(),
          proposals: history.getProposals(),
          createdAt: history.getCreatedAt().toISOString(),
        });
      }
    }

    // Fetch all providers (without API keys for security)
    const providers = await providerRepo.listProviders(userId);

    // Fetch captured AI exchanges (decrypted — the author owns this content).
    // Guarded: if the encryption key is unavailable there is nothing to export.
    const aiExchanges: UserDataExport['aiExchanges'] = [];
    try {
      const exchangeRepo = await getAIExchangeRepo();
      const summaries = await exchangeRepo.findByOwner(userId);
      for (const summary of summaries) {
        const exchange = await exchangeRepo.findById(userId, summary.id);
        if (exchange) {
          aiExchanges.push({
            id: exchange.getId(),
            projectId: exchange.getProjectId(),
            operation: exchange.getOperation(),
            provider: exchange.getProvider(),
            model: exchange.getModel(),
            systemPrompt: exchange.getSystemPrompt(),
            input: exchange.getInput(),
            output: exchange.getOutput(),
            costEur: exchange.getCostEur(),
            createdAt: exchange.getCreatedAt().toISOString(),
          });
        }
      }
    } catch (error) {
      console.error('AI exchange export skipped (encryption key unavailable?)', error);
    }

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
      aiExchanges,
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
