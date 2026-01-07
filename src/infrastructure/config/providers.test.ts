// ABOUTME: Unit tests for provider factory functions.

import { describe, it, expect, vi } from 'vitest';

// Mock Auth.js to avoid module resolution issues in tests
vi.mock('next-auth', () => ({
  default: vi.fn(),
}));

vi.mock('next-auth/providers/credentials', () => ({
  default: vi.fn(),
}));

vi.mock('@/infrastructure/auth/auth-config', () => ({
  auth: vi.fn(),
}));

import { getAuthProvider, getProjectRepository } from './providers';
import { AuthJsProvider } from '@/infrastructure/auth/AuthJsProvider';
import { InMemoryProjectRepository } from '@/infrastructure/persistence/InMemoryProjectRepository';

describe('providers', () => {
  describe('getAuthProvider', () => {
    it('returns AuthJsProvider instance', () => {
      const provider = getAuthProvider();

      expect(provider).toBeInstanceOf(AuthJsProvider);
    });
  });

  describe('getProjectRepository', () => {
    it('returns InMemoryProjectRepository instance (Phase 3.0)', async () => {
      const repository = await getProjectRepository();

      expect(repository).toBeInstanceOf(InMemoryProjectRepository);
    });
  });
});
