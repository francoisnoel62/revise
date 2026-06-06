// ABOUTME: Tests automatisés — Workflow C : Non-régression multi-providers
// ABOUTME: Vérifie que GoogleProvider et AnthropicProvider retournent exactement 3 propositions avec les bons labels

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GoogleProvider } from '@/infrastructure/ai/GoogleProvider';
import { AnthropicProvider } from '@/infrastructure/ai/AnthropicProvider';
import type { PromptRepository } from '@/domain/interfaces/PromptRepository';
import Anthropic from '@anthropic-ai/sdk';

// ─── Google ──────────────────────────────────────────────────────────────────

const mockGenerateContent = vi.fn();
const mockGenerateContentStream = vi.fn();

vi.mock('@google/genai', () => ({
  GoogleGenAI: class {
    models = {
      generateContent: mockGenerateContent,
      generateContentStream: mockGenerateContentStream,
    };
  },
}));

// ─── Anthropic ───────────────────────────────────────────────────────────────

vi.mock('@anthropic-ai/sdk', () => ({ default: vi.fn() }));

// ─── Helpers ─────────────────────────────────────────────────────────────────

const VALID_PROPOSALS = {
  proposals: [
    { content: 'Proposition épurée — style Camus', styleLabel: 'épuré' },
    { content: 'Proposition lyrique — style Duras', styleLabel: 'lyrique' },
    { content: 'Proposition amplifiée — voix intensifiée', styleLabel: 'amplifié' },
  ],
};

const mockPromptRepo = {} as PromptRepository;

// ─── Tests GoogleProvider ─────────────────────────────────────────────────────

describe('Workflow C — Non-régression providers : GoogleProvider.generateRewrites', () => {
  let provider: GoogleProvider;

  beforeEach(() => {
    vi.clearAllMocks();
    provider = new GoogleProvider('test-key', mockPromptRepo, 'gemini-3-flash-preview');
  });

  it('retourne exactement 3 propositions avec les bons styleLabel', async () => {
    mockGenerateContent.mockResolvedValue({ text: JSON.stringify(VALID_PROPOSALS) });

    const result = await provider.generateRewrites('Les mots étaient restés coincés.');

    expect(result).toHaveLength(3);
    expect(result[0].styleLabel).toBe('épuré');
    expect(result[1].styleLabel).toBe('lyrique');
    expect(result[2].styleLabel).toBe('amplifié');
  });

  it('parse le JSON encadré dans un bloc markdown ```json', async () => {
    const wrapped = `\`\`\`json\n${JSON.stringify(VALID_PROPOSALS)}\n\`\`\``;
    mockGenerateContent.mockResolvedValue({ text: wrapped });

    const result = await provider.generateRewrites('Les mots étaient restés coincés.');

    expect(result).toHaveLength(3);
    expect(result[0].content).toContain('épurée');
  });

  it('parse le JSON encadré dans un bloc markdown ``` sans annotation', async () => {
    const wrapped = `\`\`\`\n${JSON.stringify(VALID_PROPOSALS)}\n\`\`\``;
    mockGenerateContent.mockResolvedValue({ text: wrapped });

    const result = await provider.generateRewrites('Les mots étaient restés coincés.');

    expect(result).toHaveLength(3);
  });

  it('lève une erreur si le nombre de propositions n\'est pas 3', async () => {
    const twoProposals = { proposals: VALID_PROPOSALS.proposals.slice(0, 2) };
    mockGenerateContent.mockResolvedValue({ text: JSON.stringify(twoProposals) });

    await expect(provider.generateRewrites('texte')).rejects.toThrow(
      'Expected exactly 3 proposals, got 2'
    );
  });

  it('lève une erreur si la réponse n\'est pas du JSON valide', async () => {
    mockGenerateContent.mockResolvedValue({ text: 'Voici mes suggestions : ...' });

    await expect(provider.generateRewrites('texte')).rejects.toThrow(
      'Failed to parse Google AI response'
    );
  });

  it('lève une erreur si la réponse est vide', async () => {
    mockGenerateContent.mockResolvedValue({ text: '' });

    await expect(provider.generateRewrites('texte')).rejects.toThrow(
      'Empty response from Google AI'
    );
  });

  it('retourne le bon nom de provider et de modèle', () => {
    expect(provider.getProviderName()).toBe('Google AI');
    expect(provider.getModel()).toBe('gemini-3-flash-preview');
  });
});

// ─── Tests AnthropicProvider ──────────────────────────────────────────────────

describe('Workflow C — Non-régression providers : AnthropicProvider.generateRewrites', () => {
  let mockClient: { messages: { create: ReturnType<typeof vi.fn> } };
  let provider: AnthropicProvider;

  beforeEach(() => {
    vi.clearAllMocks();

    mockClient = { messages: { create: vi.fn() } };
    vi.mocked(Anthropic).mockImplementation(function (this: unknown) {
      return mockClient as unknown as InstanceType<typeof Anthropic>;
    } as unknown as typeof Anthropic);

    provider = new AnthropicProvider('test-key', mockPromptRepo, 'claude-sonnet-4-5-20250929');

    mockClient.messages.create.mockResolvedValue({
      content: [{ type: 'text', text: JSON.stringify(VALID_PROPOSALS) }],
    });
  });

  it('retourne exactement 3 propositions avec les bons styleLabel', async () => {
    const result = await provider.generateRewrites('Les mots étaient restés coincés.');

    expect(result).toHaveLength(3);
    expect(result[0].styleLabel).toBe('épuré');
    expect(result[1].styleLabel).toBe('lyrique');
    expect(result[2].styleLabel).toBe('amplifié');
  });

  it('parse le JSON encadré dans un bloc markdown ```json', async () => {
    const wrapped = `\`\`\`json\n${JSON.stringify(VALID_PROPOSALS)}\n\`\`\``;
    mockClient.messages.create.mockResolvedValue({
      content: [{ type: 'text', text: wrapped }],
    });

    const result = await provider.generateRewrites('Les mots étaient restés coincés.');

    expect(result).toHaveLength(3);
  });

  it('retourne le bon nom de provider et de modèle', () => {
    expect(provider.getProviderName()).toBe('Anthropic');
    expect(provider.getModel()).toBe('claude-sonnet-4-5-20250929');
  });
});
