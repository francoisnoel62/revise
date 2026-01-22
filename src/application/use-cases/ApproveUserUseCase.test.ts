// ABOUTME: Tests for ApproveUserUseCase.
// ABOUTME: Verifies user approval and rejection with token validation.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  ApproveUserUseCase,
  InvalidTokenError,
  UserNotFoundError,
} from './ApproveUserUseCase';
import { UserRepository } from '@/domain/interfaces/UserRepository';
import { ApprovalTokenGenerator } from '@/domain/interfaces/ApprovalTokenGenerator';
import { EmailService } from '@/domain/interfaces/EmailService';
import { User } from '@/domain/entities/User';

describe('ApproveUserUseCase', () => {
  let mockUserRepository: UserRepository;
  let mockTokenGenerator: ApprovalTokenGenerator;
  let mockEmailService: EmailService;
  let useCase: ApproveUserUseCase;

  const mockUser: User = {
    id: 'user-123',
    email: 'user@protonmail.com',
    passwordHash: 'hashed-password',
    name: 'Test User',
    isApproved: false,
    isAdmin: false,
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

    mockTokenGenerator = {
      generateToken: vi.fn().mockReturnValue('valid-token'),
      verifyToken: vi.fn().mockImplementation((userId, token) => token === 'valid-token'),
    };

    mockEmailService = {
      sendRegistrationNotification: vi.fn().mockResolvedValue(undefined),
      sendWelcomeEmail: vi.fn().mockResolvedValue(undefined),
    };

    useCase = new ApproveUserUseCase(mockUserRepository, mockTokenGenerator, mockEmailService);
  });

  describe('execute - approve', () => {
    it('approves user with valid token', async () => {
      vi.mocked(mockUserRepository.findById).mockResolvedValue(mockUser);
      vi.mocked(mockUserRepository.approveUser).mockResolvedValue(true);

      const result = await useCase.execute({
        userId: mockUser.id,
        token: 'valid-token',
        action: 'approve',
      });

      expect(result.success).toBe(true);
      expect(result.action).toBe('approve');
      expect(result.userEmail).toBe(mockUser.email);
      expect(mockUserRepository.approveUser).toHaveBeenCalledWith(mockUser.id);
      expect(mockTokenGenerator.verifyToken).toHaveBeenCalledWith(mockUser.id, 'valid-token');
    });

    it('sends welcome email when user is approved', async () => {
      vi.mocked(mockUserRepository.findById).mockResolvedValue(mockUser);
      vi.mocked(mockUserRepository.approveUser).mockResolvedValue(true);

      await useCase.execute({
        userId: mockUser.id,
        token: 'valid-token',
        action: 'approve',
      });

      expect(mockEmailService.sendWelcomeEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
        })
      );
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
      vi.mocked(mockUserRepository.findById).mockResolvedValue(null);

      await expect(
        useCase.execute({
          userId: mockUser.id,
          token: 'valid-token',
          action: 'approve',
        })
      ).rejects.toThrow(UserNotFoundError);
    });
  });

  describe('execute - reject', () => {
    it('deletes user with valid token', async () => {
      vi.mocked(mockUserRepository.findById).mockResolvedValue(mockUser);
      vi.mocked(mockUserRepository.deleteUser).mockResolvedValue(true);

      const result = await useCase.execute({
        userId: mockUser.id,
        token: 'valid-token',
        action: 'reject',
      });

      expect(result.success).toBe(true);
      expect(result.action).toBe('reject');
      expect(result.userEmail).toBe(mockUser.email);
      expect(mockUserRepository.deleteUser).toHaveBeenCalledWith(mockUser.id);
    });

    it('does not send welcome email when user is rejected', async () => {
      vi.mocked(mockUserRepository.findById).mockResolvedValue(mockUser);
      vi.mocked(mockUserRepository.deleteUser).mockResolvedValue(true);

      await useCase.execute({
        userId: mockUser.id,
        token: 'valid-token',
        action: 'reject',
      });

      expect(mockEmailService.sendWelcomeEmail).not.toHaveBeenCalled();
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
