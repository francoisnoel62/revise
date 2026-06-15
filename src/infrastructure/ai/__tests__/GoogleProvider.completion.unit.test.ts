// ABOUTME: Unit tests for GoogleProvider completion params under the low-latency policy
// ABOUTME: Locks low temperature, tiny budget, and minimal thinking level

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GoogleProvider } from '../GoogleProvider';
import type { PromptRepository } from '@/domain/interfaces/PromptRepository';
import { AUTOCOMPLETE_POLICY } from '@/domain/value-objects/AIOperationPolicy';
import { ThinkingLevel } from '@google/genai';

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
    ThinkingLevel: { MINIMAL: 'MINIMAL', LOW: 'LOW', MEDIUM: 'MEDIUM', HIGH: 'HIGH' },
  };
});

describe('GoogleProvider.generateCompletion — low-latency policy', () => {
  let provider: GoogleProvider;

  beforeEach(() => {
    vi.clearAllMocks();
    const promptRepo = {
      getCompletionPrompt: vi.fn().mockResolvedValue('Base completion prompt'),
    } as unknown as PromptRepository;
    provider = new GoogleProvider('test-key', promptRepo, 'gemini-3-flash-preview');
    mockGenerateContent.mockResolvedValue({ text: 'completed text' });
  });

  it('applies low temperature, a 256-token budget and minimal thinking', async () => {
    await provider.generateCompletion('text before');

    const config = mockGenerateContent.mock.calls[0][0].config;
    expect(config.temperature).toBe(AUTOCOMPLETE_POLICY.temperature);
    expect(config.maxOutputTokens).toBe(AUTOCOMPLETE_POLICY.outputBudgetTokens);
    expect(config.thinkingConfig.thinkingLevel).toBe(ThinkingLevel.MINIMAL);
  });
});
