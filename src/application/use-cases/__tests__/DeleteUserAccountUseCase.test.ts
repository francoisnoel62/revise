// ABOUTME: Tests for DeleteUserAccountUseCase
// ABOUTME: Verifies RGPD compliance with project settings deletion

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  DeleteUserAccountUseCase,
  UserNotFoundError,
  EmailMismatchError,
} from '../DeleteUserAccountUseCase';
import type { UserRepository } from '@/domain/interfaces/UserRepository';
import type { ProjectRepository } from '@/domain/interfaces/ProjectRepository';
import type { ProviderRepository } from '@/domain/interfaces/ProviderRepository';
import type { MetadataRepository } from '@/domain/interfaces/MetadataRepository';
import type { CorrectionHistoryRepository } from '@/domain/interfaces/CorrectionHistoryRepository';
import type { ProjectSettingsRepository } from '@/domain/interfaces/ProjectSettingsRepository';
import type { WordCountSnapshotRepository } from '@/domain/interfaces/WordCountSnapshotRepository';
import type { WritingQuotaRepository } from '@/domain/interfaces/WritingQuotaRepository';
import type { WritingGoalRepository } from '@/domain/interfaces/WritingGoalRepository';
import type { CharacterRepository } from '@/domain/interfaces/CharacterRepository';
import type { ProjectTaskRepository } from '@/domain/interfaces/ProjectTaskRepository';
import type { AIUsageRepository } from '@/domain/interfaces/AIUsageRepository';
import type { AIExchangeRepository } from '@/domain/interfaces/AIExchangeRepository';
import type { AutocompleteEventRepository } from '@/domain/interfaces/AutocompleteEventRepository';
import type { CanonFactRepository } from '@/domain/interfaces/CanonFactRepository';

