// ABOUTME: Tests for RegisterUserUseCase.
// ABOUTME: Validates user registration business logic including anti-spam protection.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  RegisterUserUseCase,
  ValidationError,
  EmailAlreadyExistsError,
  BlockedEmailDomainError,
} from './RegisterUserUseCase';

describe('RegisterUserUseCase', () => {
  const mockUserRepo = {
    findByEmail: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    emailExists: vi.fn(),
    approveUser: vi.fn(),
    deleteUser: vi.fn(),
  };

  const mockEmailService = {
    sendRegistrationNotification: vi.fn().mockResolvedValue(undefined),
  };

  let useCase: RegisterUserUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    useCase = new RegisterUserUseCase(mockUserRepo, mockEmailService);
  });

  describe('validation', () => {
    it('throws ValidationError for invalid email', async () => {
      await expect(
        useCase.execute({
          email: 'invalid-email',
          password: 'password123',
          acceptedTerms: true,
          acceptedPrivacy: true,
        })
      ).rejects.toThrow(ValidationError);
    });

    it('throws ValidationError for short password', async () => {
      await expect(
        useCase.execute({
          email: 'user@validmail.com',
          password: 'short',
          acceptedTerms: true,
          acceptedPrivacy: true,
        })
      ).rejects.toThrow(ValidationError);
    });

    it('throws ValidationError when terms not accepted', async () => {
      await expect(
        useCase.execute({
          email: 'user@validmail.com',
          password: 'password123',
          acceptedTerms: false,
          acceptedPrivacy: true,
        })
      ).rejects.toThrow(ValidationError);
    });

    it('throws ValidationError when privacy not accepted', async () => {
      await expect(
        useCase.execute({
          email: 'user@validmail.com',
          password: 'password123',
          acceptedTerms: true,
          acceptedPrivacy: false,
        })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('blocked email domains', () => {
    it('throws BlockedEmailDomainError for example.com', async () => {
      await expect(
        useCase.execute({
          email: 'test@example.com',
          password: 'password123',
          acceptedTerms: true,
          acceptedPrivacy: true,
        })
      ).rejects.toThrow(BlockedEmailDomainError);
    });

    it('throws BlockedEmailDomainError for test.com', async () => {
      await expect(
        useCase.execute({
          email: 'user@test.com',
          password: 'password123',
          acceptedTerms: true,
          acceptedPrivacy: true,
        })
      ).rejects.toThrow(BlockedEmailDomainError);
    });

    it('throws BlockedEmailDomainError for example.org', async () => {
      await expect(
        useCase.execute({
          email: 'user@example.org',
          password: 'password123',
          acceptedTerms: true,
          acceptedPrivacy: true,
        })
      ).rejects.toThrow(BlockedEmailDomainError);
    });

    it('throws BlockedEmailDomainError for localhost', async () => {
      await expect(
        useCase.execute({
          email: 'user@localhost',
          password: 'password123',
          acceptedTerms: true,
          acceptedPrivacy: true,
        })
      ).rejects.toThrow(BlockedEmailDomainError);
    });

    it('accepts valid email domains', async () => {
      mockUserRepo.emailExists.mockResolvedValue(false);
      mockUserRepo.create.mockResolvedValue({
        id: 'user-123',
        email: 'user@gmail.com',
        name: 'Test User',
      });

      const result = await useCase.execute({
        email: 'user@gmail.com',
        password: 'password123',
        acceptedTerms: true,
        acceptedPrivacy: true,
      });

      expect(result.email).toBe('user@gmail.com');
    });
  });

  describe('duplicate email', () => {
    it('throws EmailAlreadyExistsError for existing email', async () => {
      mockUserRepo.emailExists.mockResolvedValue(true);

      await expect(
        useCase.execute({
          email: 'existing@validmail.com',
          password: 'password123',
          acceptedTerms: true,
          acceptedPrivacy: true,
        })
      ).rejects.toThrow(EmailAlreadyExistsError);
    });
  });

  describe('successful registration', () => {
    it('creates user and sends notification email', async () => {
      mockUserRepo.emailExists.mockResolvedValue(false);
      mockUserRepo.create.mockResolvedValue({
        id: 'user-123',
        email: 'user@validmail.com',
        name: 'Test User',
      });

      const result = await useCase.execute({
        email: 'user@validmail.com',
        password: 'password123',
        name: 'Test User',
        acceptedTerms: true,
        acceptedPrivacy: true,
      });

      expect(result.email).toBe('user@validmail.com');
      expect(mockUserRepo.create).toHaveBeenCalledWith({
        email: 'user@validmail.com',
        password: 'password123',
        name: 'Test User',
        acceptedTerms: true,
        acceptedPrivacy: true,
      });
      expect(mockEmailService.sendRegistrationNotification).toHaveBeenCalledWith(result);
    });
  });
});
