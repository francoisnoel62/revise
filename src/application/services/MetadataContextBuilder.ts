// ABOUTME: Application service centralizing metadata loading for the synthesis feature
// ABOUTME: Reads structuredData field to build typed context objects without regex parsing

import { MetadataRepository } from '../../domain/interfaces/MetadataRepository';
import type {
  NarrativeAnalysis,
  StylisticDNA,
  Characters,
  Plot,
  Worldbuilding,
} from '../../domain';

export interface SynthesisContext {
  narrative?: NarrativeAnalysis;
  stylisticDNA?: StylisticDNA;
  characters?: Characters;
  plot?: Plot;
  worldbuilding?: Worldbuilding;
}

export class MetadataContextBuilder {
  constructor(private readonly metadataRepository: MetadataRepository) {}

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
          }
        } catch {
          // Skip metadata with corrupt structuredData
        }
      }
    } catch {
      // Fail gracefully — synthesis works without context
    }

    return result;
  }
}
