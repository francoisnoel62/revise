// ABOUTME: Unit tests for AuthJsProvider implementation.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthJsProvider } from './AuthJsProvider';
import { UnauthorizedError } from '@/domain/interfaces/AuthProvider';

// Mock the auth function from auth-config
vi.mock('./auth-config', () => ({
  auth: vi.fn(),
}));

import { auth } from './auth-config';

describe('AuthJsProvider', () => {
  let provider: AuthJsProvider;

  beforeEach(() => {
    provider = new AuthJsProvider();
    vi.clearAllMocks();
  });

  describe('getUserId', () => {
    it('returns user ID when authenticated', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (auth as any).mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
        expires: new Date().toISOString(),
      });

      const userId = await provider.getUserId();

      expect(userId).toBe('user-123');
    });

    it('throws UnauthorizedError when not authenticated', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (auth as any).mockResolvedValue(null);

      await expect(provider.getUserId()).rejects.toThrow(UnauthorizedError);
    });

    it('throws UnauthorizedError when session has no user', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (auth as any).mockResolvedValue({
        expires: new Date().toISOString(),
      });

      await expect(provider.getUserId()).rejects.toThrow(UnauthorizedError);
    });
  });

  describe('isAuthenticated', () => {
    it('returns true when authenticated', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (auth as any).mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
        expires: new Date().toISOString(),
      });

      const result = await provider.isAuthenticated();

      expect(result).toBe(true);
    });

    it('returns false when not authenticated', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (auth as any).mockResolvedValue(null);

      const result = await provider.isAuthenticated();

      expect(result).toBe(false);
    });
  });

  describe('getSession', () => {
    it('returns UserSession when authenticated', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (auth as any).mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com', name: 'Test User' },
        expires: new Date().toISOString(),
      });

      const session = await provider.getSession();

      expect(session).toEqual({
        userId: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
      });
    });

    it('returns null when not authenticated', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (auth as any).mockResolvedValue(null);

      const session = await provider.getSession();

      expect(session).toBeNull();
    });
  });
});
