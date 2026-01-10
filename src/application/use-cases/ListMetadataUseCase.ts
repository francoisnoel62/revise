// ABOUTME: Use case for listing all metadata documents for a project
// ABOUTME: Validates project ownership before returning list

import { ProjectMetadata, MetadataRepository, ProjectRepository } from '../../domain';

export interface ListMetadataInput {
  ownerId: string;
  projectId: string;
}

export interface ListMetadataResult {
  metadata: ProjectMetadata[];
}

export class ListMetadataUseCase {
  constructor(
    private readonly metadataRepository: MetadataRepository,
    private readonly projectRepository: ProjectRepository
  ) {}

  async execute(input: ListMetadataInput): Promise<ListMetadataResult> {
    // 1. Validate input
    if (!input.ownerId || input.ownerId.trim().length === 0) {
      throw new Error('Owner ID is required');
    }

    if (!input.projectId || input.projectId.trim().length === 0) {
      throw new Error('Project ID is required');
    }

    // 2. Verify project exists and is owned by user
    const project = await this.projectRepository.loadProject(
      input.ownerId,
      input.projectId
    );

    if (!project) {
      throw new Error('Project not found');
    }

    // 3. Get all metadata for this project
    const metadata = await this.metadataRepository.findByProjectId(
      input.ownerId,
      input.projectId
    );

    return { metadata };
  }
}
