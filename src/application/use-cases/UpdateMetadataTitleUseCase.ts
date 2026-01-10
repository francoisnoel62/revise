// ABOUTME: Use case for updating metadata document title
// ABOUTME: Validates ownership and title before persisting

import { ProjectMetadata, MetadataRepository } from '../../domain';

export interface UpdateMetadataTitleInput {
  ownerId: string;
  metadataId: string;
  title: string;
}

export interface UpdateMetadataTitleResult {
  metadata: ProjectMetadata;
}

export class UpdateMetadataTitleUseCase {
  constructor(private readonly metadataRepository: MetadataRepository) {}

  async execute(input: UpdateMetadataTitleInput): Promise<UpdateMetadataTitleResult> {
    // 1. Validate input
    if (!input.ownerId || input.ownerId.trim().length === 0) {
      throw new Error('Owner ID is required');
    }

    if (!input.metadataId || input.metadataId.trim().length === 0) {
      throw new Error('Metadata ID is required');
    }

    if (!input.title || input.title.trim().length === 0) {
      throw new Error('Title is required');
    }

    // 2. Load existing metadata
    const metadata = await this.metadataRepository.findById(
      input.ownerId,
      input.metadataId
    );

    if (!metadata) {
      throw new Error('Metadata not found');
    }

    // 3. Update title (entity validates non-empty)
    metadata.updateTitle(input.title);

    // 4. Persist changes
    await this.metadataRepository.update(input.ownerId, metadata);

    return { metadata };
  }
}
