// ABOUTME: Dependency injection composition root for infrastructure providers.
// ABOUTME: Single source of truth for provider selection.

import { AuthProvider } from '@/domain/interfaces/AuthProvider';
import { ProjectRepository } from '@/domain/interfaces/ProjectRepository';
import { UserRepository } from '@/domain/interfaces/UserRepository';
import { ProviderRepository } from '@/domain/interfaces/ProviderRepository';
import { MetadataRepository } from '@/domain/interfaces/MetadataRepository';
import { CustomAnnexRepository } from '@/domain/interfaces/CustomAnnexRepository';
import { CorrectionHistoryRepository } from '@/domain/interfaces/CorrectionHistoryRepository';
import { SnapshotRepository } from '@/domain/interfaces/SnapshotRepository';
import { AutomaticSnapshotRepository } from '@/domain/interfaces/AutomaticSnapshotRepository';
import { WritingGoalRepository } from '@/domain/interfaces/WritingGoalRepository';
import { WordCountSnapshotRepository } from '@/domain/interfaces/WordCountSnapshotRepository';
import { WritingQuotaRepository } from '@/domain/interfaces/WritingQuotaRepository';
import { AIUsageRepository } from '@/domain/interfaces/AIUsageRepository';
import { AIExchangeRepository } from '@/domain/interfaces/AIExchangeRepository';
import { BlogArticleRepository } from '@/domain/interfaces/BlogArticleRepository';
import { ContactMessageRepository } from '@/domain/interfaces/ContactMessageRepository';
import { ProjectTaskRepository } from '@/domain/interfaces/ProjectTaskRepository';
import { CharacterRepository } from '@/domain/interfaces/CharacterRepository';
import { ArticleViewRepository } from '@/domain/interfaces/ArticleViewRepository';
import { ResearchDocumentRepository } from '@/domain/interfaces/ResearchDocumentRepository';
import { PromptRepository } from '@/domain/interfaces/PromptRepository';
import { ProjectSettingsRepository } from '@/domain/interfaces/ProjectSettingsRepository';
import { BlobStorage } from '@/domain/interfaces/BlobStorage';
import { LLMProvider } from '@/domain/interfaces/LLMProvider';
import { DocumentParser } from '@/domain/interfaces/DocumentParser';
import { DocumentExporter } from '@/domain/interfaces/DocumentExporter';
import { ContentConverter } from '@/domain/interfaces/ContentConverter';
import { GrammarChecker } from '@/domain/interfaces/GrammarChecker';
import { GrammarDictionaryCompiler } from '@/domain/interfaces/GrammarDictionaryCompiler';
import { AuthJsProvider } from '@/infrastructure/auth/AuthJsProvider';
import { MongoDBProjectRepository } from '@/infrastructure/persistence/MongoDBProjectRepository';
import { MongoDBUserRepository } from '@/infrastructure/persistence/MongoDBUserRepository';
import { MongoDBProviderRepository } from '@/infrastructure/persistence/MongoDBProviderRepository';
import { MongoDBMetadataRepository } from '@/infrastructure/persistence/MongoDBMetadataRepository';
import { MongoDBCustomAnnexRepository } from '@/infrastructure/persistence/MongoDBCustomAnnexRepository';
import { MongoDBCorrectionHistoryRepository } from '@/infrastructure/persistence/MongoDBCorrectionHistoryRepository';
import { MongoDBSnapshotRepository } from '@/infrastructure/persistence/MongoDBSnapshotRepository';
import { MongoDBAutomaticSnapshotRepository } from '@/infrastructure/persistence/MongoDBAutomaticSnapshotRepository';
import { MongoDBWritingGoalRepository } from '@/infrastructure/persistence/MongoDBWritingGoalRepository';
import { MongoDBWordCountSnapshotRepository } from '@/infrastructure/persistence/MongoDBWordCountSnapshotRepository';
import { MongoDBWritingQuotaRepository } from '@/infrastructure/persistence/MongoDBWritingQuotaRepository';
import { MongoDBUsageRepository } from '@/infrastructure/persistence/MongoDBUsageRepository';
import { MongoDBAutocompleteEventRepository } from '@/infrastructure/persistence/MongoDBAutocompleteEventRepository';
import { AutocompleteEventRepository } from '@/domain/interfaces/AutocompleteEventRepository';
import { MongoDBCanonFactRepository } from '@/infrastructure/persistence/MongoDBCanonFactRepository';
import { CanonFactRepository } from '@/domain/interfaces/CanonFactRepository';
import { CanonExtractionStateRepository } from '@/domain/interfaces/CanonExtractionStateRepository';
import { MongoDBRateLimitRepository } from '@/infrastructure/persistence/MongoDBRateLimitRepository';
import { RateLimitRepository } from '@/domain/interfaces/RateLimitRepository';
import { MongoDBExchangeRepository } from '@/infrastructure/persistence/MongoDBExchangeRepository';
import { getFieldEncryption } from '@/infrastructure/security/FieldEncryption';
import { MongoDBModelPricingRepository } from '@/infrastructure/persistence/MongoDBModelPricingRepository';
import { ModelPricingRepository } from '@/domain/interfaces/ModelPricingRepository';
import { MongoDBPendingPriceChangeRepository } from '@/infrastructure/persistence/MongoDBPendingPriceChangeRepository';
import { PendingPriceChangeRepository } from '@/domain/interfaces/PendingPriceChangeRepository';
import { MongoDBBlogArticleRepository } from '@/infrastructure/persistence/MongoDBBlogArticleRepository';
import { MongoDBContactMessageRepository } from '@/infrastructure/persistence/MongoDBContactMessageRepository';
import { MongoDBArticleViewRepository } from '@/infrastructure/persistence/MongoDBArticleViewRepository';
import { MongoDBProjectTaskRepository } from '@/infrastructure/persistence/MongoDBProjectTaskRepository';
import { MongoDBCharacterRepository } from '@/infrastructure/persistence/MongoDBCharacterRepository';
import { MongoDBCharacterConversationRepository } from '@/infrastructure/persistence/MongoDBCharacterConversationRepository';
import { CharacterConversationRepository } from '@/domain/interfaces/CharacterConversationRepository';
import { MongoDBProjectSettingsRepository } from '@/infrastructure/persistence/MongoDBProjectSettingsRepository';
import { MongoDBResearchDocumentRepository } from '@/infrastructure/persistence/MongoDBResearchDocumentRepository';
import { MongoDBPresentationOverrideRepository } from '@/infrastructure/persistence/MongoDBPresentationOverrideRepository';
import { PresentationOverrideRepository } from '@/domain/interfaces/PresentationOverrideRepository';
import { InMemoryProjectRepository } from '@/infrastructure/persistence/InMemoryProjectRepository';
import { VercelBlobStorage } from '@/infrastructure/storage/VercelBlobStorage';
import { FilePromptRepository } from '@/infrastructure/prompts/FilePromptRepository';
import { OpenAIProvider } from '@/infrastructure/ai/OpenAIProvider';
import { AnthropicProvider } from '@/infrastructure/ai/AnthropicProvider';
import { GoogleProvider } from '@/infrastructure/ai/GoogleProvider';
import { DocxParser } from '@/infrastructure/document/parsers/DocxParser';
import { MarkdownParser } from '@/infrastructure/document/parsers/MarkdownParser';
import { CompositeDocumentParser } from '@/infrastructure/document/parsers/CompositeParser';
import { MarkdownFolderParser } from '@/infrastructure/document/parsers/MarkdownFolderParser';
import { FolderParser } from '@/domain/interfaces/FolderParser';
import { DocxExporter } from '@/infrastructure/document/exporters/DocxExporter';
import { PagedPdfExporter } from '@/infrastructure/document/exporters/PagedPdfExporter';
import { PlaywrightBrowserLauncher } from '@/infrastructure/document/paged/PlaywrightBrowserLauncher';
import { createServerPagedJsRenderer } from '@/infrastructure/document/paged/ServerPagedJsRenderer';
import { TipTapToBookHtml } from '@/infrastructure/document/paged/TipTapToBookHtml';
import { MongoDBBookPreviewCacheRepository } from '@/infrastructure/persistence/MongoDBBookPreviewCacheRepository';
import { BookPreviewCacheComputer } from '@/application/services/BookPreviewCacheComputer';
import { WholeBookHtmlAssembler } from '@/application/services/WholeBookHtmlAssembler';
import { TipTapContentService } from '@/infrastructure/document/utils/TipTapContentService';
import { GrammalecteDictionaryCompiler } from '@/infrastructure/grammar/GrammalecteDictionaryCompiler';
import { GrammalecteGrammarChecker } from '@/infrastructure/grammar/GrammalecteGrammarChecker';
import { loadNspellSpellChecker } from '@/infrastructure/spell/NspellSpellChecker';
import type { SpellChecker } from '@/domain/interfaces/SpellChecker';
import { Provider } from '@/domain/entities/Provider';
import { config } from './env';
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
 * Get the custom annex repository (author-inserted book annexes).
 */
