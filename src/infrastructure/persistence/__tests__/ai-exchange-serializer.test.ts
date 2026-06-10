// ABOUTME: Tests for AIExchange <-> MongoDB serialization with content encryption
// ABOUTME: Verifies content is encrypted at rest, round-trips, and summaries omit content

import { describe, it, expect } from 'vitest';
import { ObjectId } from 'mongodb';
import { AIExchange } from '@/domain/entities/AIExchange';
import { FieldEncryption } from '@/infrastructure/security/FieldEncryption';
import {
  serializeAIExchange,
  deserializeAIExchange,
  toAIExchangeSummary,
} from '../ai-exchange-serializer';

const encryption = new FieldEncryption('0'.repeat(64));

function build() {
  return AIExchange.create({
    id: new ObjectId().toHexString(),
    userId: 'user-1',
    projectId: 'project-1',
    usageRecordId: 'usage-1',
    operation: 'rewrite',
    provider: 'Anthropic',
    model: 'claude-sonnet',
    systemPrompt: 'Tu es un assistant',
    input: 'Texte sensible de l’auteur',
    output: 'Réponse brute de l’IA',
    inputTokens: 1500,
    outputTokens: 420,
    costEur: 0.02,
    durationMs: 2500,
    retentionDays: 30,
  });
}

describe('ai-exchange-serializer', () => {
  it('encrypts the content fields at rest', () => {
    const doc = serializeAIExchange(build(), encryption);

    expect(doc.systemPrompt).not.toContain('assistant');
    expect(doc.input).not.toContain('sensible');
    expect(doc.output).not.toContain('Réponse');
  });

  it('round-trips content through encryption', () => {
    const doc = serializeAIExchange(build(), encryption);
    const restored = deserializeAIExchange(doc, encryption);

    expect(restored.getSystemPrompt()).toBe('Tu es un assistant');
    expect(restored.getInput()).toBe('Texte sensible de l’auteur');
    expect(restored.getOutput()).toBe('Réponse brute de l’IA');
    expect(restored.getCostEur()).toBe(0.02);
  });

  it('produces a summary without any content fields', () => {
    const doc = serializeAIExchange(build(), encryption);
    const summary = toAIExchangeSummary(doc);

    expect(summary).not.toHaveProperty('systemPrompt');
    expect(summary).not.toHaveProperty('input');
    expect(summary).not.toHaveProperty('output');
    expect(summary.operation).toBe('rewrite');
    expect(summary.costEur).toBe(0.02);
  });
});
