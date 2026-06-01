// ABOUTME: Tests for WritingQuota create/update/list/delete use cases
// ABOUTME: Verifies delegation to the repository and partial updates

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateWritingQuotaUseCase } from '../CreateWritingQuotaUseCase';
import { UpdateWritingQuotaUseCase } from '../UpdateWritingQuotaUseCase';
import { ListWritingQuotasUseCase } from '../ListWritingQuotasUseCase';
import { DeleteWritingQuotaUseCase } from '../DeleteWritingQuotaUseCase';
import { WritingQuota } from '@/domain/entities/WritingQuota';

describe('WritingQuota use cases', () => {
  let mockRepository: {
    create: ReturnType<typeof vi.fn>;
    findById: ReturnType<typeof vi.fn>;
    findByProjectId: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    deleteAllByOwner: ReturnType<typeof vi.fn>;
  };
  let mockIdGenerator: { generate: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockRepository = {
      create: vi.fn((_userId, quota) => Promise.resolve(quota)),
      findById: vi.fn(),
      findByProjectId: vi.fn().mockResolvedValue([]),
      update: vi.fn((_userId, quota) => Promise.resolve(quota)),
      delete: vi.fn().mockResolvedValue(undefined),
      deleteAllByOwner: vi.fn().mockResolvedValue(undefined),
    };
    mockIdGenerator = { generate: vi.fn(() => 'generated-id') };
  });

  it('creates a quota with valid input', async () => {
    const useCase = new CreateWritingQuotaUseCase(mockRepository, mockIdGenerator);

    const result = await useCase.execute({
      userId: 'user-1',
      projectId: 'project-1',
      period: 'daily',
      targetWords: 1000,
    });

    expect(result.getId()).toBe('generated-id');
    expect(result.getPeriod()).toBe('daily');
    expect(result.getTargetWords()).toBe(1000);
    expect(mockRepository.create).toHaveBeenCalled();
  });

  it('rejects an invalid target when creating', async () => {
    const useCase = new CreateWritingQuotaUseCase(mockRepository, mockIdGenerator);
    await expect(
      useCase.execute({ userId: 'user-1', projectId: 'project-1', period: 'daily', targetWords: 0 })
    ).rejects.toThrow();
  });

  it('updates only the provided fields', async () => {
    const existing = WritingQuota.create('q-1', 'project-1', 'user-1', 'daily', 1000);
    mockRepository.findById.mockResolvedValue(existing);
    const useCase = new UpdateWritingQuotaUseCase(mockRepository);

    const result = await useCase.execute({
      userId: 'user-1',
      quotaId: 'q-1',
      targetWords: 1500,
    });

    expect(result.getTargetWords()).toBe(1500);
    expect(result.getPeriod()).toBe('daily');
  });

  it('throws when updating a missing quota', async () => {
    mockRepository.findById.mockResolvedValue(null);
    const useCase = new UpdateWritingQuotaUseCase(mockRepository);
    await expect(
      useCase.execute({ userId: 'user-1', quotaId: 'missing', targetWords: 1500 })
    ).rejects.toThrow('Quota not found');
  });

  it('lists quotas for a project', async () => {
    const quota = WritingQuota.create('q-1', 'project-1', 'user-1', 'weekly', 5000);
    mockRepository.findByProjectId.mockResolvedValue([quota]);
    const useCase = new ListWritingQuotasUseCase(mockRepository);

    const result = await useCase.execute({ userId: 'user-1', projectId: 'project-1' });

    expect(result).toHaveLength(1);
    expect(result[0].getPeriod()).toBe('weekly');
  });

  it('deletes a quota', async () => {
    const useCase = new DeleteWritingQuotaUseCase(mockRepository);
    await useCase.execute({ userId: 'user-1', quotaId: 'q-1' });
    expect(mockRepository.delete).toHaveBeenCalledWith('user-1', 'q-1');
  });
});
