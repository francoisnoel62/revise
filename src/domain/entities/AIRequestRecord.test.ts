// ABOUTME: Tests for AIRequestRecord domain entity
// ABOUTME: Verifies creation, reconstruction, getters, and validation rules

import { AIRequestRecord } from './AIRequestRecord';
import { AnalysisContext } from '../value-objects/AnalysisContext';
import { GenerationParameters } from '../value-objects/GenerationParameters';
import { PromptSnapshot } from '../value-objects/PromptSnapshot';

const makePromptSnapshot = (): PromptSnapshot => ({
  systemPrompt: 'You are a creative writing assistant.',
  userMessage: 'Write the next chapter.',
  humanReadableSummary: 'Génération complète du chapitre',
});

const makeAnalysisContext = (): AnalysisContext => ({
  entries: [
    {
      typeKey: 'narrative-analysis',
      label: 'Analyse Narrative',
      present: true,
      summary: 'Narrateur omniscient...',
      colorCode: '#8b5cf6',
    },
    {
      typeKey: 'stylistic-dna',
      label: 'ADN Stylistique',
      present: false,
      colorCode: '#3b82f6',
    },
  ],
  totalAvailable: 1,
  totalPossible: 6,
});

const makeGenerationParameters = (): GenerationParameters => ({
  temperature: null,
  maxTokens: 4096,
  thinkingBudget: 6144,
  thinkingEnabled: true,
});

