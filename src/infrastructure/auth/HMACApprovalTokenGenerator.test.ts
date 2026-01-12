// ABOUTME: Tests for HMACApprovalTokenGenerator.
// ABOUTME: Verifies secure token generation and verification.

import { describe, it, expect } from 'vitest';
import { HMACApprovalTokenGenerator } from './HMACApprovalTokenGenerator';

describe('HMACApprovalTokenGenerator', () => {
  const secret = 'test-secret-key-at-least-32-chars';

  describe('constructor', () => {
    it('creates instance with valid secret', () => {
      const generator = new HMACApprovalTokenGenerator(secret);
      expect(generator).toBeDefined();
    });

    it('throws error when secret is empty', () => {
      expect(() => new HMACApprovalTokenGenerator('')).toThrow(
        'Secret is required for token generation'
      );
    });
  });

  describe('generateToken', () => {
    it('generates 32-character token', () => {
      const generator = new HMACApprovalTokenGenerator(secret);
      const token = generator.generateToken('user-123');
      expect(token).toHaveLength(32);
    });

    it('generates consistent tokens for same user ID', () => {
      const generator = new HMACApprovalTokenGenerator(secret);
      const token1 = generator.generateToken('user-123');
      const token2 = generator.generateToken('user-123');
      expect(token1).toBe(token2);
    });

    it('generates different tokens for different user IDs', () => {
      const generator = new HMACApprovalTokenGenerator(secret);
      const token1 = generator.generateToken('user-123');
      const token2 = generator.generateToken('user-456');
      expect(token1).not.toBe(token2);
    });

    it('generates different tokens with different secrets', () => {
      const generator1 = new HMACApprovalTokenGenerator('secret-one-32-chars-minimum-req');
      const generator2 = new HMACApprovalTokenGenerator('secret-two-32-chars-minimum-req');
      const token1 = generator1.generateToken('user-123');
      const token2 = generator2.generateToken('user-123');
      expect(token1).not.toBe(token2);
    });
  });

  describe('verifyToken', () => {
    it('returns true for valid token', () => {
      const generator = new HMACApprovalTokenGenerator(secret);
      const token = generator.generateToken('user-123');
      expect(generator.verifyToken('user-123', token)).toBe(true);
    });

    it('returns false for invalid token', () => {
      const generator = new HMACApprovalTokenGenerator(secret);
      expect(generator.verifyToken('user-123', 'invalid-token')).toBe(false);
    });

    it('returns false for token from different user', () => {
      const generator = new HMACApprovalTokenGenerator(secret);
      const token = generator.generateToken('user-123');
      expect(generator.verifyToken('user-456', token)).toBe(false);
    });
  });
});
