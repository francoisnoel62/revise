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
  getPromptRepository,
  createLLMProvider,
  getDocxParser,
  getDocumentExporter as getExporterFromConfig,
  type ExportFormat,
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
