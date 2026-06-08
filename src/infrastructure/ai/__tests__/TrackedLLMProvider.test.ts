// ABOUTME: Tests for TrackedLLMProvider decorator
// ABOUTME: Verifies usage tracking without modifying provider behavior

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TrackedLLMProvider } from '../TrackedLLMProvider';
import { LLMProvider } from '@/domain/interfaces/LLMProvider';
import { AIUsageRepository } from '@/domain/interfaces/AIUsageRepository';
import { IdGenerator } from '@/domain/interfaces/IdGenerator';
import { AIUsageRecord } from '@/domain/entities/AIUsageRecord';
import { RewriteProposal } from '@/domain/value-objects/RewriteProposal';
import { ChatMessage } from '@/domain/value-objects/ChatMessage';

describe('TrackedLLMProvider', () => {
  let mockProvider: LLMProvider;
  let mockRepository: AIUsageRepository;
  let mockIdGenerator: IdGenerator;
  let trackedProvider: TrackedLLMProvider;

  beforeEach(() => {
    mockProvider = {
      generateRewrites: vi.fn().mockResolvedValue([
        new RewriteProposal('rewrite 1', 'épuré'),
        new RewriteProposal('rewrite 2', 'lyrique'),
        new RewriteProposal('rewrite 3', 'amplifié'),
      ]),
      testConnection: vi.fn().mockResolvedValue({ valid: true }),
      getProviderName: vi.fn().mockReturnValue('OpenAI'),
      getModel: vi.fn().mockReturnValue('gpt-4o-mini'),
      generateNarrativeAnalysis: vi.fn().mockResolvedValue({
        narratorType: 'first-person',
        focalization: 'internal',
        temporality: 'linear',
        chapterStructure: 'scenes',
        narrativeVoice: ['intimate'],
        summary: 'A first-person narrative',
      }),
      generateStylisticDNA: vi.fn().mockResolvedValue({
        registerAndLexicon: 'informal',
        syntax: 'simple',
        figuresOfStyle: 'metaphors',
        ticsAndSignatures: 'ellipsis',
        rhythmAndBreathing: 'staccato',
        writingRules: [],
        summary: 'Informal style',
      }),
      generateCharacters: vi.fn().mockResolvedValue({
        characterProfiles: [],
        relationalMap: '',
        narrativeHierarchy: '',
        summary: '',
      }),
      generatePlot: vi.fn().mockResolvedValue({
        initialSituation: '',
        incitingIncident: '',
        stakes: '',
        dramaticQuestions: '',
        conflicts: '',
        narrativeThreads: '',
        detectedStructure: '',
        sceneBreakdown: [],
        plotState: '',
        possibleDirections: '',
        summary: '',
      }),
      generateWorldbuilding: vi.fn().mockResolvedValue({
        explicitThemes: '',
        implicitThemes: '',
        symbolism: '',
        subtext: '',
        worldview: '',
        intertextuality: '',
        spatiotemporalSetting: '',
        atmosphere: '',
        worldRules: '',
        socialContext: '',
        immersionDetails: '',
        coherence: '',
        summary: '',
      }),
      generateSynthesis: vi.fn().mockResolvedValue({
        textIdentity: '',
        keysToSuccess: '',
        characterPotentials: [],
        narrativeDirections: [],
        summary: '',
      }),
      generateChapterSummaries: vi.fn().mockResolvedValue({
        chapters: [],
        narrativeArc: '',
      }),
      generateChapter: vi.fn().mockResolvedValue({
        content: 'Generated content',
        title: 'Chapter 1',
      }),
      generateCompletion: vi.fn().mockResolvedValue('completed text'),
      generateCompletionStream: vi.fn(),
      chatStream: vi.fn(),
      generateCharacterSheet: vi.fn().mockResolvedValue({}),
    } as unknown as LLMProvider;

    mockRepository = {
      save: vi.fn().mockImplementation((record: AIUsageRecord) => Promise.resolve(record)),
      findByProject: vi.fn(),
      getStatsByProject: vi.fn(),
      getDailyUsageByProject: vi.fn(),
      getStatsForUser: vi.fn(),
      deleteAllByOwner: vi.fn(),
    };

    mockIdGenerator = {
      generate: vi.fn().mockReturnValue('generated-id'),
    };

    trackedProvider = new TrackedLLMProvider(
      mockProvider,
      mockRepository,
      mockIdGenerator,
      'user-1',
      'project-1'
    );
  });

  describe('generateRewrites', () => {
    it('delegates to wrapped provider and returns result', async () => {
      const result = await trackedProvider.generateRewrites('test text', 'context');

      expect(mockProvider.generateRewrites).toHaveBeenCalledWith('test text', 'context', undefined);
      expect(result).toHaveLength(3);
      // RewriteProposal instances have getContent method
      expect(result[0]).toBeInstanceOf(RewriteProposal);
    });

    it('passes the authorProfile block to wrapped provider', async () => {
      const authorProfile = "--- PROFIL STYLISTIQUE DE L'AUTEUR ---\nREGISTRE ET LEXIQUE: Literary";

      await trackedProvider.generateRewrites('text', 'context', authorProfile);

      expect(mockProvider.generateRewrites).toHaveBeenCalledWith('text', 'context', authorProfile);
    });

    it('records usage after successful call', async () => {
      await trackedProvider.generateRewrites('test text');

      // Wait for async recording
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockRepository.save).toHaveBeenCalled();

      const savedRecord = (mockRepository.save as ReturnType<typeof vi.fn>).mock.calls[0][0] as AIUsageRecord;
      expect(savedRecord.getOperation()).toBe('rewrite');
      expect(savedRecord.getUserId()).toBe('user-1');
      expect(savedRecord.getProjectId()).toBe('project-1');
      expect(savedRecord.getProvider()).toBe('OpenAI');
      expect(savedRecord.getModel()).toBe('gpt-4o-mini');
    });

    it('records usage even on error', async () => {
      vi.mocked(mockProvider.generateRewrites).mockRejectedValueOnce(new Error('API error'));

      await expect(trackedProvider.generateRewrites('test')).rejects.toThrow('API error');

      // Wait for async recording
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockRepository.save).toHaveBeenCalled();
    });
  });

  describe('testConnection', () => {
    it('does not record usage for connection tests', async () => {
      const result = await trackedProvider.testConnection();

      expect(result.valid).toBe(true);
      expect(mockRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('passthrough methods', () => {
    it('getProviderName returns wrapped value', () => {
      expect(trackedProvider.getProviderName()).toBe('OpenAI');
    });

    it('getModel returns wrapped value', () => {
      expect(trackedProvider.getModel()).toBe('gpt-4o-mini');
    });
  });

  describe('metadata generation tracking', () => {
    it('tracks narrative analysis', async () => {
      await trackedProvider.generateNarrativeAnalysis('full text');

      await new Promise((resolve) => setTimeout(resolve, 10));

      const savedRecord = (mockRepository.save as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(savedRecord.getOperation()).toBe('narrative_analysis');
    });

    it('tracks stylistic DNA', async () => {
      await trackedProvider.generateStylisticDNA('full text');

      await new Promise((resolve) => setTimeout(resolve, 10));

      const savedRecord = (mockRepository.save as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(savedRecord.getOperation()).toBe('stylistic_dna');
    });

    it('tracks characters', async () => {
      await trackedProvider.generateCharacters('full text');

      await new Promise((resolve) => setTimeout(resolve, 10));

      const savedRecord = (mockRepository.save as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(savedRecord.getOperation()).toBe('characters');
    });

    it('tracks plot', async () => {
      await trackedProvider.generatePlot('full text');

      await new Promise((resolve) => setTimeout(resolve, 10));

      const savedRecord = (mockRepository.save as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(savedRecord.getOperation()).toBe('plot');
    });

    it('tracks worldbuilding', async () => {
      await trackedProvider.generateWorldbuilding('full text');

      await new Promise((resolve) => setTimeout(resolve, 10));

      const savedRecord = (mockRepository.save as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(savedRecord.getOperation()).toBe('worldbuilding');
    });

    it('tracks synthesis', async () => {
      await trackedProvider.generateSynthesis('full text', {});

      await new Promise((resolve) => setTimeout(resolve, 10));

      const savedRecord = (mockRepository.save as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(savedRecord.getOperation()).toBe('synthesis');
    });
  });

  describe('chapter operations tracking', () => {
    it('tracks chapter summaries', async () => {
      await trackedProvider.generateChapterSummaries('full text');

      await new Promise((resolve) => setTimeout(resolve, 10));

      const savedRecord = (mockRepository.save as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(savedRecord.getOperation()).toBe('chapter_summaries');
    });

    it('tracks chapter generation', async () => {
      await trackedProvider.generateChapter('full text', 'beginning');

      await new Promise((resolve) => setTimeout(resolve, 10));

      const savedRecord = (mockRepository.save as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(savedRecord.getOperation()).toBe('chapter_generation');
    });
  });

  describe('completion tracking', () => {
    it('tracks completion', async () => {
      await trackedProvider.generateCompletion('text before');

      await new Promise((resolve) => setTimeout(resolve, 10));

      const savedRecord = (mockRepository.save as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(savedRecord.getOperation()).toBe('completion');
    });
  });

  describe('chatStream tracking', () => {
    it('records character_chat usage after stream completes', async () => {
      async function* fakeStream() {
        yield 'Hello';
        yield ' world';
      }
      vi.mocked(mockProvider.chatStream).mockReturnValue(fakeStream());

      const messages = [ChatMessage.create('author', 'Hi')];
      const chunks: string[] = [];
      for await (const chunk of trackedProvider.chatStream(messages, 'You are a character.')) {
        chunks.push(chunk);
      }

      expect(chunks).toEqual(['Hello', ' world']);
      expect(mockRepository.save).toHaveBeenCalled();
      const record = (mockRepository.save as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(record.getOperation()).toBe('character_chat');
    });

    it('captures token usage reported by the wrapped provider after the stream', async () => {
      async function* fakeStream() {
        yield 'Hi';
      }
      vi.mocked(mockProvider.chatStream).mockReturnValue(fakeStream());
      vi.mocked(mockProvider).getLastTokenUsage = vi
        .fn()
        .mockReturnValue({ inputTokens: 80, outputTokens: 25 });

      const messages = [ChatMessage.create('author', 'Hi')];
      for await (const _ of trackedProvider.chatStream(messages, 'persona')) { /* drain */ }

      const record = (mockRepository.save as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(record.getInputTokens()).toBe(80);
      expect(record.getOutputTokens()).toBe(25);
    });
  });

  describe('token usage capture from wrapped provider', () => {
    it('records tokens reported by the wrapped provider after a successful call', async () => {
      vi.mocked(mockProvider).getLastTokenUsage = vi
        .fn()
        .mockReturnValue({ inputTokens: 1200, outputTokens: 300 });

      await trackedProvider.generateRewrites('test text');
      await new Promise((resolve) => setTimeout(resolve, 10));

      const savedRecord = (mockRepository.save as ReturnType<typeof vi.fn>).mock.calls[0][0] as AIUsageRecord;
      expect(savedRecord.getInputTokens()).toBe(1200);
      expect(savedRecord.getOutputTokens()).toBe(300);
    });

    it('records cached input tokens reported by the wrapped provider', async () => {
      vi.mocked(mockProvider).getLastTokenUsage = vi
        .fn()
        .mockReturnValue({ inputTokens: 1200, outputTokens: 300, cachedInputTokens: 900 });

      await trackedProvider.generateRewrites('test text');
      await new Promise((resolve) => setTimeout(resolve, 10));

      const savedRecord = (mockRepository.save as ReturnType<typeof vi.fn>).mock.calls[0][0] as AIUsageRecord;
      expect(savedRecord.getCachedInputTokens()).toBe(900);
    });

    it('records null tokens when the wrapped provider reports no usage', async () => {
      vi.mocked(mockProvider).getLastTokenUsage = vi.fn().mockReturnValue(null);

      await trackedProvider.generateNarrativeAnalysis('text');
      await new Promise((resolve) => setTimeout(resolve, 10));

      const savedRecord = (mockRepository.save as ReturnType<typeof vi.fn>).mock.calls[0][0] as AIUsageRecord;
      expect(savedRecord.getInputTokens()).toBeNull();
      expect(savedRecord.getOutputTokens()).toBeNull();
    });

    it('does not attribute stale tokens to a failed call', async () => {
      vi.mocked(mockProvider).getLastTokenUsage = vi
        .fn()
        .mockReturnValue({ inputTokens: 999, outputTokens: 999 });
      vi.mocked(mockProvider.generateRewrites).mockRejectedValueOnce(new Error('API error'));

      await expect(trackedProvider.generateRewrites('test')).rejects.toThrow('API error');
      await new Promise((resolve) => setTimeout(resolve, 10));

      const savedRecord = (mockRepository.save as ReturnType<typeof vi.fn>).mock.calls[0][0] as AIUsageRecord;
      expect(savedRecord.getInputTokens()).toBeNull();
      expect(savedRecord.getOutputTokens()).toBeNull();
    });
  });

  describe('setTokenCounts', () => {
    it('stores token counts for next usage record', async () => {
      trackedProvider.setTokenCounts(100, 50);
      await trackedProvider.generateRewrites('test');

      await new Promise((resolve) => setTimeout(resolve, 10));

      const savedRecord = (mockRepository.save as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(savedRecord.getInputTokens()).toBe(100);
      expect(savedRecord.getOutputTokens()).toBe(50);
    });

    it('resets token counts after recording', async () => {
      trackedProvider.setTokenCounts(100, 50);
      await trackedProvider.generateRewrites('test');
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Second call should have null tokens
      await trackedProvider.generateNarrativeAnalysis('text');
      await new Promise((resolve) => setTimeout(resolve, 10));

      const secondRecord = (mockRepository.save as ReturnType<typeof vi.fn>).mock.calls[1][0];
      expect(secondRecord.getInputTokens()).toBeNull();
      expect(secondRecord.getOutputTokens()).toBeNull();
    });
  });
});
