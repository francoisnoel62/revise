// ABOUTME: UUID generator implementation using Node.js crypto.
// ABOUTME: Implements IdGenerator interface for production use.

import { randomUUID } from 'crypto';
import { IdGenerator } from '@/domain/interfaces/IdGenerator';

/**
 * UUID generator using Node.js crypto.randomUUID().
 * Standard implementation for production use.
 */
export class UUIDGenerator implements IdGenerator {
  generate(): string {
    return randomUUID();
  }
}

/**
 * Singleton instance for convenience.
 */
export const uuidGenerator = new UUIDGenerator();
