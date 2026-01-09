// ABOUTME: Server Actions for user authentication.
// ABOUTME: Delegates to Application layer Use Cases for business logic.

'use server';

import { RegisterUserUseCase, EmailAlreadyExistsError } from '@/application/use-cases/RegisterUserUseCase';
import { SafeUser } from '@/domain/entities/User';
import { ActionResult, getUserRepo } from './utils';

/**
 * Register a new user.
 * Delegates to RegisterUserUseCase for business logic.
 */
export async function registerUserAction(
  email: string,
  password: string,
  name?: string
): Promise<ActionResult<SafeUser>> {
  try {
    const useCase = new RegisterUserUseCase(await getUserRepo());

    const user = await useCase.execute({
      email,
      password,
      name,
    });

    return { success: true, data: user };
  } catch (error) {
    console.error('Registration error:', error);

    if (error instanceof EmailAlreadyExistsError) {
      return { success: false, error: 'Email already registered' };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Registration failed',
    };
  }
}

/**
 * Check if email is available.
 */
export async function checkEmailAvailableAction(
  email: string
): Promise<ActionResult<{ available: boolean }>> {
  try {
    const userRepo = await getUserRepo();
    const exists = await userRepo.emailExists(email);
    return { success: true, data: { available: !exists } };
  } catch {
    return { success: false, error: 'Unable to check email' };
  }
}
