import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UpdateMetadataTitleUseCase } from '../UpdateMetadataTitleUseCase';

describe('UpdateMetadataTitleUseCase', () => {
  const mockMetadataRepository = {
    create: vi.fn(),
    findById: vi.fn(),
    findByProjectId: vi.fn(),
    findByProjectAndType: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    deleteByProjectId: vi.fn(),
    deleteAllByOwner: vi.fn(),
  };

  let useCase: UpdateMetadataTitleUseCase;

  const mockMetadata = {
    getId: () => 'meta-1',
    updateTitle: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useCase = new UpdateMetadataTitleUseCase(mockMetadataRepository);
  });

  it('should update title successfully', async () => {
    mockMetadataRepository.findById.mockResolvedValue(mockMetadata);
    mockMetadataRepository.update.mockResolvedValue(mockMetadata);

    const result = await useCase.execute({
      ownerId: 'user-1',
      metadataId: 'meta-1',
      title: 'New Title',
    });

    expect(mockMetadata.updateTitle).toHaveBeenCalledWith('New Title');
    expect(mockMetadataRepository.update).toHaveBeenCalledWith('user-1', mockMetadata);
    expect(result.metadata).toBe(mockMetadata);
  });

  it('should throw error if metadata not found', async () => {
    mockMetadataRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute({
      ownerId: 'user-1',
      metadataId: 'meta-1',
      title: 'New Title',
    })).rejects.toThrow('Metadata not found');
  });

  it('should throw error for empty owner ID', async () => {
    await expect(useCase.execute({
      ownerId: '',
      metadataId: 'meta-1',
      title: 'New Title',
    })).rejects.toThrow('Owner ID is required');
  });

  it('should throw error for empty metadata ID', async () => {
    await expect(useCase.execute({
      ownerId: 'user-1',
      metadataId: '',
      title: 'New Title',
    })).rejects.toThrow('Metadata ID is required');
  });

  it('should throw error for empty title', async () => {
    await expect(useCase.execute({
      ownerId: 'user-1',
      metadataId: 'meta-1',
      title: '',
    })).rejects.toThrow('Title is required');
  });
});
