// ABOUTME: Interface for sending emails.
// ABOUTME: Abstracts email delivery for notifications like user approval requests and sync reports.

import { SafeUser } from '../entities/User';
import { PricingProvider } from './ModelPricingRepository';

/** USD per million token rates for a single model at a point in time. */
export interface PriceSnapshot {
  inputPerM: number;
  outputPerM: number;
  cachedInputPerM: number;
}

/**
 * A model whose pricing changed during a sync.
 * `previous` is null for a newly added model, set for an updated one.
 */
export interface ModelPriceChange {
  /** "provider/prefix" identifier, e.g. "anthropic/claude-opus-4" */
  key: string;
  provider: PricingProvider;
  prefix: string;
  previous: PriceSnapshot | null;
  current: PriceSnapshot;
}

export interface PricingSyncReport {
  newModels: ModelPriceChange[];
  updatedModels: ModelPriceChange[];
  /** Price swings held back for manual validation (not applied to the database). */
  pendingVariations: ModelPriceChange[];
  totalModels: number;
  syncedAt: Date;
  errors: string[];
}

export interface EmailService {
  /**
   * Send notification to admin when a new user registers.
   * The implementation is responsible for generating approval/rejection links.
   */
  sendRegistrationNotification(user: SafeUser): Promise<void>;

  /**
   * Send welcome email to user when their account is approved.
   */
  sendWelcomeEmail(user: SafeUser): Promise<void>;

  /**
   * Send password reset email with reset link.
   */
  sendPasswordResetEmail(user: SafeUser, resetLink: string): Promise<void>;

  /**
   * Send confirmation email after password has been changed.
   */
  sendPasswordChangedEmail(user: SafeUser): Promise<void>;

  /**
   * Send a pricing sync report to the admin after a model pricing synchronization.
   */
  sendPricingSyncReport(report: PricingSyncReport): Promise<void>;
}
