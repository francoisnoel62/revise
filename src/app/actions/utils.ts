// ABOUTME: Shared utilities for Server Actions.
// ABOUTME: Provides authentication, repository access, and error handling.
// ABOUTME: Requires user-configured providers (no default fallback).

'use server';

import {
  getAuthProvider,
  getProjectRepository,
  getProviderRepository,
  getUserRepository,
  getMetadataRepository,
  getCorrectionHistoryRepository,
  getWritingGoalRepository,
  getAIUsageRepository as getAIUsageRepositoryFromConfig,
  getBlogArticleRepository,
  getArticleViewRepository,
  getProjectTaskRepository,
  getCharacterRepository as getCharacterRepositoryFromConfig,
  getProjectSettingsRepository as getProjectSettingsRepositoryFromConfig,
  getBlobStorage as getBlobStorageFromConfig,
  getPromptRepository,
  createLLMProvider,
  getDocumentParser as getDocumentParserFromConfig,
  getFolderParser as getFolderParserFromConfig,
  getDocumentExporter as getExporterFromConfig,
  type ExportFormat,
} from '@/infrastructure/config/providers';
import { LLMProviderFactoryImpl } from '@/infrastructure/ai/LLMProviderFactoryImpl';
import { TrackedLLMProvider } from '@/infrastructure/ai/TrackedLLMProvider';
import { objectIdGenerator } from '@/infrastructure/utils/ObjectIdGenerator';
import { UnauthorizedError } from '@/domain/interfaces/AuthProvider';
import { ProjectRepository } from '@/domain/interfaces/ProjectRepository';
import { ProviderRepository } from '@/domain/interfaces/ProviderRepository';
import { UserRepository } from '@/domain/interfaces/UserRepository';
import { MetadataRepository } from '@/domain/interfaces/MetadataRepository';
import { CorrectionHistoryRepository } from '@/domain/interfaces/CorrectionHistoryRepository';
import { WritingGoalRepository } from '@/domain/interfaces/WritingGoalRepository';
import { AIUsageRepository } from '@/domain/interfaces/AIUsageRepository';
import { BlogArticleRepository } from '@/domain/interfaces/BlogArticleRepository';
import { ProjectTaskRepository } from '@/domain/interfaces/ProjectTaskRepository';
import { CharacterRepository } from '@/domain/interfaces/CharacterRepository';
import { ArticleViewRepository } from '@/domain/interfaces/ArticleViewRepository';
import { ProjectSettingsRepository } from '@/domain/interfaces/ProjectSettingsRepository';
import { BlobStorage } from '@/domain/interfaces/BlobStorage';
import { LLMProviderFactory } from '@/domain/interfaces/LLMProviderFactory';
import { IdGenerator } from '@/domain/interfaces/IdGenerator';
import { LLMProvider } from '@/domain/interfaces/LLMProvider';
import { DocumentParser } from '@/domain/interfaces/DocumentParser';
import { FolderParser } from '@/domain/interfaces/FolderParser';
import { DocumentExporter } from '@/domain/interfaces/DocumentExporter';
import { EmailService } from '@/domain/interfaces/EmailService';
import { ResendEmailService } from '@/infrastructure/email/ResendEmailService';
import { config } from '@/infrastructure/config/env';

/**
 * Result type for Server Actions.
 * Either success data or error information.
 */
export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; redirect?: string };

/**
 * Get authenticated user ID or return error result.
 */
export async function getAuthenticatedUserId(): Promise<
  { userId: string } | { error: ActionResult<never> }
> {
  try {
    const authProvider = getAuthProvider();
    const userId = await authProvider.getUserId();
    return { userId };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return {
        error: {
          success: false,
          error: 'Please sign in to continue',
          redirect: '/auth/signin',
        },
      };
    }
    return {
      error: {
        success: false,
        error: 'Authentication failed',
      },
    };
  }
}

/**
 * Get authenticated admin user ID or return error result.
 * Verifies both authentication and admin status.
 */
export async function getAuthenticatedAdminId(): Promise<
  { userId: string } | { error: ActionResult<never> }
> {
  // First check basic authentication
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) {
    return auth;
  }

  // Then verify admin status
  const userRepo = await getUserRepository();
  const user = await userRepo.findById(auth.userId);

  if (!user) {
    return {
      error: {
        success: false,
        error: 'User not found',
      },
    };
  }

  if (!user.isAdmin) {
    return {
      error: {
        success: false,
        error: 'Admin access required',
      },
    };
  }

  return { userId: auth.userId };
}

/**
 * Get project repository instance.
 */
export async function getRepository(): Promise<ProjectRepository> {
  return await getProjectRepository();
}

/**
 * Get provider repository instance.
 */
export async function getProviderRepo(): Promise<ProviderRepository> {
  return await getProviderRepository();
}

/**
 * Get user repository instance.
 */
export async function getUserRepo(): Promise<UserRepository> {
  return await getUserRepository();
}

/**
 * Get metadata repository instance.
 */
export async function getMetadataRepo(): Promise<MetadataRepository> {
  return await getMetadataRepository();
}

/**
 * Get correction history repository instance.
 */
export async function getCorrectionHistoryRepo(): Promise<CorrectionHistoryRepository> {
  return await getCorrectionHistoryRepository();
}

/**
 * Get writing goal repository instance.
 */
export async function getWritingGoalRepo(): Promise<WritingGoalRepository> {
  return await getWritingGoalRepository();
}

/**
 * Get AI usage repository instance.
 */
export async function getAIUsageRepo(): Promise<AIUsageRepository> {
  return await getAIUsageRepositoryFromConfig();
}

/**
 * Get blog article repository instance.
 */
