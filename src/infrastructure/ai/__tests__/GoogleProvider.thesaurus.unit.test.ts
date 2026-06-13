// ABOUTME: Unit tests for GoogleProvider.suggestAlternatives
// ABOUTME: Verifies prompt construction, JSON parsing, and authorProfile injection

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GoogleProvider } from '../GoogleProvider';
import type { PromptRepository } from '@/domain/interfaces/PromptRepository';
import { WordAlternative } from '@/domain/value-objects/WordAlternative';

const mockGenerateContent = vi.fn();

vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: class {
      models = {
        generateContent: mockGenerateContent,
      };
    },
    ThinkingLevel: { NONE: 'NONE', LOW: 'LOW', MINIMAL: 'MINIMAL' },
  };
});

const VALID_RESPONSE = JSON.stringify({
  alternatives: [
    { word: 'épier', sceneEffect: 'installe une menace silencieuse', register: 'courant' },
    { word: 'observer', sceneEffect: 'maintient une distance neutre' },
    { word: 'scruter', sceneEffect: "accentue l'intensité du regard" },
  ],
});

describe('GoogleProvider.suggestAlternatives', () => {
  let mockPromptRepo: PromptRepository;
  let provider: GoogleProvider;

  beforeEach(() => {
    vi.clearAllMocks();

    mockGenerateContent.mockResolvedValue({ text: VALID_RESPONSE });

    mockPromptRepo = {} as unknown as PromptRepository;
    provider = new GoogleProvider('test-key', mockPromptRepo, 'gemini-2-flash');
  });

  const getContents = (): string =>
    mockGenerateContent.mock.calls[0][0].contents as string;

  const getConfig = () =>
    mockGenerateContent.mock.calls[0][0].config;

  it('returns WordAlternative array from valid response', async () => {
    const result = await provider.suggestAlternatives('regarder', 'Elle le regardait depuis la fenêtre.');

    expect(result).toHaveLength(3);
    expect(result[0]).toBeInstanceOf(WordAlternative);
    expect(result[0].word).toBe('épier');
    expect(result[0].sceneEffect).toBe('installe une menace silencieuse');
    expect(result[0].register).toBe('courant');
  });

  it('caps thinking so the JSON output is not truncated', async () => {
    // Gemini 3 Pro defaults to "high" thinking, which consumes maxOutputTokens
    // before emitting the JSON and truncates the response mid-string.
    await provider.suggestAlternatives('regarder', 'Elle le regardait depuis la fenêtre.');

    const config = getConfig();
    expect(config.thinkingConfig).toEqual({ thinkingLevel: 'MINIMAL' });
  });

  it('includes word and sentence in contents', async () => {
    await provider.suggestAlternatives('regarder', 'Elle le regardait depuis la fenêtre.');

    const contents = getContents();
    expect(contents).toContain('Mot : regarder');
    expect(contents).toContain('Elle le regardait depuis la fenêtre.');
  });

  it('injects authorProfile into contents when provided', async () => {
    const profile = 'Registre épuré, phrases courtes.';
    await provider.suggestAlternatives('regarder', 'Elle le regardait.', profile);

    const contents = getContents();
    expect(contents).toContain('VOIX DU PROJET');
    expect(contents).toContain('Registre épuré, phrases courtes.');
  });

  it('does not include voice section when authorProfile is absent', async () => {
    await provider.suggestAlternatives('regarder', 'Elle le regardait.');

    const contents = getContents();
    expect(contents).not.toContain('VOIX DU PROJET');
  });

  it('returns empty array when alternatives array is empty', async () => {
    mockGenerateContent.mockResolvedValue({
      text: JSON.stringify({ alternatives: [] }),
    });

    const result = await provider.suggestAlternatives('mot', 'phrase');
    expect(result).toEqual([]);
  });

  it('filters out alternatives with missing word or sceneEffect', async () => {
    mockGenerateContent.mockResolvedValue({
      text: JSON.stringify({
        alternatives: [
          { word: 'épier', sceneEffect: 'menace' },
          { word: '', sceneEffect: 'effet' },
          { word: 'scruter' },
        ],
      }),
    });

    const result = await provider.suggestAlternatives('regarder', 'phrase');
    expect(result).toHaveLength(1);
    expect(result[0].word).toBe('épier');
  });

  it('handles top-level JSON array (JSON mode shorthand from Google)', async () => {
    // When responseMimeType: 'application/json' is set, Google may return a bare array
    // instead of {"alternatives": [...]}. extractJson mangles arrays by slicing {…},{…}
    // which is invalid JSON — this test ensures the fallback parser handles it.
    mockGenerateContent.mockResolvedValue({
      text: JSON.stringify([
        { word: 'épier', sceneEffect: 'installe une menace silencieuse' },
        { word: 'observer', sceneEffect: 'maintient une distance neutre' },
      ]),
    });

    const result = await provider.suggestAlternatives('regarder', 'phrase');
    expect(result).toHaveLength(2);
    expect(result[0].word).toBe('épier');
  });

  it('throws on invalid JSON response', async () => {
    mockGenerateContent.mockResolvedValue({ text: 'not json at all' });

    await expect(
      provider.suggestAlternatives('mot', 'phrase')
    ).rejects.toThrow('Failed to parse thesaurus response from Google AI');
  });
});
