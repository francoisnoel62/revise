// ABOUTME: Use case for generating AI-powered chapter content
// ABOUTME: Loads project context and all available metadata to generate coherent chapter content

import {
  ProjectRepository,
  MetadataRepository,
  LLMProvider,
  ContentConverter,
  NarrativeAnalysis,
  StylisticDNA,
  Characters,
  Plot,
  Worldbuilding,
  ChapterSummaries,
} from '../../domain';
import { ChapterGeneration } from '../../domain/value-objects/ChapterGeneration';
import { ChapterGenerationTypeKey } from '../../domain/value-objects/ChapterGenerationType';

export interface GenerateChapterInput {
  ownerId: string;
  projectId: string;
  generationType: ChapterGenerationTypeKey;
}

export interface GenerateChapterResult {
  generation: ChapterGeneration;
  editorContent: string; // Editor-formatted content ready to insert
}

export class GenerateChapterUseCase {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly metadataRepository: MetadataRepository,
    private readonly llmProvider: LLMProvider,
    private readonly contentConverter: ContentConverter
  ) {}

  async execute(input: GenerateChapterInput): Promise<GenerateChapterResult> {
    // 1. Validate input
    if (!input.ownerId || input.ownerId.trim().length === 0) {
      throw new Error('Owner ID is required');
    }

    if (!input.projectId || input.projectId.trim().length === 0) {
      throw new Error('Project ID is required');
    }

    if (!input.generationType) {
      throw new Error('Generation type is required');
    }

    // 2. Load project with all chapters
    const project = await this.projectRepository.loadProject(
      input.ownerId,
      input.projectId
    );

    if (!project) {
      throw new Error('Project not found');
    }

    // 3. Extract text from all existing chapters
    const chapters = project.getChapters();
    const fullText = this.extractFullText(chapters);

    if (fullText.trim().length === 0) {
      throw new Error('Project has no existing content to use as context');
    }

    // 4. Load all available metadata for enhanced context
    const metadata = await this.loadProjectMetadata(input.ownerId, input.projectId);

    // 5. Generate chapter content using LLM
    const generation = await this.llmProvider.generateChapter(
      fullText,
      input.generationType,
      metadata
    );

    // 6. Convert generated content to editor format
    const editorContent = this.contentConverter.toEditorContent(
      generation.content,
      input.generationType
    );

    return {
      generation,
      editorContent,
    };
  }

  /**
   * Load all available project metadata for context.
   */
  private async loadProjectMetadata(
    ownerId: string,
    projectId: string
  ): Promise<{
    narrative?: NarrativeAnalysis;
    stylisticDNA?: StylisticDNA;
    characters?: Characters;
    plot?: Plot;
    worldbuilding?: Worldbuilding;
    chapterSummaries?: ChapterSummaries;
  }> {
    const result: {
      narrative?: NarrativeAnalysis;
      stylisticDNA?: StylisticDNA;
      characters?: Characters;
      plot?: Plot;
      worldbuilding?: Worldbuilding;
      chapterSummaries?: ChapterSummaries;
    } = {};

    // Load each metadata type if available
    const metadataList = await this.metadataRepository.findByProjectId(ownerId, projectId);

    for (const metadata of metadataList) {
      const typeKey = metadata.getTypeKey();
      const content = metadata.getContent();

      try {
        const text = this.contentConverter.extractText(content);

        // Parse the text back to structured format based on type
        // For now, we just include the raw text summaries
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
          case 'worldbuilding':
            result.worldbuilding = this.parseWorldbuildingFromText(text);
            break;
          case 'chapter-summaries':
            result.chapterSummaries = this.parseChapterSummariesFromText(text);
            break;
        }
      } catch {
        // Skip metadata with invalid content
      }
    }

    return result;
  }

  /**
   * Extract plain text from all chapters with chapter markers.
   */
  private extractFullText(chapters: { getContent(): string; getTitle(): string }[]): string {
    const parts: string[] = [];

    for (const chapter of chapters) {
      const title = chapter.getTitle();
      const content = chapter.getContent();
      const text = this.contentConverter.extractText(content);

      if (text.trim()) {
        parts.push(`# ${title}\n\n${text}`);
      }
    }

    return parts.join('\n\n---\n\n');
  }

  // Simplified parsers that extract key information from TipTap text

  private parseNarrativeFromText(text: string): NarrativeAnalysis {
    return {
      narratorType: this.extractSection(text, 'Narrateur') || text.substring(0, 200),
      focalization: this.extractSection(text, 'Focalisation') || '',
      temporality: this.extractSection(text, 'Temporalité') || '',
      chapterStructure: this.extractSection(text, 'Structure') || '',
      narrativeVoice: [],
      summary: text.substring(0, 300),
    };
  }

  private parseStylisticDNAFromText(text: string): StylisticDNA {
    return {
      registerAndLexicon: this.extractSection(text, 'Registre') || text.substring(0, 200),
      syntax: this.extractSection(text, 'Syntaxe') || '',
      figuresOfStyle: this.extractSection(text, 'Figures') || '',
      ticsAndSignatures: this.extractSection(text, 'Tics') || '',
      rhythmAndBreathing: this.extractSection(text, 'Rythme') || '',
      writingRules: [],
      summary: text.substring(0, 300),
    };
  }

  private parseCharactersFromText(text: string): Characters {
    return {
      characterProfiles: [],
      relationalMap: text.substring(0, 300),
      narrativeHierarchy: '',
      summary: text.substring(0, 300),
    };
  }

  private parsePlotFromText(text: string): Plot {
    return {
      initialSituation: this.extractSection(text, 'Situation') || '',
      incitingIncident: this.extractSection(text, 'Déclencheur') || '',
      stakes: this.extractSection(text, 'Enjeux') || text.substring(0, 200),
      dramaticQuestions: this.extractSection(text, 'Questions') || '',
      conflicts: this.extractSection(text, 'Conflits') || '',
      narrativeThreads: '',
      detectedStructure: '',
      sceneBreakdown: [],
      plotState: this.extractSection(text, 'État') || text.substring(0, 200),
      possibleDirections: '',
      summary: text.substring(0, 300),
    };
  }

  private parseWorldbuildingFromText(text: string): Worldbuilding {
    return {
      explicitThemes: this.extractSection(text, 'Thèmes') || text.substring(0, 200),
      implicitThemes: '',
      symbolism: this.extractSection(text, 'Symbolique') || '',
      subtext: '',
      worldview: '',
      intertextuality: '',
      spatiotemporalSetting: '',
      atmosphere: this.extractSection(text, 'Atmosphère') || '',
      worldRules: '',
      socialContext: '',
      immersionDetails: '',
      coherence: '',
      summary: text.substring(0, 300),
    };
  }

  private parseChapterSummariesFromText(text: string): ChapterSummaries {
    return {
      chapters: [],
      overallArc: text.substring(0, 500),
    };
  }

  /**
   * Extract a section from text based on a keyword.
   */
  private extractSection(text: string, keyword: string): string {
    const regex = new RegExp(`${keyword}[:\\s]*([^\\n]+)`, 'i');
    const match = text.match(regex);
    return match ? match[1].trim() : '';
  }
}
