// ABOUTME: Repository interface for password reset token persistence.
// ABOUTME: Handles creation, validation, and invalidation of reset tokens.

import { PasswordResetToken, CreatePasswordResetToken } from '../entities/PasswordResetToken';

export interface PasswordResetTokenRepository {
  /**
   * Create a new password reset token.
   * Should invalidate any existing tokens for the same user.
   */
  create(data: CreatePasswordResetToken): Promise<PasswordResetToken>;

  /**
   * Find a valid (not expired, not used) token by its value.
   * Returns null if token doesn't exist, is expired, or already used.
   */
  findValidToken(token: string): Promise<PasswordResetToken | null>;

  /**
   * Mark a token as used.
   * @returns true if token was marked, false if not found
   */
  markAsUsed(tokenId: string): Promise<boolean>;

  /**
   * Invalidate all tokens for a user.
   * Used when a new token is created or password is changed.
   */
  invalidateAllForUser(userId: string): Promise<void>;

  /**
   * Delete expired tokens (cleanup).
   */
  deleteExpired(): Promise<number>;
}
