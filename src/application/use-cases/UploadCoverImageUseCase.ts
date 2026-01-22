// ABOUTME: Use case for uploading a cover image
// ABOUTME: Validates file, uploads to blob storage, and updates settings

import { ProjectSettings } from '@/domain/entities/ProjectSettings';
import { ProjectSettingsRepository } from '@/domain/interfaces/ProjectSettingsRepository';
import { BlobStorage } from '@/domain/interfaces/BlobStorage';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export interface UploadCoverImageInput {
  userId: string;
  projectId: string;
  file: ArrayBuffer | Blob;
  filename: string;
  contentType: string;
}

export class UploadCoverImageUseCase {
  constructor(
    private readonly repository: ProjectSettingsRepository,
    private readonly blobStorage: BlobStorage
  ) {}

  async execute(input: UploadCoverImageInput): Promise<ProjectSettings> {
    const existing = await this.repository.findByProjectId(input.userId, input.projectId);

    if (!existing) {
      throw new Error('Project settings not found');
    }

    // Delete old cover image if exists
    const oldCoverUrl = existing.getCoverImageUrl();
    if (oldCoverUrl) {
      await this.blobStorage.delete(oldCoverUrl);
    }

    // Generate unique filename with project ID
    const extension = input.filename.split('.').pop() || 'jpg';
    const uniqueFilename = `${input.projectId}-${Date.now()}.${extension}`;

    // Upload new cover image
    const result = await this.blobStorage.upload(
      input.file,
      uniqueFilename,
      input.contentType,
      {
        maxSize: MAX_FILE_SIZE,
        allowedContentTypes: ALLOWED_CONTENT_TYPES,
      }
    );

    // Update settings with new cover URL
    const updated = existing.updateCoverImageUrl(result.url);

    return this.repository.update(input.userId, updated);
  }
}
