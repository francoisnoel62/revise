// ABOUTME: Tests for RequestPasswordResetUseCase.
// ABOUTME: Validates password reset request flow including token generation and email sending.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  RequestPasswordResetUseCase,
} from '../RequestPasswordResetUseCase';

describe('RequestPasswordResetUseCase', () => {
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

  const mockTokenGenerator = {
    generate: vi.fn(),
  };

  let useCase: RequestPasswordResetUseCase;

  const mockUser = {
    id: 'user-123',
    email: 'user@gmail.com',
    name: 'Test User',
    passwordHash: 'hashed',
    isApproved: true,
    isAdmin: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useCase = new RequestPasswordResetUseCase(
      mockUserRepository,
      mockTokenRepository,
      mockEmailService,
      mockTokenGenerator,
      'https://app.revise.com'
    );
  });

  describe('validation', () => {
    it('throws ValidationError for invalid email format', async () => {
      await expect(
        useCase.execute({ email: 'invalid-email' })
      ).rejects.toThrow('Invalid email address');
    });

    it('throws ValidationError for empty email', async () => {
      await expect(
        useCase.execute({ email: '' })
      ).rejects.toThrow('Invalid email address');
    });
  });

  describe('user not found', () => {
    it('returns success without revealing user existence (security)', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);

      const result = await useCase.execute({ email: 'nonexistent@gmail.com' });

      // Should return success to prevent email enumeration
      expect(result.success).toBe(true);
      expect(mockEmailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });
  });

  describe('user not approved', () => {
    it('returns success without sending email for unapproved users', async () => {
      mockUserRepository.findByEmail.mockResolvedValue({
        ...mockUser,
        isApproved: false,
      });

      const result = await useCase.execute({ email: 'user@gmail.com' });

      expect(result.success).toBe(true);
      expect(mockEmailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });
  });

  describe('successful reset request', () => {
    beforeEach(() => {
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      mockTokenGenerator.generate.mockReturnValue('secure-token-123');
      mockTokenRepository.create.mockResolvedValue({
        id: 'token-id',
        userId: mockUser.id,
        token: 'secure-token-123',
        expiresAt: new Date(Date.now() + 3600000),
        createdAt: new Date(),
      });
    });

    it('invalidates existing tokens before creating new one', async () => {
      await useCase.execute({ email: 'user@gmail.com' });

      expect(mockTokenRepository.invalidateAllForUser).toHaveBeenCalledWith(mockUser.id);
      expect(mockTokenRepository.invalidateAllForUser).toHaveBeenCalledBefore(
        mockTokenRepository.create
      );
    });

    it('creates a new reset token with 1 hour expiration', async () => {
      const beforeExecution = Date.now();
      await useCase.execute({ email: 'user@gmail.com' });
      const afterExecution = Date.now();

      expect(mockTokenRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUser.id,
          token: 'secure-token-123',
        })
      );

      const createCall = mockTokenRepository.create.mock.calls[0][0];
      const expiresAt = createCall.expiresAt.getTime();

      // Should expire in approximately 1 hour (with some tolerance)
      expect(expiresAt).toBeGreaterThanOrEqual(beforeExecution + 3600000 - 1000);
      expect(expiresAt).toBeLessThanOrEqual(afterExecution + 3600000 + 1000);
    });

    it('sends password reset email with correct link', async () => {
      await useCase.execute({ email: 'user@gmail.com' });

      expect(mockEmailService.sendPasswordResetEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
        }),
        'https://app.revise.com/auth/reset-password?token=secure-token-123'
      );
    });

    it('returns success after sending email', async () => {
      const result = await useCase.execute({ email: 'user@gmail.com' });

      expect(result.success).toBe(true);
    });

    it('handles email case insensitively', async () => {
      await useCase.execute({ email: 'USER@gmail.com' });

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('user@gmail.com');
    });
  });

  describe('email service failure', () => {
    it('throws error when email sending fails', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      mockTokenGenerator.generate.mockReturnValue('secure-token-123');
      mockTokenRepository.create.mockResolvedValue({
        id: 'token-id',
        userId: mockUser.id,
        token: 'secure-token-123',
        expiresAt: new Date(Date.now() + 3600000),
        createdAt: new Date(),
      });
      mockEmailService.sendPasswordResetEmail.mockRejectedValue(new Error('Email failed'));

      await expect(
        useCase.execute({ email: 'user@gmail.com' })
      ).rejects.toThrow('Email failed');
    });
  });
});
