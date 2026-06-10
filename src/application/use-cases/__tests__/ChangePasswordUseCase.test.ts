// ABOUTME: Tests for ChangePasswordUseCase.
// ABOUTME: Validates password change flow for authenticated users.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  ChangePasswordUseCase,
  UserNotFoundError,
  InvalidCurrentPasswordError,
  ValidationError,
} from '../ChangePasswordUseCase';

describe('ChangePasswordUseCase', () => {
  const mockUserRepository = {
    findByEmail: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    emailExists: vi.fn(),
    approveUser: vi.fn(),
    deleteUser: vi.fn(),
    updatePassword: vi.fn(),
    verifyPassword: vi.fn(),
    hashPassword: vi.fn(),
    updateAIExchangeLogging: vi.fn(),
  };

  const mockTokenRepository = {
    create: vi.fn(),
    findValidToken: vi.fn(),
    markAsUsed: vi.fn(),
    invalidateAllForUser: vi.fn(),
    deleteExpired: vi.fn(),
  };

  const mockEmailService = {
    sendRegistrationNotification: vi.fn(),
    sendWelcomeEmail: vi.fn(),
    sendPasswordResetEmail: vi.fn(),
    sendPasswordChangedEmail: vi.fn(),
  };

  let useCase: ChangePasswordUseCase;

  const mockUser = {
    id: 'user-123',
    email: 'user@gmail.com',
    name: 'Test User',
    passwordHash: 'current-hash',
    isApproved: true,
    isAdmin: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useCase = new ChangePasswordUseCase(
      mockUserRepository,
      mockTokenRepository,
      mockEmailService
    );
  });

  describe('validation', () => {
    it('throws ValidationError for empty current password', async () => {
      await expect(
        useCase.execute({
          userId: 'user-123',
          currentPassword: '',
          newPassword: 'newpassword123',
          confirmPassword: 'newpassword123',
        })
      ).rejects.toThrow(ValidationError);
    });

    it('throws ValidationError for short new password', async () => {
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.verifyPassword.mockResolvedValue(true);

      await expect(
        useCase.execute({
          userId: 'user-123',
          currentPassword: 'currentpass',
          newPassword: 'short',
          confirmPassword: 'short',
        })
      ).rejects.toThrow('Password must be at least 8 characters');
    });

    it('throws ValidationError when passwords do not match', async () => {
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.verifyPassword.mockResolvedValue(true);

      await expect(
        useCase.execute({
          userId: 'user-123',
          currentPassword: 'currentpass',
          newPassword: 'newpassword123',
          confirmPassword: 'different123',
        })
      ).rejects.toThrow('Passwords do not match');
    });

    it('throws ValidationError when new password is same as current', async () => {
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.verifyPassword.mockResolvedValue(true);

      await expect(
        useCase.execute({
          userId: 'user-123',
          currentPassword: 'samepassword123',
          newPassword: 'samepassword123',
          confirmPassword: 'samepassword123',
        })
      ).rejects.toThrow('New password must be different from current password');
    });
  });

  describe('user validation', () => {
    it('throws UserNotFoundError when user does not exist', async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(
        useCase.execute({
          userId: 'nonexistent',
          currentPassword: 'currentpass',
          newPassword: 'newpassword123',
          confirmPassword: 'newpassword123',
        })
      ).rejects.toThrow(UserNotFoundError);
    });

    it('throws InvalidCurrentPasswordError when current password is wrong', async () => {
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.verifyPassword.mockResolvedValue(false);

      await expect(
        useCase.execute({
          userId: 'user-123',
          currentPassword: 'wrongpassword',
          newPassword: 'newpassword123',
          confirmPassword: 'newpassword123',
        })
      ).rejects.toThrow(InvalidCurrentPasswordError);
    });
  });

  describe('successful password change', () => {
    beforeEach(() => {
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.verifyPassword.mockResolvedValue(true);
      mockUserRepository.hashPassword.mockResolvedValue('new-hashed-password');
      mockUserRepository.updatePassword.mockResolvedValue(true);
      mockTokenRepository.invalidateAllForUser.mockResolvedValue(undefined);
    });

    it('verifies current password against stored hash', async () => {
      await useCase.execute({
        userId: 'user-123',
        currentPassword: 'currentpass',
        newPassword: 'newpassword123',
        confirmPassword: 'newpassword123',
      });

      expect(mockUserRepository.verifyPassword).toHaveBeenCalledWith(
        'currentpass',
        'current-hash'
      );
    });

    it('hashes the new password', async () => {
      await useCase.execute({
        userId: 'user-123',
        currentPassword: 'currentpass',
        newPassword: 'newpassword123',
        confirmPassword: 'newpassword123',
      });

      expect(mockUserRepository.hashPassword).toHaveBeenCalledWith('newpassword123');
    });

    it('updates the user password', async () => {
      await useCase.execute({
        userId: 'user-123',
        currentPassword: 'currentpass',
        newPassword: 'newpassword123',
        confirmPassword: 'newpassword123',
      });

      expect(mockUserRepository.updatePassword).toHaveBeenCalledWith('user-123', 'new-hashed-password');
    });

    it('invalidates all password reset tokens for user', async () => {
      await useCase.execute({
        userId: 'user-123',
        currentPassword: 'currentpass',
        newPassword: 'newpassword123',
        confirmPassword: 'newpassword123',
      });

      expect(mockTokenRepository.invalidateAllForUser).toHaveBeenCalledWith('user-123');
    });

    it('sends password changed confirmation email', async () => {
      await useCase.execute({
        userId: 'user-123',
        currentPassword: 'currentpass',
        newPassword: 'newpassword123',
        confirmPassword: 'newpassword123',
      });

      expect(mockEmailService.sendPasswordChangedEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
        })
      );
    });

    it('returns success result', async () => {
      const result = await useCase.execute({
        userId: 'user-123',
        currentPassword: 'currentpass',
        newPassword: 'newpassword123',
        confirmPassword: 'newpassword123',
      });

      expect(result.success).toBe(true);
    });
  });

  describe('password update failure', () => {
    it('throws error when password update fails', async () => {
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.verifyPassword.mockResolvedValue(true);
      mockUserRepository.hashPassword.mockResolvedValue('new-hashed-password');
      mockUserRepository.updatePassword.mockResolvedValue(false);

      await expect(
        useCase.execute({
          userId: 'user-123',
          currentPassword: 'currentpass',
          newPassword: 'newpassword123',
          confirmPassword: 'newpassword123',
        })
      ).rejects.toThrow('Failed to update password');
    });
  });
});
