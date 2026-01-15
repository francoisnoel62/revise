// ABOUTME: HMAC-based implementation of ApprovalTokenGenerator.
// ABOUTME: Uses SHA-256 with a secret key for secure token generation.

import { createHmac } from 'node:crypto';
import { ApprovalTokenGenerator } from '@/domain/interfaces/ApprovalTokenGenerator';

export class HMACApprovalTokenGenerator implements ApprovalTokenGenerator {
  constructor(private secret: string) {
    if (!secret) {
      throw new Error('Secret is required for token generation');
    }
  }

  generateToken(userId: string): string {
    return createHmac('sha256', this.secret)
      .update(userId)
      .digest('hex')
      .slice(0, 32);
  }

  verifyToken(userId: string, token: string): boolean {
    const expectedToken = this.generateToken(userId);
    return token === expectedToken;
  }
}
