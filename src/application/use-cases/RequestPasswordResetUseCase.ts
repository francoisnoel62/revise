// ABOUTME: Use case for requesting a password reset.
// ABOUTME: Generates secure token, stores it, and sends reset email to user.

import { UserRepository } from '@/domain/interfaces/UserRepository';
import { PasswordResetTokenRepository } from '@/domain/interfaces/PasswordResetTokenRepository';
import { EmailService } from '@/domain/interfaces/EmailService';
import { SafeUser } from '@/domain/entities/User';

export interface RequestPasswordResetInput {
  email: string;
}

export interface RequestPasswordResetResult {
  success: boolean;
}

export interface TokenGenerator {
  generate(): string;
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

const TOKEN_EXPIRATION_MS = 60 * 60 * 1000; // 1 hour

export class RequestPasswordResetUseCase {
  constructor(
    private userRepository: Pick<UserRepository, 'findByEmail'>,
    private tokenRepository: Pick<PasswordResetTokenRepository, 'create' | 'invalidateAllForUser'>,
    private emailService: Pick<EmailService, 'sendPasswordResetEmail'>,
    private tokenGenerator: TokenGenerator,
    private appUrl: string
  ) {}

  async execute(input: RequestPasswordResetInput): Promise<RequestPasswordResetResult> {
    // 1. Validate email format
    const email = input.email?.toLowerCase().trim();
    if (!email || !email.includes('@')) {
      throw new ValidationError('Invalid email address');
    }

    // 2. Find user by email
    const user = await this.userRepository.findByEmail(email);

    // 3. If user doesn't exist or is not approved, return success silently
    //    This prevents email enumeration attacks
    if (!user || !user.isApproved) {
      return { success: true };
    }

    // 4. Invalidate any existing tokens for this user
    await this.tokenRepository.invalidateAllForUser(user.id);

    // 5. Generate new secure token
    const token = this.tokenGenerator.generate();
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRATION_MS);

    // 6. Store token
    await this.tokenRepository.create({
      userId: user.id,
      token,
      expiresAt,
    });

    // 7. Build reset link
    const resetLink = `${this.appUrl}/auth/reset-password?token=${token}`;

    // 8. Send email
    const safeUser: SafeUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      isApproved: user.isApproved,
      isAdmin: user.isAdmin,
    };
    await this.emailService.sendPasswordResetEmail(safeUser, resetLink);

    return { success: true };
  }
}
