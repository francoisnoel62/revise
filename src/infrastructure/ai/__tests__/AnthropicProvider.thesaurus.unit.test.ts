// ABOUTME: Unit tests for AnthropicProvider.suggestAlternatives
// ABOUTME: Verifies prompt construction, JSON parsing, and authorProfile injection

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AnthropicProvider } from '../AnthropicProvider';
import type { PromptRepository } from '@/domain/interfaces/PromptRepository';
import { WordAlternative } from '@/domain/value-objects/WordAlternative';
import Anthropic from '@anthropic-ai/sdk';

vi.mock('@anthropic-ai/sdk', () => {
  return { default: vi.fn() };
});

const VALID_RESPONSE = JSON.stringify({
  alternatives: [
    { word: 'épier', sceneEffect: 'installe une menace silencieuse', register: 'courant' },
    { word: 'observer', sceneEffect: 'maintient une distance neutre' },
    { word: 'scruter', sceneEffect: "accentue l'intensité du regard" },
  ],
});

describe('AnthropicProvider.suggestAlternatives', () => {
  let mockClient: { messages: { create: ReturnType<typeof vi.fn> } };
  let mockPromptRepo: PromptRepository;
  let provider: AnthropicProvider;

  beforeEach(() => {
    vi.clearAllMocks();

    mockClient = {
      messages: {
        create: vi.fn().mockResolvedValue({
          content: [{ type: 'text', text: VALID_RESPONSE }],
          stop_reason: 'end_turn',
        }),
      },
    };

    vi.mocked(Anthropic).mockImplementation(function (this: unknown) {
      return mockClient as unknown as InstanceType<typeof Anthropic>;
    } as unknown as typeof Anthropic);

    mockPromptRepo = {} as unknown as PromptRepository;
    provider = new AnthropicProvider('test-key', mockPromptRepo, 'claude-sonnet-4-5-20250929');
  });

  const getSystemPrompt = (): string =>
    mockClient.messages.create.mock.calls[0][0].system as string;

  const getUserMessage = (): string =>
    mockClient.messages.create.mock.calls[0][0].messages[0].content as string;

  it('returns WordAlternative array from valid response', async () => {
    const result = await provider.suggestAlternatives('regarder', 'Elle le regardait depuis la fenêtre.');

    expect(result).toHaveLength(3);
    expect(result[0]).toBeInstanceOf(WordAlternative);
    expect(result[0].word).toBe('épier');
    expect(result[0].sceneEffect).toBe('installe une menace silencieuse');
    expect(result[0].register).toBe('courant');
  });

  it('includes word and sentence in user message', async () => {
    await provider.suggestAlternatives('regarder', 'Elle le regardait depuis la fenêtre.');

    const userMsg = getUserMessage();
    expect(userMsg).toContain('Mot : regarder');
    expect(userMsg).toContain('Elle le regardait depuis la fenêtre.');
  });

  it('injects authorProfile into system prompt when provided', async () => {
    const profile = 'Registre épuré, phrases courtes.';
    await provider.suggestAlternatives('regarder', 'Elle le regardait.', profile);

    const system = getSystemPrompt();
    expect(system).toContain('VOIX DU PROJET');
    expect(system).toContain('Registre épuré, phrases courtes.');
  });

  it('does not include voice section when authorProfile is absent', async () => {
    await provider.suggestAlternatives('regarder', 'Elle le regardait.');

    const system = getSystemPrompt();
    expect(system).not.toContain('VOIX DU PROJET');
  });

  it('returns empty array when alternatives array is empty', async () => {
    mockClient.messages.create.mockResolvedValue({
      content: [{ type: 'text', text: JSON.stringify({ alternatives: [] }) }],
      stop_reason: 'end_turn',
    });

    const result = await provider.suggestAlternatives('mot', 'phrase');
    expect(result).toEqual([]);
  });

  it('filters out alternatives with missing word or sceneEffect', async () => {
    mockClient.messages.create.mockResolvedValue({
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            alternatives: [
              { word: 'épier', sceneEffect: 'menace' },
              { word: '', sceneEffect: 'effet' },
              { word: 'scruter' },
            ],
          }),
        },
      ],
      stop_reason: 'end_turn',
    });

    const result = await provider.suggestAlternatives('regarder', 'phrase');
    expect(result).toHaveLength(1);
    expect(result[0].word).toBe('épier');
  });

  it('throws on invalid JSON response', async () => {
    mockClient.messages.create.mockResolvedValue({
      content: [{ type: 'text', text: 'not json at all' }],
      stop_reason: 'end_turn',
    });

    await expect(
      provider.suggestAlternatives('mot', 'phrase')
    ).rejects.toThrow('Failed to parse thesaurus response from Anthropic');
  });
});
