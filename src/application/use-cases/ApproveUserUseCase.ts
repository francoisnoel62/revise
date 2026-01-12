// ABOUTME: Use case for approving or rejecting user registrations.
// ABOUTME: Validates token and updates user approval status.

import { createHmac } from 'node:crypto';
import { UserRepository } from '@/domain/interfaces/UserRepository';
import { config } from '@/infrastructure/config/env';

export type ApprovalAction = 'approve' | 'reject';

export interface ApproveUserInput {
  userId: string;
  token: string;
  action: ApprovalAction;
}

export interface ApproveUserResult {
  success: boolean;
  action: ApprovalAction;
  userEmail?: string;
}

export class InvalidTokenError extends Error {
  constructor() {
    super('Invalid or expired approval token');
    this.name = 'InvalidTokenError';
  }
}

export class UserNotFoundError extends Error {
  constructor(userId: string) {
    super(`User not found: ${userId}`);
    this.name = 'UserNotFoundError';
  }
}

export class ApproveUserUseCase {
  constructor(private userRepository: UserRepository) {}

  async execute(input: ApproveUserInput): Promise<ApproveUserResult> {
    const { userId, token, action } = input;

    // Validate token
    const expectedToken = ApproveUserUseCase.generateToken(userId);
    if (token !== expectedToken) {
      throw new InvalidTokenError();
    }

    // Get user to return email in result
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundError(userId);
    }

    if (action === 'approve') {
      await this.userRepository.approveUser(userId);
    } else {
      await this.userRepository.deleteUser(userId);
    }

    return {
      success: true,
      action,
      userEmail: user.email,
    };
  }

  /**
   * Generate a secure token for a user ID.
   * Uses HMAC-SHA256 with AUTH_SECRET as the key.
   */
  static generateToken(userId: string): string {
    const secret = config.auth.secret;
    if (!secret) {
      throw new Error('AUTH_SECRET is required for token generation');
    }
    return createHmac('sha256', secret).update(userId).digest('hex').slice(0, 32);
  }
}
