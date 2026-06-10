// ABOUTME: Tests for authentication Server Actions.
// ABOUTME: Includes tests for rate limiting and CAPTCHA verification.

import { describe, it, expect, vi, beforeEach
 } from 'vitest';
import { registerUserAction, checkEmailAvailableAction } from './auth-actions';
import type { InMemoryRateLimiter } from '@/infrastructure/security/InMemoryRateLimiter';
import type { HCaptchaVerifier } from '@/infrastructure/security/HCaptchaVerifier';

// Mock the providers
vi.mock('@/infrastructure/config/providers', () => ({
  getUserRepository: vi.fn(),
}));

// Mock next/headers
vi.mock('next/headers', () => ({
  headers: vi.fn(() => Promise.resolve({
    get: vi.fn((name: string) => {
      if (name === 'x-forwarded-for') return '127.0.0.1';
      return null;
    }),
  })),
}));

// Mock rate limiter
vi.mock('@/infrastructure/security/InMemoryRateLimiter', () => ({
  getRateLimiter: vi.fn(() => ({
    checkLimit: vi.fn().mockResolvedValue({ allowed: true, remainingAttempts: 5, resetInSeconds: 3600 }),
    recordAttempt: vi.fn().mockResolvedValue(undefined),
    resetLimit: vi.fn().mockResolvedValue(undefined),
  } as unknown as import('@/infrastructure/security/InMemoryRateLimiter').InMemoryRateLimiter)),
}));

// Mock hCaptcha verifier (disabled by default in tests)
vi.mock('@/infrastructure/security/HCaptchaVerifier', () => ({
  getHCaptchaVerifier: vi.fn(() => null),
}));

import { getUserRepository } from '@/infrastructure/config/providers';
import { getRateLimiter } from '@/infrastructure/security/InMemoryRateLimiter';
import { getHCaptchaVerifier } from '@/infrastructure/security/HCaptchaVerifier';

