// ABOUTME: Unit tests for AnthropicProvider.enhanceCompletionPrompt worldbuilding injection
// ABOUTME: Verifies worldRules and atmosphere are injected and guarded correctly

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AnthropicProvider } from '../AnthropicProvider';
import type { PromptRepository } from '@/domain/interfaces/PromptRepository';
import Anthropic from '@anthropic-ai/sdk';
import { Worldbuilding } from '@/domain/value-objects/Worldbuilding';

vi.mock('@anthropic-ai/sdk', () => {
  return { default: vi.fn() };
});

const worldbuilding: Worldbuilding = {
  explicitThemes: 'Liberté',
  implicitThemes: '',
  symbolism: '',
  subtext: '',
  worldview: '',
  intertextuality: '',
  spatiotemporalSetting: 'Royaume médiéval fantastique',
  atmosphere: 'Brume perpétuelle, lumière froide et bleutée',
  worldRules: 'La magie est interdite au nord du fleuve Kyr',
  socialContext: '',
  immersionDetails: '',
  coherence: '',
  summary: '',
};

describe('AnthropicProvider.generateCompletion — worldbuilding injection', () => {
  let mockClient: { messages: { create: ReturnType<typeof vi.fn>; stream: ReturnType<typeof vi.fn> } };
  let mockPromptRepo: PromptRepository;
  let provider: AnthropicProvider;

  beforeEach(() => {
    vi.clearAllMocks();

    mockClient = {
      messages: {
        create: vi.fn().mockResolvedValue({
          content: [{ type: 'text', text: 'completed text' }],
          stop_reason: 'end_turn',
        }),
        stream: vi.fn().mockReturnValue({
          [Symbol.asyncIterator]: () => ({ next: async () => ({ done: true, value: undefined }) }),
        }),
      },
    };
    vi.mocked(Anthropic).mockImplementation(function (this: unknown) {
      return mockClient as unknown as InstanceType<typeof Anthropic>;
    } as unknown as typeof Anthropic);

    mockPromptRepo = {
      getCompletionPrompt: vi.fn().mockResolvedValue('Base completion prompt'),
    } as unknown as PromptRepository;

    provider = new AnthropicProvider('test-key', mockPromptRepo, 'claude-sonnet-4-5-20250929');
  });

  const getSystemPrompt = (): string =>
    mockClient.messages.create.mock.calls[0][0].system as string;

  describe('without worldbuilding', () => {
    it('should not include [MÉTADONNÉES - UNIVERS] when metadata is undefined', async () => {
      await provider.generateCompletion('text before');
      expect(getSystemPrompt()).not.toContain('[MÉTADONNÉES - UNIVERS]');
    });

    it('should not include [MÉTADONNÉES - UNIVERS] when worldbuilding is undefined', async () => {
      await provider.generateCompletion('text', undefined, { narrative: undefined });
      expect(getSystemPrompt()).not.toContain('[MÉTADONNÉES - UNIVERS]');
    });

    it('should not include [MÉTADONNÉES - UNIVERS] when worldRules and atmosphere are both empty', async () => {
      const emptyWorldbuilding: Worldbuilding = {
        ...worldbuilding,
        worldRules: '',
        atmosphere: '',
      };
      await provider.generateCompletion('text', undefined, { worldbuilding: emptyWorldbuilding });
      expect(getSystemPrompt()).not.toContain('[MÉTADONNÉES - UNIVERS]');
    });
  });

  describe('with worldbuilding', () => {
    it('should include [MÉTADONNÉES - UNIVERS] when worldRules is provided', async () => {
      await provider.generateCompletion('text', undefined, { worldbuilding });
      expect(getSystemPrompt()).toContain('[MÉTADONNÉES - UNIVERS]');
    });

    it('should include worldRules content', async () => {
      await provider.generateCompletion('text', undefined, { worldbuilding });
      expect(getSystemPrompt()).toContain('La magie est interdite au nord du fleuve Kyr');
    });

    it('should include atmosphere content', async () => {
      await provider.generateCompletion('text', undefined, { worldbuilding });
      expect(getSystemPrompt()).toContain('Brume perpétuelle, lumière froide et bleutée');
    });

    it('should include [MÉTADONNÉES - UNIVERS] when only atmosphere is provided', async () => {
      const onlyAtmosphere: Worldbuilding = { ...worldbuilding, worldRules: '' };
      await provider.generateCompletion('text', undefined, { worldbuilding: onlyAtmosphere });
      expect(getSystemPrompt()).toContain('[MÉTADONNÉES - UNIVERS]');
      expect(getSystemPrompt()).toContain('Atmosphère:');
    });

    it('should include [MÉTADONNÉES - UNIVERS] when only worldRules is provided', async () => {
      const onlyRules: Worldbuilding = { ...worldbuilding, atmosphere: '' };
      await provider.generateCompletion('text', undefined, { worldbuilding: onlyRules });
      expect(getSystemPrompt()).toContain('[MÉTADONNÉES - UNIVERS]');
      expect(getSystemPrompt()).toContain('Règles du monde:');
    });

    it('should not include atmosphere line when atmosphere is empty', async () => {
      const noAtmosphere: Worldbuilding = { ...worldbuilding, atmosphere: '' };
      await provider.generateCompletion('text', undefined, { worldbuilding: noAtmosphere });
      expect(getSystemPrompt()).not.toContain('Atmosphère:');
    });
  });

  describe('existing metadata types unchanged', () => {
    it('should still inject stylisticDNA when provided', async () => {
      const stylisticDNA = {
        registerAndLexicon: 'Literary register',
        syntax: 'Complex',
        figuresOfStyle: '',
        ticsAndSignatures: '',
        rhythmAndBreathing: 'Slow rhythm',
        writingRules: [],
        summary: '',
      };
      await provider.generateCompletion('text', undefined, { stylisticDNA });
      expect(getSystemPrompt()).toContain('[MÉTADONNÉES - STYLE]');
      expect(getSystemPrompt()).toContain('Literary register');
    });

    it('should still inject narrative when provided', async () => {
      const narrative = {
        narratorType: 'Third person',
        focalization: 'External',
        temporality: 'Past',
        chapterStructure: '',
        narrativeVoice: [],
        summary: '',
      };
      await provider.generateCompletion('text', undefined, { narrative });
      expect(getSystemPrompt()).toContain('[MÉTADONNÉES - NARRATION]');
      expect(getSystemPrompt()).toContain('Third person');
    });

    it('should inject all metadata types when all provided', async () => {
      const narrative = {
        narratorType: 'Third person',
        focalization: 'External',
        temporality: 'Past',
        chapterStructure: '',
        narrativeVoice: [],
        summary: '',
      };
      await provider.generateCompletion('text', undefined, { narrative, worldbuilding });
      const prompt = getSystemPrompt();
      expect(prompt).toContain('[MÉTADONNÉES - NARRATION]');
      expect(prompt).toContain('[MÉTADONNÉES - UNIVERS]');
    });
  });
});
