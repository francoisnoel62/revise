// ABOUTME: Decorator wrapper that tracks AI usage metrics for any LLMProvider
// ABOUTME: Records tokens, duration, operation type, and full request details for each AI call

import { LLMProvider, ConnectionTestResult } from '@/domain/interfaces/LLMProvider';
import { AIUsageRepository } from '@/domain/interfaces/AIUsageRepository';
import { AIRequestRepository } from '@/domain/interfaces/AIRequestRepository';
import { IdGenerator } from '@/domain/interfaces/IdGenerator';
import { AIUsageRecord } from '@/domain/entities/AIUsageRecord';
import { AIRequestRecord } from '@/domain/entities/AIRequestRecord';
import { AIOperationType } from '@/domain/value-objects/AIOperationType';
import { RewriteProposal } from '@/domain/value-objects/RewriteProposal';
import { NarrativeAnalysis } from '@/domain/value-objects/NarrativeAnalysis';
import { StylisticDNA } from '@/domain/value-objects/StylisticDNA';
import { Characters } from '@/domain/value-objects/Characters';
import { Plot } from '@/domain/value-objects/Plot';
import { Worldbuilding } from '@/domain/value-objects/Worldbuilding';
import { Synthesis } from '@/domain/value-objects/Synthesis';
import { ChapterSummaries } from '@/domain/value-objects/ChapterSummaries';
import { ChapterGeneration } from '@/domain/value-objects/ChapterGeneration';
import { ChapterGenerationTypeKey } from '@/domain/value-objects/ChapterGenerationType';
import {
  AnalysisContext,
  AnalysisContextEntry,
  ANALYSIS_COLORS,
  ANALYSIS_LABELS,
} from '@/domain/value-objects/AnalysisContext';
import { PromptSnapshot } from '@/domain/value-objects/PromptSnapshot';
import { isIntrospectable } from './IntrospectableProvider';

export class TrackedLLMProvider implements LLMProvider {
  private lastInputTokens: number | null = null;
  private lastOutputTokens: number | null = null;
  private lastRequestRecordId: string | null = null;

  constructor(
    private readonly wrapped: LLMProvider,
    private readonly usageRepository: AIUsageRepository,
    private readonly idGenerator: IdGenerator,
    private readonly userId: string,
    private readonly projectId: string,
    private readonly requestRepository: AIRequestRepository | null = null
  ) {}

  /**
   * Returns the ID of the AIRequestRecord created for the last generateChapter call.
   * Returns null if request recording is not enabled or no call has been made yet.
   */
  getLastRequestRecordId(): string | null {
    return this.lastRequestRecordId;
  }

