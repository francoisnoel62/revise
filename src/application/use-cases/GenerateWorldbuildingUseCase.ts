// ABOUTME: Use case for generating worldbuilding analysis using AI
// ABOUTME: Extracts all chapter content, sends to LLM, creates/updates metadata

import {
  ProjectMetadata,
  MetadataRepository,
  ProjectRepository,
  LLMProvider,
  IdGenerator,
  Worldbuilding,
} from '../../domain';

export interface GenerateWorldbuildingInput {
  ownerId: string;
  projectId: string;
}

export interface GenerateWorldbuildingResult {
  metadata: ProjectMetadata;
  analysis: Worldbuilding;
  wasUpdated: boolean;
}

export class GenerateWorldbuildingUseCase {
  private static readonly TYPE_KEY = 'worldbuilding';
  private static readonly TITLE = 'Univers';

  constructor(
    private readonly metadataRepository: MetadataRepository,
    private readonly projectRepository: ProjectRepository,
    private readonly llmProvider: LLMProvider,
    private readonly idGenerator: IdGenerator
  ) {}

  async execute(input: GenerateWorldbuildingInput): Promise<GenerateWorldbuildingResult> {
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

    // 4. Generate analysis using LLM
    const analysis = await this.llmProvider.generateWorldbuilding(fullText);

    // 5. Format analysis as TipTap JSON
    const contentJson = this.formatAnalysisAsTipTapJSON(analysis);

    // 6. Check if metadata already exists
    let metadata = await this.metadataRepository.findByProjectAndType(
      input.ownerId,
      input.projectId,
      GenerateWorldbuildingUseCase.TYPE_KEY
    );

    const wasUpdated = metadata !== null;

    if (metadata) {
      // Update existing metadata
      metadata.updateContent(contentJson);
      metadata.markAsGenerated();
      await this.metadataRepository.update(input.ownerId, metadata);
    } else {
      // Create new metadata
      metadata = new ProjectMetadata(
        this.idGenerator.generate(),
        input.projectId,
        GenerateWorldbuildingUseCase.TYPE_KEY,
        GenerateWorldbuildingUseCase.TITLE,
        contentJson
      );
      metadata.markAsGenerated();
      await this.metadataRepository.create(input.ownerId, metadata);
    }

    return { metadata, analysis, wasUpdated };
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

  private formatAnalysisAsTipTapJSON(analysis: Worldbuilding): string {
    const doc = {
      type: 'doc',
      content: [
        this.createHeading('1. Thèmes Explicites'),
        this.createParagraph(analysis.explicitThemes),

        this.createHeading('2. Thèmes Implicites'),
        this.createParagraph(analysis.implicitThemes),

        this.createHeading('3. Symbolique'),
        this.createParagraph(analysis.symbolism),

        this.createHeading('4. Sous-texte'),
        this.createParagraph(analysis.subtext),

        this.createHeading('5. Vision du Monde'),
        this.createParagraph(analysis.worldview),

        this.createHeading('6. Intertextualité'),
        this.createParagraph(analysis.intertextuality),

        this.createHeading('7. Cadre Spatio-temporel'),
        this.createParagraph(analysis.spatiotemporalSetting),

        this.createHeading('8. Atmosphère'),
        this.createParagraph(analysis.atmosphere),

        this.createHeading('9. Règles du Monde'),
        this.createParagraph(analysis.worldRules),

        this.createHeading('10. Contexte Social'),
        this.createParagraph(analysis.socialContext),

        this.createHeading('11. Détails d\'Immersion'),
        this.createParagraph(analysis.immersionDetails),

        this.createHeading('12. Cohérence'),
        this.createParagraph(analysis.coherence),

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
