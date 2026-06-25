// ABOUTME: Test suite for AnalyzeChapterUseCase
// ABOUTME: Validates orchestration of analysis strategies (in-memory, no persistence)

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AnalyzeChapterUseCase, AnalyzeChapterInput } from '../AnalyzeChapterUseCase';
import { AnalysisCategory } from '../../../domain/value-objects/AnalysisCategory';
import { createAnalysisIssue } from '../../../domain/value-objects/AnalysisIssue';

// Mock factories
const createMockProject = (chapterId: string, chapterContent: string) => ({
  getId: () => 'project-1',
  getChapters: () => [
    {
      getId: () => chapterId,
      getContent: () => chapterContent,
    },
  ],
});

const createMockProjectRepository = (project: ReturnType<typeof createMockProject> | null) => ({
  loadProject: vi.fn().mockResolvedValue(project),
} as unknown as import('@/domain/interfaces/ProjectRepository').ProjectRepository);

const createMockCharacterRepository = () => ({
  findByProjectId: vi.fn().mockResolvedValue([]),
});

const createMockIdGenerator = () => ({
  generate: vi.fn().mockReturnValue('generated-id'),
});

const createMockIssue = (category: AnalysisCategory, id: string) =>
  createAnalysisIssue({
    id,
    category,
    severity: 'error',
    originalText: 'test',
    suggestion: 'fixed',
    explanation: 'explanation',
    position: { start: 0, end: 4 },
    context: 'test context',
  });

// Mock strategy that yields issues
const createMockStrategy = (category: AnalysisCategory, issues: ReturnType<typeof createMockIssue>[]) => ({
  category,
  supportsStreaming: () => true,
  analyze: vi.fn().mockImplementation(async function* () {
    for (const issue of issues) {
      yield issue;
    }
  }),
});

