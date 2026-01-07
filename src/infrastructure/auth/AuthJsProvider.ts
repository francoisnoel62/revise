// ABOUTME: Auth.js implementation of the AuthProvider interface.
// ABOUTME: Extracts user identity from JWT session for Server Actions.

import { AuthProvider, UserSession, UnauthorizedError } from '@/domain/interfaces/AuthProvider';
import { auth } from './auth-config';

/**
 * Auth.js implementation of AuthProvider.
 * Uses JWT session strategy - no database required for sessions.
 */
export class AuthJsProvider implements AuthProvider {
  /**
   * Get current user's ID from JWT session.
   * @throws UnauthorizedError if no active session
   */
  async getUserId(): Promise<string> {
    const session = await auth();

    if (!session?.user?.id) {
      throw new UnauthorizedError();
    }

    return session.user.id;
  }

  /**
   * Check if user has active session.
   */
  async isAuthenticated(): Promise<boolean> {
    const session = await auth();
    return !!session?.user?.id;
  }

  /**
   * Get full session data.
   * @returns UserSession if authenticated, null otherwise
   */
  async getSession(): Promise<UserSession | null> {
    const session = await auth();

    if (!session?.user) {
      return null;
    }

    return {
      userId: session.user.id,
      email: session.user.email ?? '',
      name: session.user.name ?? undefined,
    };
  }
}
