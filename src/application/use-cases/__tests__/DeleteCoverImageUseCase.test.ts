// ABOUTME: Tests for DeleteCoverImageUseCase
// ABOUTME: Verifies cover image deletion from blob storage and settings

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeleteCoverImageUseCase } from '../DeleteCoverImageUseCase';
import { ProjectSettings } from '@/domain/entities/ProjectSettings';

describe('DeleteCoverImageUseCase', () => {
  let useCase: DeleteCoverImageUseCase;
  let mockRepository: {
    findByProjectId: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  let mockBlobStorage: { delete: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockRepository = {
      findByProjectId: vi.fn(),
      update: vi.fn((userId, settings) => Promise.resolve(settings)),
    };

    mockBlobStorage = {
      delete: vi.fn(),
    };

    useCase = new DeleteCoverImageUseCase(mockRepository as unknown as import('@/domain/interfaces/ProjectSettingsRepository').ProjectSettingsRepository, mockBlobStorage as unknown as import('@/domain/interfaces/BlobStorage').BlobStorage);
  });

  it('deletes cover image and clears URL in settings', async () => {
    const settings = ProjectSettings.reconstruct({
      id: 'id-1',
      projectId: 'project-1',
      ownerId: 'user-1',
      title: 'Title',
      subtitle: undefined,
      summary: '',
      coverImageUrl: 'https://blob.vercel-storage.com/covers/cover.jpg',
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

    const result = await useCase.execute({
      userId: 'user-1',
      projectId: 'project-1',
    });

    expect(result.getCoverImageUrl()).toBeUndefined();
    expect(mockBlobStorage.delete).toHaveBeenCalledWith('https://blob.vercel-storage.com/covers/cover.jpg');
    expect(mockRepository.update).toHaveBeenCalled();
  });

  it('does nothing when no cover image exists', async () => {
    const settings = ProjectSettings.create('id-1', 'project-1', 'user-1', 'Title');
    mockRepository.findByProjectId.mockResolvedValue(settings);

    const result = await useCase.execute({
      userId: 'user-1',
      projectId: 'project-1',
    });

    expect(result.getCoverImageUrl()).toBeUndefined();
    expect(mockBlobStorage.delete).not.toHaveBeenCalled();
  });

  it('throws error when settings not found', async () => {
    mockRepository.findByProjectId.mockResolvedValue(null);

    await expect(
      useCase.execute({
        userId: 'user-1',
        projectId: 'project-1',
      })
    ).rejects.toThrow('Project settings not found');
  });
});