describe('auth-actions', () => {
  const mockUserRepo = {
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

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getUserRepository).mockResolvedValue(mockUserRepo);
  });

  describe('registerUserAction', () => {
    it('creates user with valid input and consent', async () => {
      mockUserRepo.emailExists.mockResolvedValue(false);
      mockUserRepo.create.mockResolvedValue({
        id: 'user-123',
        email: 'user@protonmail.com',
        name: 'Test User',
      });

      const result = await registerUserAction(
        'user@protonmail.com',
        'password123',
        'Test User',
        true, // acceptedTerms
        true  // acceptedPrivacy
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('user@protonmail.com');
      }
    });

    it('rejects duplicate email', async () => {
      mockUserRepo.emailExists.mockResolvedValue(true);

      const result = await registerUserAction(
        'existing@protonmail.com',
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
        'user@protonmail.com',
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
        'user@protonmail.com',
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
        'user@protonmail.com',
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

    it('rejects registration when honeypot field is filled (bot detection)', async () => {
      const result = await registerUserAction(
        'user@protonmail.com',
        'password123',
        'Test User',
        true,
        true,
        'bot-filled-this' // honeypot field
      );

      expect(result.success).toBe(false);
    });

    it('accepts registration when honeypot field is empty', async () => {
      mockUserRepo.emailExists.mockResolvedValue(false);
      mockUserRepo.create.mockResolvedValue({
        id: 'user-123',
        email: 'user@protonmail.com',
        name: 'Test User',
      });

      const result = await registerUserAction(
        'user@protonmail.com',
        'password123',
        'Test User',
        true,
        true,
        '' // empty honeypot
      );

      expect(result.success).toBe(true);
    });

    it('rejects registration with blocked email domain (example.com)', async () => {
      const result = await registerUserAction(
        'test@example.com',
        'password123',
        'Test User',
        true,
        true
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('autorisée');
      }
    });

    it('rejects registration with blocked email domain (test.com)', async () => {
      const result = await registerUserAction(
        'user@test.com',
        'password123',
        'Test User',
        true,
        true
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('autorisée');
      }
    });

    it('rejects registration with blocked email domain (example.org)', async () => {
      const result = await registerUserAction(
        'user@example.org',
        'password123',
        'Test User',
        true,
        true
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('autorisée');
      }
    });

    it('rejects registration with blocked spam domain (validmail.com)', async () => {
      const result = await registerUserAction(
        'user@validmail.com',
        'password123',
        'Test User',
        true,
        true
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('autorisée');
      }
    });

    it('rejects registration with disposable email domain (mailinator.com)', async () => {
      const result = await registerUserAction(
        'user@mailinator.com',
        'password123',
        'Test User',
        true,
        true
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('autorisée');
      }
    });

    it('rejects registration when rate limit exceeded', async () => {
      vi.mocked(getRateLimiter).mockReturnValue({
        checkLimit: vi.fn().mockResolvedValue({ allowed: false, remainingAttempts: 0, resetInSeconds: 1800 }),
        recordAttempt: vi.fn().mockResolvedValue(undefined),
        resetLimit: vi.fn().mockResolvedValue(undefined),
      } as unknown as InMemoryRateLimiter);

      const result = await registerUserAction(
        'user@protonmail.com',
        'password123',
        'Test User',
        true,
        true
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Trop de tentatives');
      }
    });

    it('requires CAPTCHA when configured', async () => {
      // Reset rate limiter mock to allow
      vi.mocked(getRateLimiter).mockReturnValue({
        checkLimit: vi.fn().mockResolvedValue({ allowed: true, remainingAttempts: 5, resetInSeconds: 3600 }),
        recordAttempt: vi.fn().mockResolvedValue(undefined),
        resetLimit: vi.fn().mockResolvedValue(undefined),
      } as unknown as InMemoryRateLimiter);

      // Enable CAPTCHA verifier
      vi.mocked(getHCaptchaVerifier).mockReturnValue({
        verify: vi.fn().mockResolvedValue({ success: true }),
      } as unknown as HCaptchaVerifier);

      const result = await registerUserAction(
        'user@protonmail.com',
        'password123',
        'Test User',
        true,
        true,
        '', // honeypot
        undefined // no captcha token
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('CAPTCHA');
      }
    });

    it('rejects invalid CAPTCHA token', async () => {
      vi.mocked(getRateLimiter).mockReturnValue({
        checkLimit: vi.fn().mockResolvedValue({ allowed: true, remainingAttempts: 5, resetInSeconds: 3600 }),
        recordAttempt: vi.fn().mockResolvedValue(undefined),
        resetLimit: vi.fn().mockResolvedValue(undefined),
      } as unknown as InMemoryRateLimiter);

      vi.mocked(getHCaptchaVerifier).mockReturnValue({
        verify: vi.fn().mockResolvedValue({ success: false, errorCodes: ['invalid-input-response'] }),
      } as unknown as HCaptchaVerifier);

      const result = await registerUserAction(
        'user@protonmail.com',
        'password123',
        'Test User',
        true,
        true,
        '',
        'invalid-token'
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('CAPTCHA échouée');
      }
    });

    it('accepts valid CAPTCHA token', async () => {
      mockUserRepo.emailExists.mockResolvedValue(false);
      mockUserRepo.create.mockResolvedValue({
        id: 'user-123',
        email: 'user@protonmail.com',
        name: 'Test User',
      });

      vi.mocked(getRateLimiter).mockReturnValue({
        checkLimit: vi.fn().mockResolvedValue({ allowed: true, remainingAttempts: 5, resetInSeconds: 3600 }),
        recordAttempt: vi.fn().mockResolvedValue(undefined),
        resetLimit: vi.fn().mockResolvedValue(undefined),
      } as unknown as InMemoryRateLimiter);

      vi.mocked(getHCaptchaVerifier).mockReturnValue({
        verify: vi.fn().mockResolvedValue({ success: true }),
      } as unknown as HCaptchaVerifier);

      const result = await registerUserAction(
        'user@protonmail.com',
        'password123',
        'Test User',
        true,
        true,
        '',
        'valid-token'
      );

      expect(result.success).toBe(true);
    });
  });

  describe('checkEmailAvailableAction', () => {
    it('returns available for new email', async () => {
      mockUserRepo.emailExists.mockResolvedValue(false);

      const result = await checkEmailAvailableAction('new@protonmail.com');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.available).toBe(true);
      }
    });

    it('returns not available for existing email', async () => {
      mockUserRepo.emailExists.mockResolvedValue(true);

      const result = await checkEmailAvailableAction('existing@protonmail.com');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.available).toBe(false);
      }
    });
  });
});
