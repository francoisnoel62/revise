// ABOUTME: Server Actions for user authentication.
// ABOUTME: Delegates to Application layer Use Cases for business logic.

'use server';

import { headers } from 'next/headers';
import { RegisterUserUseCase, EmailAlreadyExistsError, BlockedEmailDomainError } from '@/application/use-cases/RegisterUserUseCase';
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
  getProjectSettingsRepo,
  getWordCountSnapshotRepo,
} from './utils';
import { getRateLimiter } from '@/infrastructure/security/InMemoryRateLimiter';
import { getHCaptchaVerifier } from '@/infrastructure/security/HCaptchaVerifier';

/**
 * Get client IP address from headers.
 * Checks multiple headers in priority order to support various hosting providers.
 */
async function getClientIp(): Promise<string> {
  const headersList = await headers();

  // Vercel-specific header (highest priority for Vercel deployments)
  const vercelForwardedFor = headersList.get('x-vercel-forwarded-for');
  if (vercelForwardedFor) {
    return vercelForwardedFor.split(',')[0].trim();
  }

  // Standard proxy headers
  const forwardedFor = headersList.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = headersList.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Cloudflare header
  const cfConnectingIp = headersList.get('cf-connecting-ip');
  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  return 'unknown';
}

/**
 * Register a new user.
 * Delegates to RegisterUserUseCase for business logic.
 * Stores consent timestamps for RGPD compliance.
 * Includes rate limiting and CAPTCHA verification for spam protection.
 */
export async function registerUserAction(
  email: string,
  password: string,
  name: string | undefined,
  acceptedTerms: boolean,
  acceptedPrivacy: boolean,
  honeypot?: string,
  captchaToken?: string
): Promise<ActionResult<SafeUser>> {
  try {
    // Anti-spam: reject if honeypot field is filled (bots fill all fields)
    if (honeypot) {
      return { success: false, error: 'Registration failed' };
    }

    const clientIp = await getClientIp();

    // Rate limiting check
    const rateLimiter = getRateLimiter();
    const rateLimit = await rateLimiter.checkLimit(clientIp, 'registration');
    if (!rateLimit.allowed) {
      return {
        success: false,
        error: `Trop de tentatives. Réessayez dans ${Math.ceil(rateLimit.resetInSeconds / 60)} minutes.`,
      };
    }

    // CAPTCHA verification (if configured)
    const captchaVerifier = getHCaptchaVerifier();
    if (captchaVerifier) {
      if (!captchaToken) {
        return { success: false, error: 'Veuillez compléter le CAPTCHA' };
      }

      const captchaResult = await captchaVerifier.verify(captchaToken, clientIp);
      if (!captchaResult.success) {
        return { success: false, error: 'Vérification CAPTCHA échouée. Veuillez réessayer.' };
      }
    }

    // Record the attempt for rate limiting
    await rateLimiter.recordAttempt(clientIp, 'registration');

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

    if (error instanceof BlockedEmailDomainError) {
      return { success: false, error: error.message };
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
    const projectSettingsRepo = await getProjectSettingsRepo();
    const wordCountSnapshotRepo = await getWordCountSnapshotRepo();

    // Execute deletion
    const useCase = new DeleteUserAccountUseCase(
      userRepo,
      projectRepo,
      providerRepo,
      metadataRepo,
      correctionHistoryRepo,
      projectSettingsRepo,
      wordCountSnapshotRepo
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