describe('AnalyzeChapterUseCase', () => {
  let useCase: AnalyzeChapterUseCase;
  let mockProjectRepository: ReturnType<typeof createMockProjectRepository>;
  let mockCharacterRepository: ReturnType<typeof createMockCharacterRepository>;
  let mockIdGenerator: ReturnType<typeof createMockIdGenerator>;
  let mockStrategies: Map<AnalysisCategory, ReturnType<typeof createMockStrategy>>;

  const defaultInput: AnalyzeChapterInput = {
    ownerId: 'user-1',
    projectId: 'project-1',
    chapterId: 'chapter-1',
    categories: ['grammar', 'punctuation'],
    styleRigor: 'moderate',
  };

  beforeEach(() => {
    const mockProject = createMockProject('chapter-1', 'Test chapter content');
    mockProjectRepository = createMockProjectRepository(mockProject);
    mockCharacterRepository = createMockCharacterRepository();
    mockIdGenerator = createMockIdGenerator();

    mockStrategies = new Map([
      ['grammar', createMockStrategy('grammar', [createMockIssue('grammar', 'issue-1'), createMockIssue('grammar', 'issue-2')])],
      ['punctuation', createMockStrategy('punctuation', [])],
      ['repetition', createMockStrategy('repetition', [])],
      ['style', createMockStrategy('style', [])],
    ]);

    useCase = new AnalyzeChapterUseCase(
      mockProjectRepository,
      mockCharacterRepository as unknown as import('@/domain/interfaces/CharacterRepository').CharacterRepository,
      mockIdGenerator as unknown as import('@/domain/interfaces/IdGenerator').IdGenerator,
      mockStrategies
    );
  });

  describe('input validation', () => {
    it('should throw error if ownerId is empty', async () => {
      const input = { ...defaultInput, ownerId: '' };

      await expect(useCase.execute(input)).rejects.toThrow('Owner ID is required');
    });

    it('should throw error if projectId is empty', async () => {
      const input = { ...defaultInput, projectId: '' };

      await expect(useCase.execute(input)).rejects.toThrow('Project ID is required');
    });

    it('should throw error if chapterId is empty', async () => {
      const input = { ...defaultInput, chapterId: '' };

      await expect(useCase.execute(input)).rejects.toThrow('Chapter ID is required');
    });

    it('should throw error if categories is empty', async () => {
      const input = { ...defaultInput, categories: [] };

      await expect(useCase.execute(input)).rejects.toThrow('At least one category is required');
    });
  });

  describe('project validation', () => {
    it('should throw error if project not found', async () => {
      mockProjectRepository = createMockProjectRepository(null);
      useCase = new AnalyzeChapterUseCase(
        mockProjectRepository,
        mockCharacterRepository as unknown as import('@/domain/interfaces/CharacterRepository').CharacterRepository,
        mockIdGenerator as unknown as import('@/domain/interfaces/IdGenerator').IdGenerator,
        mockStrategies
      );

      await expect(useCase.execute(defaultInput)).rejects.toThrow('Project not found');
    });

    it('should throw error if chapter not found in project', async () => {
      const mockProject = createMockProject('other-chapter', 'content');
      mockProjectRepository = createMockProjectRepository(mockProject);
      useCase = new AnalyzeChapterUseCase(
        mockProjectRepository,
        mockCharacterRepository as unknown as import('@/domain/interfaces/CharacterRepository').CharacterRepository,
        mockIdGenerator as unknown as import('@/domain/interfaces/IdGenerator').IdGenerator,
        mockStrategies
      );

      await expect(useCase.execute(defaultInput)).rejects.toThrow('Chapter not found');
    });
  });

  describe('strategy execution', () => {
    it('should only execute strategies for selected categories', async () => {
      const input = { ...defaultInput, categories: ['grammar'] as AnalysisCategory[] };

      await useCase.execute(input);

      expect(mockStrategies.get('grammar')?.analyze).toHaveBeenCalled();
      expect(mockStrategies.get('punctuation')?.analyze).not.toHaveBeenCalled();
    });

    it('should collect issues from all selected strategies', async () => {
      const result = await useCase.execute(defaultInput);

      expect(result.analysis.getIssues().length).toBe(2);
    });

    it('should pass language detection to strategies', async () => {
      await useCase.execute(defaultInput);

      expect(mockStrategies.get('grammar')?.analyze).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          language: expect.stringMatching(/^(fr|en)$/),
        })
      );
    });

    it('should pass style rigor to style strategy', async () => {
      const input = { ...defaultInput, categories: ['style'] as AnalysisCategory[], styleRigor: 'strict' as const };

      await useCase.execute(input);

      expect(mockStrategies.get('style')?.analyze).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          styleRigor: 'strict',
        })
      );
    });
  });

  describe('exclusions', () => {
    it('should pass character names to repetition strategy', async () => {
      mockCharacterRepository.findByProjectId.mockResolvedValue([
        { getName: () => 'Jean' },
        { getName: () => 'Marie' },
      ]);

      const input = { ...defaultInput, categories: ['repetition'] as AnalysisCategory[] };
      await useCase.execute(input);

      expect(mockStrategies.get('repetition')?.analyze).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          exclusions: expect.arrayContaining(['Jean', 'Marie']),
        })
      );
    });
  });

  describe('result', () => {
    it('should return ChapterAnalysis with correct metadata', async () => {
      const result = await useCase.execute(defaultInput);

      expect(result.analysis.getChapterId()).toBe('chapter-1');
      expect(result.analysis.getProjectId()).toBe('project-1');
      expect(result.analysis.getOwnerId()).toBe('user-1');
      expect(result.analysis.getCategories()).toEqual(['grammar', 'punctuation']);
      expect(result.analysis.getStyleRigor()).toBe('moderate');
    });

    it('should return analysis result without fromCache property', async () => {
      const result = await useCase.execute(defaultInput);

      expect(result).not.toHaveProperty('fromCache');
    });
  });
});
