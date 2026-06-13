// ABOUTME: Unit tests for OpenAIProvider.suggestAlternatives
// ABOUTME: Verifies prompt construction, JSON parsing, and authorProfile injection

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OpenAIProvider } from '../OpenAIProvider';
import type { PromptRepository } from '@/domain/interfaces/PromptRepository';
import { WordAlternative } from '@/domain/value-objects/WordAlternative';
import OpenAI from 'openai';

vi.mock('openai', () => {
  return { default: vi.fn() };
});

const VALID_RESPONSE = JSON.stringify({
  alternatives: [
    { word: 'épier', sceneEffect: 'installe une menace silencieuse', register: 'courant' },
    { word: 'observer', sceneEffect: 'maintient une distance neutre' },
    { word: 'scruter', sceneEffect: "accentue l'intensité du regard" },
  ],
});

describe('OpenAIProvider.suggestAlternatives', () => {
  let mockClient: { chat: { completions: { create: ReturnType<typeof vi.fn> } } };
  let mockPromptRepo: PromptRepository;
  let provider: OpenAIProvider;

  beforeEach(() => {
    vi.clearAllMocks();

    mockClient = {
      chat: {
        completions: {
          create: vi.fn().mockResolvedValue({
            choices: [{ message: { content: VALID_RESPONSE } }],
            usage: { prompt_tokens: 100, completion_tokens: 50 },
          }),
        },
      },
    };

    vi.mocked(OpenAI).mockImplementation(function (this: unknown) {
      return mockClient as unknown as InstanceType<typeof OpenAI>;
    } as unknown as typeof OpenAI);

    mockPromptRepo = {} as unknown as PromptRepository;
    provider = new OpenAIProvider('test-key', mockPromptRepo, 'gpt-4o-mini');
  });

  const getSystemPrompt = (): string =>
    mockClient.chat.completions.create.mock.calls[0][0].messages[0].content as string;

  const getUserMessage = (): string =>
    mockClient.chat.completions.create.mock.calls[0][0].messages[1].content as string;

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
    mockClient.chat.completions.create.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify({ alternatives: [] }) } }],
      usage: { prompt_tokens: 10, completion_tokens: 5 },
    });

    const result = await provider.suggestAlternatives('mot', 'phrase');
    expect(result).toEqual([]);
  });

  it('filters out alternatives with missing word or sceneEffect', async () => {
    mockClient.chat.completions.create.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              alternatives: [
                { word: 'épier', sceneEffect: 'menace' },
                { word: '', sceneEffect: 'effet' },
                { word: 'scruter' },
              ],
            }),
          },
        },
      ],
      usage: { prompt_tokens: 10, completion_tokens: 5 },
    });

    const result = await provider.suggestAlternatives('regarder', 'phrase');
    expect(result).toHaveLength(1);
    expect(result[0].word).toBe('épier');
  });

  it('throws on invalid JSON response', async () => {
    mockClient.chat.completions.create.mockResolvedValue({
      choices: [{ message: { content: 'not json at all' } }],
      usage: { prompt_tokens: 10, completion_tokens: 5 },
    });

    await expect(
      provider.suggestAlternatives('mot', 'phrase')
    ).rejects.toThrow('Failed to parse thesaurus response from OpenAI');
  });
});
