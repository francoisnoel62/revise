// ABOUTME: Tests for GetRequestVisualizationUseCase
// ABOUTME: Verifies fetching of a single AI request record with proper validation

import { vi } from 'vitest';
import { GetRequestVisualizationUseCase } from './GetRequestVisualizationUseCase';
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

const makeRepository = (record: AIRequestRecord | null): AIRequestRepository => ({
  save: vi.fn(),
  findById: vi.fn().mockResolvedValue(record),
  findByProject: vi.fn(),
  deleteByProjectId: vi.fn(),
  deleteAllByOwner: vi.fn(),
});

describe('GetRequestVisualizationUseCase', () => {
  describe('execute', () => {
    it('should return the record when found', async () => {
      const record = makeRecord('rec-001');
      const repo = makeRepository(record);
      const useCase = new GetRequestVisualizationUseCase(repo);

      const result = await useCase.execute({ ownerId: 'user-001', requestRecordId: 'rec-001' });

      expect(result).toBe(record);
      expect(repo.findById).toHaveBeenCalledWith('user-001', 'rec-001');
    });

    it('should return null when not found', async () => {
      const repo = makeRepository(null);
      const useCase = new GetRequestVisualizationUseCase(repo);

      const result = await useCase.execute({ ownerId: 'user-001', requestRecordId: 'rec-999' });

      expect(result).toBeNull();
    });

    it('should throw when ownerId is empty', async () => {
      const repo = makeRepository(null);
      const useCase = new GetRequestVisualizationUseCase(repo);

      await expect(
        useCase.execute({ ownerId: '', requestRecordId: 'rec-001' })
      ).rejects.toThrow('Owner ID is required');
    });

    it('should throw when requestRecordId is empty', async () => {
      const repo = makeRepository(null);
      const useCase = new GetRequestVisualizationUseCase(repo);

      await expect(
        useCase.execute({ ownerId: 'user-001', requestRecordId: '' })
      ).rejects.toThrow('Request record ID is required');
    });

    it('should throw when ownerId is only whitespace', async () => {
      const repo = makeRepository(null);
      const useCase = new GetRequestVisualizationUseCase(repo);

      await expect(
        useCase.execute({ ownerId: '   ', requestRecordId: 'rec-001' })
      ).rejects.toThrow('Owner ID is required');
    });
  });
});
