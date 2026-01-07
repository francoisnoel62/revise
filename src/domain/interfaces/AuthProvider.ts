// ABOUTME: Defines the authentication abstraction interface.
// ABOUTME: Implementations include AuthJsProvider, with future support for Clerk, Better Auth, etc.

/**
 * User session data returned by authentication providers.
 */
export interface UserSession {
  userId: string;
  email: string;
  name?: string;
}

/**
 * Authentication provider interface.
 * Abstracts authentication framework (Auth.js, Clerk, Better Auth, etc.)
 * to maintain Clean Architecture boundaries.
 */
export interface AuthProvider {
  /**
   * Get the current authenticated user's ID.
   * @throws UnauthorizedError if no active session
   */
  getUserId(): Promise<string>;

  /**
   * Check if there is an active authenticated session.
   */
  isAuthenticated(): Promise<boolean>;

  /**
   * Get full session data for the current user.
   * @returns UserSession if authenticated, null otherwise
   */
  getSession(): Promise<UserSession | null>;
}

/**
 * Error thrown when an operation requires authentication
 * but no valid session exists.
 */
export class UnauthorizedError extends Error {
  constructor(message = 'Unauthorized: No active session') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}
