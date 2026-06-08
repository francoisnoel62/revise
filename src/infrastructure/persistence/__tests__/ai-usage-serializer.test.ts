// ABOUTME: Tests for AIUsageRecord <-> MongoDB document serialization
// ABOUTME: Covers token fields including cached tokens and backward compatibility

import { describe, it, expect } from 'vitest';
import { ObjectId } from 'mongodb';
import { AIUsageRecord } from '@/domain/entities/AIUsageRecord';
import {
  serializeAIUsage,
  deserializeAIUsage,
  AIUsageDocument,
} from '../ai-usage-serializer';

describe('ai-usage-serializer', () => {
  it('serializes cached input tokens onto the document', () => {
    const record = AIUsageRecord.create(
      new ObjectId().toHexString(),
      'user-1',
      'project-1',
      'rewrite',
      'Anthropic',
      'claude-sonnet',
      1500,
      420,
      2500,
      1200
    );

    const doc = serializeAIUsage(record);

    expect(doc.cachedInputTokens).toBe(1200);
  });

  it('round-trips cached input tokens through deserialization', () => {
    const id = new ObjectId();
    const doc: AIUsageDocument = {
      _id: id,
      userId: 'user-1',
      projectId: 'project-1',
      operation: 'rewrite',
      provider: 'OpenAI',
      model: 'gpt-4o',
      inputTokens: 800,
      outputTokens: 210,
      cachedInputTokens: 640,
      durationMs: 1000,
      createdAt: new Date(),
    };

    const record = deserializeAIUsage(doc);

    expect(record.getCachedInputTokens()).toBe(640);
  });

  it('deserializes legacy documents without cachedInputTokens as null', () => {
    const doc = {
      _id: new ObjectId(),
      userId: 'user-1',
      projectId: 'project-1',
      operation: 'rewrite',
      provider: 'OpenAI',
      model: 'gpt-4o',
      inputTokens: 800,
      outputTokens: 210,
      durationMs: 1000,
      createdAt: new Date(),
    } as AIUsageDocument;

    const record = deserializeAIUsage(doc);

    expect(record.getCachedInputTokens()).toBeNull();
  });
});
