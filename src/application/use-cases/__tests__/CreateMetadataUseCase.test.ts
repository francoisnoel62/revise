import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateMetadataUseCase } from '../CreateMetadataUseCase';
import { ProjectMetadata } from '../../../domain';

describe('CreateMetadataUseCase', () => {
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

  const mockIdGenerator = {
    generate: vi.fn().mockReturnValue('generated-id'),
  };

  let useCase: CreateMetadataUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    useCase = new CreateMetadataUseCase(
      mockMetadataRepository,
      mockProjectRepository,
      mockIdGenerator
    );
  });

  it('should create metadata successfully', async () => {
    mockProjectRepository.loadProject.mockResolvedValue({ id: 'project-1' });
    mockMetadataRepository.findByProjectAndType.mockResolvedValue(null);
    mockMetadataRepository.create.mockImplementation((_, m) => Promise.resolve(m));

    const result = await useCase.execute({
      ownerId: 'user-1',
      projectId: 'project-1',
      typeKey: 'narrative-analysis',
    });

    expect(result.metadata).toBeInstanceOf(ProjectMetadata);
    expect(result.metadata.getId()).toBe('generated-id');
    expect(result.metadata.getTypeKey()).toBe('narrative-analysis');
    expect(result.metadata.getTitle()).toBe('Analyse Narrative');
  });

  it('should use custom title when provided', async () => {
    mockProjectRepository.loadProject.mockResolvedValue({ id: 'project-1' });
    mockMetadataRepository.findByProjectAndType.mockResolvedValue(null);
    mockMetadataRepository.create.mockImplementation((_, m) => Promise.resolve(m));

    const result = await useCase.execute({
      ownerId: 'user-1',
      projectId: 'project-1',
      typeKey: 'narrative-analysis',
      title: 'Custom Title',
    });

    expect(result.metadata.getTitle()).toBe('Custom Title');
  });

  it('should throw error if project not found', async () => {
    mockProjectRepository.loadProject.mockResolvedValue(null);

    await expect(useCase.execute({
      ownerId: 'user-1',
      projectId: 'project-1',
      typeKey: 'narrative-analysis',
    })).rejects.toThrow('Project not found');
  });

  it('should throw error if metadata type already exists', async () => {
    mockProjectRepository.loadProject.mockResolvedValue({ id: 'project-1' });
    mockMetadataRepository.findByProjectAndType.mockResolvedValue({ id: 'existing' });

    await expect(useCase.execute({
      ownerId: 'user-1',
      projectId: 'project-1',
      typeKey: 'narrative-analysis',
    })).rejects.toThrow('already exists');
  });

  it('should throw error for invalid metadata type', async () => {
    await expect(useCase.execute({
      ownerId: 'user-1',
      projectId: 'project-1',
      typeKey: 'invalid-type',
    })).rejects.toThrow('Invalid metadata type');
  });

  it('should throw error for empty owner ID', async () => {
    await expect(useCase.execute({
      ownerId: '',
      projectId: 'project-1',
      typeKey: 'narrative-analysis',
    })).rejects.toThrow('Owner ID is required');
  });

  it('should throw error for empty project ID', async () => {
    await expect(useCase.execute({
      ownerId: 'user-1',
      projectId: '',
      typeKey: 'narrative-analysis',
    })).rejects.toThrow('Project ID is required');
  });

  it('should throw error for empty type key', async () => {
    await expect(useCase.execute({
      ownerId: 'user-1',
      projectId: 'project-1',
      typeKey: '',
    })).rejects.toThrow('Metadata type key is required');
  });
});
