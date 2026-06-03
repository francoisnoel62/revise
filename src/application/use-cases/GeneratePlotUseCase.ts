// ABOUTME: Use case for generating plot analysis using AI
// ABOUTME: Extracts all chapter content, sends to LLM, creates/updates metadata
// ABOUTME: Implements intelligent caching based on content hash

import {
  ProjectMetadata,
  MetadataRepository,
  ProjectRepository,
  LLMProvider,
  IdGenerator,
  Plot,
} from '../../domain';
import { hashText } from '../../infrastructure/utils/text-hash';

export interface GeneratePlotInput {
  ownerId: string;
  projectId: string;
  forceRegenerate?: boolean;
}

export interface GeneratePlotResult {
  metadata: ProjectMetadata;
  analysis: Plot | null;
  wasUpdated: boolean;
  wasCached: boolean;
}

export class GeneratePlotUseCase {
  private static readonly TYPE_KEY = 'plot';
  private static readonly TITLE = 'Intrigue';

  constructor(
    private readonly metadataRepository: MetadataRepository,
    private readonly projectRepository: ProjectRepository,
    private readonly llmProvider: LLMProvider,
    private readonly idGenerator: IdGenerator
  ) {}

  async execute(input: GeneratePlotInput): Promise<GeneratePlotResult> {
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

    const fullText = this.extractFullText(chapters);

    if (fullText.trim().length === 0) {
      throw new Error('Project chapters have no content to analyze');
    }

    // 4. Hash the full text for caching
    const contentHash = hashText(fullText);

    // 5. Check if metadata already exists
    let metadata = await this.metadataRepository.findByProjectAndType(
      input.ownerId,
      input.projectId,
      GeneratePlotUseCase.TYPE_KEY
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
    const analysis = await this.llmProvider.generatePlot(fullText);

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
        GeneratePlotUseCase.TYPE_KEY,
        GeneratePlotUseCase.TITLE,
        contentJson,
        contentHash,
        JSON.stringify(analysis)
      );
      await this.metadataRepository.create(input.ownerId, metadata);
    }

    return { metadata, analysis, wasUpdated, wasCached: false };
  }

  private extractFullText(chapters: { getContent(): string; getTitle(): string }[]): string {
    const parts: string[] = [];

    for (const chapter of chapters) {
      const title = chapter.getTitle();
      const content = chapter.getContent();

      try {
        const json = JSON.parse(content);
        const text = this.extractTextFromTipTapJSON(json);

        if (text.trim()) {
          parts.push(`# ${title}\n\n${text}`);
        }
      } catch {
        // Skip chapters with invalid JSON
      }
    }

    return parts.join('\n\n---\n\n');
  }

  private extractTextFromTipTapJSON(json: unknown): string {
    if (!json || typeof json !== 'object') return '';

    const node = json as Record<string, unknown>;

    if (node.type === 'text' && typeof node.text === 'string') {
      return node.text;
    }

    if (Array.isArray(node.content)) {
      return node.content
        .map((child) => this.extractTextFromTipTapJSON(child))
        .join(node.type === 'paragraph' ? '\n' : ' ');
    }

    return '';
  }

  private formatAnalysisAsTipTapJSON(analysis: Plot): string {
    const doc = {
      type: 'doc',
      content: [
        this.createHeading('1. Situation Initiale'),
        this.createParagraph(analysis.initialSituation),

        this.createHeading('2. Élément Déclencheur'),
        this.createParagraph(analysis.incitingIncident),

        this.createHeading('3. Enjeux'),
        this.createParagraph(analysis.stakes),

        this.createHeading('4. Questions Dramatiques'),
        this.createParagraph(analysis.dramaticQuestions),

        this.createHeading('5. Conflits'),
        this.createParagraph(analysis.conflicts),

        this.createHeading('6. Fils Narratifs'),
        this.createParagraph(analysis.narrativeThreads),

        this.createHeading('7. Structure Détectée'),
        this.createParagraph(analysis.detectedStructure),

        this.createHeading('8. Scène par Scène'),
        ...analysis.sceneBreakdown.map((scene) =>
          this.createParagraph(
            `**${scene.chapter}** | ${scene.location} | ${scene.characters} | ${scene.objective} | ${scene.conflict} | ${scene.outcome} | ${scene.function}`
          )
        ),

        this.createHeading('9. État de l\'Intrigue'),
        this.createParagraph(analysis.plotState),

        this.createHeading('10. Directions Possibles'),
        this.createParagraph(analysis.possibleDirections),

        this.createHeading('Synthèse'),
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
