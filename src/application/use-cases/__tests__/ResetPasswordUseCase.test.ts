// ABOUTME: Tests for ResetPasswordUseCase.
// ABOUTME: Validates password reset flow with token validation and password update.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  ResetPasswordUseCase,
  InvalidTokenError,
  ExpiredTokenError,
  ValidationError,
} from '../ResetPasswordUseCase';

describe('ResetPasswordUseCase', () => {
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

  let useCase: ResetPasswordUseCase;

  const mockUser = {
    id: 'user-123',
    email: 'user@gmail.com',
    name: 'Test User',
    passwordHash: 'old-hash',
    isApproved: true,
    isAdmin: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockToken = {
    id: 'token-id',
    userId: 'user-123',
    token: 'valid-token-123',
    expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
    createdAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useCase = new ResetPasswordUseCase(
      mockUserRepository,
      mockTokenRepository,
      mockEmailService
    );
  });

  describe('validation', () => {
    it('throws ValidationError for empty token', async () => {
      await expect(
        useCase.execute({ token: '', newPassword: 'newpassword123', confirmPassword: 'newpassword123' })
      ).rejects.toThrow(ValidationError);
    });

    it('throws ValidationError for short password', async () => {
      mockTokenRepository.findValidToken.mockResolvedValue(mockToken);

      await expect(
        useCase.execute({ token: 'valid-token', newPassword: 'short', confirmPassword: 'short' })
      ).rejects.toThrow('Password must be at least 8 characters');
    });

    it('throws ValidationError when passwords do not match', async () => {
      mockTokenRepository.findValidToken.mockResolvedValue(mockToken);

      await expect(
        useCase.execute({ token: 'valid-token', newPassword: 'newpassword123', confirmPassword: 'different123' })
      ).rejects.toThrow('Passwords do not match');
    });
  });

  describe('token validation', () => {
    it('throws InvalidTokenError for non-existent token', async () => {
      mockTokenRepository.findValidToken.mockResolvedValue(null);

      await expect(
        useCase.execute({ token: 'invalid-token', newPassword: 'newpassword123', confirmPassword: 'newpassword123' })
      ).rejects.toThrow(InvalidTokenError);
    });

    it('throws InvalidTokenError when user not found', async () => {
      mockTokenRepository.findValidToken.mockResolvedValue(mockToken);
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(
        useCase.execute({ token: 'valid-token', newPassword: 'newpassword123', confirmPassword: 'newpassword123' })
      ).rejects.toThrow(InvalidTokenError);
    });
  });

  describe('successful password reset', () => {
    beforeEach(() => {
      mockTokenRepository.findValidToken.mockResolvedValue(mockToken);
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.hashPassword.mockResolvedValue('new-hashed-password');
      mockUserRepository.updatePassword.mockResolvedValue(true);
      mockTokenRepository.markAsUsed.mockResolvedValue(true);
      mockTokenRepository.invalidateAllForUser.mockResolvedValue(undefined);
    });

    it('hashes the new password', async () => {
      await useCase.execute({ token: 'valid-token', newPassword: 'newpassword123', confirmPassword: 'newpassword123' });

      expect(mockUserRepository.hashPassword).toHaveBeenCalledWith('newpassword123');
    });

    it('updates the user password', async () => {
      await useCase.execute({ token: 'valid-token', newPassword: 'newpassword123', confirmPassword: 'newpassword123' });

      expect(mockUserRepository.updatePassword).toHaveBeenCalledWith('user-123', 'new-hashed-password');
    });

    it('marks token as used', async () => {
      await useCase.execute({ token: 'valid-token', newPassword: 'newpassword123', confirmPassword: 'newpassword123' });

      expect(mockTokenRepository.markAsUsed).toHaveBeenCalledWith('token-id');
    });

    it('invalidates all remaining tokens for user', async () => {
      await useCase.execute({ token: 'valid-token', newPassword: 'newpassword123', confirmPassword: 'newpassword123' });

      expect(mockTokenRepository.invalidateAllForUser).toHaveBeenCalledWith('user-123');
    });

    it('sends password changed confirmation email', async () => {
      await useCase.execute({ token: 'valid-token', newPassword: 'newpassword123', confirmPassword: 'newpassword123' });

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
        token: 'valid-token',
        newPassword: 'newpassword123',
        confirmPassword: 'newpassword123',
      });

      expect(result.success).toBe(true);
    });
  });

  describe('password update failure', () => {
    it('throws error when password update fails', async () => {
      mockTokenRepository.findValidToken.mockResolvedValue(mockToken);
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.hashPassword.mockResolvedValue('new-hashed-password');
      mockUserRepository.updatePassword.mockResolvedValue(false);

      await expect(
        useCase.execute({ token: 'valid-token', newPassword: 'newpassword123', confirmPassword: 'newpassword123' })
      ).rejects.toThrow('Failed to update password');
    });
  });
});
