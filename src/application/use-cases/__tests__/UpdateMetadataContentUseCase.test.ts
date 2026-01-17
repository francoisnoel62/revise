import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UpdateMetadataContentUseCase } from '../UpdateMetadataContentUseCase';

describe('UpdateMetadataContentUseCase', () => {
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

  let useCase: UpdateMetadataContentUseCase;

  const mockMetadata = {
    getId: () => 'meta-1',
    updateContent: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useCase = new UpdateMetadataContentUseCase(mockMetadataRepository);
  });

  it('should update content successfully', async () => {
    const newContent = JSON.stringify({
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'New content' }] }],
    });

    mockMetadataRepository.findById.mockResolvedValue(mockMetadata);
    mockMetadataRepository.update.mockResolvedValue(mockMetadata);

    const result = await useCase.execute({
      ownerId: 'user-1',
      metadataId: 'meta-1',
      content: newContent,
    });

    expect(mockMetadata.updateContent).toHaveBeenCalledWith(newContent);
    expect(mockMetadataRepository.update).toHaveBeenCalledWith('user-1', mockMetadata);
    expect(result.metadata).toBe(mockMetadata);
  });

  it('should throw error if metadata not found', async () => {
    mockMetadataRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute({
      ownerId: 'user-1',
      metadataId: 'meta-1',
      content: '{}',
    })).rejects.toThrow('Metadata not found');
  });

  it('should throw error for empty owner ID', async () => {
    await expect(useCase.execute({
      ownerId: '',
      metadataId: 'meta-1',
      content: '{}',
    })).rejects.toThrow('Owner ID is required');
  });

  it('should throw error for empty metadata ID', async () => {
    await expect(useCase.execute({
      ownerId: 'user-1',
      metadataId: '',
      content: '{}',
    })).rejects.toThrow('Metadata ID is required');
  });

  it('should throw error for empty content', async () => {
    await expect(useCase.execute({
      ownerId: 'user-1',
      metadataId: 'meta-1',
      content: '',
    })).rejects.toThrow('Content is required');
  });
});
