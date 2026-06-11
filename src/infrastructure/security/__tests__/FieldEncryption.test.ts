// ABOUTME: Tests for FieldEncryption (AES-256-GCM at-rest encryption of exchange content)
// ABOUTME: Covers round-trip, randomized IV, key validation, and tamper detection

import { describe, it, expect } from 'vitest';
import { FieldEncryption } from '../FieldEncryption';

// 32-byte key encoded as 64 hex characters
const KEY_HEX = '0'.repeat(64);
const OTHER_KEY_HEX = 'a'.repeat(64);

describe('FieldEncryption', () => {
  it('round-trips plaintext through encrypt/decrypt', () => {
    const enc = new FieldEncryption(KEY_HEX);
    const plaintext = 'Le narrateur regarde la mer. «Texte sensible» 🌊';

    const blob = enc.encrypt(plaintext);
    expect(blob).not.toContain(plaintext);
    expect(enc.decrypt(blob)).toBe(plaintext);
  });

  it('produces different ciphertext for the same plaintext (randomized IV)', () => {
    const enc = new FieldEncryption(KEY_HEX);

    const a = enc.encrypt('same');
    const b = enc.encrypt('same');

    expect(a).not.toBe(b);
    expect(enc.decrypt(a)).toBe('same');
    expect(enc.decrypt(b)).toBe('same');
  });

  it('rejects a key that is not 64 hex characters', () => {
    expect(() => new FieldEncryption('too-short')).toThrow();
    expect(() => new FieldEncryption('z'.repeat(64))).toThrow();
  });

  it('throws when the payload format is invalid', () => {
    const enc = new FieldEncryption(KEY_HEX);
    expect(() => enc.decrypt('not-a-valid-blob')).toThrow();
  });

  it('rejects a tampered authentication tag', () => {
    const enc = new FieldEncryption(KEY_HEX);
    const blob = enc.encrypt('secret');
    const [iv, , data] = blob.split(':');
    const forgedTag = Buffer.from('0'.repeat(16)).toString('base64');
    const tampered = [iv, forgedTag, data].join(':');

    expect(() => enc.decrypt(tampered)).toThrow();
  });

  it('cannot decrypt content encrypted with a different key', () => {
    const blob = new FieldEncryption(KEY_HEX).encrypt('secret');
    expect(() => new FieldEncryption(OTHER_KEY_HEX).decrypt(blob)).toThrow();
  });
});
