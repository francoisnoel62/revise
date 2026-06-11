// ABOUTME: Unit tests for OpenAIProvider exchange content capture
// ABOUTME: Verifies getLastExchange reflects the system prompt, input, and raw output

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OpenAIProvider } from '../OpenAIProvider';
import { PromptRepository } from '@/domain/interfaces/PromptRepository';

vi.mock('openai', () => {
  return {
    default: class {
      chat = {
        completions: {
          create: vi.fn(),
        },
      };
    },
  };
});

const mockPromptRepository = {} as unknown as PromptRepository;

function rewritesCompletion() {
  return {
    usage: { prompt_tokens: 10, completion_tokens: 5 },
    choices: [
      {
        message: {
          content: JSON.stringify({
            proposals: [
              { content: 'V1', styleLabel: 'épuré' },
              { content: 'V2', styleLabel: 'lyrique' },
              { content: 'V3', styleLabel: 'amplifié' },
            ],
          }),
        },
      },
    ],
  };
}

describe('OpenAIProvider exchange capture', () => {
  let provider: OpenAIProvider;
  let mockCreate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    provider = new OpenAIProvider('fake-api-key', mockPromptRepository, 'gpt-4o');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockCreate = (provider as any).client.chat.completions.create;
    mockCreate.mockClear();
  });

  it('returns null before any API call', () => {
    expect(provider.getLastExchange()).toBeNull();
  });

  it('captures the system prompt, the transmitted input, and the raw output', async () => {
    mockCreate.mockResolvedValue(rewritesCompletion());

    await provider.generateRewrites('Le héros marche.', 'Contexte du chapitre');

    const exchange = provider.getLastExchange();
    expect(exchange).not.toBeNull();
    expect(exchange?.systemPrompt.length).toBeGreaterThan(0);
    expect(exchange?.input).toContain('Le héros marche.');
    expect(exchange?.input).toContain('Contexte du chapitre');
    expect(exchange?.output).toContain('proposals');
  });
});
