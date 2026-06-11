// ABOUTME: Unit tests for GoogleProvider exchange content capture
// ABOUTME: Verifies getLastExchange reflects the system prompt, input, and raw output

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GoogleProvider } from '../GoogleProvider';
import type { PromptRepository } from '@/domain/interfaces/PromptRepository';

const mockGenerateContent = vi.fn();
const mockGenerateContentStream = vi.fn();

vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: class {
      models = {
        generateContent: mockGenerateContent,
        generateContentStream: mockGenerateContentStream,
      };
    },
    ThinkingLevel: { MINIMAL: 'MINIMAL' },
  };
});

const rewritesText = JSON.stringify({
  proposals: [
    { content: 'V1', styleLabel: 'épuré' },
    { content: 'V2', styleLabel: 'lyrique' },
    { content: 'V3', styleLabel: 'amplifié' },
  ],
});

describe('GoogleProvider exchange capture', () => {
  let provider: GoogleProvider;

  beforeEach(() => {
    vi.clearAllMocks();
    const mockPromptRepo = {} as unknown as PromptRepository;
    provider = new GoogleProvider('test-key', mockPromptRepo, 'gemini-3-flash-preview');
  });

  it('returns null before any API call', () => {
    expect(provider.getLastExchange()).toBeNull();
  });

  it('captures the system prompt, the transmitted input, and the raw output', async () => {
    mockGenerateContent.mockResolvedValue({
      text: rewritesText,
      usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 5 },
    });

    await provider.generateRewrites('Le héros marche.', 'Contexte du chapitre');

    const exchange = provider.getLastExchange();
    expect(exchange).not.toBeNull();
    expect(exchange?.systemPrompt.length).toBeGreaterThan(0);
    expect(exchange?.input).toContain('Le héros marche.');
    expect(exchange?.input).toContain('Contexte du chapitre');
    expect(exchange?.output).toContain('proposals');
  });
});