let customAnnexRepoInstance: MongoDBCustomAnnexRepository | null = null;

export async function getCustomAnnexRepository(): Promise<CustomAnnexRepository> {
  if (!customAnnexRepoInstance) {
    const db = await getDatabase();
    customAnnexRepoInstance = new MongoDBCustomAnnexRepository(db);
    await customAnnexRepoInstance.ensureIndexes();
  }
  return customAnnexRepoInstance;
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
 * Get the snapshot repository.
 */
let snapshotRepoInstance: MongoDBSnapshotRepository | null = null;

export async function getSnapshotRepository(): Promise<SnapshotRepository> {
  if (!snapshotRepoInstance) {
    const db = await getDatabase();
    snapshotRepoInstance = new MongoDBSnapshotRepository(db);
    // Ensure indexes on first use
    await snapshotRepoInstance.ensureIndexes();
  }
  return snapshotRepoInstance;
}

/** Get the shared server-side scheduler for automatic project snapshots. */
let automaticSnapshotRepoInstance: MongoDBAutomaticSnapshotRepository | null = null;

export async function getAutomaticSnapshotRepository(): Promise<AutomaticSnapshotRepository> {
  if (!automaticSnapshotRepoInstance) {
    const db = await getDatabase();
    automaticSnapshotRepoInstance = new MongoDBAutomaticSnapshotRepository(db);
    await automaticSnapshotRepoInstance.ensureIndexes();
  }
  return automaticSnapshotRepoInstance;
}

/**
 * Get the blog article repository.
 */
let blogArticleRepoInstance: MongoDBBlogArticleRepository | null = null;

export async function getBlogArticleRepository(): Promise<BlogArticleRepository> {
  if (!blogArticleRepoInstance) {
    const db = await getDatabase();
    blogArticleRepoInstance = new MongoDBBlogArticleRepository(db);
    // Ensure indexes on first use
    await blogArticleRepoInstance.ensureIndexes();
  }
  return blogArticleRepoInstance;
}

/**
 * Get the contact message repository.
 */
let contactMessageRepoInstance: MongoDBContactMessageRepository | null = null;

export async function getContactMessageRepository(): Promise<ContactMessageRepository> {
  if (!contactMessageRepoInstance) {
    const db = await getDatabase();
    contactMessageRepoInstance = new MongoDBContactMessageRepository(db);
    await contactMessageRepoInstance.ensureIndexes();
  }
  return contactMessageRepoInstance;
}

/**
 * Get the article view repository.
 */
let articleViewRepoInstance: MongoDBArticleViewRepository | null = null;

export async function getArticleViewRepository(): Promise<ArticleViewRepository> {
  if (!articleViewRepoInstance) {
    const db = await getDatabase();
    articleViewRepoInstance = new MongoDBArticleViewRepository(db);
    await articleViewRepoInstance.ensureIndexes();
  }
  return articleViewRepoInstance;
}

/**
 * Get the writing goal repository.
 */
export async function getWritingGoalRepository(): Promise<WritingGoalRepository> {
  const db = await getDatabase();
  return new MongoDBWritingGoalRepository(db);
}

/**
 * Get the word count snapshot repository.
 */
let wordCountSnapshotRepoInstance: MongoDBWordCountSnapshotRepository | null = null;

export async function getWordCountSnapshotRepository(): Promise<WordCountSnapshotRepository> {
  if (!wordCountSnapshotRepoInstance) {
    const db = await getDatabase();
    wordCountSnapshotRepoInstance = new MongoDBWordCountSnapshotRepository(db);
    // Ensure indexes on first use
    await wordCountSnapshotRepoInstance.ensureIndexes();
  }
  return wordCountSnapshotRepoInstance;
}

/**
 * Get the writing quota repository.
 */
export async function getWritingQuotaRepository(): Promise<WritingQuotaRepository> {
  const db = await getDatabase();
  return new MongoDBWritingQuotaRepository(db);
}

/**
 * Get the model pricing repository.
 */
let modelPricingRepoInstance: MongoDBModelPricingRepository | null = null;

export async function getModelPricingRepository(): Promise<ModelPricingRepository> {
  if (!modelPricingRepoInstance) {
    const db = await getDatabase();
    modelPricingRepoInstance = new MongoDBModelPricingRepository(db);
    await modelPricingRepoInstance.ensureIndexes();
  }
  return modelPricingRepoInstance;
}

/**
 * Get the pending (quarantined) price change repository.
 */
let pendingPriceChangeRepoInstance: MongoDBPendingPriceChangeRepository | null = null;

export async function getPendingPriceChangeRepository(): Promise<PendingPriceChangeRepository> {
  if (!pendingPriceChangeRepoInstance) {
    const db = await getDatabase();
    pendingPriceChangeRepoInstance = new MongoDBPendingPriceChangeRepository(db);
    await pendingPriceChangeRepoInstance.ensureIndexes();
  }
  return pendingPriceChangeRepoInstance;
}

/**
 * Get the AI usage repository.
 */
let aiUsageRepoInstance: MongoDBUsageRepository | null = null;

export async function getAIUsageRepository(): Promise<AIUsageRepository> {
  if (!aiUsageRepoInstance) {
    const db = await getDatabase();
    aiUsageRepoInstance = new MongoDBUsageRepository(db);
  }
  return aiUsageRepoInstance;
}

/**
 * Get the autocomplete event repository (instrumentation; one record per suggestion).
 */
let autocompleteEventRepoInstance: MongoDBAutocompleteEventRepository | null = null;

export async function getAutocompleteEventRepository(): Promise<AutocompleteEventRepository> {
  if (!autocompleteEventRepoInstance) {
    const db = await getDatabase();
    autocompleteEventRepoInstance = new MongoDBAutocompleteEventRepository(db);
    await autocompleteEventRepoInstance.ensureIndexes();
  }
  return autocompleteEventRepoInstance;
}

/**
 * Get the canon-fact repository (the canon ledger; atomic manuscript facts).
 */
let canonFactRepoInstance: MongoDBCanonFactRepository | null = null;

export async function getCanonFactRepository(): Promise<CanonFactRepository> {
  if (!canonFactRepoInstance) {
    const db = await getDatabase();
    canonFactRepoInstance = new MongoDBCanonFactRepository(db);
    await canonFactRepoInstance.ensureIndexes();
  }
  return canonFactRepoInstance;
}

export async function getCanonExtractionStateRepository(): Promise<CanonExtractionStateRepository> {
  // MongoDBCanonFactRepository implements both interfaces; reuse the shared instance.
  if (!canonFactRepoInstance) {
    const db = await getDatabase();
    canonFactRepoInstance = new MongoDBCanonFactRepository(db);
    await canonFactRepoInstance.ensureIndexes();
  }
  return canonFactRepoInstance;
}

/**
 * Get the rate-limit repository (shared fixed-window counters across instances).
 */
let rateLimitRepoInstance: MongoDBRateLimitRepository | null = null;

export async function getRateLimitRepository(): Promise<RateLimitRepository> {
  if (!rateLimitRepoInstance) {
    const db = await getDatabase();
    rateLimitRepoInstance = new MongoDBRateLimitRepository(db);
    await rateLimitRepoInstance.ensureIndexes();
  }
  return rateLimitRepoInstance;
}

/**
 * Get the AI exchange repository (captured exchange content, encrypted at rest).
 */
let aiExchangeRepoInstance: MongoDBExchangeRepository | null = null;

export async function getAIExchangeRepository(): Promise<AIExchangeRepository> {
  if (!aiExchangeRepoInstance) {
    const db = await getDatabase();
    aiExchangeRepoInstance = new MongoDBExchangeRepository(
      db,
      getFieldEncryption()
    );
    await aiExchangeRepoInstance.ensureIndexes();
  }
  return aiExchangeRepoInstance;
}

/**
 * Get the project task repository.
 */
export async function getProjectTaskRepository(): Promise<ProjectTaskRepository> {
  const db = await getDatabase();
  return new MongoDBProjectTaskRepository(db);
}

/**
 * Get the character repository.
 */
let characterRepoInstance: MongoDBCharacterRepository | null = null;

export async function getCharacterRepository(): Promise<CharacterRepository> {
  if (!characterRepoInstance) {
    const db = await getDatabase();
    characterRepoInstance = new MongoDBCharacterRepository(db);
    await characterRepoInstance.ensureIndexes();
  }
  return characterRepoInstance;
}

/**
 * Get the character conversation repository.
 */
let characterConversationRepoInstance: MongoDBCharacterConversationRepository | null = null;

export async function getCharacterConversationRepository(): Promise<CharacterConversationRepository> {
  if (!characterConversationRepoInstance) {
    const db = await getDatabase();
    characterConversationRepoInstance = new MongoDBCharacterConversationRepository(db);
    await characterConversationRepoInstance.ensureIndexes();
  }
  return characterConversationRepoInstance;
}

/**
 * Get the project settings repository.
 */
let projectSettingsRepoInstance: MongoDBProjectSettingsRepository | null = null;

export async function getProjectSettingsRepository(): Promise<ProjectSettingsRepository> {
  if (!projectSettingsRepoInstance) {
    const db = await getDatabase();
    projectSettingsRepoInstance = new MongoDBProjectSettingsRepository(db);
    await projectSettingsRepoInstance.ensureIndexes();
  }
  return projectSettingsRepoInstance;
}

/**
 * Get the research document repository.
 */
let researchDocumentRepoInstance: MongoDBResearchDocumentRepository | null = null;

export async function getResearchDocumentRepository(): Promise<ResearchDocumentRepository> {
  if (!researchDocumentRepoInstance) {
    const db = await getDatabase();
    researchDocumentRepoInstance = new MongoDBResearchDocumentRepository(db);
    await researchDocumentRepoInstance.ensureIndexes();
  }
  return researchDocumentRepoInstance;
}

/**
 * Get the presentation override repository.
 */
let presentationOverrideRepoInstance: MongoDBPresentationOverrideRepository | null = null;

export async function getPresentationOverrideRepository(): Promise<PresentationOverrideRepository> {
  if (!presentationOverrideRepoInstance) {
    const db = await getDatabase();
    presentationOverrideRepoInstance = new MongoDBPresentationOverrideRepository(db);
    await presentationOverrideRepoInstance.ensureIndexes();
  }
  return presentationOverrideRepoInstance;
}

/**
 * Get the blob storage service.
 * Returns Vercel Blob storage implementation for cover images.
 */
let blobStorageInstance: BlobStorage | null = null;

export function getBlobStorage(): BlobStorage {
  if (!blobStorageInstance) {
    blobStorageInstance = new VercelBlobStorage('covers');
  }
  return blobStorageInstance;
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

    case 'google':
      return new GoogleProvider(apiKey, promptRepo, model);

    default:
      throw new Error(`Unsupported provider type: ${provider.getType()}`);
  }
}

