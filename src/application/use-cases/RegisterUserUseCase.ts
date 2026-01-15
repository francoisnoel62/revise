// ABOUTME: Use case for registering a new user.
// ABOUTME: Handles user creation, validation, and admin notification email.

import { UserRepository, SafeUser } from '@/domain/interfaces/UserRepository';
import { EmailService } from '@/domain/interfaces/EmailService';

export interface RegisterUserInput {
  email: string;
  password: string;
  name?: string;
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
 * Error thrown when attempting to register with an email that already exists.
 */
export class EmailAlreadyExistsError extends Error {
  constructor(email: string) {
    super(`Email already registered: ${email}`);
    this.name = 'EmailAlreadyExistsError';
  }
}

export class RegisterUserUseCase {
  constructor(
    private userRepository: UserRepository,
    private emailService?: EmailService
  ) {}

  async execute(input: RegisterUserInput): Promise<SafeUser> {
    // 1. Validate input
    this.validateInput(input);

    // 2. Check if email already exists
    if (await this.userRepository.emailExists(input.email)) {
      throw new EmailAlreadyExistsError(input.email);
    }

    // 3. Create user (with isApproved=false)
    const user = await this.userRepository.create({
      email: input.email,
      password: input.password,
      name: input.name,
    });

    // 4. Send notification email to admin
    if (this.emailService) {
      await this.emailService.sendRegistrationNotification(user);
    }

    return user;
  }

  private validateInput(input: RegisterUserInput): void {
    // Validate email format
    if (!input.email || !input.email.includes('@')) {
      throw new ValidationError('Invalid email address');
    }

    // Validate password length
    if (!input.password || input.password.length < 8) {
      throw new ValidationError('Password must be at least 8 characters');
    }
  }
}
