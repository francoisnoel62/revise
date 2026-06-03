// ABOUTME: Unit tests for AnthropicProvider.generateRewrites authorProfile injection
// ABOUTME: Verifies the provided authorProfile block is inserted between INTERDITS and FORMAT DE SORTIE

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AnthropicProvider } from '../AnthropicProvider';
import type { PromptRepository } from '@/domain/interfaces/PromptRepository';
import Anthropic from '@anthropic-ai/sdk';

vi.mock('@anthropic-ai/sdk', () => {
  return { default: vi.fn() };
});

const validProposalsResponse = JSON.stringify({
  proposals: [
    { content: 'Proposal A', styleLabel: 'épuré' },
    { content: 'Proposal B', styleLabel: 'lyrique' },
    { content: 'Proposal C', styleLabel: 'amplifié' },
  ],
});

const authorProfile = [
  "--- PROFIL STYLISTIQUE DE L'AUTEUR ---",
  '(Issu de l\'analyse IA du roman complet — calibre la VOIX AMPLIFIÉE)',
  '',
  'REGISTRE ET LEXIQUE: Registre littéraire soutenu',
  'RYTHME: Rythme lent et contemplatif',
].join('\n');

describe('AnthropicProvider.generateRewrites — authorProfile injection', () => {
  let mockClient: { messages: { create: ReturnType<typeof vi.fn> } };
  let mockPromptRepo: PromptRepository;
  let provider: AnthropicProvider;

  beforeEach(() => {
    vi.clearAllMocks();

    mockClient = { messages: { create: vi.fn() } };
    vi.mocked(Anthropic).mockImplementation(function (this: unknown) {
      return mockClient as unknown as InstanceType<typeof Anthropic>;
    } as unknown as typeof Anthropic);

    mockPromptRepo = {} as PromptRepository;
    provider = new AnthropicProvider('test-key', mockPromptRepo, 'claude-sonnet-4-5-20250929');

    mockClient.messages.create.mockResolvedValue({
      content: [{ type: 'text', text: validProposalsResponse }],
    });
  });

  const getSystemPrompt = (): string =>
    mockClient.messages.create.mock.calls[0][0].system as string;

  describe('without authorProfile', () => {
    it('should not include PROFIL STYLISTIQUE', async () => {
      await provider.generateRewrites('text', 'context');
      expect(getSystemPrompt()).not.toContain('PROFIL STYLISTIQUE');
    });

    it('should keep INTERDITS ABSOLUS before FORMAT DE SORTIE', async () => {
      await provider.generateRewrites('text');
      const prompt = getSystemPrompt();
      const interditsPos = prompt.indexOf('INTERDITS ABSOLUS');
      const formatPos = prompt.indexOf('FORMAT DE SORTIE');
      expect(interditsPos).toBeGreaterThan(-1);
      expect(formatPos).toBeGreaterThan(interditsPos);
    });
  });

  describe('with authorProfile', () => {
    it('should include the provided authorProfile block verbatim', async () => {
      await provider.generateRewrites('text', undefined, authorProfile);
      const prompt = getSystemPrompt();
      expect(prompt).toContain("PROFIL STYLISTIQUE DE L'AUTEUR");
      expect(prompt).toContain('REGISTRE ET LEXIQUE: Registre littéraire soutenu');
      expect(prompt).toContain('RYTHME: Rythme lent et contemplatif');
    });

    it('should insert the authorProfile between INTERDITS ABSOLUS and FORMAT DE SORTIE', async () => {
      await provider.generateRewrites('text', undefined, authorProfile);
      const prompt = getSystemPrompt();
      const interditsPos = prompt.indexOf('INTERDITS ABSOLUS');
      const profilPos = prompt.indexOf('PROFIL STYLISTIQUE');
      const formatPos = prompt.indexOf('FORMAT DE SORTIE');
      expect(interditsPos).toBeLessThan(profilPos);
      expect(profilPos).toBeLessThan(formatPos);
    });
  });
});