describe('AIRequestRecord', () => {
  describe('create', () => {
    it('should create a valid record with all properties', () => {
      const record = AIRequestRecord.create(
        'rec-001',
        'user-001',
        'project-001',
        'chapter_generation',
        'anthropic',
        'claude-3-5-sonnet-20241022',
        makePromptSnapshot(),
        makeAnalysisContext(),
        makeGenerationParameters(),
        1500,
        800,
        12000,
        'Il était une fois...'
      );

      expect(record.getId()).toBe('rec-001');
      expect(record.getUserId()).toBe('user-001');
      expect(record.getProjectId()).toBe('project-001');
      expect(record.getOperation()).toBe('chapter_generation');
      expect(record.getProvider()).toBe('anthropic');
      expect(record.getModel()).toBe('claude-3-5-sonnet-20241022');
      expect(record.getInputTokens()).toBe(1500);
      expect(record.getOutputTokens()).toBe(800);
      expect(record.getTotalTokens()).toBe(2300);
      expect(record.getDurationMs()).toBe(12000);
      expect(record.getResponsePreview()).toBe('Il était une fois...');
      expect(record.getCreatedAt()).toBeInstanceOf(Date);
    });

    it('should handle null token counts', () => {
      const record = AIRequestRecord.create(
        'rec-002',
        'user-001',
        'project-001',
        'chapter_generation',
        'anthropic',
        'claude-3-5-sonnet-20241022',
        makePromptSnapshot(),
        makeAnalysisContext(),
        makeGenerationParameters(),
        null,
        null,
        5000,
        'Preview...'
      );

      expect(record.getInputTokens()).toBeNull();
      expect(record.getOutputTokens()).toBeNull();
      expect(record.getTotalTokens()).toBeNull();
    });

    it('should handle mixed null/non-null token counts', () => {
      const record = AIRequestRecord.create(
        'rec-003',
        'user-001',
        'project-001',
        'chapter_generation',
        'anthropic',
        'claude-3-5-sonnet-20241022',
        makePromptSnapshot(),
        makeAnalysisContext(),
        makeGenerationParameters(),
        null,
        500,
        5000,
        'Preview...'
      );

      expect(record.getTotalTokens()).toBe(500);
    });

    it('should set createdAt to current time', () => {
      const before = Date.now();
      const record = AIRequestRecord.create(
        'rec-004',
        'user-001',
        'project-001',
        'chapter_generation',
        'anthropic',
        'claude-3-5-sonnet-20241022',
        makePromptSnapshot(),
        makeAnalysisContext(),
        makeGenerationParameters(),
        null,
        null,
        1000,
        'Preview...'
      );
      const after = Date.now();

      expect(record.getCreatedAt().getTime()).toBeGreaterThanOrEqual(before);
      expect(record.getCreatedAt().getTime()).toBeLessThanOrEqual(after);
    });

    it('should throw if duration is negative', () => {
      expect(() =>
        AIRequestRecord.create(
          'rec-005',
          'user-001',
          'project-001',
          'chapter_generation',
          'anthropic',
          'claude-3-5-sonnet-20241022',
          makePromptSnapshot(),
          makeAnalysisContext(),
          makeGenerationParameters(),
          null,
          null,
          -1,
          'Preview...'
        )
      ).toThrow('Duration cannot be negative');
    });

    it('should throw if input tokens are negative', () => {
      expect(() =>
        AIRequestRecord.create(
          'rec-006',
          'user-001',
          'project-001',
          'chapter_generation',
          'anthropic',
          'claude-3-5-sonnet-20241022',
          makePromptSnapshot(),
          makeAnalysisContext(),
          makeGenerationParameters(),
          -5,
          null,
          1000,
          'Preview...'
        )
      ).toThrow('Input tokens cannot be negative');
    });

    it('should throw if output tokens are negative', () => {
      expect(() =>
        AIRequestRecord.create(
          'rec-007',
          'user-001',
          'project-001',
          'chapter_generation',
          'anthropic',
          'claude-3-5-sonnet-20241022',
          makePromptSnapshot(),
          makeAnalysisContext(),
          makeGenerationParameters(),
          null,
          -3,
          1000,
          'Preview...'
        )
      ).toThrow('Output tokens cannot be negative');
    });
  });

  describe('reconstruct', () => {
    it('should reconstruct from properties with existing createdAt', () => {
      const createdAt = new Date('2024-01-15T10:00:00Z');
      const record = AIRequestRecord.reconstruct({
        id: 'rec-100',
        userId: 'user-001',
        projectId: 'project-001',
        operation: 'chapter_generation',
        provider: 'anthropic',
        model: 'claude-3-5-sonnet-20241022',
        prompt: makePromptSnapshot(),
        analysisContext: makeAnalysisContext(),
        parameters: makeGenerationParameters(),
        inputTokens: 1000,
        outputTokens: 500,
        durationMs: 8000,
        responsePreview: 'Le soleil se levait...',
        createdAt,
      });

      expect(record.getId()).toBe('rec-100');
      expect(record.getCreatedAt()).toEqual(createdAt);
      expect(record.getResponsePreview()).toBe('Le soleil se levait...');
    });
  });

  describe('getPrompt', () => {
    it('should return the prompt snapshot', () => {
      const prompt = makePromptSnapshot();
      const record = AIRequestRecord.create(
        'rec-200',
        'user-001',
        'project-001',
        'chapter_generation',
        'anthropic',
        'model',
        prompt,
        makeAnalysisContext(),
        makeGenerationParameters(),
        null,
        null,
        1000,
        'Preview...'
      );

      expect(record.getPrompt().systemPrompt).toBe(prompt.systemPrompt);
      expect(record.getPrompt().humanReadableSummary).toBe(prompt.humanReadableSummary);
    });
  });

  describe('getAnalysisContext', () => {
    it('should return the analysis context', () => {
      const context = makeAnalysisContext();
      const record = AIRequestRecord.create(
        'rec-300',
        'user-001',
        'project-001',
        'chapter_generation',
        'anthropic',
        'model',
        makePromptSnapshot(),
        context,
        makeGenerationParameters(),
        null,
        null,
        1000,
        'Preview...'
      );

      expect(record.getAnalysisContext().totalAvailable).toBe(1);
      expect(record.getAnalysisContext().totalPossible).toBe(6);
      expect(record.getAnalysisContext().entries).toHaveLength(2);
    });
  });

  describe('getParameters', () => {
    it('should return the generation parameters', () => {
      const params = makeGenerationParameters();
      const record = AIRequestRecord.create(
        'rec-400',
        'user-001',
        'project-001',
        'chapter_generation',
        'anthropic',
        'model',
        makePromptSnapshot(),
        makeAnalysisContext(),
        params,
        null,
        null,
        1000,
        'Preview...'
      );

      expect(record.getParameters().thinkingEnabled).toBe(true);
      expect(record.getParameters().maxTokens).toBe(4096);
      expect(record.getParameters().thinkingBudget).toBe(6144);
    });
  });
});
