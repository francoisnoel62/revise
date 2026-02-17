// ABOUTME: Tests for ListRequestHistoryUseCase
// ABOUTME: Verifies paginated listing of AI request records per project

import { vi } from 'vitest';
import { ListRequestHistoryUseCase } from './ListRequestHistoryUseCase';
import { AIRequestRepository } from '../../domain/interfaces/AIRequestRepository';
import { AIRequestRecord } from '../../domain/entities/AIRequestRecord';

const makeRecord = (id: string): AIRequestRecord =>
  AIRequestRecord.create(
    id,
    'user-001',
    'project-001',
    'chapter_generation',
    'anthropic',
    'claude-3-5-sonnet-20241022',
    { systemPrompt: 'System', userMessage: 'User', humanReadableSummary: 'Test' },
    { entries: [], totalAvailable: 0, totalPossible: 6 },
    { temperature: null, maxTokens: 4096, thinkingBudget: 6144, thinkingEnabled: true },
    null,
    null,
    5000,
    'Preview...'
  );

const makeRepository = (records: AIRequestRecord[]): AIRequestRepository => ({
  save: vi.fn(),
  findById: vi.fn(),
  findByProject: vi.fn().mockResolvedValue(records),
  deleteByProjectId: vi.fn(),
  deleteAllByOwner: vi.fn(),
});

describe('ListRequestHistoryUseCase', () => {
  describe('execute', () => {
    it('should return records for a project', async () => {
      const records = [makeRecord('rec-001'), makeRecord('rec-002')];
      const repo = makeRepository(records);
      const useCase = new ListRequestHistoryUseCase(repo);

      const result = await useCase.execute({ ownerId: 'user-001', projectId: 'project-001' });

      expect(result).toHaveLength(2);
      expect(repo.findByProject).toHaveBeenCalledWith('user-001', 'project-001', {
        limit: 50,
        offset: 0,
      });
    });

    it('should use provided limit and offset', async () => {
      const repo = makeRepository([]);
      const useCase = new ListRequestHistoryUseCase(repo);

      await useCase.execute({
        ownerId: 'user-001',
        projectId: 'project-001',
        limit: 10,
        offset: 20,
      });

      expect(repo.findByProject).toHaveBeenCalledWith('user-001', 'project-001', {
        limit: 10,
        offset: 20,
      });
    });

    it('should default limit to 50 and offset to 0', async () => {
      const repo = makeRepository([]);
      const useCase = new ListRequestHistoryUseCase(repo);

      await useCase.execute({ ownerId: 'user-001', projectId: 'project-001' });

      expect(repo.findByProject).toHaveBeenCalledWith('user-001', 'project-001', {
        limit: 50,
        offset: 0,
      });
    });

    it('should throw when ownerId is empty', async () => {
      const repo = makeRepository([]);
      const useCase = new ListRequestHistoryUseCase(repo);

      await expect(
        useCase.execute({ ownerId: '', projectId: 'project-001' })
      ).rejects.toThrow('Owner ID is required');
    });

    it('should throw when projectId is empty', async () => {
      const repo = makeRepository([]);
      const useCase = new ListRequestHistoryUseCase(repo);

      await expect(
        useCase.execute({ ownerId: 'user-001', projectId: '' })
      ).rejects.toThrow('Project ID is required');
    });

    it('should return empty array when no records exist', async () => {
      const repo = makeRepository([]);
      const useCase = new ListRequestHistoryUseCase(repo);

      const result = await useCase.execute({ ownerId: 'user-001', projectId: 'project-001' });

      expect(result).toEqual([]);
    });
  });
});
