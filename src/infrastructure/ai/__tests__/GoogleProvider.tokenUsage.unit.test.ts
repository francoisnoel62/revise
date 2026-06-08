// ABOUTME: Unit tests for GoogleProvider token usage capture
// ABOUTME: Verifies getLastTokenUsage reflects the usage of the most recent API response

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

describe('GoogleProvider token usage', () => {
  let provider: GoogleProvider;

  beforeEach(() => {
    vi.clearAllMocks();
    const mockPromptRepo = {
      getNarrativeAnalysisPrompt: vi.fn().mockResolvedValue('Test prompt'),
    } as unknown as PromptRepository;
    provider = new GoogleProvider('test-key', mockPromptRepo, 'gemini-3-flash-preview');
  });

  it('returns null before any API call', () => {
    expect(provider.getLastTokenUsage()).toBeNull();
  });

  it('captures prompt and candidate tokens from usageMetadata', async () => {
    mockGenerateContent.mockResolvedValue({
      text: rewritesText,
      usageMetadata: { promptTokenCount: 640, candidatesTokenCount: 180 },
    });

    await provider.generateRewrites('text');

    expect(provider.getLastTokenUsage()).toEqual({ inputTokens: 640, outputTokens: 180 });
  });

  it('reports null counts when the response carries no usageMetadata', async () => {
    mockGenerateContent.mockResolvedValue({ text: rewritesText });

    await provider.generateRewrites('text');

    expect(provider.getLastTokenUsage()).toEqual({ inputTokens: null, outputTokens: null });
  });
});
