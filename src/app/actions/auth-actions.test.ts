// ABOUTME: Tests for authentication Server Actions.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { registerUserAction, checkEmailAvailableAction } from './auth-actions';

// Mock the providers
vi.mock('@/infrastructure/config/providers', () => ({
  getUserRepository: vi.fn(),
}));

import { getUserRepository } from '@/infrastructure/config/providers';

describe('auth-actions', () => {
  const mockUserRepo = {
    findByEmail: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    emailExists: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getUserRepository).mockResolvedValue(mockUserRepo);
  });

  describe('registerUserAction', () => {
    it('creates user with valid input and consent', async () => {
      mockUserRepo.emailExists.mockResolvedValue(false);
      mockUserRepo.create.mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
      });

      const result = await registerUserAction(
        'test@example.com',
        'password123',
        'Test User',
        true, // acceptedTerms
        true  // acceptedPrivacy
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('test@example.com');
      }
    });

    it('rejects duplicate email', async () => {
      mockUserRepo.emailExists.mockResolvedValue(true);

      const result = await registerUserAction(
        'existing@example.com',
        'password123',
        undefined,
        true,
        true
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('already registered');
      }
    });

    it('rejects short password', async () => {
      const result = await registerUserAction(
        'test@example.com',
        'short',
        undefined,
        true,
        true
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('8 characters');
      }
    });

    it('rejects invalid email', async () => {
      const result = await registerUserAction(
        'invalid-email',
        'password123',
        undefined,
        true,
        true
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Invalid email');
      }
    });

    it('rejects registration without terms acceptance', async () => {
      const result = await registerUserAction(
        'test@example.com',
        'password123',
        'Test User',
        false, // acceptedTerms = false
        true
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Terms of Service');
      }
    });

    it('rejects registration without privacy acceptance', async () => {
      const result = await registerUserAction(
        'test@example.com',
        'password123',
        'Test User',
        true,
        false // acceptedPrivacy = false
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Privacy Policy');
      }
    });
  });

  describe('checkEmailAvailableAction', () => {
    it('returns available for new email', async () => {
      mockUserRepo.emailExists.mockResolvedValue(false);

      const result = await checkEmailAvailableAction('new@example.com');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.available).toBe(true);
      }
    });

    it('returns not available for existing email', async () => {
      mockUserRepo.emailExists.mockResolvedValue(true);

      const result = await checkEmailAvailableAction('existing@example.com');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.available).toBe(false);
      }
    });
  });
});
