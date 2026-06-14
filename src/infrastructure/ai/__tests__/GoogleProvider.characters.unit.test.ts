// ABOUTME: Unit tests for GoogleProvider.generateCharacters
// ABOUTME: Verifies JSON parsing and that thinking is capped so output is not truncated

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GoogleProvider } from '../GoogleProvider';
import type { PromptRepository } from '@/domain/interfaces/PromptRepository';

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

const VALID_CHARACTERS = {
  characterProfiles: [
    {
      name: 'Alice',
      identity: 'Jeune femme, 25 ans, journaliste',
      appearance: 'Cheveux roux, yeux verts',
      psychology: 'Curieuse et obstinée',
      voiceAndLanguage: 'Phrases courtes, ton incisif',
      backstory: 'Orpheline élevée par sa tante',
      relationships: 'Amie proche de Bob',
      narrativeFunction: 'Protagoniste',
      openQuestions: 'Que cache son passé ?',
    },
  ],
  relationalMap: 'Alice et Bob sont liés par une amitié ancienne.',
  narrativeHierarchy: 'Alice (principal), Bob (secondaire)',
  summary: 'Galerie centrée sur Alice et ses relations.',
};

describe('GoogleProvider.generateCharacters', () => {
  let mockPromptRepo: PromptRepository;
  let provider: GoogleProvider;

  beforeEach(() => {
    vi.clearAllMocks();
    mockGenerateContent.mockResolvedValue({ text: JSON.stringify(VALID_CHARACTERS) });
    mockPromptRepo = {
      getCharactersPrompt: vi.fn().mockResolvedValue('Test prompt'),
    } as unknown as PromptRepository;
    provider = new GoogleProvider('test-key', mockPromptRepo, 'gemini-3-flash-preview');
  });

  const getConfig = () => mockGenerateContent.mock.calls[0][0].config;

  it('parses a valid characters response', async () => {
    const result = await provider.generateCharacters('Texte à analyser');

    expect(result.characterProfiles).toHaveLength(1);
    expect(result.characterProfiles[0].name).toBe('Alice');
    expect(result.relationalMap).toBe(VALID_CHARACTERS.relationalMap);
    expect(result.summary).toBe(VALID_CHARACTERS.summary);
  });

  it('caps thinking so the JSON output is not truncated', async () => {
    // Gemini 3 defaults to "high" thinking, which consumes maxOutputTokens
    // before emitting the JSON and truncates the response mid-string.
    await provider.generateCharacters('Texte à analyser');

    const config = getConfig();
    expect(config.thinkingConfig).toEqual({ thinkingLevel: 'MINIMAL' });
  });
});
