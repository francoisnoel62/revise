// ABOUTME: Unit tests for DeleteCorrectionHistoryUseCase
// ABOUTME: Validates deletion of correction history entries with ownership checks

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeleteCorrectionHistoryUseCase } from '../DeleteCorrectionHistoryUseCase';
import { CorrectionHistory } from '../../../domain/entities/CorrectionHistory';
import { CorrectionHistoryRepository } from '../../../domain/interfaces/CorrectionHistoryRepository';

describe('DeleteCorrectionHistoryUseCase', () => {
  let useCase: DeleteCorrectionHistoryUseCase;
  let mockHistoryRepository: CorrectionHistoryRepository;

  const ownerId = 'user-1';
  const historyId = 'history-1';
  const projectId = 'project-1';
  const chapterId = 'chapter-1';

  const createMockHistory = (): CorrectionHistory => {
    return new CorrectionHistory(
      historyId,
      projectId,
      chapterId,
      'Selected text',
      ['Proposal 1', 'Proposal 2', 'Proposal 3'],
      new Date('2026-01-12T10:00:00Z')
    );
  };

  beforeEach(() => {
    mockHistoryRepository = {
      save: vi.fn().mockResolvedValue(undefined),
      findByProjectId: vi.fn().mockResolvedValue([]),
      findByChapterId: vi.fn().mockResolvedValue([]),
      findById: vi.fn().mockResolvedValue(createMockHistory()),
      delete: vi.fn().mockResolvedValue(undefined),
      deleteByChapterId: vi.fn().mockResolvedValue(undefined),
      deleteByProjectId: vi.fn().mockResolvedValue(undefined),
    };

    useCase = new DeleteCorrectionHistoryUseCase(mockHistoryRepository);
  });

  describe('execute', () => {
    it('should delete history entry successfully', async () => {
      await useCase.execute({ ownerId, historyId });

      expect(mockHistoryRepository.delete).toHaveBeenCalledWith(ownerId, historyId);
    });

    it('should verify history exists before deleting', async () => {
      await useCase.execute({ ownerId, historyId });

      expect(mockHistoryRepository.findById).toHaveBeenCalledWith(ownerId, historyId);
    });

    it('should throw error if ownerId is empty', async () => {
      await expect(
        useCase.execute({ ownerId: '', historyId })
      ).rejects.toThrow('Owner ID is required');
    });

    it('should throw error if historyId is empty', async () => {
      await expect(
        useCase.execute({ ownerId, historyId: '' })
      ).rejects.toThrow('History ID is required');
    });

    it('should throw error if history entry not found', async () => {
      vi.mocked(mockHistoryRepository.findById).mockResolvedValue(null);

      await expect(
        useCase.execute({ ownerId, historyId })
      ).rejects.toThrow('Correction history not found');
    });
  });
});
