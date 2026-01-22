// ABOUTME: Tests for UploadCoverImageUseCase
// ABOUTME: Verifies cover image upload and settings update

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UploadCoverImageUseCase } from '../UploadCoverImageUseCase';
import { ProjectSettings } from '@/domain/entities/ProjectSettings';

describe('UploadCoverImageUseCase', () => {
  let useCase: UploadCoverImageUseCase;
  let mockRepository: {
    findByProjectId: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  let mockBlobStorage: {
    upload: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockRepository = {
      findByProjectId: vi.fn(),
      update: vi.fn((userId, settings) => Promise.resolve(settings)),
    };

    mockBlobStorage = {
      upload: vi.fn(),
      delete: vi.fn(),
    };

    useCase = new UploadCoverImageUseCase(mockRepository, mockBlobStorage);
  });

  it('uploads cover image and updates settings', async () => {
    const settings = ProjectSettings.create('id-1', 'project-1', 'user-1', 'Title');
    mockRepository.findByProjectId.mockResolvedValue(settings);
    mockBlobStorage.upload.mockResolvedValue({
      url: 'https://blob.vercel-storage.com/covers/cover.jpg',
      pathname: 'covers/cover.jpg',
      contentType: 'image/jpeg',
      size: 1024,
    });

    const file = new ArrayBuffer(1024);
    const result = await useCase.execute({
      userId: 'user-1',
      projectId: 'project-1',
      file,
      filename: 'cover.jpg',
      contentType: 'image/jpeg',
    });

    expect(result.getCoverImageUrl()).toBe('https://blob.vercel-storage.com/covers/cover.jpg');
    expect(mockBlobStorage.upload).toHaveBeenCalledWith(
      file,
      expect.stringContaining('project-1'),
      'image/jpeg',
      expect.objectContaining({
        maxSize: 5 * 1024 * 1024,
        allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp'],
      })
    );
    expect(mockRepository.update).toHaveBeenCalled();
  });

  it('deletes old cover image before uploading new one', async () => {
    const settings = ProjectSettings.reconstruct({
      id: 'id-1',
      projectId: 'project-1',
      ownerId: 'user-1',
      title: 'Title',
      subtitle: undefined,
      summary: '',
      coverImageUrl: 'https://old-url.com/old-cover.jpg',
      genre: '',
      synopsis: '',
      pointOfView: undefined,
      tense: undefined,
      targetAudience: undefined,
      isbn: undefined,
      contributors: [],
      relatedWorks: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    mockRepository.findByProjectId.mockResolvedValue(settings);
    mockBlobStorage.upload.mockResolvedValue({
      url: 'https://blob.vercel-storage.com/covers/new-cover.jpg',
      pathname: 'covers/new-cover.jpg',
      contentType: 'image/jpeg',
      size: 1024,
    });

    const file = new ArrayBuffer(1024);
    await useCase.execute({
      userId: 'user-1',
      projectId: 'project-1',
      file,
      filename: 'new-cover.jpg',
      contentType: 'image/jpeg',
    });

    expect(mockBlobStorage.delete).toHaveBeenCalledWith('https://old-url.com/old-cover.jpg');
  });

  it('throws error when settings not found', async () => {
    mockRepository.findByProjectId.mockResolvedValue(null);

    const file = new ArrayBuffer(1024);
    await expect(
      useCase.execute({
        userId: 'user-1',
        projectId: 'project-1',
        file,
        filename: 'cover.jpg',
        contentType: 'image/jpeg',
      })
    ).rejects.toThrow('Project settings not found');
  });

  it('throws error for invalid content type', async () => {
    const settings = ProjectSettings.create('id-1', 'project-1', 'user-1', 'Title');
    mockRepository.findByProjectId.mockResolvedValue(settings);
    mockBlobStorage.upload.mockRejectedValue(new Error('Content type not allowed'));

    const file = new ArrayBuffer(1024);
    await expect(
      useCase.execute({
        userId: 'user-1',
        projectId: 'project-1',
        file,
        filename: 'cover.gif',
        contentType: 'image/gif',
      })
    ).rejects.toThrow('Content type not allowed');
  });

  it('throws error for file too large', async () => {
    const settings = ProjectSettings.create('id-1', 'project-1', 'user-1', 'Title');
    mockRepository.findByProjectId.mockResolvedValue(settings);
    mockBlobStorage.upload.mockRejectedValue(new Error('File size exceeds maximum allowed size'));

    const file = new ArrayBuffer(10 * 1024 * 1024);
    await expect(
      useCase.execute({
        userId: 'user-1',
        projectId: 'project-1',
        file,
        filename: 'cover.jpg',
        contentType: 'image/jpeg',
      })
    ).rejects.toThrow('File size exceeds maximum allowed size');
  });
});
