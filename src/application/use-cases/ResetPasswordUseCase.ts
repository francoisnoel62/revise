// ABOUTME: Use case for resetting a user's password with a valid token.
// ABOUTME: Validates token, updates password, invalidates token, and sends confirmation email.

import { UserRepository } from '@/domain/interfaces/UserRepository';
import { PasswordResetTokenRepository } from '@/domain/interfaces/PasswordResetTokenRepository';
import { EmailService } from '@/domain/interfaces/EmailService';
import { SafeUser } from '@/domain/entities/User';

export interface ResetPasswordInput {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ResetPasswordResult {
  success: boolean;
}

/**
 * Error thrown when input validation fails.
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Error thrown when token is invalid or not found.
 */
export class InvalidTokenError extends Error {
  constructor() {
    super('Invalid or expired reset token');
    this.name = 'InvalidTokenError';
  }
}

/**
 * Error thrown when token has expired.
 */
export class ExpiredTokenError extends Error {
  constructor() {
    super('Reset token has expired');
    this.name = 'ExpiredTokenError';
  }
}

export class ResetPasswordUseCase {
  constructor(
    private userRepository: Pick<UserRepository, 'findById' | 'updatePassword' | 'hashPassword'>,
    private tokenRepository: Pick<PasswordResetTokenRepository, 'findValidToken' | 'markAsUsed' | 'invalidateAllForUser'>,
    private emailService: Pick<EmailService, 'sendPasswordChangedEmail'>
  ) {}

  async execute(input: ResetPasswordInput): Promise<ResetPasswordResult> {
    // 1. Validate input
    if (!input.token || input.token.trim() === '') {
      throw new ValidationError('Token is required');
    }

    // 2. Find and validate token
    const resetToken = await this.tokenRepository.findValidToken(input.token);
    if (!resetToken) {
      throw new InvalidTokenError();
    }

    // 3. Validate password
    if (!input.newPassword || input.newPassword.length < 8) {
      throw new ValidationError('Password must be at least 8 characters');
    }

    if (input.newPassword !== input.confirmPassword) {
      throw new ValidationError('Passwords do not match');
    }

    // 4. Find user
    const user = await this.userRepository.findById(resetToken.userId);
    if (!user) {
      throw new InvalidTokenError();
    }

    // 5. Hash new password
    const newPasswordHash = await this.userRepository.hashPassword(input.newPassword);

    // 6. Update password
    const updated = await this.userRepository.updatePassword(user.id, newPasswordHash);
    if (!updated) {
      throw new Error('Failed to update password');
    }

    // 7. Mark token as used
    await this.tokenRepository.markAsUsed(resetToken.id);

    // 8. Invalidate all remaining tokens for user (security)
    await this.tokenRepository.invalidateAllForUser(user.id);

    // 9. Send confirmation email (best effort - don't fail if email fails)
    const safeUser: SafeUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      isApproved: user.isApproved,
      isAdmin: user.isAdmin,
    };

    try {
      await this.emailService.sendPasswordChangedEmail(safeUser);
    } catch (emailError) {
      // Log but don't fail - password was already reset successfully
      console.error('Failed to send password changed email:', emailError);
    }

    return { success: true };
  }
}