  private async trackUsage<T>(
    operation: AIOperationType,
    fn: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now();

    try {
      const result = await fn();
      const durationMs = Date.now() - startTime;

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

  async generateRewrites(text: string, context?: string): Promise<RewriteProposal[]> {
    return this.trackUsage('rewrite', () =>
      this.wrapped.generateRewrites(text, context)
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
    metadata?: {
      narrative?: NarrativeAnalysis;
      stylisticDNA?: StylisticDNA;
      characters?: Characters;
      plot?: Plot;
      worldbuilding?: Worldbuilding;
      chapterSummaries?: ChapterSummaries;
    }
  ): Promise<ChapterGeneration> {
    const startTime = Date.now();
    const result = await this.trackUsage('chapter_generation', () =>
      this.wrapped.generateChapter(fullText, generationType, metadata)
    );
    const durationMs = Date.now() - startTime;

    // Capture full request details asynchronously if request repository is configured
    if (this.requestRepository) {
      this.captureRequestRecord('chapter_generation', generationType, metadata, result, durationMs)
        .catch(console.error);
    }

    return result;
  }

  /**
   * Build AnalysisContext from the metadata passed to generateChapter.
   */
  private buildAnalysisContextFromMetadata(metadata?: {
    narrative?: NarrativeAnalysis;
    stylisticDNA?: StylisticDNA;
    characters?: Characters;
    plot?: Plot;
    worldbuilding?: Worldbuilding;
    chapterSummaries?: ChapterSummaries;
  }): AnalysisContext {
    const ANALYSIS_KEYS: Array<{
      typeKey: string;
      present: boolean;
      summary?: string;
    }> = [
      {
        typeKey: 'narrative-analysis',
        present: !!(metadata?.narrative),
        summary: metadata?.narrative?.summary?.substring(0, 200),
      },
      {
        typeKey: 'stylistic-dna',
        present: !!(metadata?.stylisticDNA),
        summary: metadata?.stylisticDNA?.summary?.substring(0, 200),
      },
      {
        typeKey: 'characters',
        present: !!(metadata?.characters),
        summary: metadata?.characters?.summary?.substring(0, 200),
      },
      {
        typeKey: 'plot',
        present: !!(metadata?.plot),
        summary: metadata?.plot?.summary?.substring(0, 200),
      },
      {
        typeKey: 'worldbuilding',
        present: !!(metadata?.worldbuilding),
        summary: metadata?.worldbuilding?.summary?.substring(0, 200),
      },
      {
        typeKey: 'chapter-summaries',
        present: !!(metadata?.chapterSummaries),
        summary: metadata?.chapterSummaries?.overallArc?.substring(0, 200),
      },
    ];

    const entries: AnalysisContextEntry[] = ANALYSIS_KEYS.map(({ typeKey, present, summary }) => ({
      typeKey,
      label: ANALYSIS_LABELS[typeKey] ?? typeKey,
      present,
      summary: present ? summary : undefined,
      colorCode: ANALYSIS_COLORS[typeKey] ?? '#64748b',
    }));

    return {
      entries,
      totalAvailable: entries.filter((e) => e.present).length,
      totalPossible: ANALYSIS_KEYS.length,
    };
  }

  /**
   * Build a human-readable summary for a chapter generation type.
   */
  private buildGenerationSummary(generationType: ChapterGenerationTypeKey): string {
    const summaries: Record<ChapterGenerationTypeKey, string> = {
      'chapter-full': 'Génération complète du chapitre',
      'chapter-beginning': 'Génération du début du chapitre',
      'chapter-outline': 'Génération du plan du chapitre',
    };
    return summaries[generationType] ?? 'Génération de chapitre';
  }

  /**
   * Capture a full AIRequestRecord after a successful generateChapter call.
   * Runs asynchronously and does not block the response.
   */
  private async captureRequestRecord(
    operation: AIOperationType,
    generationType: ChapterGenerationTypeKey,
    metadata: {
      narrative?: NarrativeAnalysis;
      stylisticDNA?: StylisticDNA;
      characters?: Characters;
      plot?: Plot;
      worldbuilding?: Worldbuilding;
      chapterSummaries?: ChapterSummaries;
    } | undefined,
    result: ChapterGeneration,
    durationMs: number
  ): Promise<void> {
    if (!this.requestRepository) return;

    // Build analysis context from metadata
    const analysisContext = this.buildAnalysisContextFromMetadata(metadata);

    // Get prompt snapshot from introspectable provider
    let prompt: PromptSnapshot;
    if (isIntrospectable(this.wrapped)) {
      const details = this.wrapped.getLastRequestDetails();
      prompt = {
        systemPrompt: details.systemPrompt ?? '',
        userMessage: details.userMessage ?? '',
        humanReadableSummary: this.buildGenerationSummary(generationType),
      };
    } else {
      prompt = {
        systemPrompt: '',
        userMessage: '',
        humanReadableSummary: this.buildGenerationSummary(generationType),
      };
    }

    // Get parameters from introspectable provider
    let parameters = {
      temperature: null as number | null,
      maxTokens: 4096,
      thinkingBudget: 0,
      thinkingEnabled: false,
    };
    if (isIntrospectable(this.wrapped)) {
      const details = this.wrapped.getLastRequestDetails();
      if (details.parameters) {
        parameters = details.parameters;
      }
    }

    // Truncate response preview
    const responsePreview = result.content.substring(0, 500);

    const record = AIRequestRecord.create(
      this.idGenerator.generate(),
      this.userId,
      this.projectId,
      operation,
      this.wrapped.getProviderName(),
      this.wrapped.getModel(),
      prompt,
      analysisContext,
      parameters,
      this.lastInputTokens,
      this.lastOutputTokens,
      durationMs,
      responsePreview
    );

    const saved = await this.requestRepository.save(record);
    this.lastRequestRecordId = saved.getId();
  }

  async generateCompletion(
    textBeforeCursor: string,
    textAfterCursor?: string,
    metadata?: {
      narrative?: NarrativeAnalysis;
      stylisticDNA?: StylisticDNA;
      characters?: Characters;
      plot?: Plot;
    }
  ): Promise<string> {
    return this.trackUsage('completion', () =>
      this.wrapped.generateCompletion(textBeforeCursor, textAfterCursor, metadata)
    );
  }

  async *generateCompletionStream(
    textBeforeCursor: string,
    textAfterCursor?: string,
    metadata?: {
      narrative?: NarrativeAnalysis;
      stylisticDNA?: StylisticDNA;
      characters?: Characters;
      plot?: Plot;
    }
  ): AsyncIterableIterator<string> {
    const startTime = Date.now();

    try {
      const iterator = this.wrapped.generateCompletionStream(
        textBeforeCursor,
        textAfterCursor,
        metadata
      );

      for await (const chunk of iterator) {
        yield chunk;
      }

      const durationMs = Date.now() - startTime;
      this.recordUsage('completion', durationMs).catch(console.error);
    } catch (error) {
      const durationMs = Date.now() - startTime;
      this.recordUsage('completion', durationMs).catch(console.error);
      throw error;
    }
  }
}
