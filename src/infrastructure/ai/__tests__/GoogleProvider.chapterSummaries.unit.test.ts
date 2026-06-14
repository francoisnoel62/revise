// ABOUTME: Unit tests for GoogleProvider.generateChapterSummaries
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

const VALID_CHAPTER_SUMMARIES = {
  chapters: [
    {
      chapterNumber: 1,
      chapterTitle: 'Le départ',
      summary: 'Alice quitte sa ville natale.',
    },
    {
      chapterNumber: 2,
      chapterTitle: "L'arrivée",
      summary: 'Alice découvre la grande ville.',
    },
  ],
  overallArc: "Un parcours d'émancipation en deux temps.",
};

describe('GoogleProvider.generateChapterSummaries', () => {
  let mockPromptRepo: PromptRepository;
  let provider: GoogleProvider;

  beforeEach(() => {
    vi.clearAllMocks();
    mockGenerateContent.mockResolvedValue({ text: JSON.stringify(VALID_CHAPTER_SUMMARIES) });
    mockPromptRepo = {
      getChapterSummariesPrompt: vi.fn().mockResolvedValue('Test prompt'),
    } as unknown as PromptRepository;
    provider = new GoogleProvider('test-key', mockPromptRepo, 'gemini-3-flash-preview');
  });

  const getConfig = () => mockGenerateContent.mock.calls[0][0].config;

  it('parses a valid chapter summaries response', async () => {
    const result = await provider.generateChapterSummaries('Texte à analyser');

    expect(result.chapters).toHaveLength(2);
    expect(result.chapters[0].chapterNumber).toBe(1);
    expect(result.chapters[0].chapterTitle).toBe('Le départ');
    expect(result.overallArc).toBe(VALID_CHAPTER_SUMMARIES.overallArc);
  });

  it('caps thinking so the JSON output is not truncated', async () => {
    // Gemini 3 defaults to "high" thinking, which consumes maxOutputTokens
    // before emitting the JSON and truncates the response mid-string.
    await provider.generateChapterSummaries('Texte à analyser');

    const config = getConfig();
    expect(config.thinkingConfig).toEqual({ thinkingLevel: 'MINIMAL' });
  });
});