/**
 * Get the document parser for import.
 * Returns CompositeDocumentParser supporting .docx and .md files.
 */
export function getDocumentParser(): DocumentParser {
  return new CompositeDocumentParser([
    new DocxParser(),
    new MarkdownParser(),
  ]);
}

/**
 * @deprecated Use getDocumentParser() instead
 */
export function getDocxParser(): DocumentParser {
  return getDocumentParser();
}

/**
 * Get the folder parser for importing folders of Markdown files.
 * Each .md file in the folder becomes a chapter.
 */
export function getFolderParser(): FolderParser {
  return new MarkdownFolderParser();
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
    return new PagedPdfExporter(
      config.app.baseUrl,
      new PlaywrightBrowserLauncher(),
      createServerPagedJsRenderer(),
    );
  }
  return new DocxExporter();
}

/**
 * Get the whole-book PDF preview cache repository (metrics document + GridFS blob).
 */
let bookPreviewCacheRepoInstance: MongoDBBookPreviewCacheRepository | null = null;

export async function getBookPreviewCacheRepository(): Promise<MongoDBBookPreviewCacheRepository> {
  if (!bookPreviewCacheRepoInstance) {
    const db = await getDatabase();
    bookPreviewCacheRepoInstance = new MongoDBBookPreviewCacheRepository(db);
    await bookPreviewCacheRepoInstance.ensureIndexes();
  }
  return bookPreviewCacheRepoInstance;
}

