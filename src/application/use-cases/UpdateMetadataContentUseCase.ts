// ABOUTME: Use case for updating metadata document content
// ABOUTME: Validates ownership and content format before persisting

import { ProjectMetadata, MetadataRepository } from '../../domain';

export interface UpdateMetadataContentInput {
  ownerId: string;
  metadataId: string;
  content: string; // TipTap JSON
}

export interface UpdateMetadataContentResult {
  metadata: ProjectMetadata;
}

export class UpdateMetadataContentUseCase {
  constructor(private readonly metadataRepository: MetadataRepository) {}

  async execute(input: UpdateMetadataContentInput): Promise<UpdateMetadataContentResult> {
    // 1. Validate input
    if (!input.ownerId || input.ownerId.trim().length === 0) {
      throw new Error('Owner ID is required');
    }

    if (!input.metadataId || input.metadataId.trim().length === 0) {
      throw new Error('Metadata ID is required');
    }

    if (!input.content) {
      throw new Error('Content is required');
    }

    // 2. Load existing metadata
    const metadata = await this.metadataRepository.findById(
      input.ownerId,
      input.metadataId
    );

    if (!metadata) {
      throw new Error('Metadata not found');
    }

    // 3. Update content (entity validates TipTap JSON format)
    metadata.updateContent(input.content);

    // 4. Persist changes
    await this.metadataRepository.update(input.ownerId, metadata);

    return { metadata };
  }
}
