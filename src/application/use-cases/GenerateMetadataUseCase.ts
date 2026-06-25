// ABOUTME: Unified metadata generation use case parameterised by a MetadataTypeConfig.
// ABOUTME: Replaces 7 shallow use case classes with one deep module: load → hash → cache → generate → persist.

import {
  ProjectMetadata,
  MetadataRepository,
  ProjectRepository,
  LLMProvider,
  IdGenerator,
} from '../../domain';
import { hashText } from '../utils/text-hash';
import { extractProjectFullText } from '../services/project-text';

export interface MetadataTypeConfig<T> {
  typeKey: string;
  title: string;
  generate: (provider: LLMProvider, fullText: string) => Promise<T>;
  format: (analysis: T) => string;
}

export interface GenerateMetadataInput {
  ownerId: string;
  projectId: string;
  forceRegenerate?: boolean;
}

export interface GenerateMetadataResult {
  metadata: ProjectMetadata;
  wasUpdated: boolean;
  wasCached: boolean;
}

export class GenerateMetadataUseCase<T> {
  constructor(
    private readonly metadataRepository: MetadataRepository,
    private readonly projectRepository: ProjectRepository,
    private readonly llmProvider: LLMProvider,
    private readonly idGenerator: IdGenerator,
    private readonly config: MetadataTypeConfig<T>
  ) {}

  async execute(input: GenerateMetadataInput): Promise<GenerateMetadataResult> {
    if (!input.ownerId || input.ownerId.trim().length === 0) {
      throw new Error('Owner ID is required');
    }
    if (!input.projectId || input.projectId.trim().length === 0) {
      throw new Error('Project ID is required');
    }

    const project = await this.projectRepository.loadProject(input.ownerId, input.projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    const chapters = project.getChapters();
    if (chapters.length === 0) {
      throw new Error('Project has no chapters to analyze');
    }

    const fullText = extractProjectFullText(chapters);
    if (fullText.trim().length === 0) {
      throw new Error('Project chapters have no content to analyze');
    }

    const contentHash = hashText(fullText);

    let metadata = await this.metadataRepository.findByProjectAndType(
      input.ownerId,
      input.projectId,
      this.config.typeKey
    );

    if (metadata && !input.forceRegenerate && !metadata.needsRegeneration(contentHash)) {
      return { metadata, wasUpdated: false, wasCached: true };
    }

    const analysis = await this.config.generate(this.llmProvider, fullText);
    const contentJson = this.config.format(analysis);
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
        this.config.typeKey,
        this.config.title,
        contentJson,
        contentHash,
        JSON.stringify(analysis)
      );
      await this.metadataRepository.create(input.ownerId, metadata);
    }

    return { metadata, wasUpdated, wasCached: false };
  }
}
