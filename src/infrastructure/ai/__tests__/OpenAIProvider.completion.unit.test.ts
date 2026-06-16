// ABOUTME: Unit tests for OpenAIProvider completion params under the low-latency policy
// ABOUTME: Locks low temperature, tiny budget, and no reasoning-budget inflation

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OpenAIProvider } from '../OpenAIProvider';
import type { PromptRepository } from '@/domain/interfaces/PromptRepository';
import { AUTOCOMPLETE_POLICY } from '@/domain/value-objects/AIOperationPolicy';

vi.mock('openai', () => {
  return {
    default: class {
      chat = {
        completions: {
          create: vi.fn().mockResolvedValue({
            choices: [{ message: { content: 'completed text' } }],
          }),
        },
      };
    },
  };
});

const promptRepo = {
  getCompletionPrompt: vi.fn().mockResolvedValue('Base completion prompt'),
} as unknown as PromptRepository;

function makeProvider(model: string) {
  const provider = new OpenAIProvider('fake-key', promptRepo, model);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const create = (provider as any).client.chat.completions.create as ReturnType<typeof vi.fn>;
  create.mockClear();
  return { provider, create };
}

describe('OpenAIProvider.generateCompletion — low-latency policy', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses low temperature and a 256-token budget on a standard model', async () => {
    const { provider, create } = makeProvider('gpt-4o');
    await provider.generateCompletion('text before');

    const params = create.mock.calls[0][0];
    expect(params.temperature).toBe(AUTOCOMPLETE_POLICY.temperature);
    expect(params.max_tokens).toBe(AUTOCOMPLETE_POLICY.outputBudgetTokens);
  });

  it('does not inflate the budget for reasoning models (no 16000)', async () => {
    const { provider, create } = makeProvider('gpt-5');
    await provider.generateCompletion('text before');

    const params = create.mock.calls[0][0];
    // Reasoning models use max_completion_tokens and omit temperature
    expect(params.max_completion_tokens).toBe(AUTOCOMPLETE_POLICY.outputBudgetTokens);
    expect(params.max_tokens).toBeUndefined();
    expect(params.temperature).toBeUndefined();
  });
});
