// ABOUTME: Interface for sending emails.
// ABOUTME: Abstracts email delivery for notifications like user approval requests and sync reports.

import { SafeUser } from '../entities/User';

export interface PricingSyncReport {
  newModels: string[];
  updatedModels: string[];
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
