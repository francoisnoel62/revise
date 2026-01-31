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
      <p><strong>Nom:</strong> ${user.name || 'Non renseigné'}</p>
      <p><strong>Date:</strong> ${new Date().toLocaleDateString('fr-FR', { dateStyle: 'full' })}</p>
    </div>

    <div class="buttons">
      <a href="${approveUrl}" class="btn btn-approve">Approuver</a>
      <a href="${rejectUrl}" class="btn btn-reject">Rejeter</a>
    </div>

    <p class="footer">
      Cet utilisateur ne pourra pas se connecter tant que vous n'aurez pas approuvé son inscription.
    </p>
  </div>
</body>
</html>
    `.trim();

    const text = `
Nouvelle inscription sur Revise

Email: ${user.email}
Nom: ${user.name || 'Non renseigné'}
Date: ${new Date().toLocaleDateString('fr-FR', { dateStyle: 'full' })}

Pour approuver: ${approveUrl}
Pour rejeter: ${rejectUrl}

Cet utilisateur ne pourra pas se connecter tant que vous n'aurez pas approuvé son inscription.
    `.trim();

    await this.resend.emails.send({
      from: this.fromEmail,
      to: this.adminEmail,
      subject: `[Revise] Nouvelle inscription: ${user.email}`,
      html,
      text,
    });
  }

  async sendWelcomeEmail(user: SafeUser): Promise<void> {
    const loginUrl = `${this.baseUrl}/auth/signin`;
    const featuresUrl = `${this.baseUrl}/features`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #0a0a0a;
      background: #fafafa;
      padding: 40px 20px;
    }
    .email-wrapper {
      max-width: 680px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid #e5e5e5;
    }
    .header {
      padding: 60px 40px 50px;
      text-align: center;
      background: white;
      position: relative;
    }
    .logo {
      font-size: 24px;
      font-weight: 700;
      color: #0a0a0a;
      margin-bottom: 16px;
      letter-spacing: -0.02em;
    }
    .tagline {
      font-size: 13px;
      color: #a3a3a3;
      margin-bottom: 40px;
      font-weight: 400;
    }
    .wave-emoji {
      font-size: 48px;
      display: inline-block;
      margin-bottom: 20px;
    }
    h1 {
      font-size: 36px;
      font-weight: 700;
      margin-bottom: 16px;
      line-height: 1.2;
      letter-spacing: -0.02em;
      color: #0a0a0a;
    }
    .subtitle {
      font-size: 17px;
      color: #737373;
      font-weight: 400;
      line-height: 1.6;
      max-width: 520px;
      margin: 0 auto;
    }
    .content {
      padding: 40px;
      border-top: 1px solid #f0f0f0;
    }
    .welcome-message {
      font-size: 16px;
      color: #525252;
      margin-bottom: 32px;
      line-height: 1.6;
    }
    .welcome-message strong {
      color: #0a0a0a;
      font-weight: 600;
    }
    .feature-grid {
      display: grid;
      gap: 12px;
      margin: 32px 0;
    }
    .feature-item {
      display: flex;
      align-items: start;
      gap: 14px;
      padding: 20px;
      background: #fafafa;
      border-radius: 10px;
      border: 1px solid #f0f0f0;
    }
    .feature-icon {
      width: 44px;
      height: 44px;
      background: white;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      flex-shrink: 0;
      border: 1px solid #f0f0f0;
    }
    .feature-text {
      flex: 1;
      padding-top: 2px;
    }
    .feature-title {
      font-weight: 600;
      color: #0a0a0a;
      margin-bottom: 4px;
      font-size: 15px;
    }
    .feature-desc {
      font-size: 14px;
      color: #737373;
      line-height: 1.5;
    }
    .social-proof {
      background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%);
      border: 1px solid #f0f0f0;
      border-radius: 12px;
      padding: 24px;
      margin: 32px 0;
      text-align: center;
    }
    .social-proof-title {
      font-size: 13px;
      color: #a3a3a3;
      margin-bottom: 16px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .testimonial {
      font-size: 15px;
      color: #525252;
      font-style: italic;
      line-height: 1.6;
      margin-bottom: 12px;
    }
    .author {
      font-size: 14px;
      color: #0a0a0a;
      font-weight: 600;
      font-style: normal;
    }
    .author-role {
      font-size: 13px;
      color: #a3a3a3;
    }
    .cta-section {
      text-align: center;
      margin: 40px 0 32px;
    }
    .cta-label {
      font-size: 13px;
      color: #a3a3a3;
      margin-bottom: 16px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .btn-group {
      display: flex;
      gap: 12px;
      justify-content: center;
      flex-wrap: wrap;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 14px 32px;
      background: #0a0a0a;
      color: white;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 500;
      font-size: 15px;
    }
    .btn-secondary {
      background: white;
      color: #0a0a0a;
      border: 1px solid #e5e5e5;
    }
    .btn-arrow {
      font-size: 16px;
    }
    .quick-start {
      background: #fafafa;
      border: 1px solid #f0f0f0;
      border-radius: 10px;
      padding: 24px;
      margin-top: 32px;
    }
    .quick-start-title {
      font-weight: 600;
      color: #0a0a0a;
      margin-bottom: 16px;
      font-size: 15px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .steps {
      display: grid;
      gap: 12px;
    }
    .step {
      display: flex;
      align-items: start;
      gap: 12px;
    }
    .step-number {
      width: 24px;
      height: 24px;
      background: #0a0a0a;
      color: white;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 600;
      flex-shrink: 0;
    }
    .step-text {
      font-size: 14px;
      color: #525252;
      line-height: 1.5;
      padding-top: 2px;
    }
    .footer {
      background: #fafafa;
      padding: 32px 40px;
      border-top: 1px solid #f0f0f0;
    }
    .signature-box {
      display: flex;
      align-items: start;
      gap: 16px;
    }
    .avatar {
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, #0a0a0a 0%, #404040 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 600;
      font-size: 18px;
      flex-shrink: 0;
    }
    .signature {
      color: #737373;
      font-size: 14px;
      line-height: 1.8;
      flex: 1;
    }
    .signature-name {
      font-weight: 600;
      color: #0a0a0a;
      font-size: 15px;
    }
    .signature-role {
      font-size: 13px;
      color: #a3a3a3;
    }
    .ps {
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid #f0f0f0;
      font-size: 13px;
      color: #737373;
      font-style: italic;
    }
    @media (max-width: 600px) {
      body { padding: 20px 12px; }
      .header { padding: 40px 24px 32px; }
      h1 { font-size: 28px; }
      .content { padding: 24px; }
      .footer { padding: 24px; }
      .btn-group { flex-direction: column; }
      .btn { width: 100%; justify-content: center; }
      .signature-box { flex-direction: column; align-items: center; text-align: center; }
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="header">
      <div class="logo">Revise</div>
      <div class="tagline">Studio d'écriture créative</div>
      <div class="wave-emoji">&#128075;</div>
      <h1>Vous êtes dans le Studio.</h1>
      <p class="subtitle">Le partenaire d'écriture que tout auteur créatif voudrait avoir. Pas un remplaçant. Un allié silencieux qui enrichit votre voix.</p>
    </div>

    <div class="content">
      <p class="welcome-message">
        <strong>Félicitations</strong> — Votre compte est actif et votre espace d'écriture vous attend. Vous avez désormais accès à tous les outils pour transformer vos idées en histoires abouties.
      </p>

      <div class="feature-grid">
        <div class="feature-item">
          <div class="feature-icon">&#128214;</div>
          <div class="feature-text">
            <div class="feature-title">Organisation par projets</div>
            <div class="feature-desc">Chapitres, scènes, métadonnées. Tout est structuré.</div>
          </div>
        </div>

        <div class="feature-item">
          <div class="feature-icon">&#9999;&#65039;</div>
          <div class="feature-text">
            <div class="feature-title">Éditeur professionnel</div>
            <div class="feature-desc">Format A4, typographie avancée, export .docx.</div>
          </div>
        </div>

        <div class="feature-item">
          <div class="feature-icon">&#9889;</div>
          <div class="feature-text">
            <div class="feature-title">Sauvegarde automatique</div>
            <div class="feature-desc">Vos écrits sont sauvegardés en temps réel.</div>
          </div>
        </div>
      </div>

      <div class="social-proof">
        <div class="social-proof-title">Ce qu'en pensent les auteurs</div>
        <div class="testimonial">
          "Enfin un outil qui comprend qu'écrire, c'est réécrire. Les variantes proposées m'ont débloquée à chaque fois."
        </div>
        <div class="author">Marie Lefebvre</div>
        <div class="author-role">Auteure de romans historiques</div>
      </div>

      <div class="cta-section">
        <div class="cta-label">Prêt à commencer ?</div>
        <div class="btn-group">
          <a href="${loginUrl}" class="btn">
            Accéder au Studio
            <span class="btn-arrow">&#8594;</span>
          </a>
          <a href="${featuresUrl}" class="btn btn-secondary">
            Découvrir les fonctionnalités
          </a>
        </div>
      </div>

      <div class="quick-start">
        <div class="quick-start-title">&#128640; Guide de démarrage rapide</div>
        <div class="steps">
          <div class="step">
            <div class="step-number">1</div>
            <div class="step-text">Créez votre premier projet et donnez-lui un titre</div>
          </div>
          <div class="step">
            <div class="step-number">2</div>
            <div class="step-text">Commencez à écrire dans l'éditeur ou importez un texte existant</div>
          </div>
          <div class="step">
            <div class="step-number">3</div>
            <div class="step-text">Utilisez l'assistant IA pour améliorer vos passages</div>
          </div>
        </div>
      </div>
    </div>

    <div class="footer">
      <div class="signature-box">
        <div class="avatar">F</div>
        <div class="signature">
          À très vite dans le Studio,<br>
          <span class="signature-name">François</span><br>
          <span class="signature-role">Fondateur — Studio Revise</span>
          <div class="ps">
            P.S. — Besoin d'aide ? Envoyez-moi un message sur mon adresse e-mail (francoisnoel62@gmail.com), je lis tous les messages personnellement :)
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
    `.trim();

    const text = `
REVISE - Studio d'écriture créative

Vous êtes dans le Studio.

Le partenaire d'écriture que tout auteur créatif voudrait avoir. Pas un remplaçant. Un allié silencieux qui enrichit votre voix.

---

Félicitations — Votre compte est actif et votre espace d'écriture vous attend. Vous avez désormais accès à tous les outils pour transformer vos idées en histoires abouties.

---

CE QUE VOUS POUVEZ FAIRE :

- Organisation par projets : Chapitres, scènes, métadonnées. Tout est structuré.
- Éditeur professionnel : Format A4, typographie avancée, export .docx.
- Sauvegarde automatique : Vos écrits sont sauvegardés en temps réel.

---

CE QU'EN PENSENT LES AUTEURS :

"Enfin un outil qui comprend qu'écrire, c'est réécrire. Les variantes proposées m'ont débloquée à chaque fois."
— Marie Lefebvre, Auteure de romans historiques

---

PRÊT À COMMENCER ?

Accéder au Studio : ${loginUrl}
Découvrir les fonctionnalités : ${featuresUrl}

---

GUIDE DE DÉMARRAGE RAPIDE :

1. Créez votre premier projet et donnez-lui un titre
2. Commencez à écrire dans l'éditeur ou importez un texte existant
3. Utilisez l'assistant IA pour améliorer vos passages

---

À très vite dans le Studio,
François
Fondateur — Studio Revise

P.S. — Besoin d'aide ? Envoyez-moi un message sur mon adresse e-mail (francoisnoel62@gmail.com), je lis tous les messages personnellement :)
    `.trim();

    await this.resend.emails.send({
      from: this.fromEmail,
      to: user.email,
      subject: 'Bienvenue sur Studio Revise!',
      html,
      text,
    });
  }

  async sendPasswordResetEmail(user: SafeUser, resetLink: string): Promise<void> {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; padding: 40px 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; border: 1px solid #e5e5e5; }
    .logo { font-size: 24px; font-weight: 700; color: #0a0a0a; margin-bottom: 8px; }
    .tagline { font-size: 13px; color: #a3a3a3; margin-bottom: 32px; }
    h1 { color: #0a0a0a; font-size: 24px; margin-bottom: 16px; }
    p { color: #525252; margin-bottom: 16px; }
    .warning { background: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 16px; margin: 24px 0; }
    .warning p { color: #92400e; margin: 0; font-size: 14px; }
    .btn { display: inline-block; padding: 14px 32px; background: #0a0a0a; color: white; text-decoration: none; border-radius: 8px; font-weight: 500; margin: 24px 0; }
    .link-fallback { font-size: 13px; color: #737373; word-break: break-all; margin-top: 16px; padding: 16px; background: #f5f5f5; border-radius: 8px; }
    .footer { margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e5e5; font-size: 13px; color: #737373; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">Revise</div>
    <div class="tagline">Studio d'écriture créative</div>

    <h1>Réinitialisation de votre mot de passe</h1>

    <p>Bonjour${user.name ? ` ${user.name}` : ''},</p>

    <p>Nous avons reçu une demande de réinitialisation de mot de passe pour votre compte Revise.</p>

    <p>Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :</p>

    <a href="${resetLink}" class="btn">Réinitialiser mon mot de passe</a>

    <div class="warning">
      <p><strong>Ce lien expire dans 1 heure.</strong> Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email en toute sécurité.</p>
    </div>

    <div class="link-fallback">
      <strong>Le bouton ne fonctionne pas ?</strong><br>
      Copiez et collez ce lien dans votre navigateur :<br>
      ${resetLink}
    </div>

    <div class="footer">
      <p>Cet email a été envoyé à ${user.email} suite à une demande de réinitialisation de mot de passe sur Revise.</p>
      <p>Si vous n'êtes pas à l'origine de cette demande, nous vous recommandons de vérifier la sécurité de votre compte email.</p>
    </div>
  </div>
</body>
</html>
    `.trim();

    const text = `
REVISE - Réinitialisation de votre mot de passe

Bonjour${user.name ? ` ${user.name}` : ''},

Nous avons reçu une demande de réinitialisation de mot de passe pour votre compte Revise.

Pour créer un nouveau mot de passe, cliquez sur le lien ci-dessous :
${resetLink}

IMPORTANT : Ce lien expire dans 1 heure.

Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email en toute sécurité.

---
Cet email a été envoyé à ${user.email} suite à une demande de réinitialisation de mot de passe sur Revise.
    `.trim();

    await this.resend.emails.send({
      from: this.fromEmail,
      to: user.email,
      subject: '[Revise] Réinitialisation de votre mot de passe',
      html,
      text,
    });
  }

  async sendPasswordChangedEmail(user: SafeUser): Promise<void> {
    const loginUrl = `${this.baseUrl}/auth/signin`;
    const now = new Date().toLocaleString('fr-FR', {
      dateStyle: 'full',
      timeStyle: 'short',
    });

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; padding: 40px 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; border: 1px solid #e5e5e5; }
    .logo { font-size: 24px; font-weight: 700; color: #0a0a0a; margin-bottom: 8px; }
    .tagline { font-size: 13px; color: #a3a3a3; margin-bottom: 32px; }
    .success-icon { font-size: 48px; margin-bottom: 16px; }
    h1 { color: #0a0a0a; font-size: 24px; margin-bottom: 16px; }
    p { color: #525252; margin-bottom: 16px; }
    .info-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 24px 0; }
    .info-box p { color: #166534; margin: 0; font-size: 14px; }
    .warning { background: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 16px; margin: 24px 0; }
    .warning p { color: #92400e; margin: 0; font-size: 14px; }
    .btn { display: inline-block; padding: 14px 32px; background: #0a0a0a; color: white; text-decoration: none; border-radius: 8px; font-weight: 500; margin: 24px 0; }
    .footer { margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e5e5; font-size: 13px; color: #737373; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">Revise</div>
    <div class="tagline">Studio d'écriture créative</div>

    <div class="success-icon">&#9989;</div>
    <h1>Mot de passe modifié avec succès</h1>

    <p>Bonjour${user.name ? ` ${user.name}` : ''},</p>

    <p>Votre mot de passe Revise a été modifié avec succès.</p>

    <div class="info-box">
      <p><strong>Date de modification :</strong> ${now}</p>
    </div>

    <div class="warning">
      <p><strong>Vous n'êtes pas à l'origine de cette modification ?</strong><br>
      Si vous n'avez pas effectué ce changement, votre compte a peut-être été compromis. Veuillez nous contacter immédiatement à francoisnoel62@gmail.com.</p>
    </div>

    <p>Vous pouvez maintenant vous connecter avec votre nouveau mot de passe :</p>

    <a href="${loginUrl}" class="btn">Se connecter</a>

    <div class="footer">
      <p>Cet email de confirmation a été envoyé à ${user.email} suite à une modification de mot de passe sur votre compte Revise.</p>
    </div>
  </div>
</body>
</html>
    `.trim();

    const text = `
REVISE - Mot de passe modifié avec succès

Bonjour${user.name ? ` ${user.name}` : ''},

Votre mot de passe Revise a été modifié avec succès.

Date de modification : ${now}

---

VOUS N'ÊTES PAS À L'ORIGINE DE CETTE MODIFICATION ?

Si vous n'avez pas effectué ce changement, votre compte a peut-être été compromis.
Veuillez nous contacter immédiatement à francoisnoel62@gmail.com.

---

Vous pouvez maintenant vous connecter avec votre nouveau mot de passe :
${loginUrl}

---
Cet email de confirmation a été envoyé à ${user.email} suite à une modification de mot de passe sur votre compte Revise.
    `.trim();

    await this.resend.emails.send({
      from: this.fromEmail,
      to: user.email,
      subject: '[Revise] Votre mot de passe a été modifié',
      html,
      text,
    });
  }
}
