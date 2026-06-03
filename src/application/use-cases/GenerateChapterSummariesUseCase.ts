// ABOUTME: Use case for generating chapter summaries using AI
// ABOUTME: Extracts all chapter content, sends to LLM, creates/updates metadata
// ABOUTME: Implements intelligent caching based on content hash

import {
  ProjectMetadata,
  MetadataRepository,
  ProjectRepository,
  LLMProvider,
  IdGenerator,
  ChapterSummaries,
} from '../../domain';
import { hashText } from '../utils/text-hash';

export interface GenerateChapterSummariesInput {
  ownerId: string;
  projectId: string;
  forceRegenerate?: boolean; // Optional flag to bypass cache
}

export interface GenerateChapterSummariesResult {
  metadata: ProjectMetadata;
  analysis: ChapterSummaries | null; // null when using cache
  wasUpdated: boolean; // true if existing metadata was overwritten
  wasCached: boolean; // true if cache was used (no API call)
}

export class GenerateChapterSummariesUseCase {
  private static readonly TYPE_KEY = 'chapter-summaries';
  private static readonly TITLE = 'Résumés des Chapitres';

  constructor(
    private readonly metadataRepository: MetadataRepository,
    private readonly projectRepository: ProjectRepository,
    private readonly llmProvider: LLMProvider,
    private readonly idGenerator: IdGenerator
  ) {}

  async execute(input: GenerateChapterSummariesInput): Promise<GenerateChapterSummariesResult> {
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
      GenerateChapterSummariesUseCase.TYPE_KEY
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
    const analysis = await this.llmProvider.generateChapterSummaries(fullText);

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
        GenerateChapterSummariesUseCase.TYPE_KEY,
        GenerateChapterSummariesUseCase.TITLE,
        contentJson,
        contentHash,
        JSON.stringify(analysis)
      );
      await this.metadataRepository.create(input.ownerId, metadata);
    }

    return { metadata, analysis, wasUpdated, wasCached: false };
  }

  /**
   * Extract plain text from all chapters with chapter markers.
   */
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

  /**
   * Recursively extract text from TipTap JSON.
   */
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

  /**
   * Format ChapterSummaries as TipTap JSON document.
   */
  private formatAnalysisAsTipTapJSON(analysis: ChapterSummaries): string {
    const content: object[] = [];

    // Add each chapter summary
    for (const chapter of analysis.chapters) {
      content.push(
        this.createHeading(`Chapitre ${chapter.chapterNumber} – ${chapter.chapterTitle}`)
      );
      content.push(this.createParagraph(chapter.summary));
    }

    // Add overall arc at the end
    if (analysis.overallArc) {
      content.push(this.createHeading('Arc narratif global'));
      content.push(this.createParagraph(analysis.overallArc));
    }

    const doc = {
      type: 'doc',
      content,
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
