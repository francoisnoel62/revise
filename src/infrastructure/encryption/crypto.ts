// ABOUTME: Encryption utilities for API key storage using AES-256-GCM.
// ABOUTME: Provides encryption, decryption, and masking for sensitive credentials.

import crypto from 'crypto';
import { config } from '@/infrastructure/config/env';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const _TAG_LENGTH = 16; // 128 bits (reserved for future use)

/**
 * Derive encryption key from ENCRYPTION_KEY environment variable.
 * Uses PBKDF2 to ensure consistent 32-byte key.
 */
function getEncryptionKey(): Buffer {
  const secret = config.encryption.key;

  if (!secret || secret.length < 32) {
    throw new Error('ENCRYPTION_KEY must be at least 32 characters');
  }

  // Derive consistent 32-byte key using PBKDF2
  // Salt is fixed per application (not secret, just for key derivation)
  return crypto.pbkdf2Sync(
    secret,
    'revise-provider-salt', // Application-specific salt
    100000, // Iterations
    KEY_LENGTH,
    'sha256'
  );
}

/**
 * Encrypt API key using AES-256-GCM.
 * Returns encrypted data, IV, and authentication tag.
 *
 * @param plaintext The API key to encrypt
 * @returns Object with encryptedData, iv, and authTag (all hex strings)
 * @throws Error if encryption fails
 */
export function encryptApiKey(plaintext: string): {
  encryptedData: string;
  iv: string;
  authTag: string;
} {
  if (!plaintext) {
    throw new Error('Cannot encrypt empty API key');
  }

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return {
    encryptedData: encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
  };
}

/**
 * Decrypt API key using AES-256-GCM.
 *
 * @param encryptedData Hex-encoded encrypted data
 * @param iv Hex-encoded initialization vector
 * @param authTag Hex-encoded authentication tag
 * @returns Decrypted API key (plaintext)
 * @throws Error if decryption fails (wrong key, tampered data, etc.)
 */
export function decryptApiKey(
  encryptedData: string,
  iv: string,
  authTag: string
): string {
  if (!encryptedData || !iv || !authTag) {
    throw new Error('Missing encryption parameters');
  }

  const key = getEncryptionKey();

  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(iv, 'hex')
  );

  decipher.setAuthTag(Buffer.from(authTag, 'hex'));

  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Mask API key for display (show only first 8 and last 4 chars).
 * Example: "sk-proj-abc123def456..." -> "sk-proj-...6def"
 *
 * @param apiKey The API key to mask
 * @returns Masked version safe for display
 */
export function maskApiKey(apiKey: string): string {
  if (!apiKey) {
    return '';
  }

  if (apiKey.length <= 12) {
    return '***';
  }

  const prefix = apiKey.substring(0, 8);
  const suffix = apiKey.substring(apiKey.length - 4);

  return `${prefix}...${suffix}`;
}
