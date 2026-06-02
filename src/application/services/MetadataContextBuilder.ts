// ABOUTME: Application service centralizing metadata loading for AI features
// ABOUTME: Reads structuredData field to build typed context objects without regex parsing

import { MetadataRepository } from '../../domain/interfaces/MetadataRepository';
import type {
  NarrativeAnalysis,
  StylisticDNA,
  Characters,
  Plot,
  Worldbuilding,
  ChapterSummaries,
} from '../../domain';

export interface RewriteContext {
  stylisticDNA?: StylisticDNA;
  narrative?: NarrativeAnalysis;
}

export interface CompletionContext {
  narrative?: NarrativeAnalysis;
  stylisticDNA?: StylisticDNA;
  characters?: Characters;
  plot?: Plot;
  worldbuilding?: Worldbuilding;
}

export interface ChapterGenerationContext {
  narrative?: NarrativeAnalysis;
  stylisticDNA?: StylisticDNA;
  characters?: Characters;
  plot?: Plot;
  worldbuilding?: Worldbuilding;
  chapterSummaries?: ChapterSummaries;
}

export interface SynthesisContext {
  narrative?: NarrativeAnalysis;
  stylisticDNA?: StylisticDNA;
  characters?: Characters;
  plot?: Plot;
  worldbuilding?: Worldbuilding;
}

export class MetadataContextBuilder {
  constructor(private readonly metadataRepository: MetadataRepository) {}

  async buildForRewrite(ownerId: string, projectId: string): Promise<RewriteContext> {
    return this.load(ownerId, projectId, ['stylistic-dna', 'narrative-analysis']) as Promise<RewriteContext>;
  }

  async buildForCompletion(ownerId: string, projectId: string): Promise<CompletionContext> {
    return this.load(ownerId, projectId, [
      'narrative-analysis',
      'stylistic-dna',
      'characters',
      'plot',
      'worldbuilding',
    ]) as Promise<CompletionContext>;
  }

  async buildForChapterGeneration(ownerId: string, projectId: string): Promise<ChapterGenerationContext> {
    return this.load(ownerId, projectId, [
      'narrative-analysis',
      'stylistic-dna',
      'characters',
      'plot',
      'worldbuilding',
      'chapter-summaries',
    ]) as Promise<ChapterGenerationContext>;
  }

  async buildForSynthesis(ownerId: string, projectId: string): Promise<SynthesisContext> {
    return this.load(ownerId, projectId, [
      'narrative-analysis',
      'stylistic-dna',
      'characters',
      'plot',
      'worldbuilding',
    ]) as Promise<SynthesisContext>;
  }

  private async load(
    ownerId: string,
    projectId: string,
    typeKeys: string[]
  ): Promise<Record<string, unknown>> {
    const result: Record<string, unknown> = {};

    try {
      const metadataList = await this.metadataRepository.findByProjectId(ownerId, projectId);

      for (const metadata of metadataList) {
        const typeKey = metadata.getTypeKey();
        if (!typeKeys.includes(typeKey)) continue;

        const raw = metadata.getStructuredData();
        if (!raw) continue;

        try {
          const parsed = JSON.parse(raw);
          switch (typeKey) {
            case 'narrative-analysis': result.narrative = parsed; break;
            case 'stylistic-dna':     result.stylisticDNA = parsed; break;
            case 'characters':        result.characters = parsed; break;
            case 'plot':              result.plot = parsed; break;
            case 'worldbuilding':     result.worldbuilding = parsed; break;
            case 'chapter-summaries': result.chapterSummaries = parsed; break;
          }
        } catch {
          // Skip metadata with corrupt structuredData
        }
      }
    } catch {
      // Fail gracefully — AI features work without context
    }

    return result;
  }
}
