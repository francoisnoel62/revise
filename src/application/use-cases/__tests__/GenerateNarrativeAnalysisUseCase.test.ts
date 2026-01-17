import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GenerateNarrativeAnalysisUseCase } from '../GenerateNarrativeAnalysisUseCase';

describe('GenerateNarrativeAnalysisUseCase', () => {
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

  const mockProjectRepository = {
    loadProject: vi.fn(),
    createProject: vi.fn(),
    updateProject: vi.fn(),
    deleteProject: vi.fn(),
    listProjects: vi.fn(),
    updateChapter: vi.fn(),
    deleteAllByOwner: vi.fn(),
  };

  const mockLLMProvider = {
    generateRewrites: vi.fn(),
    testConnection: vi.fn(),
    getProviderName: vi.fn().mockReturnValue('OpenAI'),
    getModel: vi.fn().mockReturnValue('gpt-4o-mini'),
    generateNarrativeAnalysis: vi.fn(),
  };

  const mockIdGenerator = {
    generate: vi.fn().mockReturnValue('generated-id'),
  };

  let useCase: GenerateNarrativeAnalysisUseCase;

  const mockChapter = {
    getTitle: () => 'Chapter 1',
    getContent: () => JSON.stringify({
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Test content' }] }],
    }),
  };

  const mockProject = {
    id: 'project-1',
    getChapters: () => [mockChapter],
  };

  const mockAnalysis = {
    narratorType: 'Première personne',
    focalization: 'Interne',
    temporality: 'Passé simple',
    chapterStructure: 'Linéaire',
    narrativeVoice: ['Point 1', 'Point 2'],
    summary: 'Résumé de l\'analyse',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useCase = new GenerateNarrativeAnalysisUseCase(
      mockMetadataRepository,
      mockProjectRepository,
      mockLLMProvider,
      mockIdGenerator
    );
  });

  it('should generate narrative analysis and create new metadata', async () => {
    mockProjectRepository.loadProject.mockResolvedValue(mockProject);
    mockLLMProvider.generateNarrativeAnalysis.mockResolvedValue(mockAnalysis);
    mockMetadataRepository.findByProjectAndType.mockResolvedValue(null);
    mockMetadataRepository.create.mockImplementation((_, m) => Promise.resolve(m));

    const result = await useCase.execute({
      ownerId: 'user-1',
      projectId: 'project-1',
    });

    expect(result.analysis).toEqual(mockAnalysis);
    expect(result.wasUpdated).toBe(false);
    expect(result.metadata.isGenerated()).toBe(true);
    expect(mockMetadataRepository.create).toHaveBeenCalled();
    expect(mockLLMProvider.generateNarrativeAnalysis).toHaveBeenCalledWith(
      expect.stringContaining('# Chapter 1')
    );
  });

  it('should update existing metadata when regenerating', async () => {
    const existingMetadata = {
      getId: () => 'existing-id',
      updateContent: vi.fn(),
      markAsGenerated: vi.fn(),
      isGenerated: () => true,
      needsRegeneration: vi.fn().mockReturnValue(true),
    };

    mockProjectRepository.loadProject.mockResolvedValue(mockProject);
    mockLLMProvider.generateNarrativeAnalysis.mockResolvedValue(mockAnalysis);
    mockMetadataRepository.findByProjectAndType.mockResolvedValue(existingMetadata);
    mockMetadataRepository.update.mockResolvedValue(existingMetadata);

    const result = await useCase.execute({
      ownerId: 'user-1',
      projectId: 'project-1',
    });

    expect(result.wasUpdated).toBe(true);
    expect(existingMetadata.updateContent).toHaveBeenCalled();
    expect(existingMetadata.markAsGenerated).toHaveBeenCalled();
    expect(mockMetadataRepository.update).toHaveBeenCalled();
  });

  it('should throw error if project not found', async () => {
    mockProjectRepository.loadProject.mockResolvedValue(null);

    await expect(useCase.execute({
      ownerId: 'user-1',
      projectId: 'project-1',
    })).rejects.toThrow('Project not found');
  });

  it('should throw error if project has no chapters', async () => {
    mockProjectRepository.loadProject.mockResolvedValue({
      ...mockProject,
      getChapters: () => [],
    });

    await expect(useCase.execute({
      ownerId: 'user-1',
      projectId: 'project-1',
    })).rejects.toThrow('no chapters');
  });

  it('should throw error if chapters have no content', async () => {
    const emptyChapter = {
      getTitle: () => 'Empty',
      getContent: () => JSON.stringify({ type: 'doc', content: [] }),
    };

    mockProjectRepository.loadProject.mockResolvedValue({
      ...mockProject,
      getChapters: () => [emptyChapter],
    });

    await expect(useCase.execute({
      ownerId: 'user-1',
      projectId: 'project-1',
    })).rejects.toThrow('no content');
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

  it('should format analysis as TipTap JSON correctly', async () => {
    mockProjectRepository.loadProject.mockResolvedValue(mockProject);
    mockLLMProvider.generateNarrativeAnalysis.mockResolvedValue(mockAnalysis);
    mockMetadataRepository.findByProjectAndType.mockResolvedValue(null);
    mockMetadataRepository.create.mockImplementation((_, m) => Promise.resolve(m));

    const result = await useCase.execute({
      ownerId: 'user-1',
      projectId: 'project-1',
    });

    const content = JSON.parse(result.metadata.getContent());
    expect(content.type).toBe('doc');
    expect(content.content).toBeInstanceOf(Array);

    // Check for headings
    const headings = content.content.filter((node: {type: string}) => node.type === 'heading');
    expect(headings.length).toBeGreaterThan(0);
  });

  it('should extract text from multiple chapters', async () => {
    const chapter1 = {
      getTitle: () => 'Chapter 1',
      getContent: () => JSON.stringify({
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Content 1' }] }],
      }),
    };

    const chapter2 = {
      getTitle: () => 'Chapter 2',
      getContent: () => JSON.stringify({
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Content 2' }] }],
      }),
    };

    const multiChapterProject = {
      id: 'project-1',
      getChapters: () => [chapter1, chapter2],
    };

    mockProjectRepository.loadProject.mockResolvedValue(multiChapterProject);
    mockLLMProvider.generateNarrativeAnalysis.mockResolvedValue(mockAnalysis);
    mockMetadataRepository.findByProjectAndType.mockResolvedValue(null);
    mockMetadataRepository.create.mockImplementation((_, m) => Promise.resolve(m));

    await useCase.execute({
      ownerId: 'user-1',
      projectId: 'project-1',
    });

    expect(mockLLMProvider.generateNarrativeAnalysis).toHaveBeenCalledWith(
      expect.stringContaining('# Chapter 1')
    );
    expect(mockLLMProvider.generateNarrativeAnalysis).toHaveBeenCalledWith(
      expect.stringContaining('# Chapter 2')
    );
  });
});