/**
 * Build the whole-book preview computer wired to headless Chromium.
 * Stateless per call; the browser is launched and closed inside compute().
 */
export function getBookPreviewCacheComputer(): BookPreviewCacheComputer {
  return new BookPreviewCacheComputer(
    new PlaywrightBrowserLauncher(),
    () => new Date(),
    createServerPagedJsRenderer(),
    new WholeBookHtmlAssembler(new TipTapToBookHtml()),
  );
}

/**
 * Get the content converter for extracting/transforming editor content.
 * Returns TipTapContentService implementation.
 */
export function getContentConverter(): ContentConverter {
  return new TipTapContentService();
}

/** Get the process-local grammar checker backed by the private Grammalecte package. */
let grammarCheckerInstance: GrammarChecker | null = null;

export function getGrammarChecker(): GrammarChecker {
  if (!grammarCheckerInstance) {
    grammarCheckerInstance = new GrammalecteGrammarChecker();
  }
  return grammarCheckerInstance;
}

/**
 * Get the process-local spell checker backed by nspell and the fr-FR dictionary.
 *
 * The adapter memoises the load itself, so concurrent callers share one engine rather than
 * each starting their own — see `loadNspellSpellChecker`.
 */
export function getSpellChecker(): Promise<SpellChecker> {
  return loadNspellSpellChecker();
}

/** Get the builder turning a project's declared vocabulary into an engine dictionary. */
let dictionaryCompilerInstance: GrammarDictionaryCompiler | null = null;

export function getGrammarDictionaryCompiler(): GrammarDictionaryCompiler {
  if (!dictionaryCompilerInstance) {
    dictionaryCompilerInstance = new GrammalecteDictionaryCompiler();
  }
  return dictionaryCompilerInstance;
}
