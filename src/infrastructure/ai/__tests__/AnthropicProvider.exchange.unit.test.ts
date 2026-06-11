// ABOUTME: Unit tests for AnthropicProvider exchange content capture
// ABOUTME: Verifies getLastExchange reflects the system prompt, input, and raw output sent/received

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AnthropicProvider } from '../AnthropicProvider';
import { PromptRepository } from '@/domain/interfaces/PromptRepository';

vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: class {
      messages = {
        create: vi.fn(),
      };
    },
  };
});

const mockPromptRepository = {} as unknown as PromptRepository;

function rewritesResponse() {
  return {
    usage: { input_tokens: 10, output_tokens: 5 },
    content: [
      { type: 'thinking', thinking: 'reflexion interne' },
      {
        type: 'text',
        text: JSON.stringify({
          proposals: [
            { content: 'V1', styleLabel: 'épuré' },
            { content: 'V2', styleLabel: 'lyrique' },
            { content: 'V3', styleLabel: 'amplifié' },
          ],
        }),
      },
    ],
  };
}

describe('AnthropicProvider exchange capture', () => {
  let provider: AnthropicProvider;
  let mockCreate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    provider = new AnthropicProvider('fake-api-key', mockPromptRepository, 'claude-sonnet-4-5-20250929');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockCreate = (provider as any).client.messages.create;
    mockCreate.mockClear();
  });

  it('returns null before any API call', () => {
    expect(provider.getLastExchange()).toBeNull();
  });

  it('captures the system prompt, the transmitted input, and the raw output', async () => {
    mockCreate.mockResolvedValue(rewritesResponse());

    await provider.generateRewrites('Le héros marche.', 'Contexte du chapitre');

    const exchange = provider.getLastExchange();
    expect(exchange).not.toBeNull();
    expect(exchange?.systemPrompt).toContain('assistant');
    expect(exchange?.input).toContain('Le héros marche.');
    expect(exchange?.input).toContain('Contexte du chapitre');
    // Raw output is the JSON returned by the model, not the thinking block.
    expect(exchange?.output).toContain('proposals');
    expect(exchange?.output).not.toContain('reflexion interne');
  });
});
