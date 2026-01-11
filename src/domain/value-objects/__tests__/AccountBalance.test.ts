// ABOUTME: Unit tests for AccountBalance value object
// ABOUTME: Tests creation, validation, formatting, and percentage calculation

import { describe, it, expect } from 'vitest';
import {
  AccountBalance,
  createAccountBalance,
  createUnavailableBalance,
  formatBalance,
  getUsagePercentage,
} from '../AccountBalance';

describe('AccountBalance', () => {
  describe('createAccountBalance', () => {
    it('should create a valid balance with all fields', () => {
      const renewalDate = new Date('2026-02-01');
      const balance = createAccountBalance(42.5, 100, renewalDate, 'USD');

      expect(balance.used).toBe(42.5);
      expect(balance.limit).toBe(100);
      expect(balance.renewalDate).toBe(renewalDate);
      expect(balance.currency).toBe('USD');
      expect(balance.available).toBe(true);
      expect(balance.errorMessage).toBeUndefined();
    });

    it('should create a balance with null limit', () => {
      const balance = createAccountBalance(25.0, null);

      expect(balance.used).toBe(25.0);
      expect(balance.limit).toBeNull();
      expect(balance.renewalDate).toBeNull();
      expect(balance.available).toBe(true);
    });

    it('should default currency to USD', () => {
      const balance = createAccountBalance(10, 50);

      expect(balance.currency).toBe('USD');
    });

    it('should throw error for negative used amount', () => {
      expect(() => createAccountBalance(-10, 100)).toThrow(
        'Used amount cannot be negative'
      );
    });

    it('should throw error for negative limit', () => {
      expect(() => createAccountBalance(10, -100)).toThrow(
        'Limit cannot be negative'
      );
    });

    it('should allow zero values', () => {
      const balance = createAccountBalance(0, 0);

      expect(balance.used).toBe(0);
      expect(balance.limit).toBe(0);
    });
  });

  describe('createUnavailableBalance', () => {
    it('should create an unavailable balance with error message', () => {
      const balance = createUnavailableBalance('Admin API key required');

      expect(balance.available).toBe(false);
      expect(balance.errorMessage).toBe('Admin API key required');
      expect(balance.used).toBe(0);
      expect(balance.limit).toBeNull();
    });
  });

  describe('formatBalance', () => {
    it('should format balance with limit', () => {
      const balance = createAccountBalance(42.5, 100);

      expect(formatBalance(balance)).toBe('$42.50 / $100.00');
    });

    it('should format balance without limit', () => {
      const balance = createAccountBalance(42.5, null);

      expect(formatBalance(balance)).toBe('$42.50');
    });

    it('should format unavailable balance with error message', () => {
      const balance = createUnavailableBalance('API error');

      expect(formatBalance(balance)).toBe('API error');
    });

    it('should format unavailable balance without error message', () => {
      const balance: AccountBalance = {
        used: 0,
        limit: null,
        renewalDate: null,
        currency: 'USD',
        available: false,
      };

      expect(formatBalance(balance)).toBe('Balance unavailable');
    });

    it('should handle EUR currency', () => {
      const balance = createAccountBalance(25.0, 50.0, null, 'EUR');

      expect(formatBalance(balance)).toBe('EUR 25.00 / EUR 50.00');
    });
  });

  describe('getUsagePercentage', () => {
    it('should calculate percentage correctly', () => {
      const balance = createAccountBalance(42.5, 100);

      expect(getUsagePercentage(balance)).toBe(42.5);
    });

    it('should cap at 100%', () => {
      const balance = createAccountBalance(150, 100);

      expect(getUsagePercentage(balance)).toBe(100);
    });

    it('should return null for null limit', () => {
      const balance = createAccountBalance(50, null);

      expect(getUsagePercentage(balance)).toBeNull();
    });

    it('should return null for zero limit', () => {
      const balance = createAccountBalance(0, 0);

      expect(getUsagePercentage(balance)).toBeNull();
    });

    it('should return null for unavailable balance', () => {
      const balance = createUnavailableBalance('Error');

      expect(getUsagePercentage(balance)).toBeNull();
    });

    it('should handle 0% usage', () => {
      const balance = createAccountBalance(0, 100);

      expect(getUsagePercentage(balance)).toBe(0);
    });
  });
});
