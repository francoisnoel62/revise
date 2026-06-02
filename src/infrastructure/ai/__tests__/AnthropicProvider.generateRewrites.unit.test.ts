// ABOUTME: Unit tests for AnthropicProvider.generateRewrites with metadata injection
// ABOUTME: Verifies buildAuthorProfileSection inserts correct content into system prompt

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AnthropicProvider } from '../AnthropicProvider';
import type { PromptRepository } from '@/domain/interfaces/PromptRepository';
import Anthropic from '@anthropic-ai/sdk';
import { StylisticDNA } from '@/domain/value-objects/StylisticDNA';
import { NarrativeAnalysis } from '@/domain/value-objects/NarrativeAnalysis';

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

const stylisticDNA: StylisticDNA = {
  registerAndLexicon: 'Registre littéraire soutenu',
  syntax: 'Phrases complexes',
  figuresOfStyle: 'Métaphores filées',
  ticsAndSignatures: 'Points de suspension',
  rhythmAndBreathing: 'Rythme lent et contemplatif',
  writingRules: ['FAIRE: phrases longues', 'ÉVITER: adverbes', 'FAIRE: images concrètes', 'ÉVITER: clichés', 'FAIRE: verbes forts', 'ÉVITER: passif (rule 6 — should be truncated)'],
  summary: 'Style introspectif',
};

const narrative: NarrativeAnalysis = {
  narratorType: 'Narrateur à la troisième personne omniscient',
  focalization: 'Focalisation interne',
  temporality: 'Passé',
  chapterStructure: 'Scènes courtes',
  narrativeVoice: ['Mélancolique'],
  summary: '',
};

describe('AnthropicProvider.generateRewrites — metadata injection', () => {
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

  describe('without metadata', () => {
    it('should not include PROFIL STYLISTIQUE when metadata is undefined', async () => {
      await provider.generateRewrites('text', 'context');
      expect(getSystemPrompt()).not.toContain('PROFIL STYLISTIQUE');
    });

    it('should not include PROFIL STYLISTIQUE when metadata is empty object', async () => {
      await provider.generateRewrites('text', 'context', {});
      expect(getSystemPrompt()).not.toContain('PROFIL STYLISTIQUE');
    });

    it('should still contain INTERDITS ABSOLUS and FORMAT DE SORTIE in correct order', async () => {
      await provider.generateRewrites('text');
      const prompt = getSystemPrompt();
      const interditsPos = prompt.indexOf('INTERDITS ABSOLUS');
      const formatPos = prompt.indexOf('FORMAT DE SORTIE');
      expect(interditsPos).toBeGreaterThan(-1);
      expect(formatPos).toBeGreaterThan(interditsPos);
    });
  });

  describe('with stylisticDNA', () => {
    it('should include PROFIL STYLISTIQUE section', async () => {
      await provider.generateRewrites('text', undefined, { stylisticDNA });
      expect(getSystemPrompt()).toContain('PROFIL STYLISTIQUE');
    });

    it('should include registerAndLexicon', async () => {
      await provider.generateRewrites('text', undefined, { stylisticDNA });
      expect(getSystemPrompt()).toContain('Registre littéraire soutenu');
    });

    it('should include rhythmAndBreathing', async () => {
      await provider.generateRewrites('text', undefined, { stylisticDNA });
      expect(getSystemPrompt()).toContain('Rythme lent et contemplatif');
    });

    it('should truncate writingRules to 5 maximum', async () => {
      await provider.generateRewrites('text', undefined, { stylisticDNA });
      const prompt = getSystemPrompt();
      // The 6th rule "ÉVITER: passif (rule 6...)" should NOT be in the prompt
      expect(prompt).not.toContain('rule 6 — should be truncated');
    });

    it('should include first 5 writing rules', async () => {
      await provider.generateRewrites('text', undefined, { stylisticDNA });
      const prompt = getSystemPrompt();
      expect(prompt).toContain('FAIRE: phrases longues');
      expect(prompt).toContain('ÉVITER: adverbes');
      expect(prompt).toContain('FAIRE: images concrètes');
      expect(prompt).toContain('ÉVITER: clichés');
      expect(prompt).toContain('FAIRE: verbes forts');
    });

    it('should be inserted between INTERDITS ABSOLUS and FORMAT DE SORTIE', async () => {
      await provider.generateRewrites('text', undefined, { stylisticDNA });
      const prompt = getSystemPrompt();
      const interditsPos = prompt.indexOf('INTERDITS ABSOLUS');
      const profilPos = prompt.indexOf('PROFIL STYLISTIQUE');
      const formatPos = prompt.indexOf('FORMAT DE SORTIE');
      expect(interditsPos).toBeLessThan(profilPos);
      expect(profilPos).toBeLessThan(formatPos);
    });
  });

  describe('with narrative', () => {
    it('should include narratorType in system prompt', async () => {
      await provider.generateRewrites('text', undefined, { narrative });
      expect(getSystemPrompt()).toContain('Narrateur à la troisième personne omniscient');
    });

    it('should include focalization in system prompt', async () => {
      await provider.generateRewrites('text', undefined, { narrative });
      expect(getSystemPrompt()).toContain('Focalisation interne');
    });
  });

  describe('with both stylisticDNA and narrative', () => {
    it('should include all fields', async () => {
      await provider.generateRewrites('text', undefined, { stylisticDNA, narrative });
      const prompt = getSystemPrompt();
      expect(prompt).toContain('PROFIL STYLISTIQUE');
      expect(prompt).toContain('Registre littéraire soutenu');
      expect(prompt).toContain('Narrateur à la troisième personne omniscient');
    });

    it('should mention VOIX AMPLIFIÉE calibration', async () => {
      await provider.generateRewrites('text', undefined, { stylisticDNA });
      expect(getSystemPrompt()).toContain('VOIX AMPLIFIÉE');
    });
  });

  describe('writingRules edge cases', () => {
    it('should not include rules section when writingRules is empty', async () => {
      const dnaNoRules: StylisticDNA = { ...stylisticDNA, writingRules: [] };
      await provider.generateRewrites('text', undefined, { stylisticDNA: dnaNoRules });
      expect(getSystemPrompt()).not.toContain("RÈGLES D'ÉCRITURE");
    });

    it('should show all rules when fewer than 5', async () => {
      const dnaFewRules: StylisticDNA = { ...stylisticDNA, writingRules: ['Rule A', 'Rule B'] };
      await provider.generateRewrites('text', undefined, { stylisticDNA: dnaFewRules });
      const prompt = getSystemPrompt();
      expect(prompt).toContain('Rule A');
      expect(prompt).toContain('Rule B');
    });
  });
});
