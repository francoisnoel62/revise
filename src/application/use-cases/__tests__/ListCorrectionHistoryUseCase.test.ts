// ABOUTME: Unit tests for ListCorrectionHistoryUseCase
// ABOUTME: Validates listing correction history with ownership verification

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ListCorrectionHistoryUseCase } from '../ListCorrectionHistoryUseCase';
import { CorrectionHistory } from '../../../domain/entities/CorrectionHistory';
import { CorrectionHistoryRepository } from '../../../domain/interfaces/CorrectionHistoryRepository';
import { ProjectRepository } from '../../../domain/interfaces/ProjectRepository';
import { Project } from '../../../domain/entities/Project';
import { Chapter } from '../../../domain/entities/Chapter';

describe('ListCorrectionHistoryUseCase', () => {
  let useCase: ListCorrectionHistoryUseCase;
  let mockHistoryRepository: CorrectionHistoryRepository;
  let mockProjectRepository: ProjectRepository;

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

  const createMockHistory = (id: string, createdAt: Date): CorrectionHistory => {
    return new CorrectionHistory(
      id,
      projectId,
      chapterId,
      'Selected text',
      ['Proposal 1', 'Proposal 2', 'Proposal 3'],
      createdAt
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

    useCase = new ListCorrectionHistoryUseCase(
      mockHistoryRepository,
      mockProjectRepository
    );
  });

  describe('execute', () => {
    it('should return empty array when no history exists', async () => {
      const result = await useCase.execute({ ownerId, projectId });

      expect(result.history).toEqual([]);
    });

    it('should return history entries for the project', async () => {
      const history1 = createMockHistory('h1', new Date('2026-01-12T10:00:00Z'));
      const history2 = createMockHistory('h2', new Date('2026-01-12T11:00:00Z'));
      vi.mocked(mockHistoryRepository.findByProjectId).mockResolvedValue([history2, history1]);

      const result = await useCase.execute({ ownerId, projectId });

      expect(result.history).toHaveLength(2);
      expect(result.history[0].getId()).toBe('h2');
      expect(result.history[1].getId()).toBe('h1');
    });

    it('should call repository with correct arguments', async () => {
      await useCase.execute({ ownerId, projectId });

      expect(mockHistoryRepository.findByProjectId).toHaveBeenCalledWith(ownerId, projectId);
    });

    it('should verify project ownership before listing', async () => {
      await useCase.execute({ ownerId, projectId });

      expect(mockProjectRepository.loadProject).toHaveBeenCalledWith(ownerId, projectId);
    });

    it('should throw error if ownerId is empty', async () => {
      await expect(
        useCase.execute({ ownerId: '', projectId })
      ).rejects.toThrow('Owner ID is required');
    });

    it('should throw error if projectId is empty', async () => {
      await expect(
        useCase.execute({ ownerId, projectId: '' })
      ).rejects.toThrow('Project ID is required');
    });

    it('should throw error if project not found', async () => {
      vi.mocked(mockProjectRepository.loadProject).mockResolvedValue(null);

      await expect(
        useCase.execute({ ownerId, projectId })
      ).rejects.toThrow('Project not found');
    });
  });
});
