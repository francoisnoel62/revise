// ABOUTME: Tests for the AIExchange entity (captured content of one AI exchange)
// ABOUTME: Covers factory creation, retention/expiry computation, and reconstruction

import { describe, it, expect } from 'vitest';
import { ObjectId } from 'mongodb';
import { AIExchange } from '../AIExchange';

function build(retentionDays = 30) {
  return AIExchange.create({
    id: new ObjectId().toHexString(),
    userId: 'user-1',
    projectId: 'project-1',
    usageRecordId: 'usage-1',
    operation: 'rewrite',
    provider: 'Anthropic',
    model: 'claude-sonnet',
    systemPrompt: 'system prompt',
    input: 'input text',
    output: 'raw output',
    inputTokens: 1500,
    outputTokens: 420,
    costEur: 0.02,
    durationMs: 2500,
    retentionDays,
  });
}

describe('AIExchange', () => {
  it('exposes the captured content and metrics snapshot', () => {
    const exchange = build();

    expect(exchange.getUserId()).toBe('user-1');
    expect(exchange.getProjectId()).toBe('project-1');
    expect(exchange.getUsageRecordId()).toBe('usage-1');
    expect(exchange.getOperation()).toBe('rewrite');
    expect(exchange.getProvider()).toBe('Anthropic');
    expect(exchange.getModel()).toBe('claude-sonnet');
    expect(exchange.getSystemPrompt()).toBe('system prompt');
    expect(exchange.getInput()).toBe('input text');
    expect(exchange.getOutput()).toBe('raw output');
    expect(exchange.getInputTokens()).toBe(1500);
    expect(exchange.getCostEur()).toBe(0.02);
    expect(exchange.getDurationMs()).toBe(2500);
  });

  it('defaults the metrics snapshot to null when omitted', () => {
    const exchange = AIExchange.create({
      id: 'id-1',
      userId: 'user-1',
      projectId: 'project-1',
      usageRecordId: null,
      operation: 'rewrite',
      provider: 'Anthropic',
      model: 'claude-sonnet',
      systemPrompt: 's',
      input: 'i',
      output: 'o',
      retentionDays: 30,
    });

    expect(exchange.getInputTokens()).toBeNull();
    expect(exchange.getCostEur()).toBeNull();
    expect(exchange.getDurationMs()).toBeNull();
  });

  it('computes expiresAt from createdAt plus the retention window', () => {
    const exchange = build(30);

    const expectedMs = 30 * 24 * 60 * 60 * 1000;
    const actualMs =
      exchange.getExpiresAt().getTime() - exchange.getCreatedAt().getTime();

    expect(actualMs).toBe(expectedMs);
  });

  it('rejects a non-positive retention window', () => {
    expect(() => build(0)).toThrow();
    expect(() => build(-5)).toThrow();
  });

  it('reconstructs from persisted properties without mutating them', () => {
    const createdAt = new Date('2026-06-08T14:32:00.000Z');
    const expiresAt = new Date('2026-07-08T14:32:00.000Z');

    const exchange = AIExchange.reconstruct({
      id: 'id-1',
      userId: 'user-1',
      projectId: 'project-1',
      usageRecordId: 'usage-1',
      operation: 'synthesis',
      provider: 'OpenAI',
      model: 'gpt-4o',
      systemPrompt: 's',
      input: 'i',
      output: 'o',
      inputTokens: null,
      outputTokens: null,
      cachedInputTokens: null,
      costEur: null,
      durationMs: null,
      createdAt,
      expiresAt,
    });

    expect(exchange.getCreatedAt()).toEqual(createdAt);
    expect(exchange.getExpiresAt()).toEqual(expiresAt);
    expect(exchange.getOperation()).toBe('synthesis');
  });
});
