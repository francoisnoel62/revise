// ABOUTME: Use case for the contextual thesaurus — assembles lexical (layer 1) and AI (layer 2) alternatives
// ABOUTME: Layer 1 is always computed; layer 2 is only triggered when includeAILayer is true

import { LLMProvider } from '../../domain';
import { AIContextBuilder } from '../services/AIContextBuilder';
import { Thesaurus } from '../../domain/interfaces/Thesaurus';
import { WordAlternative } from '../../domain/value-objects/WordAlternative';

export interface SuggestAlternativesInput {
  ownerId: string;
  projectId: string;
  word: string;
  sentence: string;
  includeAILayer?: boolean;
}

export interface SuggestAlternativesResult {
  layer1: string[];
  layer2?: WordAlternative[];
  voiceAnchored: boolean;
}

export class SuggestAlternativesUseCase {
  constructor(
    private readonly aiContextBuilder: AIContextBuilder,
    private readonly llmProvider: LLMProvider,
    private readonly thesaurus: Thesaurus
  ) {}

  async execute(input: SuggestAlternativesInput): Promise<SuggestAlternativesResult> {
    if (!input.ownerId || input.ownerId.trim().length === 0) {
      throw new Error('Owner ID is required');
    }

    if (!input.projectId || input.projectId.trim().length === 0) {
      throw new Error('Project ID is required');
    }

    if (!input.word || input.word.trim().length === 0) {
      throw new Error('Word is required');
    }

    if (!input.sentence || input.sentence.trim().length === 0) {
      throw new Error('Sentence is required');
    }

    // Layer 1: always computed, 0 token, instant
    const layer1 = await this.thesaurus.lookup(input.word);

    if (!input.includeAILayer) {
      return { layer1, voiceAnchored: false };
    }

    // Layer 2: AI, only when explicitly requested
    const authorProfile = await this.aiContextBuilder.buildRewriteContext(
      input.ownerId,
      input.projectId
    );
    const voiceAnchored = authorProfile.length > 0;

    const layer2 = await this.llmProvider.suggestAlternatives(
      input.word,
      input.sentence,
      voiceAnchored ? authorProfile : undefined
    );

    return { layer1, layer2, voiceAnchored };
  }
}