describe('DeleteUserAccountUseCase', () => {
  let mockUserRepository: {
    findById: ReturnType<typeof vi.fn>;
    deleteUser: ReturnType<typeof vi.fn>;
  };
  let mockProjectRepository: { deleteAllByOwner: ReturnType<typeof vi.fn> };
  let mockProviderRepository: { deleteAllByOwner: ReturnType<typeof vi.fn> };
  let mockMetadataRepository: { deleteAllByOwner: ReturnType<typeof vi.fn> };
  let mockCorrectionHistoryRepository: { deleteAllByOwner: ReturnType<typeof vi.fn> };
  let mockProjectSettingsRepository: { deleteAllByOwner: ReturnType<typeof vi.fn> };
  let mockWordCountSnapshotRepository: { deleteAllByOwner: ReturnType<typeof vi.fn> };
  let mockWritingQuotaRepository: { deleteAllByOwner: ReturnType<typeof vi.fn> };
  let mockWritingGoalRepository: { deleteAllByOwner: ReturnType<typeof vi.fn> };
  let mockCharacterRepository: { deleteAllByOwner: ReturnType<typeof vi.fn> };
  let mockProjectTaskRepository: { deleteAllByOwner: ReturnType<typeof vi.fn> };
  let mockAIUsageRepository: { deleteAllByOwner: ReturnType<typeof vi.fn> };

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
  };

  beforeEach(() => {
    mockUserRepository = {
      findById: vi.fn().mockResolvedValue(mockUser),
      deleteUser: vi.fn().mockResolvedValue(undefined),
    };

    mockProjectRepository = {
      deleteAllByOwner: vi.fn().mockResolvedValue(5),
    };

    mockProviderRepository = {
      deleteAllByOwner: vi.fn().mockResolvedValue(2),
    };

    mockMetadataRepository = {
      deleteAllByOwner: vi.fn().mockResolvedValue(10),
    };

    mockCorrectionHistoryRepository = {
      deleteAllByOwner: vi.fn().mockResolvedValue(15),
    };

    mockProjectSettingsRepository = {
      deleteAllByOwner: vi.fn().mockResolvedValue(undefined),
    };

    mockWordCountSnapshotRepository = {
      deleteAllByOwner: vi.fn().mockResolvedValue(undefined),
    };
    mockWritingQuotaRepository = {
      deleteAllByOwner: vi.fn().mockResolvedValue(undefined),
    };
    mockWritingGoalRepository = {
      deleteAllByOwner: vi.fn().mockResolvedValue(undefined),
    };
    mockCharacterRepository = {
      deleteAllByOwner: vi.fn().mockResolvedValue(undefined),
    };
    mockProjectTaskRepository = {
      deleteAllByOwner: vi.fn().mockResolvedValue(undefined),
    };
    mockAIUsageRepository = {
      deleteAllByOwner: vi.fn().mockResolvedValue(undefined),
    };
  });

  it('should delete word count snapshots when the repository is provided', async () => {
    const useCase = new DeleteUserAccountUseCase(
      mockUserRepository as unknown as UserRepository,
      mockProjectRepository as unknown as ProjectRepository,
      mockProviderRepository as unknown as ProviderRepository,
      mockMetadataRepository as unknown as MetadataRepository,
      mockCorrectionHistoryRepository as unknown as CorrectionHistoryRepository,
      mockProjectSettingsRepository as unknown as ProjectSettingsRepository,
      mockWordCountSnapshotRepository as unknown as WordCountSnapshotRepository
    );

    await useCase.execute({ userId: 'user-1', confirmEmail: 'test@example.com' });

    expect(mockWordCountSnapshotRepository.deleteAllByOwner).toHaveBeenCalledWith('user-1');
  });

  it('should delete all owned data across every provided repository (RGPD)', async () => {
    const mockAIExchangeRepository = { deleteAllByOwner: vi.fn().mockResolvedValue(undefined) };
    const mockAutocompleteEventRepository = { deleteAllByOwner: vi.fn().mockResolvedValue(undefined) };
    const mockCanonFactRepository = { deleteAllByOwner: vi.fn().mockResolvedValue(undefined) };

    const useCase = new DeleteUserAccountUseCase(
      mockUserRepository as unknown as UserRepository,
      mockProjectRepository as unknown as ProjectRepository,
      mockProviderRepository as unknown as ProviderRepository,
      mockMetadataRepository as unknown as MetadataRepository,
      mockCorrectionHistoryRepository as unknown as CorrectionHistoryRepository,
      mockProjectSettingsRepository as unknown as ProjectSettingsRepository,
      mockWordCountSnapshotRepository as unknown as WordCountSnapshotRepository,
      mockWritingQuotaRepository as unknown as WritingQuotaRepository,
      mockWritingGoalRepository as unknown as WritingGoalRepository,
      mockCharacterRepository as unknown as CharacterRepository,
      mockProjectTaskRepository as unknown as ProjectTaskRepository,
      mockAIUsageRepository as unknown as AIUsageRepository,
      mockAIExchangeRepository as unknown as AIExchangeRepository,
      mockAutocompleteEventRepository as unknown as AutocompleteEventRepository,
      mockCanonFactRepository as unknown as CanonFactRepository
    );

    await useCase.execute({ userId: 'user-1', confirmEmail: 'test@example.com' });

    expect(mockWritingQuotaRepository.deleteAllByOwner).toHaveBeenCalledWith('user-1');
    expect(mockWritingGoalRepository.deleteAllByOwner).toHaveBeenCalledWith('user-1');
    expect(mockCharacterRepository.deleteAllByOwner).toHaveBeenCalledWith('user-1');
    expect(mockProjectTaskRepository.deleteAllByOwner).toHaveBeenCalledWith('user-1');
    expect(mockAIUsageRepository.deleteAllByOwner).toHaveBeenCalledWith('user-1');
    expect(mockAIExchangeRepository.deleteAllByOwner).toHaveBeenCalledWith('user-1');
    expect(mockAutocompleteEventRepository.deleteAllByOwner).toHaveBeenCalledWith('user-1');
    expect(mockCanonFactRepository.deleteAllByOwner).toHaveBeenCalledWith('user-1');
  });

  it('should throw UserNotFoundError when user does not exist', async () => {
    mockUserRepository.findById.mockResolvedValue(null);

    const useCase = new DeleteUserAccountUseCase(
      mockUserRepository as unknown as UserRepository,
      mockProjectRepository as unknown as ProjectRepository,
      mockProviderRepository as unknown as ProviderRepository,
      mockMetadataRepository as unknown as MetadataRepository,
      mockCorrectionHistoryRepository as unknown as CorrectionHistoryRepository,
      mockProjectSettingsRepository as unknown as ProjectSettingsRepository
    );

    await expect(
      useCase.execute({ userId: 'user-1', confirmEmail: 'test@example.com' })
    ).rejects.toThrow(UserNotFoundError);
  });

  it('should throw EmailMismatchError when email does not match', async () => {
    const useCase = new DeleteUserAccountUseCase(
      mockUserRepository as unknown as UserRepository,
      mockProjectRepository as unknown as ProjectRepository,
      mockProviderRepository as unknown as ProviderRepository,
      mockMetadataRepository as unknown as MetadataRepository,
      mockCorrectionHistoryRepository as unknown as CorrectionHistoryRepository,
      mockProjectSettingsRepository as unknown as ProjectSettingsRepository
    );

    await expect(
      useCase.execute({ userId: 'user-1', confirmEmail: 'wrong@example.com' })
    ).rejects.toThrow(EmailMismatchError);
  });

  it('should delete project settings and include in result', async () => {
    const useCase = new DeleteUserAccountUseCase(
      mockUserRepository as unknown as UserRepository,
      mockProjectRepository as unknown as ProjectRepository,
      mockProviderRepository as unknown as ProviderRepository,
      mockMetadataRepository as unknown as MetadataRepository,
      mockCorrectionHistoryRepository as unknown as CorrectionHistoryRepository,
      mockProjectSettingsRepository as unknown as ProjectSettingsRepository
    );

    const result = await useCase.execute({
      userId: 'user-1',
      confirmEmail: 'test@example.com',
    });

    expect(mockProjectSettingsRepository.deleteAllByOwner).toHaveBeenCalledWith('user-1');
    expect(result.settingsDeleted).toBe(0); // deleteAllByOwner returns void, count not available
  });

  it('should delete all user data in correct order', async () => {
    const callOrder: string[] = [];

    mockCorrectionHistoryRepository.deleteAllByOwner = vi.fn().mockImplementation(() => {
      callOrder.push('history');
      return Promise.resolve(15);
    });

    mockMetadataRepository.deleteAllByOwner = vi.fn().mockImplementation(() => {
      callOrder.push('metadata');
      return Promise.resolve(10);
    });

    mockProjectSettingsRepository.deleteAllByOwner = vi.fn().mockImplementation(() => {
      callOrder.push('settings');
      return Promise.resolve(undefined);
    });

    mockProjectRepository.deleteAllByOwner = vi.fn().mockImplementation(() => {
      callOrder.push('projects');
      return Promise.resolve(5);
    });

    mockProviderRepository.deleteAllByOwner = vi.fn().mockImplementation(() => {
      callOrder.push('providers');
      return Promise.resolve(2);
    });

    mockUserRepository.deleteUser = vi.fn().mockImplementation(() => {
      callOrder.push('user');
      return Promise.resolve(undefined);
    });

    const useCase = new DeleteUserAccountUseCase(
      mockUserRepository as unknown as UserRepository,
      mockProjectRepository as unknown as ProjectRepository,
      mockProviderRepository as unknown as ProviderRepository,
      mockMetadataRepository as unknown as MetadataRepository,
      mockCorrectionHistoryRepository as unknown as CorrectionHistoryRepository,
      mockProjectSettingsRepository as unknown as ProjectSettingsRepository
    );

    await useCase.execute({
      userId: 'user-1',
      confirmEmail: 'test@example.com',
    });

    // Settings should be deleted before projects
    expect(callOrder.indexOf('settings')).toBeLessThan(callOrder.indexOf('projects'));
    // User should be deleted last
    expect(callOrder.indexOf('user')).toBe(callOrder.length - 1);
  });

  it('should return correct deletion counts', async () => {
    const useCase = new DeleteUserAccountUseCase(
      mockUserRepository as unknown as UserRepository,
      mockProjectRepository as unknown as ProjectRepository,
      mockProviderRepository as unknown as ProviderRepository,
      mockMetadataRepository as unknown as MetadataRepository,
      mockCorrectionHistoryRepository as unknown as CorrectionHistoryRepository,
      mockProjectSettingsRepository as unknown as ProjectSettingsRepository
    );

    const result = await useCase.execute({
      userId: 'user-1',
      confirmEmail: 'test@example.com',
    });

    expect(result).toEqual({
      projectsDeleted: 5,
      providersDeleted: 2,
      metadataDeleted: 10,
      historyDeleted: 15,
      settingsDeleted: 0, // deleteAllByOwner returns void, count not available
    });
  });
});
