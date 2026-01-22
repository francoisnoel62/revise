// ABOUTME: Tests for DeleteUserAccountUseCase
// ABOUTME: Verifies RGPD compliance with project settings deletion

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  DeleteUserAccountUseCase,
  UserNotFoundError,
  EmailMismatchError,
} from '../DeleteUserAccountUseCase';

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
  });

  it('should throw UserNotFoundError when user does not exist', async () => {
    mockUserRepository.findById.mockResolvedValue(null);

    const useCase = new DeleteUserAccountUseCase(
      mockUserRepository,
      mockProjectRepository,
      mockProviderRepository,
      mockMetadataRepository,
      mockCorrectionHistoryRepository,
      mockProjectSettingsRepository
    );

    await expect(
      useCase.execute({ userId: 'user-1', confirmEmail: 'test@example.com' })
    ).rejects.toThrow(UserNotFoundError);
  });

  it('should throw EmailMismatchError when email does not match', async () => {
    const useCase = new DeleteUserAccountUseCase(
      mockUserRepository,
      mockProjectRepository,
      mockProviderRepository,
      mockMetadataRepository,
      mockCorrectionHistoryRepository,
      mockProjectSettingsRepository
    );

    await expect(
      useCase.execute({ userId: 'user-1', confirmEmail: 'wrong@example.com' })
    ).rejects.toThrow(EmailMismatchError);
  });

  it('should delete project settings and include in result', async () => {
    const useCase = new DeleteUserAccountUseCase(
      mockUserRepository,
      mockProjectRepository,
      mockProviderRepository,
      mockMetadataRepository,
      mockCorrectionHistoryRepository,
      mockProjectSettingsRepository
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
      mockUserRepository,
      mockProjectRepository,
      mockProviderRepository,
      mockMetadataRepository,
      mockCorrectionHistoryRepository,
      mockProjectSettingsRepository
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
      mockUserRepository,
      mockProjectRepository,
      mockProviderRepository,
      mockMetadataRepository,
      mockCorrectionHistoryRepository,
      mockProjectSettingsRepository
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
