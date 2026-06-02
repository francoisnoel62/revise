// ABOUTME: Use case for generating AI-powered chapter content
// ABOUTME: Loads project context and all available metadata to generate coherent chapter content

import {
  ProjectRepository,
  LLMProvider,
  ContentConverter,
} from '../../domain';
import { ChapterGeneration } from '../../domain/value-objects/ChapterGeneration';
import { ChapterGenerationTypeKey } from '../../domain/value-objects/ChapterGenerationType';
import { MetadataContextBuilder } from '../services/MetadataContextBuilder';

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
    private readonly metadataContextBuilder: MetadataContextBuilder,
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
    const metadata = await this.metadataContextBuilder.buildForChapterGeneration(
      input.ownerId,
      input.projectId
    );

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
}
