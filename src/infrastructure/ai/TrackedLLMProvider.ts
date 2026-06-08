// ABOUTME: Decorator wrapper that tracks AI usage metrics for any LLMProvider
// ABOUTME: Records tokens, duration, and operation type for each AI call

import { LLMProvider, ConnectionTestResult } from '@/domain/interfaces/LLMProvider';
import { AIUsageRepository } from '@/domain/interfaces/AIUsageRepository';
import { IdGenerator } from '@/domain/interfaces/IdGenerator';
import { AIUsageRecord } from '@/domain/entities/AIUsageRecord';
import { AIOperationType } from '@/domain/value-objects/AIOperationType';
import { RewriteProposal } from '@/domain/value-objects/RewriteProposal';
import { NarrativeAnalysis } from '@/domain/value-objects/NarrativeAnalysis';
import { StylisticDNA } from '@/domain/value-objects/StylisticDNA';
import { Characters, CharacterProfile } from '@/domain/value-objects/Characters';
import { Plot } from '@/domain/value-objects/Plot';
import { Worldbuilding } from '@/domain/value-objects/Worldbuilding';
import { Synthesis } from '@/domain/value-objects/Synthesis';
import { ChapterSummaries } from '@/domain/value-objects/ChapterSummaries';
import { ChapterGeneration } from '@/domain/value-objects/ChapterGeneration';
import { ChapterGenerationTypeKey } from '@/domain/value-objects/ChapterGenerationType';
import { ChatMessage } from '@/domain/value-objects/ChatMessage';

export class TrackedLLMProvider implements LLMProvider {
  private lastInputTokens: number | null = null;
  private lastOutputTokens: number | null = null;

  constructor(
    private readonly wrapped: LLMProvider,
    private readonly usageRepository: AIUsageRepository,
    private readonly idGenerator: IdGenerator,
    private readonly userId: string,
    private readonly projectId: string
  ) {}

  private async trackUsage<T>(
    operation: AIOperationType,
    fn: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now();

    try {
      const result = await fn();
      const durationMs = Date.now() - startTime;

      // Capture real token usage reported by the wrapped provider (success only,
      // to avoid attributing a previous call's tokens to a failed one).
      this.captureWrappedUsage();

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

  private async recordUsage(
    operation: AIOperationType,
    durationMs: number
  ): Promise<void> {
    const record = AIUsageRecord.create(
      this.idGenerator.generate(),
      this.userId,
      this.projectId,
      operation,
      this.wrapped.getProviderName(),
      this.wrapped.getModel(),
      this.lastInputTokens,
      this.lastOutputTokens,
      durationMs
    );

    await this.usageRepository.save(record);

    // Reset token counts for next operation
    this.lastInputTokens = null;
    this.lastOutputTokens = null;
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
}
