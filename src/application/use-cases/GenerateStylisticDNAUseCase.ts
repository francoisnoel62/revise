// ABOUTME: Use case for generating stylistic DNA analysis using AI
// ABOUTME: Extracts all chapter content, sends to LLM, creates/updates metadata
// ABOUTME: Implements intelligent caching based on content hash

import {
  ProjectMetadata,
  MetadataRepository,
  ProjectRepository,
  LLMProvider,
  IdGenerator,
  StylisticDNA,
} from '../../domain';
import { hashText } from '../utils/text-hash';
import { extractProjectFullText } from '../services/project-text';

export interface GenerateStylisticDNAInput {
  ownerId: string;
  projectId: string;
  forceRegenerate?: boolean;
}

export interface GenerateStylisticDNAResult {
  metadata: ProjectMetadata;
  analysis: StylisticDNA | null;
  wasUpdated: boolean;
  wasCached: boolean;
}

export class GenerateStylisticDNAUseCase {
  private static readonly TYPE_KEY = 'stylistic-dna';
  private static readonly TITLE = 'ADN Stylistique';

  constructor(
    private readonly metadataRepository: MetadataRepository,
    private readonly projectRepository: ProjectRepository,
    private readonly llmProvider: LLMProvider,
    private readonly idGenerator: IdGenerator
  ) {}

  async execute(input: GenerateStylisticDNAInput): Promise<GenerateStylisticDNAResult> {
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
      GenerateStylisticDNAUseCase.TYPE_KEY
    );

    // 6. Check if we can use cached metadata
    if (metadata && !input.forceRegenerate && !metadata.needsRegeneration(contentHash)) {
      return {
        metadata,
        analysis: null,
        wasUpdated: false,
        wasCached: true,
      };
    }

    // 7. Generate analysis using LLM
    const analysis = await this.llmProvider.generateStylisticDNA(fullText);

    // 8. Format analysis as TipTap JSON
    const contentJson = this.formatAnalysisAsTipTapJSON(analysis);

    const wasUpdated = metadata !== null;

    if (metadata) {
      metadata.updateContent(contentJson, contentHash);
      metadata.markAsGenerated();
      metadata.updateStructuredData(JSON.stringify(analysis));
      await this.metadataRepository.update(input.ownerId, metadata);
    } else {
      metadata = ProjectMetadata.createGenerated(
        this.idGenerator.generate(),
        input.projectId,
        GenerateStylisticDNAUseCase.TYPE_KEY,
        GenerateStylisticDNAUseCase.TITLE,
        contentJson,
        contentHash,
        JSON.stringify(analysis)
      );
      await this.metadataRepository.create(input.ownerId, metadata);
    }

    return { metadata, analysis, wasUpdated, wasCached: false };
  }

  private formatAnalysisAsTipTapJSON(analysis: StylisticDNA): string {
    const doc = {
      type: 'doc',
      content: [
        // Register and Lexicon
        this.createHeading('1. Registre et Lexique'),
        this.createParagraph(analysis.registerAndLexicon),

        // Syntax
        this.createHeading('2. Syntaxe'),
        this.createParagraph(analysis.syntax),

        // Figures of Style
        this.createHeading('3. Figures de Style'),
        this.createParagraph(analysis.figuresOfStyle),

        // Tics and Signatures
        this.createHeading('4. Tics et Signatures'),
        this.createParagraph(analysis.ticsAndSignatures),

        // Rhythm and Breathing
        this.createHeading('5. Rythme et Respiration'),
        this.createParagraph(analysis.rhythmAndBreathing),

        // Writing Rules (as list)
        this.createHeading('6. Charte "À la manière de"'),
        ...analysis.writingRules.map((rule) => this.createParagraph(`• ${rule}`)),

        // Summary
        this.createHeading('7. Synthèse'),
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
