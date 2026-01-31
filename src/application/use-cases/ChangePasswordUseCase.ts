// ABOUTME: Use case for changing password for authenticated users.
// ABOUTME: Requires current password verification before allowing change.

import { UserRepository } from '@/domain/interfaces/UserRepository';
import { PasswordResetTokenRepository } from '@/domain/interfaces/PasswordResetTokenRepository';
import { EmailService } from '@/domain/interfaces/EmailService';
import { SafeUser } from '@/domain/entities/User';

export interface ChangePasswordInput {
  userId: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ChangePasswordResult {
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
 * Error thrown when user is not found.
 */
export class UserNotFoundError extends Error {
  constructor() {
    super('User not found');
    this.name = 'UserNotFoundError';
  }
}

/**
 * Error thrown when current password is incorrect.
 */
export class InvalidCurrentPasswordError extends Error {
  constructor() {
    super('Current password is incorrect');
    this.name = 'InvalidCurrentPasswordError';
  }
}

export class ChangePasswordUseCase {
  constructor(
    private userRepository: Pick<UserRepository, 'findById' | 'verifyPassword' | 'hashPassword' | 'updatePassword'>,
    private tokenRepository: Pick<PasswordResetTokenRepository, 'invalidateAllForUser'>,
    private emailService: Pick<EmailService, 'sendPasswordChangedEmail'>
  ) {}

  async execute(input: ChangePasswordInput): Promise<ChangePasswordResult> {
    // 1. Validate input
    if (!input.currentPassword || input.currentPassword.trim() === '') {
      throw new ValidationError('Current password is required');
    }

    // 2. Find user
    const user = await this.userRepository.findById(input.userId);
    if (!user) {
      throw new UserNotFoundError();
    }

    // 3. Verify current password
    const isValidPassword = await this.userRepository.verifyPassword(
      input.currentPassword,
      user.passwordHash
    );
    if (!isValidPassword) {
      throw new InvalidCurrentPasswordError();
    }

    // 4. Validate new password
    if (!input.newPassword || input.newPassword.length < 8) {
      throw new ValidationError('Password must be at least 8 characters');
    }

    if (input.newPassword !== input.confirmPassword) {
      throw new ValidationError('Passwords do not match');
    }

    if (input.newPassword === input.currentPassword) {
      throw new ValidationError('New password must be different from current password');
    }

    // 5. Hash new password
    const newPasswordHash = await this.userRepository.hashPassword(input.newPassword);

    // 6. Update password
    const updated = await this.userRepository.updatePassword(user.id, newPasswordHash);
    if (!updated) {
      throw new Error('Failed to update password');
    }

    // 7. Invalidate all password reset tokens (security)
    await this.tokenRepository.invalidateAllForUser(user.id);

    // 8. Send confirmation email
    const safeUser: SafeUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      isApproved: user.isApproved,
      isAdmin: user.isAdmin,
    };
    await this.emailService.sendPasswordChangedEmail(safeUser);

    return { success: true };
  }
}
