// ABOUTME: Decorator wrapper that tracks AI usage metrics for any LLMProvider
// ABOUTME: Records tokens, duration, and operation type for each AI call

import { LLMProvider, ConnectionTestResult, ExchangeContent } from '@/domain/interfaces/LLMProvider';
import { AIUsageRepository } from '@/domain/interfaces/AIUsageRepository';
import { AIExchangeRepository } from '@/domain/interfaces/AIExchangeRepository';
import { IdGenerator } from '@/domain/interfaces/IdGenerator';
import { AIUsageRecord } from '@/domain/entities/AIUsageRecord';
import { AIExchange } from '@/domain/entities/AIExchange';
import { AIOperationType } from '@/domain/value-objects/AIOperationType';
import { computeCostEur, selectPricingEntry } from '@/domain/value-objects/ModelPricing';
import { truncateExchangeField } from './exchange-truncation';
import { ModelPricingRepository, ModelPricingEntry, PricingProvider } from '@/domain/interfaces/ModelPricingRepository';
import { EUR_USD_RATE } from '@/infrastructure/pricing/OpenRouterPricingClient';
import { RewriteProposal } from '@/domain/value-objects/RewriteProposal';
import { NarrativeAnalysis } from '@/domain/value-objects/NarrativeAnalysis';
import { StylisticDNA } from '@/domain/value-objects/StylisticDNA';
import { Characters, CharacterProfile } from '@/domain/value-objects/Characters';
import { Plot } from '@/domain/value-objects/Plot';
import { Worldbuilding } from '@/domain/value-objects/Worldbuilding';
import { Synthesis } from '@/domain/value-objects/Synthesis';
import { ChapterSummaries } from '@/domain/value-objects/ChapterSummaries';
import { CanonFacts } from '@/domain/value-objects/CanonFacts';
import { ChapterGeneration } from '@/domain/value-objects/ChapterGeneration';
import { ChapterGenerationTypeKey } from '@/domain/value-objects/ChapterGenerationType';
import { ChatMessage } from '@/domain/value-objects/ChatMessage';
import { WordAlternative } from '@/domain/value-objects/WordAlternative';

export interface ExchangeLoggingConfig {
  enabled: boolean;
  retentionDays: number;
}

/** Maps display provider names returned by LLMProvider.getProviderName() to normalized ProviderType keys. */
const PROVIDER_NAME_MAP: Record<string, PricingProvider> = {
  'Anthropic': 'anthropic',
  'OpenAI': 'openai',
  'Google AI': 'google',
};

const PRICING_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

export class TrackedLLMProvider implements LLMProvider {
  private lastInputTokens: number | null = null;
  private lastOutputTokens: number | null = null;
  private lastCachedInputTokens: number | null = null;
  private lastExchangeContent: ExchangeContent | null = null;

  private pricingCache: ModelPricingEntry[] | null = null;
  private pricingCacheAt = 0;

  constructor(
    private readonly wrapped: LLMProvider,
    private readonly usageRepository: AIUsageRepository,
    private readonly idGenerator: IdGenerator,
    private readonly userId: string,
    private readonly projectId: string,
    private readonly exchangeRepository: AIExchangeRepository | null = null,
    private readonly exchangeLogging: ExchangeLoggingConfig | null = null,
    private readonly pricingRepository?: ModelPricingRepository
  ) {}

  /**
   * Pull the content of the wrapped provider's most recent call so it can be
   * persisted by logExchange(). No-op when the provider does not capture it.
   */
  private captureWrappedExchange(): void {
    this.lastExchangeContent = this.wrapped.getLastExchange?.() ?? null;
  }

  /**
   * Persist the captured exchange content, encrypted and truncated, alongside
   * the usage record. Best-effort: a failure here never breaks the AI call or
   * the usage record. Skipped when logging is disabled or no content exists.
   */
  private async logExchange(
    operation: AIOperationType,
    usageRecord: AIUsageRecord
  ): Promise<void> {
    if (!this.exchangeRepository || !this.exchangeLogging?.enabled) {
      return;
    }
    const content = this.lastExchangeContent;
    if (!content) {
      return;
    }

    try {
      const exchange = AIExchange.create({
        id: this.idGenerator.generate(),
        userId: this.userId,
        projectId: this.projectId,
        usageRecordId: usageRecord.getId(),
        operation,
        provider: usageRecord.getProvider(),
        model: usageRecord.getModel(),
        systemPrompt: truncateExchangeField(content.systemPrompt),
        input: truncateExchangeField(content.input),
        output: truncateExchangeField(content.output),
        inputTokens: usageRecord.getInputTokens(),
        outputTokens: usageRecord.getOutputTokens(),
        cachedInputTokens: usageRecord.getCachedInputTokens(),
        costEur: usageRecord.getCostEur(),
        durationMs: usageRecord.getDurationMs(),
        retentionDays: this.exchangeLogging.retentionDays,
      });
      await this.exchangeRepository.save(exchange);
    } catch (error) {
      console.error('Failed to persist AI exchange content', error);
    }
  }

