// ABOUTME: Interface for sending emails.
// ABOUTME: Abstracts email delivery for notifications like user approval requests.

import { SafeUser } from '../entities/User';

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
}
