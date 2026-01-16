import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LoadMetadataUseCase } from '../LoadMetadataUseCase';

describe('LoadMetadataUseCase', () => {
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

  let useCase: LoadMetadataUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    useCase = new LoadMetadataUseCase(mockMetadataRepository);
  });

  it('should load metadata successfully', async () => {
    const mockMetadata = { id: 'meta-1', typeKey: 'narrative-analysis' };
    mockMetadataRepository.findById.mockResolvedValue(mockMetadata);

    const result = await useCase.execute({
      ownerId: 'user-1',
      metadataId: 'meta-1',
    });

    expect(mockMetadataRepository.findById).toHaveBeenCalledWith('user-1', 'meta-1');
    expect(result.metadata).toEqual(mockMetadata);
  });

  it('should throw error if metadata not found', async () => {
    mockMetadataRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute({
      ownerId: 'user-1',
      metadataId: 'meta-1',
    })).rejects.toThrow('Metadata not found');
  });

  it('should throw error for empty owner ID', async () => {
    await expect(useCase.execute({
      ownerId: '',
      metadataId: 'meta-1',
    })).rejects.toThrow('Owner ID is required');
  });

  it('should throw error for empty metadata ID', async () => {
    await expect(useCase.execute({
      ownerId: 'user-1',
      metadataId: '',
    })).rejects.toThrow('Metadata ID is required');
  });
});
