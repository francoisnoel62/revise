// ABOUTME: Server Actions for user authentication.
// ABOUTME: Handles registration and auth-related operations.

'use server';

import { getUserRepository } from '@/infrastructure/config/providers';
import { SafeUser } from '@/domain/entities/User';
import { ActionResult } from './utils';

/**
 * Register a new user.
 */
export async function registerUserAction(
  email: string,
  password: string,
  name?: string
): Promise<ActionResult<SafeUser>> {
  try {
    // Validate input
    if (!email || !email.includes('@')) {
      return { success: false, error: 'Invalid email address' };
    }

    if (!password || password.length < 8) {
      return { success: false, error: 'Password must be at least 8 characters' };
    }

    const userRepo = await getUserRepository();

    // Check if email exists
    if (await userRepo.emailExists(email)) {
      return { success: false, error: 'Email already registered' };
    }

    // Create user
    const user = await userRepo.create({
      email,
      password,
      name,
    });

    return { success: true, data: user };
  } catch (error) {
    console.error('Registration error:', error);
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
    const userRepo = await getUserRepository();
    const exists = await userRepo.emailExists(email);
    return { success: true, data: { available: !exists } };
  } catch {
    return { success: false, error: 'Unable to check email' };
  }
}
