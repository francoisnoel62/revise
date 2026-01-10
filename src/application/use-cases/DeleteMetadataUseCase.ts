// ABOUTME: Use case for deleting a project metadata document
// ABOUTME: Validates ownership before deletion

import { MetadataRepository } from '../../domain';

export interface DeleteMetadataInput {
  ownerId: string;
  metadataId: string;
}

export interface DeleteMetadataResult {
  deleted: true;
}

export class DeleteMetadataUseCase {
  constructor(private readonly metadataRepository: MetadataRepository) {}

  async execute(input: DeleteMetadataInput): Promise<DeleteMetadataResult> {
    // 1. Validate input
    if (!input.ownerId || input.ownerId.trim().length === 0) {
      throw new Error('Owner ID is required');
    }

    if (!input.metadataId || input.metadataId.trim().length === 0) {
      throw new Error('Metadata ID is required');
    }

    // 2. Verify metadata exists and is owned by user
    const metadata = await this.metadataRepository.findById(
      input.ownerId,
      input.metadataId
    );

    if (!metadata) {
      throw new Error('Metadata not found');
    }

    // 3. Delete from repository
    await this.metadataRepository.delete(input.ownerId, input.metadataId);

    return { deleted: true };
  }
}
