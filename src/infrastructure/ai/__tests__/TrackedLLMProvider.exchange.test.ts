// ABOUTME: Tests for AIExchange content logging within TrackedLLMProvider
// ABOUTME: Verifies opt-in gating, content capture, metrics snapshot, and graceful skipping

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TrackedLLMProvider } from '../TrackedLLMProvider';
import { LLMProvider } from '@/domain/interfaces/LLMProvider';
import { AIUsageRepository } from '@/domain/interfaces/AIUsageRepository';
import { AIExchangeRepository } from '@/domain/interfaces/AIExchangeRepository';
import { IdGenerator } from '@/domain/interfaces/IdGenerator';
import { AIUsageRecord } from '@/domain/entities/AIUsageRecord';
import { AIExchange } from '@/domain/entities/AIExchange';
import { RewriteProposal } from '@/domain/value-objects/RewriteProposal';

function buildMockProvider(): LLMProvider {
  return {
    generateRewrites: vi
      .fn()
      .mockResolvedValue([new RewriteProposal('r1', 'épuré')]),
    testConnection: vi.fn(),
    getProviderName: vi.fn().mockReturnValue('Anthropic'),
    getModel: vi.fn().mockReturnValue('claude-sonnet-4-5-20250929'),
    getLastTokenUsage: vi
      .fn()
      .mockReturnValue({ inputTokens: 100, outputTokens: 50, cachedInputTokens: null }),
    getLastExchange: vi.fn().mockReturnValue({
      systemPrompt: 'Tu es un assistant',
      input: 'Texte envoyé',
      output: 'Réponse brute',
    }),
  } as unknown as LLMProvider;
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 10));

describe('TrackedLLMProvider exchange logging', () => {
  let mockProvider: LLMProvider;
  let usageRepo: AIUsageRepository;
  let exchangeRepo: AIExchangeRepository;
  let idGenerator: IdGenerator;

  beforeEach(() => {
    mockProvider = buildMockProvider();
    usageRepo = {
      save: vi.fn().mockImplementation((r: AIUsageRecord) => Promise.resolve(r)),
      findByProject: vi.fn(),
      getStatsByProject: vi.fn(),
      getDailyUsageByProject: vi.fn(),
      getStatsForUser: vi.fn(),
      deleteAllByOwner: vi.fn(),
    };
    exchangeRepo = {
      save: vi.fn().mockImplementation((e: AIExchange) => Promise.resolve(e)),
      findByOwner: vi.fn(),
      findById: vi.fn(),
      deleteAllByOwner: vi.fn(),
      ensureIndexes: vi.fn(),
    };
    idGenerator = { generate: vi.fn().mockReturnValue('generated-id') };
  });

  it('does not log content when no exchange repository is wired (back-compat)', async () => {
    const tracked = new TrackedLLMProvider(
      mockProvider,
      usageRepo,
      idGenerator,
      'user-1',
      'project-1'
    );

    await tracked.generateRewrites('text');
    await flush();

    expect(usageRepo.save).toHaveBeenCalled();
    expect(exchangeRepo.save).not.toHaveBeenCalled();
  });

  it('does not log content when logging is disabled', async () => {
    const tracked = new TrackedLLMProvider(
      mockProvider,
      usageRepo,
      idGenerator,
      'user-1',
      'project-1',
      exchangeRepo,
      { enabled: false, retentionDays: 30 }
    );

    await tracked.generateRewrites('text');
    await flush();

    expect(exchangeRepo.save).not.toHaveBeenCalled();
  });

  it('logs the captured exchange with content and metrics snapshot when enabled', async () => {
    const tracked = new TrackedLLMProvider(
      mockProvider,
      usageRepo,
      idGenerator,
      'user-1',
      'project-1',
      exchangeRepo,
      { enabled: true, retentionDays: 30 }
    );

    await tracked.generateRewrites('text');
    await flush();

    expect(exchangeRepo.save).toHaveBeenCalledTimes(1);
    const exchange = (exchangeRepo.save as ReturnType<typeof vi.fn>).mock
      .calls[0][0] as AIExchange;
    expect(exchange.getOperation()).toBe('rewrite');
    expect(exchange.getInput()).toBe('Texte envoyé');
    expect(exchange.getOutput()).toBe('Réponse brute');
    expect(exchange.getSystemPrompt()).toBe('Tu es un assistant');
    expect(exchange.getInputTokens()).toBe(100);
    expect(exchange.getUserId()).toBe('user-1');
  });

  it('skips content logging when the provider does not capture exchanges', async () => {
    vi.mocked(mockProvider).getLastExchange = vi.fn().mockReturnValue(null);
    const tracked = new TrackedLLMProvider(
      mockProvider,
      usageRepo,
      idGenerator,
      'user-1',
      'project-1',
      exchangeRepo,
      { enabled: true, retentionDays: 30 }
    );

    await tracked.generateRewrites('text');
    await flush();

    expect(usageRepo.save).toHaveBeenCalled();
    expect(exchangeRepo.save).not.toHaveBeenCalled();
  });

  it('does not log content for a failed call', async () => {
    vi.mocked(mockProvider.generateRewrites).mockRejectedValueOnce(
      new Error('API error')
    );
    const tracked = new TrackedLLMProvider(
      mockProvider,
      usageRepo,
      idGenerator,
      'user-1',
      'project-1',
      exchangeRepo,
      { enabled: true, retentionDays: 30 }
    );

    await expect(tracked.generateRewrites('text')).rejects.toThrow('API error');
    await flush();

    expect(exchangeRepo.save).not.toHaveBeenCalled();
  });
});
