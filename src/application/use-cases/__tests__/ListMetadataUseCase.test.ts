import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ListMetadataUseCase } from '../ListMetadataUseCase';

describe('ListMetadataUseCase', () => {
  const mockMetadataRepository = {
    create: vi.fn(),
    findById: vi.fn(),
    findByProjectId: vi.fn(),
    findByProjectAndType: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    deleteByProjectId: vi.fn(),
  };

  const mockProjectRepository = {
    loadProject: vi.fn(),
    createProject: vi.fn(),
    updateProject: vi.fn(),
    deleteProject: vi.fn(),
    listProjects: vi.fn(),
    updateChapter: vi.fn(),
  };

  let useCase: ListMetadataUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    useCase = new ListMetadataUseCase(
      mockMetadataRepository,
      mockProjectRepository
    );
  });

  it('should list metadata successfully', async () => {
    const mockMetadataList = [
      { id: 'meta-1', typeKey: 'narrative-analysis' },
      { id: 'meta-2', typeKey: 'narrative-analysis' },
    ];

    mockProjectRepository.loadProject.mockResolvedValue({ id: 'project-1' });
    mockMetadataRepository.findByProjectId.mockResolvedValue(mockMetadataList);

    const result = await useCase.execute({
      ownerId: 'user-1',
      projectId: 'project-1',
    });

    expect(mockMetadataRepository.findByProjectId).toHaveBeenCalledWith('user-1', 'project-1');
    expect(result.metadata).toEqual(mockMetadataList);
  });

  it('should return empty array when no metadata exists', async () => {
    mockProjectRepository.loadProject.mockResolvedValue({ id: 'project-1' });
    mockMetadataRepository.findByProjectId.mockResolvedValue([]);

    const result = await useCase.execute({
      ownerId: 'user-1',
      projectId: 'project-1',
    });

    expect(result.metadata).toEqual([]);
  });

  it('should throw error if project not found', async () => {
    mockProjectRepository.loadProject.mockResolvedValue(null);

    await expect(useCase.execute({
      ownerId: 'user-1',
      projectId: 'project-1',
    })).rejects.toThrow('Project not found');
  });

  it('should throw error for empty owner ID', async () => {
    await expect(useCase.execute({
      ownerId: '',
      projectId: 'project-1',
    })).rejects.toThrow('Owner ID is required');
  });

  it('should throw error for empty project ID', async () => {
    await expect(useCase.execute({
      ownerId: 'user-1',
      projectId: '',
    })).rejects.toThrow('Project ID is required');
  });
});
