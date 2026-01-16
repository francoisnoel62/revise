// ABOUTME: Unit tests for SaveCorrectionHistoryUseCase
// ABOUTME: Validates correction history saving with proper ownership checks

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SaveCorrectionHistoryUseCase } from '../SaveCorrectionHistoryUseCase';
import { CorrectionHistory } from '../../../domain/entities/CorrectionHistory';
import { CorrectionHistoryRepository } from '../../../domain/interfaces/CorrectionHistoryRepository';
import { ProjectRepository } from '../../../domain/interfaces/ProjectRepository';
import { IdGenerator } from '../../../domain/interfaces/IdGenerator';
import { Project } from '../../../domain/entities/Project';
import { Chapter } from '../../../domain/entities/Chapter';

describe('SaveCorrectionHistoryUseCase', () => {
  let useCase: SaveCorrectionHistoryUseCase;
  let mockHistoryRepository: CorrectionHistoryRepository;
  let mockProjectRepository: ProjectRepository;
  let mockIdGenerator: IdGenerator;

  const ownerId = 'user-1';
  const projectId = 'project-1';
  const chapterId = 'chapter-1';

  const createMockProject = (): Project => {
    const chapter = new Chapter(
      chapterId,
      'Chapter 1',
      JSON.stringify({ type: 'doc', content: [{ type: 'paragraph' }] }),
      0
    );
    return new Project(
      projectId,
      ownerId,
      'Test Project',
      [chapter],
      chapterId,
      null, // providerId
      new Date(),
      new Date()
    );
  };

  beforeEach(() => {
    mockHistoryRepository = {
      save: vi.fn().mockResolvedValue(undefined),
      findByProjectId: vi.fn().mockResolvedValue([]),
      findByChapterId: vi.fn().mockResolvedValue([]),
      findById: vi.fn().mockResolvedValue(null),
      delete: vi.fn().mockResolvedValue(undefined),
      deleteByChapterId: vi.fn().mockResolvedValue(undefined),
      deleteByProjectId: vi.fn().mockResolvedValue(undefined),
      deleteAllByOwner: vi.fn().mockResolvedValue(0),
    };

    mockProjectRepository = {
      createProject: vi.fn().mockResolvedValue(createMockProject()),
      loadProject: vi.fn().mockResolvedValue(createMockProject()),
      listProjects: vi.fn().mockResolvedValue([]),
      updateProject: vi.fn().mockResolvedValue(createMockProject()),
      deleteProject: vi.fn().mockResolvedValue(undefined),
      updateChapter: vi.fn().mockResolvedValue(undefined),
      deleteAllByOwner: vi.fn().mockResolvedValue(0),
    };

    mockIdGenerator = {
      generate: vi.fn().mockReturnValue('generated-id-1'),
    };

    useCase = new SaveCorrectionHistoryUseCase(
      mockHistoryRepository,
      mockProjectRepository,
      mockIdGenerator
    );
  });

  describe('execute', () => {
    const validInput = {
      ownerId,
      projectId,
      chapterId,
      selectedText: 'The quick brown fox',
      proposals: ['The swift brown fox', 'The agile brown fox', 'The rapid brown fox'],
    };

    it('should save correction history successfully', async () => {
      const result = await useCase.execute(validInput);

      expect(result.history).toBeInstanceOf(CorrectionHistory);
      expect(result.history.getId()).toBe('generated-id-1');
      expect(result.history.getProjectId()).toBe(projectId);
      expect(result.history.getChapterId()).toBe(chapterId);
      expect(result.history.getSelectedText()).toBe('The quick brown fox');
      expect(result.history.getProposals()).toEqual(validInput.proposals);
    });

    it('should call repository.save with correct arguments', async () => {
      await useCase.execute(validInput);

      expect(mockHistoryRepository.save).toHaveBeenCalledTimes(1);
      expect(mockHistoryRepository.save).toHaveBeenCalledWith(
        ownerId,
        expect.any(CorrectionHistory)
      );
    });

    it('should verify project ownership before saving', async () => {
      await useCase.execute(validInput);

      expect(mockProjectRepository.loadProject).toHaveBeenCalledWith(ownerId, projectId);
    });

    it('should throw error if ownerId is empty', async () => {
      await expect(
        useCase.execute({ ...validInput, ownerId: '' })
      ).rejects.toThrow('Owner ID is required');
    });

    it('should throw error if ownerId is whitespace', async () => {
      await expect(
        useCase.execute({ ...validInput, ownerId: '   ' })
      ).rejects.toThrow('Owner ID is required');
    });

    it('should throw error if projectId is empty', async () => {
      await expect(
        useCase.execute({ ...validInput, projectId: '' })
      ).rejects.toThrow('Project ID is required');
    });

    it('should throw error if chapterId is empty', async () => {
      await expect(
        useCase.execute({ ...validInput, chapterId: '' })
      ).rejects.toThrow('Chapter ID is required');
    });

    it('should throw error if selectedText is empty', async () => {
      await expect(
        useCase.execute({ ...validInput, selectedText: '' })
      ).rejects.toThrow('Selected text is required');
    });

    it('should throw error if proposals array is empty', async () => {
      await expect(
        useCase.execute({ ...validInput, proposals: [] })
      ).rejects.toThrow('At least one proposal is required');
    });

    it('should throw error if project not found', async () => {
      vi.mocked(mockProjectRepository.loadProject).mockResolvedValue(null);

      await expect(useCase.execute(validInput)).rejects.toThrow('Project not found');
    });

    it('should throw error if chapter not found in project', async () => {
      const projectWithoutChapter = new Project(
        projectId,
        ownerId,
        'Test Project',
        [new Chapter('other-chapter', 'Other', JSON.stringify({ type: 'doc', content: [] }), 0)],
        'other-chapter',
        null, // providerId
        new Date(),
        new Date()
      );
      vi.mocked(mockProjectRepository.loadProject).mockResolvedValue(projectWithoutChapter);

      await expect(useCase.execute(validInput)).rejects.toThrow('Chapter not found in project');
    });

    it('should use generated ID for new history entry', async () => {
      vi.mocked(mockIdGenerator.generate).mockReturnValue('custom-generated-id');

      const result = await useCase.execute(validInput);

      expect(result.history.getId()).toBe('custom-generated-id');
    });
  });
});
