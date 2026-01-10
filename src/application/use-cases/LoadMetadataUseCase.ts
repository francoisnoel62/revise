// ABOUTME: Use case for loading a single metadata document
// ABOUTME: Validates ownership before returning

import { ProjectMetadata, MetadataRepository } from '../../domain';

export interface LoadMetadataInput {
  ownerId: string;
  metadataId: string;
}

export interface LoadMetadataResult {
  metadata: ProjectMetadata;
}

export class LoadMetadataUseCase {
  constructor(private readonly metadataRepository: MetadataRepository) {}

  async execute(input: LoadMetadataInput): Promise<LoadMetadataResult> {
    // 1. Validate input
    if (!input.ownerId || input.ownerId.trim().length === 0) {
      throw new Error('Owner ID is required');
    }

    if (!input.metadataId || input.metadataId.trim().length === 0) {
      throw new Error('Metadata ID is required');
    }

    // 2. Load metadata from repository
    const metadata = await this.metadataRepository.findById(
      input.ownerId,
      input.metadataId
    );

    if (!metadata) {
      throw new Error('Metadata not found');
    }

    return { metadata };
  }
}