export async function getBlogArticleRepo(): Promise<BlogArticleRepository> {
  return await getBlogArticleRepository();
}

/**
 * Get article view repository instance.
 */
export async function getArticleViewRepo(): Promise<ArticleViewRepository> {
  return await getArticleViewRepository();
}

/**
 * Get project task repository instance.
 */
export async function getProjectTaskRepo(): Promise<ProjectTaskRepository> {
  return await getProjectTaskRepository();
}

/**
 * Get character repository instance.
 */
export async function getCharacterRepo(): Promise<CharacterRepository> {
  return await getCharacterRepositoryFromConfig();
}

/**
 * Get project settings repository instance.
 */
export async function getProjectSettingsRepo(): Promise<ProjectSettingsRepository> {
  return await getProjectSettingsRepositoryFromConfig();
}

/**
 * Get blob storage instance.
 */
export async function getBlobStorageInstance(): Promise<BlobStorage> {
  return getBlobStorageFromConfig();
}

/**
 * Get email service instance if configured.
 * Returns undefined if RESEND_API_KEY or ADMIN_EMAIL are not set.
 */
export async function getEmailService(): Promise<EmailService | undefined> {
  if (!config.email.resendApiKey || !config.email.adminEmail) {
    return undefined;
  }
  return new ResendEmailService();
}

/**
 * Get LLM provider factory instance.
 */
export async function getLLMProviderFactory(): Promise<LLMProviderFactory> {
  const promptRepo = getPromptRepository();
  return new LLMProviderFactoryImpl(promptRepo);
}

/**
 * Get ID generator instance.
 * Uses MongoDB ObjectId generator for compatibility with MongoDB repositories.
 */
export async function getIdGenerator(): Promise<IdGenerator> {
  return objectIdGenerator;
}

/**
 * Get document parser instance.
 * Supports .docx and .md files.
 */
export async function getDocumentParser(): Promise<DocumentParser> {
  return getDocumentParserFromConfig();
}

/**
 * Get folder parser instance.
 * Used for importing folders of .md files.
 */
export async function getFolderParser(): Promise<FolderParser> {
  return getFolderParserFromConfig();
}

/**
 * Get document exporter instance for the specified format.
 * Returns appropriate exporter implementation via providers.
 * @param format - Export format ('docx' or 'pdf'), defaults to 'docx'
 */
export async function getDocumentExporter(format: ExportFormat = 'docx'): Promise<DocumentExporter> {
  return getExporterFromConfig(format);
}

/**
 * Get LLM provider for a specific project.
 * Requires a user-configured provider for the project.
 * Throws an error if no provider is configured.
 */
export async function getLLMProviderForProject(
  userId: string,
  projectId: string
): Promise<LLMProvider> {
  const projectRepo = await getRepository();
  const project = await projectRepo.loadProject(userId, projectId);

  if (!project) {
    throw new Error('Project not found');
  }

  const providerId = project.getProviderId();

  if (!providerId) {
    throw new Error(
      'Aucun fournisseur IA configuré pour ce projet. Veuillez en sélectionner un dans les paramètres du projet.'
    );
  }

  const providerRepo = await getProviderRepo();
  const provider = await providerRepo.findById(userId, providerId);

  if (!provider) {
    throw new Error(
      'Le fournisseur IA configuré est introuvable. Veuillez en sélectionner un autre.'
    );
  }

  if (!provider.isValidProvider()) {
    throw new Error(
      'Le fournisseur IA configuré est invalide. Veuillez tester la connexion ou en choisir un autre.'
    );
  }

  return createLLMProvider(provider);
}

/**
 * Get LLM provider for a project with usage tracking enabled.
 * Wraps the provider in TrackedLLMProvider to record AI usage.
 */
export async function getTrackedLLMProviderForProject(
  userId: string,
  projectId: string
): Promise<LLMProvider> {
  const baseProvider = await getLLMProviderForProject(userId, projectId);
  const usageRepo = await getAIUsageRepo();

  return new TrackedLLMProvider(
    baseProvider,
    usageRepo,
    objectIdGenerator,
    userId,
    projectId
  );
}

/**
 * Get LLM provider by provider ID.
 * Used when user explicitly selects a provider for a specific operation.
 */
export async function getLLMProviderById(
  userId: string,
  providerId: string
): Promise<LLMProvider> {
  const providerRepo = await getProviderRepo();
  const provider = await providerRepo.findById(userId, providerId);

  if (!provider) {
    throw new Error('Provider not found. Please select a valid provider.');
  }

  if (!provider.isValidProvider()) {
    throw new Error(
      'Provider is invalid. Please test the connection or select a different provider.'
    );
  }

  return createLLMProvider(provider);
}

/**
 * Get LLM provider by provider ID with usage tracking enabled.
 * Wraps the provider in TrackedLLMProvider to record AI usage.
 */
export async function getTrackedLLMProviderById(
  userId: string,
  providerId: string,
  projectId: string
): Promise<LLMProvider> {
  const baseProvider = await getLLMProviderById(userId, providerId);
  const usageRepo = await getAIUsageRepo();

  return new TrackedLLMProvider(
    baseProvider,
    usageRepo,
    objectIdGenerator,
    userId,
    projectId
  );
}

/**
 * Wrap async operation with error handling.
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>
): Promise<ActionResult<T>> {
  try {
    const data = await operation();
    return { success: true, data };
  } catch (error) {
    console.error('Server Action error:', error);

    if (error instanceof UnauthorizedError) {
      return {
        success: false,
        error: 'Please sign in to continue',
        redirect: '/auth/signin',
      };
    }

    if (error instanceof Error) {
      return { success: false, error: error.message };
    }

    return { success: false, error: 'An unexpected error occurred' };
  }
}
