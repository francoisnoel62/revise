// ABOUTME: Use case for approving or rejecting user registrations.
// ABOUTME: Validates token and updates user approval status.

import { UserRepository } from '@/domain/interfaces/UserRepository';
import { ApprovalTokenGenerator } from '@/domain/interfaces/ApprovalTokenGenerator';

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
  constructor(
    private userRepository: UserRepository,
    private tokenGenerator: ApprovalTokenGenerator
  ) {}

  async execute(input: ApproveUserInput): Promise<ApproveUserResult> {
    const { userId, token, action } = input;

    // Validate token
    if (!this.tokenGenerator.verifyToken(userId, token)) {
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
}
