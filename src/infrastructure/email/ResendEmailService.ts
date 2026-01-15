// ABOUTME: Resend implementation of EmailService.
// ABOUTME: Sends registration approval emails to admin with secure links.

import { Resend } from 'resend';
import { EmailService } from '@/domain/interfaces/EmailService';
import { SafeUser } from '@/domain/entities/User';
import { config } from '../config/env';
import { HMACApprovalTokenGenerator } from '../auth/HMACApprovalTokenGenerator';

export class ResendEmailService implements EmailService {
  private resend: Resend;
  private adminEmail: string;
  private fromEmail: string;
  private tokenGenerator: HMACApprovalTokenGenerator;
  private baseUrl: string;

  constructor() {
    if (!config.email.resendApiKey) {
      throw new Error('RESEND_API_KEY is required for email service');
    }
    if (!config.email.adminEmail) {
      throw new Error('ADMIN_EMAIL is required for email service');
    }

    this.resend = new Resend(config.email.resendApiKey);
    this.adminEmail = config.email.adminEmail;
    this.fromEmail = config.email.fromEmail;
    this.tokenGenerator = new HMACApprovalTokenGenerator(config.auth.secret);
    this.baseUrl = config.app.baseUrl;
  }

  async sendRegistrationNotification(user: SafeUser): Promise<void> {
    const token = this.tokenGenerator.generateToken(user.id);
    const approveUrl = `${this.baseUrl}/api/approve?userId=${user.id}&token=${token}&action=approve`;
    const rejectUrl = `${this.baseUrl}/api/approve?userId=${user.id}&token=${token}&action=reject`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    h1 { color: #1a1a1a; font-size: 24px; }
    .info { background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0; }
    .info p { margin: 5px 0; }
    .buttons { margin: 30px 0; }
    .btn { display: inline-block; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; margin-right: 10px; }
    .btn-approve { background: #22c55e; color: white; }
    .btn-reject { background: #ef4444; color: white; }
    .footer { color: #666; font-size: 14px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Nouvelle inscription sur Revise</h1>

    <div class="info">
      <p><strong>Email:</strong> ${user.email}</p>
      <p><strong>Nom:</strong> ${user.name || 'Non renseigne'}</p>
      <p><strong>Date:</strong> ${new Date().toLocaleDateString('fr-FR', { dateStyle: 'full' })}</p>
    </div>

    <div class="buttons">
      <a href="${approveUrl}" class="btn btn-approve">Approuver</a>
      <a href="${rejectUrl}" class="btn btn-reject">Rejeter</a>
    </div>

    <p class="footer">
      Cet utilisateur ne pourra pas se connecter tant que vous n'aurez pas approuve son inscription.
    </p>
  </div>
</body>
</html>
    `.trim();

    const text = `
Nouvelle inscription sur Revise

Email: ${user.email}
Nom: ${user.name || 'Non renseigne'}
Date: ${new Date().toLocaleDateString('fr-FR', { dateStyle: 'full' })}

Pour approuver: ${approveUrl}
Pour rejeter: ${rejectUrl}

Cet utilisateur ne pourra pas se connecter tant que vous n'aurez pas approuve son inscription.
    `.trim();

    await this.resend.emails.send({
      from: this.fromEmail,
      to: this.adminEmail,
      subject: `[Revise] Nouvelle inscription: ${user.email}`,
      html,
      text,
    });
  }
}
