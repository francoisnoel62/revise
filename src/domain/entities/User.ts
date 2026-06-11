// ABOUTME: User entity for authentication.
// ABOUTME: Stores credentials and basic profile information.

/**
 * User entity for authentication.
 * Passwords are hashed before storage - never store plain text.
 */
/** Default retention window (days) for captured AI exchange content. */
export const DEFAULT_AI_EXCHANGE_RETENTION_DAYS = 30;

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name?: string;
  isApproved: boolean;
  isAdmin: boolean;
  approvedAt?: Date;
  termsAcceptedAt?: Date;
  privacyAcceptedAt?: Date;
  /** Opt-in: persist the real content of AI exchanges (transparency ledger). */
  aiExchangeLoggingEnabled: boolean;
  /** Retention window in days before captured exchanges are auto-purged. */
  aiExchangeRetentionDays: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User data for registration (password not yet hashed).
 */
export interface UserRegistration {
  email: string;
  password: string;
  name?: string;
  acceptedTerms: boolean;
  acceptedPrivacy: boolean;
}

/**
 * User data safe for client exposure (no password).
 */
export interface SafeUser {
  id: string;
  email: string;
  name?: string;
  isApproved: boolean;
  isAdmin: boolean;
}
