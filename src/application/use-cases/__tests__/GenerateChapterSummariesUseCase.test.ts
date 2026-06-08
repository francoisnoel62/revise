// ABOUTME: Unit tests for GenerateChapterSummariesUseCase
// ABOUTME: Tests chapter summaries generation with caching and error handling

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GenerateChapterSummariesUseCase } from '../GenerateChapterSummariesUseCase';

describe('GenerateChapterSummariesUseCase', () => {
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
    findPublishedByToken: vi.fn(),
  };

  const mockLLMProvider = {
    generateRewrites: vi.fn(),
    testConnection: vi.fn(),
    getProviderName: vi.fn().mockReturnValue('OpenAI'),
    getModel: vi.fn().mockReturnValue('gpt-4o-mini'),
    generateNarrativeAnalysis: vi.fn(),
    generateStylisticDNA: vi.fn(),
    generateCharacters: vi.fn(),
    generatePlot: vi.fn(),
    generateWorldbuilding: vi.fn(),
    generateSynthesis: vi.fn(),
    generateChapterSummaries: vi.fn(),
    generateChapter: vi.fn(),
    generateCompletion: vi.fn(),
    generateCompletionStream: vi.fn(),
    chatStream: vi.fn(),
    generateCharacterSheet: vi.fn(),
  };

  const mockIdGenerator = {
    generate: vi.fn().mockReturnValue('generated-id'),
  };

  let useCase: GenerateChapterSummariesUseCase;

  const mockChapter = {
    getTitle: () => 'Chapitre 1',
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
    chapters: [
      {
        chapterNumber: 1,
        chapterTitle: 'Chapitre 1',
        summary: 'Résumé du chapitre 1. Le protagoniste découvre son pouvoir.',
      },
    ],
    overallArc: 'Arc global du récit avec montée dramatique.',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useCase = new GenerateChapterSummariesUseCase(
      mockMetadataRepository,
      mockProjectRepository,
      mockLLMProvider,
      mockIdGenerator
    );
  });

  it('should generate chapter summaries and create new metadata', async () => {
    mockProjectRepository.loadProject.mockResolvedValue(mockProject);
    mockLLMProvider.generateChapterSummaries.mockResolvedValue(mockAnalysis);
    mockMetadataRepository.findByProjectAndType.mockResolvedValue(null);
    mockMetadataRepository.create.mockImplementation((_, m) => Promise.resolve(m));

    const result = await useCase.execute({
      ownerId: 'user-1',
      projectId: 'project-1',
    });

    expect(result.analysis).toEqual(mockAnalysis);
    expect(result.wasUpdated).toBe(false);
    expect(result.wasCached).toBe(false);
    expect(result.metadata.isGenerated()).toBe(true);
    expect(mockMetadataRepository.create).toHaveBeenCalled();
    expect(mockLLMProvider.generateChapterSummaries).toHaveBeenCalledWith(
      expect.stringContaining('# Chapitre 1')
    );
  });

  it('should update existing metadata when regenerating', async () => {
    const existingMetadata = {
      getId: () => 'existing-id',
      updateContent: vi.fn(),
      markAsGenerated: vi.fn(),
      updateStructuredData: vi.fn(),
      isGenerated: () => true,
      needsRegeneration: vi.fn().mockReturnValue(true),
    };

    mockProjectRepository.loadProject.mockResolvedValue(mockProject);
    mockLLMProvider.generateChapterSummaries.mockResolvedValue(mockAnalysis);
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

  it('should use cached metadata when content unchanged', async () => {
    const cachedMetadata = {
      getId: () => 'cached-id',
      needsRegeneration: vi.fn().mockReturnValue(false),
      isGenerated: () => true,
    };

    mockProjectRepository.loadProject.mockResolvedValue(mockProject);
    mockMetadataRepository.findByProjectAndType.mockResolvedValue(cachedMetadata);

    const result = await useCase.execute({
      ownerId: 'user-1',
      projectId: 'project-1',
    });

    expect(result.wasCached).toBe(true);
    expect(result.analysis).toBeNull();
    expect(result.wasUpdated).toBe(false);
    expect(mockLLMProvider.generateChapterSummaries).not.toHaveBeenCalled();
  });

  it('should force regenerate when flag is set', async () => {
    const cachedMetadata = {
      getId: () => 'cached-id',
      updateContent: vi.fn(),
      markAsGenerated: vi.fn(),
      updateStructuredData: vi.fn(),
      needsRegeneration: vi.fn().mockReturnValue(false),
      isGenerated: () => true,
    };

    mockProjectRepository.loadProject.mockResolvedValue(mockProject);
    mockMetadataRepository.findByProjectAndType.mockResolvedValue(cachedMetadata);
    mockLLMProvider.generateChapterSummaries.mockResolvedValue(mockAnalysis);
    mockMetadataRepository.update.mockResolvedValue(cachedMetadata);

    const result = await useCase.execute({
      ownerId: 'user-1',
      projectId: 'project-1',
      forceRegenerate: true,
    });

    expect(result.wasCached).toBe(false);
    expect(result.wasUpdated).toBe(true);
    expect(mockLLMProvider.generateChapterSummaries).toHaveBeenCalled();
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
    mockLLMProvider.generateChapterSummaries.mockResolvedValue(mockAnalysis);
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

    // Check that chapter title is in heading
    const firstHeading = headings[0];
    expect(firstHeading.content[0].text).toContain('Chapitre 1');
  });

  it('should extract text from multiple chapters', async () => {
    const chapter1 = {
      getTitle: () => 'Chapitre 1',
      getContent: () => JSON.stringify({
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Content 1' }] }],
      }),
    };

    const chapter2 = {
      getTitle: () => 'Chapitre 2',
      getContent: () => JSON.stringify({
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Content 2' }] }],
      }),
    };

    const multiChapterAnalysis = {
      chapters: [
        { chapterNumber: 1, chapterTitle: 'Chapitre 1', summary: 'Résumé 1' },
        { chapterNumber: 2, chapterTitle: 'Chapitre 2', summary: 'Résumé 2' },
      ],
      overallArc: 'Arc narratif global',
    };

    const multiChapterProject = {
      id: 'project-1',
      getChapters: () => [chapter1, chapter2],
    };

    mockProjectRepository.loadProject.mockResolvedValue(multiChapterProject);
    mockLLMProvider.generateChapterSummaries.mockResolvedValue(multiChapterAnalysis);
    mockMetadataRepository.findByProjectAndType.mockResolvedValue(null);
    mockMetadataRepository.create.mockImplementation((_, m) => Promise.resolve(m));

    const result = await useCase.execute({
      ownerId: 'user-1',
      projectId: 'project-1',
    });

    expect(mockLLMProvider.generateChapterSummaries).toHaveBeenCalledWith(
      expect.stringContaining('# Chapitre 1')
    );
    expect(mockLLMProvider.generateChapterSummaries).toHaveBeenCalledWith(
      expect.stringContaining('# Chapitre 2')
    );

    // Check that both chapters appear in formatted output
    const content = JSON.parse(result.metadata.getContent());
    const headings = content.content.filter((node: {type: string}) => node.type === 'heading');
    expect(headings.length).toBe(3); // 2 chapters + overall arc
  });

  it('should include overall arc in formatted output', async () => {
    mockProjectRepository.loadProject.mockResolvedValue(mockProject);
    mockLLMProvider.generateChapterSummaries.mockResolvedValue(mockAnalysis);
    mockMetadataRepository.findByProjectAndType.mockResolvedValue(null);
    mockMetadataRepository.create.mockImplementation((_, m) => Promise.resolve(m));

    const result = await useCase.execute({
      ownerId: 'user-1',
      projectId: 'project-1',
    });

    const content = JSON.parse(result.metadata.getContent());
    const headings = content.content.filter((node: {type: string}) => node.type === 'heading');
    const arcHeading = headings.find(
      (h: { content: Array<{ text: string }> }) => h.content[0].text.includes('Arc narratif')
    );
    expect(arcHeading).toBeDefined();
  });
});
