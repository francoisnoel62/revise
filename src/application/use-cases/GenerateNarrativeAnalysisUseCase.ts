// ABOUTME: Use case for generating narrative analysis using AI
// ABOUTME: Extracts all chapter content, sends to LLM, creates/updates metadata
// ABOUTME: Implements intelligent caching based on content hash

import {
  ProjectMetadata,
  MetadataRepository,
  ProjectRepository,
  LLMProvider,
  IdGenerator,
  NarrativeAnalysis,
} from '../../domain';
import { hashText } from '../utils/text-hash';
import { extractProjectFullText } from '../services/project-text';

export interface GenerateNarrativeAnalysisInput {
  ownerId: string;
  projectId: string;
  forceRegenerate?: boolean; // Optional flag to bypass cache
}

export interface GenerateNarrativeAnalysisResult {
  metadata: ProjectMetadata;
  analysis: NarrativeAnalysis | null; // null when using cache
  wasUpdated: boolean; // true if existing metadata was overwritten
  wasCached: boolean; // true if cache was used (no API call)
}

export class GenerateNarrativeAnalysisUseCase {
  private static readonly TYPE_KEY = 'narrative-analysis';
  private static readonly TITLE = 'Analyse Narrative';

  constructor(
    private readonly metadataRepository: MetadataRepository,
    private readonly projectRepository: ProjectRepository,
    private readonly llmProvider: LLMProvider,
    private readonly idGenerator: IdGenerator
  ) {}

  async execute(input: GenerateNarrativeAnalysisInput): Promise<GenerateNarrativeAnalysisResult> {
    // 1. Validate input
    if (!input.ownerId || input.ownerId.trim().length === 0) {
      throw new Error('Owner ID is required');
    }

    if (!input.projectId || input.projectId.trim().length === 0) {
      throw new Error('Project ID is required');
    }

    // 2. Load project with all chapters
    const project = await this.projectRepository.loadProject(
      input.ownerId,
      input.projectId
    );

    if (!project) {
      throw new Error('Project not found');
    }

    // 3. Extract text from all chapters
    const chapters = project.getChapters();
    if (chapters.length === 0) {
      throw new Error('Project has no chapters to analyze');
    }

    const fullText = extractProjectFullText(chapters);

    if (fullText.trim().length === 0) {
      throw new Error('Project chapters have no content to analyze');
    }

    // 4. Hash the full text for caching
    const contentHash = hashText(fullText);

    // 5. Check if metadata already exists
    let metadata = await this.metadataRepository.findByProjectAndType(
      input.ownerId,
      input.projectId,
      GenerateNarrativeAnalysisUseCase.TYPE_KEY
    );

    // 6. Check if we can use cached metadata
    if (metadata && !input.forceRegenerate && !metadata.needsRegeneration(contentHash)) {
      // Content unchanged - return cached metadata
      return {
        metadata,
        analysis: null, // No new analysis generated
        wasUpdated: false,
        wasCached: true,
      };
    }

    // 7. Generate analysis using LLM (content changed or forced)
    const analysis = await this.llmProvider.generateNarrativeAnalysis(fullText);

    // 8. Format analysis as TipTap JSON
    const contentJson = this.formatAnalysisAsTipTapJSON(analysis);

    const wasUpdated = metadata !== null;

    if (metadata) {
      // Update existing metadata with new content and hash
      metadata.updateContent(contentJson, contentHash);
      metadata.markAsGenerated();
      metadata.updateStructuredData(JSON.stringify(analysis));
      await this.metadataRepository.update(input.ownerId, metadata);
    } else {
      // Create new metadata with hash
      metadata = ProjectMetadata.createGenerated(
        this.idGenerator.generate(),
        input.projectId,
        GenerateNarrativeAnalysisUseCase.TYPE_KEY,
        GenerateNarrativeAnalysisUseCase.TITLE,
        contentJson,
        contentHash,
        JSON.stringify(analysis)
      );
      await this.metadataRepository.create(input.ownerId, metadata);
    }

    return { metadata, analysis, wasUpdated, wasCached: false };
  }

  private formatAnalysisAsTipTapJSON(analysis: NarrativeAnalysis): string {
    const doc = {
      type: 'doc',
      content: [
        // Narrator Type
        this.createHeading('1. Narrateur'),
        this.createParagraph(analysis.narratorType),

        // Focalization
        this.createHeading('2. Focalisation'),
        this.createParagraph(analysis.focalization),

        // Temporality
        this.createHeading('3. Temporalité'),
        this.createParagraph(analysis.temporality),

        // Chapter Structure
        this.createHeading('4. Structure des chapitres'),
        this.createParagraph(analysis.chapterStructure),

        // Narrative Voice (as list)
        this.createHeading('5. Voix narrative distinctive'),
        ...analysis.narrativeVoice.map((point) => this.createParagraph(`• ${point}`)),

        // Summary
        this.createHeading('6. Synthèse'),
        this.createParagraph(analysis.summary),
      ],
    };

    return JSON.stringify(doc);
  }

  private createHeading(text: string): object {
    return {
      type: 'heading',
      attrs: { level: 2 },
      content: [{ type: 'text', text }],
    };
  }

  private createParagraph(text: string): object {
    return {
      type: 'paragraph',
      content: text ? [{ type: 'text', text }] : [],
    };
  }
}
