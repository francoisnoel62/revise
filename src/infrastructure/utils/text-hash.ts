// ABOUTME: Text hashing utility for cache invalidation detection.
// ABOUTME: Generates SHA-256 hash of text content to detect changes.

import crypto from 'crypto';

/**
 * Generate SHA-256 hash of text content.
 * Used for cache invalidation detection in metadata generation.
 *
 * @param text - The text content to hash
 * @returns Hexadecimal string representation of SHA-256 hash
 */
export function hashText(text: string): string {
  return crypto.createHash('sha256').update(text, 'utf8').digest('hex');
}
