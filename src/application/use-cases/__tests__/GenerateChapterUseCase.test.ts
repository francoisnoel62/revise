// ABOUTME: Unit tests for GenerateChapterUseCase
// ABOUTME: Tests chapter generation with mocked repositories and LLM provider

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GenerateChapterUseCase } from '../GenerateChapterUseCase';
import {
  Project,
  Chapter,
  LLMProvider,
  ProjectRepository,
  MetadataRepository,
  ProjectMetadata,
  ContentConverter,
} from '../../../domain';
import { ChapterGeneration } from '../../../domain/value-objects/ChapterGeneration';

// Mock implementations
const createMockProject = (chapters: Chapter[]): Project => {
  const project = Project.createEmpty('test-user', 'Test Project');
  // Replace chapters with our test chapters
  for (const chapter of chapters) {
    project.addChapter(chapter);
  }
  return project;
};

const createMockChapter = (id: string, title: string, content: string, order: number = 0): Chapter => {
  return new Chapter(id, title, content, order);
};

const createMockGeneration = (
  type: 'chapter-beginning' | 'chapter-full' | 'chapter-outline',
  content: string
): ChapterGeneration => ({
  generationType: type,
  content,
  narrativeContext: 'Test context',
  suggestions: ['Suggestion 1', 'Suggestion 2'],
});

