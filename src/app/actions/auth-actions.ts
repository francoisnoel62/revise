// ABOUTME: Server Actions for user authentication.
// ABOUTME: Delegates to Application layer Use Cases for business logic.

'use server';

import { RegisterUserUseCase, EmailAlreadyExistsError } from '@/application/use-cases/RegisterUserUseCase';
import {
  DeleteUserAccountUseCase,
  UserNotFoundError,
  EmailMismatchError,
  DeleteUserAccountResult,
} from '@/application/use-cases/DeleteUserAccountUseCase';
import { SafeUser } from '@/domain/entities/User';
import {
  ActionResult,
  getUserRepo,
  getEmailService,
  getAuthenticatedUserId,
  getRepository,
  getProviderRepo,
  getMetadataRepo,
  getCorrectionHistoryRepo,
} from './utils';

/**
 * Register a new user.
 * Delegates to RegisterUserUseCase for business logic.
 * Stores consent timestamps for RGPD compliance.
 */
export async function registerUserAction(
  email: string,
  password: string,
  name: string | undefined,
  acceptedTerms: boolean,
  acceptedPrivacy: boolean
): Promise<ActionResult<SafeUser>> {
  try {
    const emailService = await getEmailService();
    const useCase = new RegisterUserUseCase(await getUserRepo(), emailService);

    const user = await useCase.execute({
      email,
      password,
      name,
      acceptedTerms,
      acceptedPrivacy,
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

/**
 * Delete user account and all associated data.
 * RGPD right to erasure (Article 17).
 * Requires email confirmation as security measure.
 */
export async function deleteAccountAction(
  confirmEmail: string
): Promise<ActionResult<DeleteUserAccountResult>> {
  try {
    // Verify authentication
    const auth = await getAuthenticatedUserId();
    if ('error' in auth) {
      return auth.error;
    }

    // Get all repositories
    const userRepo = await getUserRepo();
    const projectRepo = await getRepository();
    const providerRepo = await getProviderRepo();
    const metadataRepo = await getMetadataRepo();
    const correctionHistoryRepo = await getCorrectionHistoryRepo();

    // Execute deletion
    const useCase = new DeleteUserAccountUseCase(
      userRepo,
      projectRepo,
      providerRepo,
      metadataRepo,
      correctionHistoryRepo
    );

    const result = await useCase.execute({
      userId: auth.userId,
      confirmEmail,
    });

    return { success: true, data: result };
  } catch (error) {
    console.error('Account deletion error:', error);

    if (error instanceof UserNotFoundError) {
      return { success: false, error: 'Utilisateur non trouvé' };
    }

    if (error instanceof EmailMismatchError) {
      return { success: false, error: 'L\'email de confirmation ne correspond pas' };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'La suppression du compte a échoué',
    };
  }
}
