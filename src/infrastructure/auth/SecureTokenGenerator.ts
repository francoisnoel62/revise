// ABOUTME: Secure token generator for password reset tokens.
// ABOUTME: Uses crypto.randomBytes for cryptographically secure random values.

import { randomBytes } from 'node:crypto';
import { TokenGenerator } from '@/application/use-cases/RequestPasswordResetUseCase';

export class SecureTokenGenerator implements TokenGenerator {
  private readonly byteLength: number;

  constructor(byteLength: number = 32) {
    this.byteLength = byteLength;
  }

  generate(): string {
    return randomBytes(this.byteLength).toString('hex');
  }
}
