// ABOUTME: Tests for ApproveUserUseCase.
// ABOUTME: Verifies user approval and rejection with token validation.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  ApproveUserUseCase,
  InvalidTokenError,
  UserNotFoundError,
} from './ApproveUserUseCase';
import { UserRepository } from '@/domain/interfaces/UserRepository';
import { User, SafeUser } from '@/domain/entities/User';

// Mock the config
vi.mock('@/infrastructure/config/env', () => ({
  config: {
    auth: {
      secret: 'test-secret-key-for-hmac-generation',
    },
  },
}));

describe('ApproveUserUseCase', () => {
  let mockUserRepository: UserRepository;
  let useCase: ApproveUserUseCase;

  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    passwordHash: 'hashed-password',
    name: 'Test User',
    isApproved: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    mockUserRepository = {
      findByEmail: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
      emailExists: vi.fn(),
      approveUser: vi.fn(),
      deleteUser: vi.fn(),
    };
    useCase = new ApproveUserUseCase(mockUserRepository);
  });

  describe('generateToken', () => {
    it('generates consistent tokens for same user ID', () => {
      const token1 = ApproveUserUseCase.generateToken('user-123');
      const token2 = ApproveUserUseCase.generateToken('user-123');
      expect(token1).toBe(token2);
      expect(token1).toHaveLength(32);
    });

    it('generates different tokens for different user IDs', () => {
      const token1 = ApproveUserUseCase.generateToken('user-123');
      const token2 = ApproveUserUseCase.generateToken('user-456');
      expect(token1).not.toBe(token2);
    });
  });

  describe('execute - approve', () => {
    it('approves user with valid token', async () => {
      const validToken = ApproveUserUseCase.generateToken(mockUser.id);
      vi.mocked(mockUserRepository.findById).mockResolvedValue(mockUser);
      vi.mocked(mockUserRepository.approveUser).mockResolvedValue(true);

      const result = await useCase.execute({
        userId: mockUser.id,
        token: validToken,
        action: 'approve',
      });

      expect(result.success).toBe(true);
      expect(result.action).toBe('approve');
      expect(result.userEmail).toBe(mockUser.email);
      expect(mockUserRepository.approveUser).toHaveBeenCalledWith(mockUser.id);
    });

    it('rejects invalid token', async () => {
      await expect(
        useCase.execute({
          userId: mockUser.id,
          token: 'invalid-token',
          action: 'approve',
        })
      ).rejects.toThrow(InvalidTokenError);
    });

    it('rejects when user not found', async () => {
      const validToken = ApproveUserUseCase.generateToken(mockUser.id);
      vi.mocked(mockUserRepository.findById).mockResolvedValue(null);

      await expect(
        useCase.execute({
          userId: mockUser.id,
          token: validToken,
          action: 'approve',
        })
      ).rejects.toThrow(UserNotFoundError);
    });
  });

  describe('execute - reject', () => {
    it('deletes user with valid token', async () => {
      const validToken = ApproveUserUseCase.generateToken(mockUser.id);
      vi.mocked(mockUserRepository.findById).mockResolvedValue(mockUser);
      vi.mocked(mockUserRepository.deleteUser).mockResolvedValue(true);

      const result = await useCase.execute({
        userId: mockUser.id,
        token: validToken,
        action: 'reject',
      });

      expect(result.success).toBe(true);
      expect(result.action).toBe('reject');
      expect(result.userEmail).toBe(mockUser.email);
      expect(mockUserRepository.deleteUser).toHaveBeenCalledWith(mockUser.id);
    });

    it('rejects invalid token for rejection', async () => {
      await expect(
        useCase.execute({
          userId: mockUser.id,
          token: 'invalid-token',
          action: 'reject',
        })
      ).rejects.toThrow(InvalidTokenError);
    });
  });
});
