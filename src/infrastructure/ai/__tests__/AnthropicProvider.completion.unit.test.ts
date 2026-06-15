// ABOUTME: Unit tests for AnthropicProvider.generateCompletion context injection
// ABOUTME: Verifies the provider appends the pre-built projectContext block to the base prompt

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AnthropicProvider } from '../AnthropicProvider';
import type { PromptRepository } from '@/domain/interfaces/PromptRepository';
import { AUTOCOMPLETE_POLICY } from '@/domain/value-objects/AIOperationPolicy';
import Anthropic from '@anthropic-ai/sdk';

vi.mock('@anthropic-ai/sdk', () => {
  return { default: vi.fn() };
});

describe('AnthropicProvider.generateCompletion — context injection', () => {
  let mockClient: { messages: { create: ReturnType<typeof vi.fn> } };
  let mockPromptRepo: PromptRepository;
  let provider: AnthropicProvider;

  beforeEach(() => {
    vi.clearAllMocks();

    mockClient = {
      messages: {
        create: vi.fn().mockResolvedValue({
          content: [{ type: 'text', text: 'completed text' }],
          stop_reason: 'end_turn',
        }),
      },
    };
    vi.mocked(Anthropic).mockImplementation(function (this: unknown) {
      return mockClient as unknown as InstanceType<typeof Anthropic>;
    } as unknown as typeof Anthropic);

    mockPromptRepo = {
      getCompletionPrompt: vi.fn().mockResolvedValue('Base completion prompt'),
    } as unknown as PromptRepository;

    provider = new AnthropicProvider('test-key', mockPromptRepo, 'claude-sonnet-4-5-20250929');
  });

  const getSystemPrompt = (): string =>
    mockClient.messages.create.mock.calls[0][0].system as string;

  it('should use the base prompt only when no projectContext is given', async () => {
    await provider.generateCompletion('text before');
    expect(getSystemPrompt()).toBe('Base completion prompt');
  });

  it('should append the provided projectContext block to the base prompt', async () => {
    const projectContext = '\n\n[MÉTADONNÉES - UNIVERS]\nRègles du monde: La magie est interdite au nord\n';
    await provider.generateCompletion('text before', undefined, projectContext);

    const system = getSystemPrompt();
    expect(system).toContain('Base completion prompt');
    expect(system).toContain('[MÉTADONNÉES - UNIVERS]');
    expect(system).toContain('La magie est interdite au nord');
  });

  it('should not append anything for an empty projectContext', async () => {
    await provider.generateCompletion('text before', undefined, '');
    expect(getSystemPrompt()).toBe('Base completion prompt');
  });

  it('applies the low-latency completion policy (low temperature, tiny budget)', async () => {
    await provider.generateCompletion('text before');
    const params = mockClient.messages.create.mock.calls[0][0];
    expect(params.temperature).toBe(AUTOCOMPLETE_POLICY.temperature);
    expect(params.max_tokens).toBe(AUTOCOMPLETE_POLICY.outputBudgetTokens);
  });

  it('does not enable thinking on completion', async () => {
    await provider.generateCompletion('text before');
    const params = mockClient.messages.create.mock.calls[0][0];
    expect(params.thinking).toBeUndefined();
  });
});
