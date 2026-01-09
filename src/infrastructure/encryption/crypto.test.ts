import { describe, it, expect } from 'vitest';

// Set test encryption key BEFORE importing crypto module
process.env.ENCRYPTION_KEY = 'test-encryption-key-minimum-32-characters-long';

import { encryptApiKey, decryptApiKey, maskApiKey } from './crypto';

describe('Encryption Utilities', () => {

  describe('encryptApiKey', () => {
    it('should encrypt a plain-text API key', () => {
      const plaintext = 'sk-test-api-key-123456';
      const result = encryptApiKey(plaintext);

      expect(result.encryptedData).toBeDefined();
      expect(result.iv).toBeDefined();
      expect(result.authTag).toBeDefined();
      expect(result.encryptedData).not.toBe(plaintext);
    });

    it('should use different IVs for each encryption', () => {
      const plaintext = 'sk-test-api-key';
      const result1 = encryptApiKey(plaintext);
      const result2 = encryptApiKey(plaintext);

      expect(result1.iv).not.toBe(result2.iv);
      expect(result1.encryptedData).not.toBe(result2.encryptedData);
    });

    it('should throw error for empty string', () => {
      expect(() => encryptApiKey('')).toThrow('Cannot encrypt empty API key');
    });
  });

  describe('decryptApiKey', () => {
    it('should decrypt to original plain-text', () => {
      const plaintext = 'sk-test-api-key-123456';
      const encrypted = encryptApiKey(plaintext);

      const decrypted = decryptApiKey(
        encrypted.encryptedData,
        encrypted.iv,
        encrypted.authTag
      );

      expect(decrypted).toBe(plaintext);
    });

    it('should throw error for tampered data', () => {
      const plaintext = 'sk-test-api-key';
      const encrypted = encryptApiKey(plaintext);

      // Tamper with encrypted data by flipping some bits
      const encryptedBytes = Buffer.from(encrypted.encryptedData, 'hex');
      encryptedBytes[0] = encryptedBytes[0] ^ 0xFF; // Flip all bits in first byte
      const tampered = encryptedBytes.toString('hex');

      expect(() =>
        decryptApiKey(tampered, encrypted.iv, encrypted.authTag)
      ).toThrow();
    });

    it('should throw error for wrong auth tag', () => {
      const plaintext = 'sk-test-api-key';
      const encrypted = encryptApiKey(plaintext);

      const wrongTag = '0'.repeat(encrypted.authTag.length);

      expect(() =>
        decryptApiKey(encrypted.encryptedData, encrypted.iv, wrongTag)
      ).toThrow();
    });

    it('should throw error for missing parameters', () => {
      expect(() => decryptApiKey('', '', '')).toThrow(
        'Missing encryption parameters'
      );
    });
  });

  describe('maskApiKey', () => {
    it('should mask API key showing first 8 and last 4 chars', () => {
      const apiKey = 'sk-proj-abc123def456ghi789';
      const masked = maskApiKey(apiKey);

      expect(masked).toBe('sk-proj-...i789');
      expect(masked).toContain('...');
      expect(masked.length).toBeLessThan(apiKey.length);
    });

    it('should return *** for short keys', () => {
      expect(maskApiKey('short')).toBe('***');
    });

    it('should return empty string for empty input', () => {
      expect(maskApiKey('')).toBe('');
    });
  });

  describe('Round-trip encryption', () => {
    it('should handle various API key formats', () => {
      const keys = [
        'sk-proj-abc123',
        'sk-test-very-long-api-key-with-many-characters',
        'anthropic-api-key-format',
        'simple-key',
      ];

      keys.forEach((key) => {
        const encrypted = encryptApiKey(key);
        const decrypted = decryptApiKey(
          encrypted.encryptedData,
          encrypted.iv,
          encrypted.authTag
        );
        expect(decrypted).toBe(key);
      });
    });
  });
});
