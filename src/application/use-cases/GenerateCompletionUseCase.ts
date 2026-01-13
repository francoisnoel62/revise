// ABOUTME: Use case for generating AI-powered text completion
// ABOUTME: Loads project metadata for context-aware autocompletion

import {
  MetadataRepository,
  LLMProvider,
  ContentConverter,
  NarrativeAnalysis,
  StylisticDNA,
  Characters,
  Plot,
} from '../../domain';

export interface GenerateCompletionInput {
  ownerId: string;
  projectId: string;
  textBeforeCursor: string;
  textAfterCursor?: string;
}

export interface GenerateCompletionResult {
  completion: string;
}

export class GenerateCompletionUseCase {
  constructor(
    private readonly metadataRepository: MetadataRepository,
    private readonly llmProvider: LLMProvider,
    private readonly contentConverter: ContentConverter
  ) {}

  async execute(input: GenerateCompletionInput): Promise<GenerateCompletionResult> {
    // 1. Validate input
    if (!input.ownerId || input.ownerId.trim().length === 0) {
      throw new Error('Owner ID is required');
    }

    if (!input.projectId || input.projectId.trim().length === 0) {
      throw new Error('Project ID is required');
    }

    if (!input.textBeforeCursor || input.textBeforeCursor.trim().length === 0) {
      throw new Error('Text before cursor is required');
    }

    // 2. Load project metadata for context (optional - don't fail if unavailable)
    const metadata = await this.loadProjectMetadata(input.ownerId, input.projectId);

    // 3. Generate completion using LLM
    const completion = await this.llmProvider.generateCompletion(
      input.textBeforeCursor,
      input.textAfterCursor,
      metadata
    );

    return {
      completion,
    };
  }

  /**
   * Load relevant project metadata for completion context.
   */
  private async loadProjectMetadata(
    ownerId: string,
    projectId: string
  ): Promise<{
    narrative?: NarrativeAnalysis;
    stylisticDNA?: StylisticDNA;
    characters?: Characters;
    plot?: Plot;
  }> {
    const result: {
      narrative?: NarrativeAnalysis;
      stylisticDNA?: StylisticDNA;
      characters?: Characters;
      plot?: Plot;
    } = {};

    try {
      const metadataList = await this.metadataRepository.findByProjectId(ownerId, projectId);

      for (const metadata of metadataList) {
        const typeKey = metadata.getTypeKey();
        const content = metadata.getContent();

        try {
          const text = this.contentConverter.extractText(content);

          switch (typeKey) {
            case 'narrative-analysis':
              result.narrative = this.parseNarrativeFromText(text);
              break;
            case 'stylistic-dna':
              result.stylisticDNA = this.parseStylisticDNAFromText(text);
              break;
            case 'characters':
              result.characters = this.parseCharactersFromText(text);
              break;
            case 'plot':
              result.plot = this.parsePlotFromText(text);
              break;
          }
        } catch {
          // Skip metadata with invalid content
        }
      }
    } catch {
      // If metadata loading fails, continue without it
    }

    return result;
  }

  private parseNarrativeFromText(text: string): NarrativeAnalysis {
    return {
      narratorType: this.extractSection(text, 'Narrateur') || text.substring(0, 100),
      focalization: this.extractSection(text, 'Focalisation') || '',
      temporality: this.extractSection(text, 'Temporalité') || '',
      chapterStructure: '',
      narrativeVoice: [],
      summary: '',
    };
  }

  private parseStylisticDNAFromText(text: string): StylisticDNA {
    return {
      registerAndLexicon: this.extractSection(text, 'Registre') || text.substring(0, 100),
      syntax: '',
      figuresOfStyle: '',
      ticsAndSignatures: '',
      rhythmAndBreathing: this.extractSection(text, 'Rythme') || '',
      writingRules: [],
      summary: '',
    };
  }

  private parseCharactersFromText(text: string): Characters {
    return {
      characterProfiles: [],
      relationalMap: text.substring(0, 200),
      narrativeHierarchy: '',
      summary: '',
    };
  }

  private parsePlotFromText(text: string): Plot {
    return {
      initialSituation: '',
      incitingIncident: '',
      stakes: '',
      dramaticQuestions: '',
      conflicts: '',
      narrativeThreads: '',
      detectedStructure: '',
      sceneBreakdown: [],
      plotState: this.extractSection(text, 'État') || text.substring(0, 100),
      possibleDirections: '',
      summary: '',
    };
  }

  private extractSection(text: string, keyword: string): string {
    const regex = new RegExp(`${keyword}[:\\s]*([^\\n]+)`, 'i');
    const match = text.match(regex);
    return match ? match[1].trim() : '';
  }
}
