// ABOUTME: Server actions for password management.
// ABOUTME: Handles password reset requests, password resets, and password changes.

'use server';

import { getDatabase } from '@/infrastructure/config/database';
import { MongoDBUserRepository } from '@/infrastructure/persistence/MongoDBUserRepository';
import { MongoDBPasswordResetTokenRepository } from '@/infrastructure/persistence/MongoDBPasswordResetTokenRepository';
import { ResendEmailService } from '@/infrastructure/email/ResendEmailService';
import { SecureTokenGenerator } from '@/infrastructure/auth/SecureTokenGenerator';
import { RequestPasswordResetUseCase } from '@/application/use-cases/RequestPasswordResetUseCase';
import { ResetPasswordUseCase, InvalidTokenError } from '@/application/use-cases/ResetPasswordUseCase';
import { ChangePasswordUseCase, UserNotFoundError, InvalidCurrentPasswordError } from '@/application/use-cases/ChangePasswordUseCase';
import { auth } from '@/infrastructure/auth/auth-config';
import { config } from '@/infrastructure/config/env';

interface ActionResult {
  success: boolean;
  error?: string;
}

/**
 * Request a password reset email.
 */
export async function requestPasswordResetAction(email: string): Promise<ActionResult> {
  try {
    const db = await getDatabase();
    const userRepository = new MongoDBUserRepository(db);
    const tokenRepository = new MongoDBPasswordResetTokenRepository(db);
    const emailService = new ResendEmailService();
    const tokenGenerator = new SecureTokenGenerator();

    const useCase = new RequestPasswordResetUseCase(
      userRepository,
      tokenRepository,
      emailService,
      tokenGenerator,
      config.app.baseUrl
    );

    await useCase.execute({ email });

    return { success: true };
  } catch (error) {
    console.error('Password reset request error:', error);
    // Always return success to prevent email enumeration
    return { success: true };
  }
}

/**
 * Reset password using a valid token.
 */
export async function resetPasswordAction(
  token: string,
  newPassword: string,
  confirmPassword: string
): Promise<ActionResult> {
  try {
    const db = await getDatabase();
    const userRepository = new MongoDBUserRepository(db);
    const tokenRepository = new MongoDBPasswordResetTokenRepository(db);
    const emailService = new ResendEmailService();

    const useCase = new ResetPasswordUseCase(
      userRepository,
      tokenRepository,
      emailService
    );

    await useCase.execute({ token, newPassword, confirmPassword });

    return { success: true };
  } catch (error) {
    console.error('Password reset error:', error);

    if (error instanceof InvalidTokenError) {
      return { success: false, error: 'Le lien de réinitialisation est invalide ou a expiré.' };
    }

    if (error instanceof Error) {
      if (error.message.includes('Password must be')) {
        return { success: false, error: 'Le mot de passe doit contenir au moins 8 caractères.' };
      }
      if (error.message.includes('Passwords do not match')) {
        return { success: false, error: 'Les mots de passe ne correspondent pas.' };
      }
    }

    return { success: false, error: 'Une erreur est survenue. Veuillez réessayer.' };
  }
}

/**
 * Change password for authenticated user.
 */
export async function changePasswordAction(
  currentPassword: string,
  newPassword: string,
  confirmPassword: string
): Promise<ActionResult> {
  try {
    // Get current user from session
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Vous devez être connecté pour modifier votre mot de passe.' };
    }

    const db = await getDatabase();
    const userRepository = new MongoDBUserRepository(db);
    const tokenRepository = new MongoDBPasswordResetTokenRepository(db);
    const emailService = new ResendEmailService();

    const useCase = new ChangePasswordUseCase(
      userRepository,
      tokenRepository,
      emailService
    );

    await useCase.execute({
      userId: session.user.id,
      currentPassword,
      newPassword,
      confirmPassword,
    });

    return { success: true };
  } catch (error) {
    console.error('Password change error:', error);

    if (error instanceof UserNotFoundError) {
      return { success: false, error: 'Utilisateur non trouvé.' };
    }

    if (error instanceof InvalidCurrentPasswordError) {
      return { success: false, error: 'Le mot de passe actuel est incorrect.' };
    }

    if (error instanceof Error) {
      if (error.message.includes('Password must be')) {
        return { success: false, error: 'Le nouveau mot de passe doit contenir au moins 8 caractères.' };
      }
      if (error.message.includes('Passwords do not match')) {
        return { success: false, error: 'Les mots de passe ne correspondent pas.' };
      }
      if (error.message.includes('must be different')) {
        return { success: false, error: 'Le nouveau mot de passe doit être différent de l\'actuel.' };
      }
    }

    return { success: false, error: 'Une erreur est survenue. Veuillez réessayer.' };
  }
}
