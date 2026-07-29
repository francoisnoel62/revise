// ABOUTME: Tests for narrative analysis generation via GenerateMetadataUseCase + narrativeAnalysisConfig.
// ABOUTME: Verifies formatter output structure, structuredData storage, and multi-chapter extraction.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GenerateMetadataUseCase } from '../GenerateMetadataUseCase';
import { narrativeAnalysisConfig } from '../metadata-type-configs';

describe('GenerateMetadataUseCase — narrative analysis config', () => {
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
    replaceProjectIfUnchanged: vi.fn(),
    deleteAllByOwner: vi.fn(),
    findPublishedByToken: vi.fn(),
  };

  const mockLLMProvider = {
    generateNarrativeAnalysis: vi.fn(),
  } as never;

  const mockIdGenerator = {
    generate: vi.fn().mockReturnValue('generated-id'),
  };

  const mockChapter = {
    getTitle: () => 'Chapter 1',
    getContent: () =>
      JSON.stringify({
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
    summary: "Résumé de l'analyse",
  };

  let useCase: GenerateMetadataUseCase<typeof mockAnalysis>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockProjectRepository.loadProject.mockResolvedValue(mockProject);
    mockLLMProvider.generateNarrativeAnalysis.mockResolvedValue(mockAnalysis);
    mockMetadataRepository.findByProjectAndType.mockResolvedValue(null);
    mockMetadataRepository.create.mockImplementation((_, m: unknown) => Promise.resolve(m));
    useCase = new GenerateMetadataUseCase(
      mockMetadataRepository,
      mockProjectRepository,
      mockLLMProvider,
      mockIdGenerator,
      narrativeAnalysisConfig
    );
  });

  it('creates new metadata and stores structuredData on the create path', async () => {
    const result = await useCase.execute({ ownerId: 'user-1', projectId: 'project-1' });

    expect(result.wasUpdated).toBe(false);
    expect(result.metadata.isGenerated()).toBe(true);
    expect(mockMetadataRepository.create).toHaveBeenCalled();

    const raw = result.metadata.getStructuredData();
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed.narratorType).toBe(mockAnalysis.narratorType);
    expect(parsed.narrativeVoice).toEqual(mockAnalysis.narrativeVoice);
  });

  it('stores structuredData on the update path', async () => {
    const existingMetadata = {
      getId: () => 'existing-id',
      updateContent: vi.fn(),
      markAsGenerated: vi.fn(),
      updateStructuredData: vi.fn(),
      isGenerated: () => true,
      needsRegeneration: vi.fn().mockReturnValue(true),
    };
    mockMetadataRepository.findByProjectAndType.mockResolvedValue(existingMetadata);
    mockMetadataRepository.update.mockResolvedValue(existingMetadata);

    await useCase.execute({ ownerId: 'user-1', projectId: 'project-1' });

    expect(existingMetadata.updateStructuredData).toHaveBeenCalledWith(
      JSON.stringify(mockAnalysis)
    );
  });

  it('formats analysis as TipTap JSON with headings', async () => {
    const result = await useCase.execute({ ownerId: 'user-1', projectId: 'project-1' });

    const content = JSON.parse(result.metadata.getContent());
    expect(content.type).toBe('doc');
    const headings = content.content.filter((node: { type: string }) => node.type === 'heading');
    expect(headings.length).toBeGreaterThan(0);
  });

  it('passes the full text of multiple chapters to the LLM', async () => {
    const chapter2 = {
      getTitle: () => 'Chapter 2',
      getContent: () =>
        JSON.stringify({
          type: 'doc',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Content 2' }] }],
        }),
    };
    mockProjectRepository.loadProject.mockResolvedValue({
      id: 'project-1',
      getChapters: () => [mockChapter, chapter2],
    });

    await useCase.execute({ ownerId: 'user-1', projectId: 'project-1' });

    expect(mockLLMProvider.generateNarrativeAnalysis).toHaveBeenCalledWith(
      expect.stringContaining('# Chapter 1')
    );
    expect(mockLLMProvider.generateNarrativeAnalysis).toHaveBeenCalledWith(
      expect.stringContaining('# Chapter 2')
    );
  });
});
