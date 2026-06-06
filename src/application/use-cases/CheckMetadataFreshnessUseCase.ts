// ABOUTME: Use case computing per-metadata staleness vs the current manuscript text.
// ABOUTME: Compares each generated metadata's content hash to the current project full-text hash.

import { MetadataRepository, ProjectRepository } from '../../domain';
import { extractProjectFullText } from '../services/project-text';
import { hashText } from '../utils/text-hash';

export interface MetadataFreshness {
  id: string;
  typeKey: string;
  isStale: boolean;
}

export interface CheckMetadataFreshnessInput {
  ownerId: string;
  projectId: string;
}

export class CheckMetadataFreshnessUseCase {
  constructor(
    private readonly metadataRepository: MetadataRepository,
    private readonly projectRepository: ProjectRepository
  ) {}

  async execute(input: CheckMetadataFreshnessInput): Promise<MetadataFreshness[]> {
    const project = await this.projectRepository.loadProject(input.ownerId, input.projectId);
    if (!project) return [];

    const fullText = extractProjectFullText(project.getChapters());
    const currentHash = fullText.trim() ? hashText(fullText) : null;

    const metadataList = await this.metadataRepository.findByProjectId(
      input.ownerId,
      input.projectId
    );

    return metadataList.map((metadata) => ({
      id: metadata.getId(),
      typeKey: metadata.getTypeKey(),
      // Staleness is determined purely by hash comparison — manual author edits
      // to the fiche do not exempt it from being marked stale when the manuscript changes.
      isStale:
        currentHash !== null &&
        metadata.isGenerated() &&
        metadata.needsRegeneration(currentHash),
    }));
  }
}
