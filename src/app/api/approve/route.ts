// ABOUTME: API route for approving or rejecting user registrations.
// ABOUTME: Handles GET requests from email links with token validation.

import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/infrastructure/config/database';
import { MongoDBUserRepository } from '@/infrastructure/persistence/MongoDBUserRepository';
import { HMACApprovalTokenGenerator } from '@/infrastructure/auth/HMACApprovalTokenGenerator';
import { ResendEmailService } from '@/infrastructure/email/ResendEmailService';
import { config } from '@/infrastructure/config/env';
import {
  ApproveUserUseCase,
  ApprovalAction,
  InvalidTokenError,
  UserNotFoundError,
} from '@/application/use-cases/ApproveUserUseCase';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get('userId');
  const token = searchParams.get('token');
  const action = searchParams.get('action') as ApprovalAction | null;

  // Validate parameters
  if (!userId || !token || !action) {
    return createHtmlResponse(
      'Parametres manquants',
      'Le lien est invalide ou incomplet.',
      'error'
    );
  }

  if (action !== 'approve' && action !== 'reject') {
    return createHtmlResponse(
      'Action invalide',
      'L\'action doit etre "approve" ou "reject".',
      'error'
    );
  }

  try {
    const db = await getDatabase();
    const userRepo = new MongoDBUserRepository(db);
    const tokenGenerator = new HMACApprovalTokenGenerator(config.auth.secret);
    const emailService = new ResendEmailService();
    const useCase = new ApproveUserUseCase(userRepo, tokenGenerator, emailService);

    const result = await useCase.execute({ userId, token, action });

    if (result.action === 'approve') {
      return createHtmlResponse(
        'Utilisateur approuve',
        `L'utilisateur ${result.userEmail} peut maintenant se connecter. Un email de bienvenue lui a ete envoye.`,
        'success'
      );
    } else {
      return createHtmlResponse(
        'Inscription rejetee',
        `L'inscription de ${result.userEmail} a ete rejetee et le compte supprime.`,
        'warning'
      );
    }
  } catch (error) {
    if (error instanceof InvalidTokenError) {
      return createHtmlResponse(
        'Token invalide',
        'Le lien a expire ou est invalide.',
        'error'
      );
    }

    if (error instanceof UserNotFoundError) {
      return createHtmlResponse(
        'Utilisateur introuvable',
        'L\'utilisateur n\'existe pas ou a deja ete traite.',
        'error'
      );
    }

    console.error('Approval error:', error);
    return createHtmlResponse(
      'Erreur',
      'Une erreur est survenue lors du traitement.',
      'error'
    );
  }
}

function createHtmlResponse(
  title: string,
  message: string,
  type: 'success' | 'warning' | 'error'
): NextResponse {
  const colors = {
    success: { bg: '#dcfce7', border: '#22c55e', text: '#166534' },
    warning: { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' },
    error: { bg: '#fee2e2', border: '#ef4444', text: '#991b1b' },
  };

  const color = colors[type];

  const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title} - Revise</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f5f5f5;
      margin: 0;
      padding: 20px;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .card {
      background: white;
      border-radius: 12px;
      padding: 40px;
      max-width: 500px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      text-align: center;
    }
    .status {
      background: ${color.bg};
      border: 2px solid ${color.border};
      color: ${color.text};
      padding: 15px 20px;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    h1 { margin: 0 0 10px; font-size: 24px; }
    p { color: #666; margin: 0; }
    .logo { font-size: 32px; margin-bottom: 20px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">✍️</div>
    <div class="status">
      <h1>${title}</h1>
    </div>
    <p>${message}</p>
  </div>
</body>
</html>
  `.trim();

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
