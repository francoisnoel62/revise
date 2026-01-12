// ABOUTME: Interface for sending emails.
// ABOUTME: Abstracts email delivery for notifications like user approval requests.

import { SafeUser } from '../entities/User';

export interface RegistrationNotification {
  user: SafeUser;
  approveUrl: string;
  rejectUrl: string;
}

export interface EmailService {
  /**
   * Send notification to admin when a new user registers.
   * Contains approve/reject links for the admin to act on.
   */
  sendRegistrationNotification(notification: RegistrationNotification): Promise<void>;
}
