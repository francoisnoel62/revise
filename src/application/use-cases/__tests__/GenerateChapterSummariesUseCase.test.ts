// ABOUTME: Tests for chapter summaries generation via GenerateMetadataUseCase + chapterSummariesConfig.
// ABOUTME: Verifies formatter output structure, overall arc, and multi-chapter formatting.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GenerateMetadataUseCase } from '../GenerateMetadataUseCase';
import { chapterSummariesConfig } from '../metadata-type-configs';

describe('GenerateMetadataUseCase — chapter summaries config', () => {
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
    generateChapterSummaries: vi.fn(),
  } as never;

  const mockIdGenerator = {
    generate: vi.fn().mockReturnValue('generated-id'),
  };

  const mockChapter = {
    getTitle: () => 'Chapitre 1',
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
    chapters: [
      {
        chapterNumber: 1,
        chapterTitle: 'Chapitre 1',
        summary: 'Résumé du chapitre 1. Le protagoniste découvre son pouvoir.',
      },
    ],
    overallArc: 'Arc global du récit avec montée dramatique.',
  };

  let useCase: GenerateMetadataUseCase<typeof mockAnalysis>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockProjectRepository.loadProject.mockResolvedValue(mockProject);
    mockLLMProvider.generateChapterSummaries.mockResolvedValue(mockAnalysis);
    mockMetadataRepository.findByProjectAndType.mockResolvedValue(null);
    mockMetadataRepository.create.mockImplementation((_, m: unknown) => Promise.resolve(m));
    useCase = new GenerateMetadataUseCase(
      mockMetadataRepository,
      mockProjectRepository,
      mockLLMProvider,
      mockIdGenerator,
      chapterSummariesConfig
    );
  });

  it('formats chapters as TipTap JSON with chapter headings', async () => {
    const result = await useCase.execute({ ownerId: 'user-1', projectId: 'project-1' });

    const content = JSON.parse(result.metadata.getContent());
    expect(content.type).toBe('doc');
    const headings = content.content.filter((node: { type: string }) => node.type === 'heading');
    expect(headings.length).toBeGreaterThan(0);
    expect(headings[0].content[0].text).toContain('Chapitre 1');
  });

  it('includes overall arc heading in formatted output', async () => {
    const result = await useCase.execute({ ownerId: 'user-1', projectId: 'project-1' });

    const content = JSON.parse(result.metadata.getContent());
    const headings = content.content.filter((node: { type: string }) => node.type === 'heading');
    const arcHeading = headings.find((h: { content: Array<{ text: string }> }) =>
      h.content[0].text.includes('Arc narratif')
    );
    expect(arcHeading).toBeDefined();
  });

  it('formats multiple chapters and overall arc (3 headings total)', async () => {
    const multiChapterAnalysis = {
      chapters: [
        { chapterNumber: 1, chapterTitle: 'Chapitre 1', summary: 'Résumé 1' },
        { chapterNumber: 2, chapterTitle: 'Chapitre 2', summary: 'Résumé 2' },
      ],
      overallArc: 'Arc narratif global',
    };
    const chapter2 = {
      getTitle: () => 'Chapitre 2',
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
    mockLLMProvider.generateChapterSummaries.mockResolvedValue(multiChapterAnalysis);

    const result = await useCase.execute({ ownerId: 'user-1', projectId: 'project-1' });

    expect(mockLLMProvider.generateChapterSummaries).toHaveBeenCalledWith(
      expect.stringContaining('# Chapitre 1')
    );
    expect(mockLLMProvider.generateChapterSummaries).toHaveBeenCalledWith(
      expect.stringContaining('# Chapitre 2')
    );
    const content = JSON.parse(result.metadata.getContent());
    const headings = content.content.filter((node: { type: string }) => node.type === 'heading');
    expect(headings.length).toBe(3);
  });
});