  private async trackUsage<T>(
    operation: AIOperationType,
    fn: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now();

    try {
      const result = await fn();
      const durationMs = Date.now() - startTime;

      // Capture real token usage and exchange content reported by the wrapped
      // provider (success only, to avoid attributing a previous call's data to
      // a failed one).
      this.captureWrappedUsage();
      this.captureWrappedExchange();

      // Record usage asynchronously (don't block the response)
      this.recordUsage(operation, durationMs).catch(console.error);

      return result;
    } catch (error) {
      // Still record failed attempts for monitoring
      const durationMs = Date.now() - startTime;
      this.recordUsage(operation, durationMs).catch(console.error);
      throw error;
    }
  }

  private async resolvePricingEntry(
    normalizedProvider: PricingProvider,
    model: string
  ): Promise<ModelPricingEntry | null> {
    if (!this.pricingRepository) return null;

    const now = Date.now();
    if (!this.pricingCache || now - this.pricingCacheAt > PRICING_CACHE_TTL_MS) {
      this.pricingCache = await this.pricingRepository.findAll();
      this.pricingCacheAt = now;
    }

    return selectPricingEntry(this.pricingCache, normalizedProvider, model);
  }

  private async recordUsage(
    operation: AIOperationType,
    durationMs: number
  ): Promise<void> {
    const displayProvider = this.wrapped.getProviderName();
    const model = this.wrapped.getModel();
    const normalizedProvider = PROVIDER_NAME_MAP[displayProvider];

    let costEur: number | null = null;
    if (normalizedProvider) {
      const entry = await this.resolvePricingEntry(normalizedProvider, model);
      costEur = computeCostEur(
        {
          provider: displayProvider,
          model,
          inputTokens: this.lastInputTokens,
          outputTokens: this.lastOutputTokens,
          cachedInputTokens: this.lastCachedInputTokens,
        },
        entry,
        EUR_USD_RATE
      );
    }

    const record = AIUsageRecord.create(
      this.idGenerator.generate(),
      this.userId,
      this.projectId,
      operation,
      displayProvider,
      model,
      this.lastInputTokens,
      this.lastOutputTokens,
      durationMs,
      this.lastCachedInputTokens,
      costEur
    );

    await this.usageRepository.save(record);

    // Persist the captured content (opt-in) linked to this usage record.
    await this.logExchange(operation, record);

    // Reset captured state for next operation
    this.lastInputTokens = null;
    this.lastOutputTokens = null;
    this.lastCachedInputTokens = null;
    this.lastExchangeContent = null;
  }

  setTokenCounts(inputTokens: number | null, outputTokens: number | null): void {
    this.lastInputTokens = inputTokens;
    this.lastOutputTokens = outputTokens;
  }

  /**
   * Pull the token usage reported by the wrapped provider for its most recent
   * call and stage it for the next usage record. No-op when the provider does
   * not report usage, preserving any counts set manually via setTokenCounts.
   */
  private captureWrappedUsage(): void {
    const usage = this.wrapped.getLastTokenUsage?.();
    if (usage) {
      this.lastInputTokens = usage.inputTokens;
      this.lastOutputTokens = usage.outputTokens;
      this.lastCachedInputTokens = usage.cachedInputTokens;
    }
  }

  async generateRewrites(
    text: string,
    context?: string,
    authorProfile?: string
  ): Promise<RewriteProposal[]> {
    return this.trackUsage('rewrite', () =>
      this.wrapped.generateRewrites(text, context, authorProfile)
    );
  }

  async testConnection(): Promise<ConnectionTestResult> {
    // Don't track connection tests - they're not user operations
    return this.wrapped.testConnection();
  }

  getProviderName(): string {
    return this.wrapped.getProviderName();
  }

