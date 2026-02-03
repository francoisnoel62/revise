// ABOUTME: Service for computing content hashes using SHA-256
// ABOUTME: Used for caching analysis results based on chapter content

import { createHash } from 'crypto';
import { HashService } from '@/application/use-cases/AnalyzeChapterUseCase';

/**
 * Implementation of HashService using SHA-256.
 * Produces consistent hashes for identical content.
 */
export class ContentHashService implements HashService {
  /**
   * Compute SHA-256 hash of content.
   *
   * @param content - The text content to hash
   * @returns Hex-encoded SHA-256 hash
   */
  hash(content: string): string {
    return createHash('sha256').update(content, 'utf8').digest('hex');
  }
}

/**
 * Create a singleton instance of ContentHashService.
 */
export const contentHashService = new ContentHashService();
