// ABOUTME: Shared utilities for Server Actions.
// ABOUTME: Provides authentication, repository access, and error handling.
// ABOUTME: Centralizes dependency injection to reduce coupling to Infrastructure layer.

'use server';

import {
  getAuthProvider,
  getProjectRepository,
  getProviderRepository,
  getUserRepository,
  getMetadataRepository,
  getPromptRepository,
  createLLMProvider,
  getDefaultLLMProvider,
  getDocxParser,
  getDocumentExporter as getExporterFromConfig,
} from '@/infrastructure/config/providers';
import { LLMProviderFactoryImpl } from '@/infrastructure/ai/LLMProviderFactoryImpl';
import { uuidGenerator } from '@/infrastructure/utils/UUIDGenerator';
import { UnauthorizedError } from '@/domain/interfaces/AuthProvider';
import { ProjectRepository } from '@/domain/interfaces/ProjectRepository';
import { ProviderRepository } from '@/domain/interfaces/ProviderRepository';
import { UserRepository } from '@/domain/interfaces/UserRepository';
import { MetadataRepository } from '@/domain/interfaces/MetadataRepository';
import { LLMProviderFactory } from '@/domain/interfaces/LLMProviderFactory';
import { IdGenerator } from '@/domain/interfaces/IdGenerator';
import { LLMProvider } from '@/domain/interfaces/LLMProvider';
import { DocumentParser } from '@/domain/interfaces/DocumentParser';
import { DocumentExporter } from '@/domain/interfaces/DocumentExporter';

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
 * Get LLM provider factory instance.
 */
export async function getLLMProviderFactory(): Promise<LLMProviderFactory> {
  const promptRepo = getPromptRepository();
  return new LLMProviderFactoryImpl(promptRepo);
}

/**
 * Get ID generator instance.
 */
export async function getIdGenerator(): Promise<IdGenerator> {
  return uuidGenerator;
}

/**
 * Get document parser instance.
 */
export async function getDocumentParser(): Promise<DocumentParser> {
  return getDocxParser();
}

/**
 * Get document exporter instance.
 * Returns DocxExporter implementation via providers.
 */
export async function getDocumentExporter(): Promise<DocumentExporter> {
  return getExporterFromConfig();
}

/**
 * Get LLM provider for a specific project.
 * Uses project's configured provider or falls back to environment variable.
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

  if (providerId) {
    // Use project's configured provider
    const providerRepo = await getProviderRepo();
    const provider = await providerRepo.findById(userId, providerId);

    if (!provider) {
      throw new Error('Project provider not found. Please select a valid provider.');
    }

    if (!provider.isValidProvider()) {
      throw new Error(
        'Project provider is invalid. Please test the connection or select a different provider.'
      );
    }

    return createLLMProvider(provider);
  }

  // Fall back to environment variable (backward compatibility)
  return getDefaultLLMProvider();
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
