// ABOUTME: Tests for AIUsageRecord entity
// ABOUTME: Covers creation, validation, and computed properties

import { describe, it, expect } from 'vitest';
import { AIUsageRecord } from '../AIUsageRecord';

describe('AIUsageRecord', () => {
  describe('create', () => {
    it('creates a record with all properties', () => {
      const record = AIUsageRecord.create(
        'record-1',
        'user-1',
        'project-1',
        'rewrite',
        'OpenAI',
        'gpt-4o-mini',
        500,
        150,
        2500
      );

      expect(record.getId()).toBe('record-1');
      expect(record.getUserId()).toBe('user-1');
      expect(record.getProjectId()).toBe('project-1');
      expect(record.getOperation()).toBe('rewrite');
      expect(record.getProvider()).toBe('OpenAI');
      expect(record.getModel()).toBe('gpt-4o-mini');
      expect(record.getInputTokens()).toBe(500);
      expect(record.getOutputTokens()).toBe(150);
      expect(record.getDurationMs()).toBe(2500);
      expect(record.getCreatedAt()).toBeInstanceOf(Date);
    });

    it('creates a record with null tokens', () => {
      const record = AIUsageRecord.create(
        'record-1',
        'user-1',
        'project-1',
        'completion',
        'Anthropic',
        'claude-3-haiku',
        null,
        null,
        1000
      );

      expect(record.getInputTokens()).toBeNull();
      expect(record.getOutputTokens()).toBeNull();
      expect(record.getTotalTokens()).toBeNull();
    });

    it('throws error for negative duration', () => {
      expect(() =>
        AIUsageRecord.create(
          'record-1',
          'user-1',
          'project-1',
          'rewrite',
          'OpenAI',
          'gpt-4o-mini',
          100,
          50,
          -100
        )
      ).toThrow('Duration cannot be negative');
    });

    it('throws error for negative input tokens', () => {
      expect(() =>
        AIUsageRecord.create(
          'record-1',
          'user-1',
          'project-1',
          'rewrite',
          'OpenAI',
          'gpt-4o-mini',
          -100,
          50,
          1000
        )
      ).toThrow('Input tokens cannot be negative');
    });

    it('throws error for negative output tokens', () => {
      expect(() =>
        AIUsageRecord.create(
          'record-1',
          'user-1',
          'project-1',
          'rewrite',
          'OpenAI',
          'gpt-4o-mini',
          100,
          -50,
          1000
        )
      ).toThrow('Output tokens cannot be negative');
    });
  });

  describe('cachedInputTokens', () => {
    it('stores and returns cached input tokens', () => {
      const record = AIUsageRecord.create(
        'record-1',
        'user-1',
        'project-1',
        'rewrite',
        'Anthropic',
        'claude-sonnet',
        500,
        150,
        2500,
        400
      );

      expect(record.getCachedInputTokens()).toBe(400);
    });

    it('defaults cached input tokens to null when omitted', () => {
      const record = AIUsageRecord.create(
        'record-1',
        'user-1',
        'project-1',
        'rewrite',
        'OpenAI',
        'gpt-4o-mini',
        500,
        150,
        2500
      );

      expect(record.getCachedInputTokens()).toBeNull();
    });

    it('throws error for negative cached input tokens', () => {
      expect(() =>
        AIUsageRecord.create(
          'record-1',
          'user-1',
          'project-1',
          'rewrite',
          'OpenAI',
          'gpt-4o-mini',
          100,
          50,
          1000,
          -10
        )
      ).toThrow('Cached input tokens cannot be negative');
    });

    it('reconstructs cached input tokens as null when absent from properties', () => {
      const record = AIUsageRecord.reconstruct({
        id: 'record-1',
        userId: 'user-1',
        projectId: 'project-1',
        operation: 'narrative_analysis',
        provider: 'Anthropic',
        model: 'claude-3-sonnet',
        inputTokens: 10000,
        outputTokens: 2000,
        durationMs: 5000,
        createdAt: new Date('2024-01-15'),
      });

      expect(record.getCachedInputTokens()).toBeNull();
    });
  });

  describe('costEur', () => {
    it('stores and returns the euro cost', () => {
      const record = AIUsageRecord.create(
        'record-1',
        'user-1',
        'project-1',
        'rewrite',
        'Anthropic',
        'claude-sonnet',
        500,
        150,
        2500,
        400,
        0.0123
      );

      expect(record.getCostEur()).toBe(0.0123);
    });

    it('defaults cost to null when omitted', () => {
      const record = AIUsageRecord.create(
        'record-1',
        'user-1',
        'project-1',
        'rewrite',
        'OpenAI',
        'gpt-4o-mini',
        500,
        150,
        2500
      );

      expect(record.getCostEur()).toBeNull();
    });
  });

  describe('getTotalTokens', () => {
    it('returns sum of input and output tokens', () => {
      const record = AIUsageRecord.create(
        'record-1',
        'user-1',
        'project-1',
        'rewrite',
        'OpenAI',
        'gpt-4o-mini',
        500,
        150,
        2500
      );

      expect(record.getTotalTokens()).toBe(650);
    });

    it('handles null input tokens', () => {
      const record = AIUsageRecord.create(
        'record-1',
        'user-1',
        'project-1',
        'rewrite',
        'OpenAI',
        'gpt-4o-mini',
        null,
        150,
        2500
      );

      expect(record.getTotalTokens()).toBe(150);
    });

    it('handles null output tokens', () => {
      const record = AIUsageRecord.create(
        'record-1',
        'user-1',
        'project-1',
        'rewrite',
        'OpenAI',
        'gpt-4o-mini',
        500,
        null,
        2500
      );

      expect(record.getTotalTokens()).toBe(500);
    });

    it('returns null when both tokens are null', () => {
      const record = AIUsageRecord.create(
        'record-1',
        'user-1',
        'project-1',
        'completion',
        'OpenAI',
        'gpt-4o-mini',
        null,
        null,
        1000
      );

      expect(record.getTotalTokens()).toBeNull();
    });
  });

  describe('reconstruct', () => {
    it('reconstructs from properties', () => {
      const createdAt = new Date('2024-01-15');
      const record = AIUsageRecord.reconstruct({
        id: 'record-1',
        userId: 'user-1',
        projectId: 'project-1',
        operation: 'narrative_analysis',
        provider: 'Anthropic',
        model: 'claude-3-sonnet',
        inputTokens: 10000,
        outputTokens: 2000,
        durationMs: 5000,
        createdAt,
      });

      expect(record.getId()).toBe('record-1');
      expect(record.getCreatedAt()).toEqual(createdAt);
    });
  });
});
