import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeleteMetadataUseCase } from '../DeleteMetadataUseCase';

describe('DeleteMetadataUseCase', () => {
  const mockMetadataRepository = {
    create: vi.fn(),
    findById: vi.fn(),
    findByProjectId: vi.fn(),
    findByProjectAndType: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    deleteByProjectId: vi.fn(),
  };

  let useCase: DeleteMetadataUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    useCase = new DeleteMetadataUseCase(mockMetadataRepository);
  });

  it('should delete metadata successfully', async () => {
    mockMetadataRepository.findById.mockResolvedValue({ id: 'meta-1' });
    mockMetadataRepository.delete.mockResolvedValue(undefined);

    const result = await useCase.execute({
      ownerId: 'user-1',
      metadataId: 'meta-1',
    });

    expect(mockMetadataRepository.delete).toHaveBeenCalledWith('user-1', 'meta-1');
    expect(result.deleted).toBe(true);
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
