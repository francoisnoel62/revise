// ABOUTME: Use case for deleting a cover image
// ABOUTME: Removes from blob storage and clears URL in settings

import { ProjectSettings } from '@/domain/entities/ProjectSettings';
import { ProjectSettingsRepository } from '@/domain/interfaces/ProjectSettingsRepository';
import { BlobStorage } from '@/domain/interfaces/BlobStorage';

export interface DeleteCoverImageInput {
  userId: string;
  projectId: string;
}

export class DeleteCoverImageUseCase {
  constructor(
    private readonly repository: ProjectSettingsRepository,
    private readonly blobStorage: BlobStorage
  ) {}

  async execute(input: DeleteCoverImageInput): Promise<ProjectSettings> {
    const existing = await this.repository.findByProjectId(input.userId, input.projectId);

    if (!existing) {
      throw new Error('Project settings not found');
    }

    const coverUrl = existing.getCoverImageUrl();

    // Only delete if there's a cover image
    if (coverUrl) {
      await this.blobStorage.delete(coverUrl);
    }

    // Clear the cover URL in settings
    const updated = existing.updateCoverImageUrl(undefined);

    // Only update if there was a change
    if (coverUrl) {
      return this.repository.update(input.userId, updated);
    }

    return existing;
  }
}
