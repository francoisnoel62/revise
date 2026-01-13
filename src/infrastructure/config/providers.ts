// ABOUTME: Dependency injection composition root for infrastructure providers.
// ABOUTME: Single source of truth for provider selection.

import { AuthProvider } from '@/domain/interfaces/AuthProvider';
import { ProjectRepository } from '@/domain/interfaces/ProjectRepository';
import { UserRepository } from '@/domain/interfaces/UserRepository';
import { ProviderRepository } from '@/domain/interfaces/ProviderRepository';
import { MetadataRepository } from '@/domain/interfaces/MetadataRepository';
import { CorrectionHistoryRepository } from '@/domain/interfaces/CorrectionHistoryRepository';
import { PromptRepository } from '@/domain/interfaces/PromptRepository';
import { LLMProvider } from '@/domain/interfaces/LLMProvider';
import { DocumentParser } from '@/domain/interfaces/DocumentParser';
import { DocumentExporter } from '@/domain/interfaces/DocumentExporter';
import { AuthJsProvider } from '@/infrastructure/auth/AuthJsProvider';
import { MongoDBProjectRepository } from '@/infrastructure/persistence/MongoDBProjectRepository';
import { MongoDBUserRepository } from '@/infrastructure/persistence/MongoDBUserRepository';
import { MongoDBProviderRepository } from '@/infrastructure/persistence/MongoDBProviderRepository';
import { MongoDBMetadataRepository } from '@/infrastructure/persistence/MongoDBMetadataRepository';
import { MongoDBCorrectionHistoryRepository } from '@/infrastructure/persistence/MongoDBCorrectionHistoryRepository';
import { InMemoryProjectRepository } from '@/infrastructure/persistence/InMemoryProjectRepository';
import { FilePromptRepository } from '@/infrastructure/prompts/FilePromptRepository';
import { OpenAIProvider } from '@/infrastructure/ai/OpenAIProvider';
import { AnthropicProvider } from '@/infrastructure/ai/AnthropicProvider';
import { DocxParser } from '@/infrastructure/document/parsers/DocxParser';
import { CompositeDocumentParser } from '@/infrastructure/document/parsers/CompositeParser';
import { DocxExporter } from '@/infrastructure/document/exporters/DocxExporter';
import { PdfExporter } from '@/infrastructure/document/exporters/PdfExporter';
import { Provider } from '@/domain/entities/Provider';
import { getDatabase } from './database';

/**
 * Get the authentication provider.
 */
export function getAuthProvider(): AuthProvider {
  return new AuthJsProvider();
}

/**
 * Get the project repository.
 * Returns MongoDB implementation for production, InMemory for tests.
 */
export async function getProjectRepository(): Promise<ProjectRepository> {
  if (process.env.NODE_ENV === 'test' && !process.env.USE_REAL_DB) {
    return new InMemoryProjectRepository();
  }

  const db = await getDatabase();
  return new MongoDBProjectRepository(db);
}

/**
 * Get in-memory repository for testing.
 */
export function getTestRepository(): InMemoryProjectRepository {
  return new InMemoryProjectRepository();
}

/**
 * Get the user repository.
 */
export async function getUserRepository(): Promise<UserRepository> {
  const db = await getDatabase();
  return new MongoDBUserRepository(db);
}

/**
 * Get the provider repository.
 */
export async function getProviderRepository(): Promise<ProviderRepository> {
  const db = await getDatabase();
  return new MongoDBProviderRepository(db);
}

/**
 * Get the metadata repository.
 */
let metadataRepoInstance: MongoDBMetadataRepository | null = null;

export async function getMetadataRepository(): Promise<MetadataRepository> {
  if (!metadataRepoInstance) {
    const db = await getDatabase();
    metadataRepoInstance = new MongoDBMetadataRepository(db);
    // Ensure indexes on first use
    await metadataRepoInstance.ensureIndexes();
  }
  return metadataRepoInstance;
}

/**
 * Get the correction history repository.
 */
let correctionHistoryRepoInstance: MongoDBCorrectionHistoryRepository | null = null;

export async function getCorrectionHistoryRepository(): Promise<CorrectionHistoryRepository> {
  if (!correctionHistoryRepoInstance) {
    const db = await getDatabase();
    correctionHistoryRepoInstance = new MongoDBCorrectionHistoryRepository(db);
    // Ensure indexes on first use
    await correctionHistoryRepoInstance.ensureIndexes();
  }
  return correctionHistoryRepoInstance;
}

/**
 * Get the prompt repository.
 * Singleton instance for accessing AI prompts from files.
 */
let promptRepoInstance: PromptRepository | null = null;

export function getPromptRepository(): PromptRepository {
  if (!promptRepoInstance) {
    promptRepoInstance = new FilePromptRepository();
  }
  return promptRepoInstance;
}

/**
 * Create an LLM provider instance from a Provider entity.
 *
 * @param provider The provider entity with configuration
 * @returns LLMProvider implementation (OpenAI, Anthropic, etc.)
 * @throws Error if provider type is unsupported
 */
export function createLLMProvider(provider: Provider): LLMProvider {
  const apiKey = provider.getApiKey(); // Already decrypted by repository
  const model = provider.getModel();
  const promptRepo = getPromptRepository();

  switch (provider.getType()) {
    case 'openai':
      return new OpenAIProvider(apiKey, promptRepo, model);

    case 'anthropic':
      return new AnthropicProvider(apiKey, promptRepo, model);

    case 'mistral':
      // TODO Phase 2: Implement MistralProvider
      throw new Error('Mistral provider not yet implemented');

    case 'cohere':
      // TODO Phase 2: Implement CohereProvider
      throw new Error('Cohere provider not yet implemented');

    case 'google':
      // TODO Phase 2: Implement GoogleProvider
      throw new Error('Google provider not yet implemented');

    default:
      throw new Error(`Unsupported provider type: ${provider.getType()}`);
  }
}

/**
 * Get the document parser for import.
 * Returns CompositeDocumentParser supporting .docx files.
 */
export function getDocxParser(): DocumentParser {
  return new CompositeDocumentParser([
    new DocxParser(),
  ]);
}

/**
 * Export format type for document exports.
 */
export type ExportFormat = 'docx' | 'pdf';

/**
 * Get the document exporter for the specified format.
 * Returns appropriate exporter implementation based on format.
 * @param format - Export format ('docx' or 'pdf'), defaults to 'docx'
 */
export function getDocumentExporter(format: ExportFormat = 'docx'): DocumentExporter {
  if (format === 'pdf') {
    return new PdfExporter();
  }
  return new DocxExporter();
}
