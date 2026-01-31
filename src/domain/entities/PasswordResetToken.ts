// ABOUTME: Entity for password reset tokens.
// ABOUTME: Stores secure tokens with expiration for password reset flow.

/**
 * Password reset token entity.
 * Tokens are single-use and have a limited lifespan.
 */
export interface PasswordResetToken {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  usedAt?: Date;
  createdAt: Date;
}

/**
 * Data required to create a new password reset token.
 */
export interface CreatePasswordResetToken {
  userId: string;
  token: string;
  expiresAt: Date;
}