describe('GenerateChapterUseCase', () => {
  let mockProjectRepo: ProjectRepository;
  let mockMetadataRepo: MetadataRepository;
  let mockLLMProvider: LLMProvider;
  let mockContentConverter: ContentConverter;

  beforeEach(() => {
    mockProjectRepo = {
      loadProject: vi.fn(),
      saveProject: vi.fn(),
      createProject: vi.fn(),
      listProjects: vi.fn(),
      deleteProject: vi.fn(),
      updateProject: vi.fn(),
    } as unknown as ProjectRepository;

    mockMetadataRepo = {
      findByProjectId: vi.fn().mockResolvedValue([]),
      findById: vi.fn(),
      findByProjectAndType: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteByProjectId: vi.fn(),
    } as unknown as MetadataRepository;

    mockLLMProvider = {
      generateChapter: vi.fn(),
      generateRewrites: vi.fn(),
      testConnection: vi.fn(),
      getProviderName: vi.fn().mockReturnValue('Mock'),
      getModel: vi.fn().mockReturnValue('mock-model'),
    } as unknown as LLMProvider;

    mockContentConverter = {
      extractText: vi.fn().mockImplementation((content: string) => {
        try {
          const json = JSON.parse(content);
          if (json.content && Array.isArray(json.content)) {
            return json.content
              .map((node: { content?: Array<{ text?: string }> }) =>
                node.content?.map((c) => c.text || '').join('') || ''
              )
              .join(' ');
          }
          return '';
        } catch {
          return content;
        }
      }),
      toEditorContent: vi.fn().mockImplementation((text: string) => {
        return JSON.stringify({
          type: 'doc',
          content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
        });
      }),
    } as ContentConverter;
  });

  it('should generate chapter beginning content', async () => {
    // Setup
    const tiptapContent = JSON.stringify({
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Test content' }] }],
    });
    const chapter = createMockChapter('ch-1', 'Chapter 1', tiptapContent);
    const project = createMockProject([chapter]);

    vi.mocked(mockProjectRepo.loadProject).mockResolvedValue(project);
    vi.mocked(mockLLMProvider.generateChapter).mockResolvedValue(
      createMockGeneration('chapter-beginning', 'Generated beginning text.')
    );

    const useCase = new GenerateChapterUseCase(
      mockProjectRepo,
      mockMetadataRepo,
      mockLLMProvider,
      mockContentConverter
    );

    // Execute
    const result = await useCase.execute({
      ownerId: 'test-user',
      projectId: 'proj-1',
      generationType: 'chapter-beginning',
    });

    // Verify
    expect(result.generation.generationType).toBe('chapter-beginning');
    expect(result.generation.content).toBe('Generated beginning text.');
    expect(result.editorContent).toBeDefined();
    expect(JSON.parse(result.editorContent).type).toBe('doc');
  });

  it('should generate full chapter content', async () => {
    // Setup
    const tiptapContent = JSON.stringify({
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Existing content' }] }],
    });
    const chapter = createMockChapter('ch-1', 'Chapter 1', tiptapContent);
    const project = createMockProject([chapter]);

    vi.mocked(mockProjectRepo.loadProject).mockResolvedValue(project);
    vi.mocked(mockLLMProvider.generateChapter).mockResolvedValue(
      createMockGeneration('chapter-full', 'Full chapter content.\n\nWith multiple paragraphs.')
    );

    const useCase = new GenerateChapterUseCase(
      mockProjectRepo,
      mockMetadataRepo,
      mockLLMProvider,
      mockContentConverter
    );

    // Execute
    const result = await useCase.execute({
      ownerId: 'test-user',
      projectId: 'proj-1',
      generationType: 'chapter-full',
    });

    // Verify
    expect(result.generation.generationType).toBe('chapter-full');
    const parsedContent = JSON.parse(result.editorContent);
    expect(parsedContent.content.length).toBeGreaterThan(0);
  });

  it('should generate chapter outline', async () => {
    // Setup
    const tiptapContent = JSON.stringify({
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Existing content' }] }],
    });
    const chapter = createMockChapter('ch-1', 'Chapter 1', tiptapContent);
    const project = createMockProject([chapter]);

    vi.mocked(mockProjectRepo.loadProject).mockResolvedValue(project);
    vi.mocked(mockLLMProvider.generateChapter).mockResolvedValue(
      createMockGeneration('chapter-outline', '1. First point\n2. Second point\n3. Third point')
    );

    const useCase = new GenerateChapterUseCase(
      mockProjectRepo,
      mockMetadataRepo,
      mockLLMProvider,
      mockContentConverter
    );

    // Execute
    const result = await useCase.execute({
      ownerId: 'test-user',
      projectId: 'proj-1',
      generationType: 'chapter-outline',
    });

    // Verify
    expect(result.generation.generationType).toBe('chapter-outline');
    expect(result.generation.content).toContain('First point');
  });

  it('should throw error if project not found', async () => {
    vi.mocked(mockProjectRepo.loadProject).mockResolvedValue(null);

    const useCase = new GenerateChapterUseCase(
      mockProjectRepo,
      mockMetadataRepo,
      mockLLMProvider,
      mockContentConverter
    );

    await expect(
      useCase.execute({
        ownerId: 'test-user',
        projectId: 'non-existent',
        generationType: 'chapter-beginning',
      })
    ).rejects.toThrow('Project not found');
  });

  it('should throw error if project has no content', async () => {
    const emptyContent = JSON.stringify({ type: 'doc', content: [] });
    const chapter = createMockChapter('ch-1', 'Empty Chapter', emptyContent);
    const project = createMockProject([chapter]);

    vi.mocked(mockProjectRepo.loadProject).mockResolvedValue(project);

    const useCase = new GenerateChapterUseCase(
      mockProjectRepo,
      mockMetadataRepo,
      mockLLMProvider,
      mockContentConverter
    );

    await expect(
      useCase.execute({
        ownerId: 'test-user',
        projectId: 'proj-1',
        generationType: 'chapter-beginning',
      })
    ).rejects.toThrow('Project has no existing content');
  });

  it('should validate required inputs', async () => {
    const useCase = new GenerateChapterUseCase(
      mockProjectRepo,
      mockMetadataRepo,
      mockLLMProvider,
      mockContentConverter
    );

    await expect(
      useCase.execute({
        ownerId: '',
        projectId: 'proj-1',
        generationType: 'chapter-beginning',
      })
    ).rejects.toThrow('Owner ID is required');

    await expect(
      useCase.execute({
        ownerId: 'test-user',
        projectId: '',
        generationType: 'chapter-beginning',
      })
    ).rejects.toThrow('Project ID is required');
  });

  it('should include metadata context in generation', async () => {
    // Setup project with content
    const tiptapContent = JSON.stringify({
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Story content' }] }],
    });
    const chapter = createMockChapter('ch-1', 'Chapter 1', tiptapContent);
    const project = createMockProject([chapter]);

    // Setup mock metadata
    const mockNarrativeMetadata = {
      getId: () => 'meta-1',
      getProjectId: () => 'proj-1',
      getTypeKey: () => 'narrative-analysis',
      getTitle: () => 'Narrative Analysis',
      getContent: () =>
        JSON.stringify({
          type: 'doc',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Narrateur: Third person' }] }],
        }),
      getProperties: () => ({
        wordCount: 10,
        characterCount: 50,
        lastEdited: new Date(),
        generatedAt: new Date(),
        isGenerated: true,
        contentHash: 'abc123',
      }),
    } as unknown as ProjectMetadata;

    vi.mocked(mockProjectRepo.loadProject).mockResolvedValue(project);
    vi.mocked(mockMetadataRepo.findByProjectId).mockResolvedValue([mockNarrativeMetadata]);
    vi.mocked(mockLLMProvider.generateChapter).mockResolvedValue(
      createMockGeneration('chapter-beginning', 'Generated with context.')
    );

    const useCase = new GenerateChapterUseCase(
      mockProjectRepo,
      mockMetadataRepo,
      mockLLMProvider,
      mockContentConverter
    );

    // Execute
    await useCase.execute({
      ownerId: 'test-user',
      projectId: 'proj-1',
      generationType: 'chapter-beginning',
    });

    // Verify LLM was called with metadata
    expect(mockLLMProvider.generateChapter).toHaveBeenCalledWith(
      expect.any(String), // fullText
      'chapter-beginning',
      expect.objectContaining({
        narrative: expect.any(Object),
      })
    );
  });
});