  getModel(): string {
    return this.wrapped.getModel();
  }

  async generateNarrativeAnalysis(fullText: string): Promise<NarrativeAnalysis> {
    return this.trackUsage('narrative_analysis', () =>
      this.wrapped.generateNarrativeAnalysis(fullText)
    );
  }

  async generateStylisticDNA(fullText: string): Promise<StylisticDNA> {
    return this.trackUsage('stylistic_dna', () =>
      this.wrapped.generateStylisticDNA(fullText)
    );
  }

  async generateCharacters(fullText: string): Promise<Characters> {
    return this.trackUsage('characters', () =>
      this.wrapped.generateCharacters(fullText)
    );
  }

  async generatePlot(fullText: string): Promise<Plot> {
    return this.trackUsage('plot', () =>
      this.wrapped.generatePlot(fullText)
    );
  }

  async generateWorldbuilding(fullText: string): Promise<Worldbuilding> {
    return this.trackUsage('worldbuilding', () =>
      this.wrapped.generateWorldbuilding(fullText)
    );
  }

  async generateSynthesis(
    fullText: string,
    previousAnalyses: {
      narrative?: NarrativeAnalysis;
      stylisticDNA?: StylisticDNA;
      characters?: Characters;
      plot?: Plot;
      worldbuilding?: Worldbuilding;
    }
  ): Promise<Synthesis> {
    return this.trackUsage('synthesis', () =>
      this.wrapped.generateSynthesis(fullText, previousAnalyses)
    );
  }

  async generateChapterSummaries(fullText: string): Promise<ChapterSummaries> {
    return this.trackUsage('chapter_summaries', () =>
      this.wrapped.generateChapterSummaries(fullText)
    );
  }

  async generateCanonFacts(
    fullText: string,
    characterNames: string[]
  ): Promise<CanonFacts> {
    return this.trackUsage('canon_facts', () =>
      this.wrapped.generateCanonFacts(fullText, characterNames)
    );
  }

  async generateChapter(
    fullText: string,
    generationType: ChapterGenerationTypeKey,
    projectContext?: string
  ): Promise<ChapterGeneration> {
    return this.trackUsage('chapter_generation', () =>
      this.wrapped.generateChapter(fullText, generationType, projectContext)
    );
  }

  async generateCompletion(
    textBeforeCursor: string,
    textAfterCursor?: string,
    projectContext?: string
  ): Promise<string> {
    return this.trackUsage('completion', () =>
      this.wrapped.generateCompletion(textBeforeCursor, textAfterCursor, projectContext)
    );
  }

  async *generateCompletionStream(
    textBeforeCursor: string,
    textAfterCursor?: string,
    projectContext?: string
  ): AsyncIterableIterator<string> {
    const startTime = Date.now();

    try {
      const iterator = this.wrapped.generateCompletionStream(
        textBeforeCursor,
        textAfterCursor,
        projectContext
      );

      for await (const chunk of iterator) {
        yield chunk;
      }

      const durationMs = Date.now() - startTime;
      this.captureWrappedUsage();
      this.captureWrappedExchange();
      this.recordUsage('completion', durationMs).catch(console.error);
    } catch (error) {
      const durationMs = Date.now() - startTime;
      this.recordUsage('completion', durationMs).catch(console.error);
      throw error;
    }
  }

  async *chatStream(
    messages: ChatMessage[],
    systemPrompt: string,
  ): AsyncIterableIterator<string> {
    const start = Date.now();
    try {
      yield* this.wrapped.chatStream(messages, systemPrompt);
      this.captureWrappedUsage();
      this.captureWrappedExchange();
      await this.recordUsage('character_chat', Date.now() - start);
    } catch (error) {
      await this.recordUsage('character_chat', Date.now() - start);
      throw error;
    }
  }

  async generateCharacterSheet(
    characterName: string,
    existingFields: Omit<CharacterProfile, 'name'>,
    projectContext: string
  ): Promise<Omit<CharacterProfile, 'name'>> {
    return this.trackUsage('character_sheet', () =>
      this.wrapped.generateCharacterSheet(characterName, existingFields, projectContext)
    );
  }

  async suggestAlternatives(
    word: string,
    sentence: string,
    authorProfile?: string
  ): Promise<WordAlternative[]> {
    return this.trackUsage('suggest_alternatives', () =>
      this.wrapped.suggestAlternatives(word, sentence, authorProfile)
    );
  }
}
