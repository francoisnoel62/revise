// ABOUTME: Text hashing utility for content-change detection in metadata generation.
// ABOUTME: Generates SHA-256 hash of text content to compare against stored contentHash.

import crypto from 'crypto';

export function hashText(text: string): string {
  return crypto.createHash('sha256').update(text, 'utf8').digest('hex');
}
