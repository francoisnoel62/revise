// ABOUTME: AES-256-GCM authenticated encryption for sensitive field values stored at rest
// ABOUTME: Encodes payloads as base64(iv):base64(authTag):base64(ciphertext)

import {
  createCipheriv,
  createDecipheriv,
  pbkdf2Sync,
  randomBytes,
} from 'node:crypto';
import { config } from '@/infrastructure/config/env';

const ALGORITHM = 'aes-256-gcm';
const IV_BYTES = 12;
const KEY_BYTES = 32;
const KEY_HEX_LENGTH = 64; // 32 bytes
const PAYLOAD_PARTS = 3;
const MIN_SECRET_LENGTH = 32;
// Domain-separated from provider API-key encryption, which uses its own salt.
const KEY_DERIVATION_SALT = 'revise-exchange-salt';
const KEY_DERIVATION_ITERATIONS = 100000;

/**
 * Encrypts and decrypts short string fields using AES-256-GCM. The key is a
 * 32-byte value provided as 64 hexadecimal characters. Each call uses a fresh
 * random IV, and the GCM authentication tag protects against tampering.
 */
export class FieldEncryption {
  private readonly key: Buffer;

  constructor(keyHex: string) {
    if (!new RegExp(`^[0-9a-fA-F]{${KEY_HEX_LENGTH}}$`).test(keyHex)) {
      throw new Error(
        'Encryption key must be 64 hexadecimal characters (32 bytes)'
      );
    }
    this.key = Buffer.from(keyHex, 'hex');
  }

  encrypt(plaintext: string): string {
    const iv = randomBytes(IV_BYTES);
    const cipher = createCipheriv(ALGORITHM, this.key, iv);
    const ciphertext = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();

    return [
      iv.toString('base64'),
      authTag.toString('base64'),
      ciphertext.toString('base64'),
    ].join(':');
  }

  decrypt(blob: string): string {
    const parts = blob.split(':');
    if (parts.length !== PAYLOAD_PARTS) {
      throw new Error('Invalid encrypted payload format');
    }

    const [ivB64, authTagB64, dataB64] = parts;
    const iv = Buffer.from(ivB64, 'base64');
    const authTag = Buffer.from(authTagB64, 'base64');
    const data = Buffer.from(dataB64, 'base64');

    const decipher = createDecipheriv(ALGORITHM, this.key, iv);
    decipher.setAuthTag(authTag);

    return Buffer.concat([decipher.update(data), decipher.final()]).toString(
      'utf8'
    );
  }
}

let instance: FieldEncryption | null = null;

/**
 * Returns the process-wide FieldEncryption, deriving a 32-byte key from the
 * ENCRYPTION_KEY environment variable via PBKDF2. Uses a distinct salt from
 * provider API-key encryption for domain separation. Throws when the secret is
 * missing or too short, so content is never silently stored unencrypted.
 */
export function getFieldEncryption(): FieldEncryption {
  if (!instance) {
    const secret = process.env.ENCRYPTION_KEY || config.encryption.key;
    if (!secret || secret.length < MIN_SECRET_LENGTH) {
      throw new Error('ENCRYPTION_KEY must be at least 32 characters');
    }
    const key = pbkdf2Sync(
      secret,
      KEY_DERIVATION_SALT,
      KEY_DERIVATION_ITERATIONS,
      KEY_BYTES,
      'sha256'
    );
    instance = new FieldEncryption(key.toString('hex'));
  }
  return instance;
}
