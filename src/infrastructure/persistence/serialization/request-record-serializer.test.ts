// ABOUTME: Tests for AIRequestRecord serializer
// ABOUTME: Verifies serialize/deserialize roundtrip for MongoDB persistence

import { AIRequestRecord } from '@/domain/entities/AIRequestRecord';
import { serializeRequestRecord, deserializeRequestRecord } from './request-record-serializer';

const makeRecord = (): AIRequestRecord =>
  AIRequestRecord.create(
    'rec-001',
    'user-001',
    'project-001',
    'chapter_generation',
    'Anthropic',
    'claude-sonnet-4-5-20250929',
    {
      systemPrompt: 'You are a writing assistant.',
      userMessage: 'Write the next chapter.',
      humanReadableSummary: 'Génération complète du chapitre',
    },
    {
      entries: [
        {
          typeKey: 'narrative-analysis',
          label: 'Analyse Narrative',
          present: true,
          summary: 'Narrateur omniscient...',
          colorCode: '#8b5cf6',
        },
        {
          typeKey: 'plot',
          label: 'Intrigue',
          present: false,
          colorCode: '#f97316',
        },
      ],
      totalAvailable: 1,
      totalPossible: 6,
    },
    {
      temperature: null,
      maxTokens: 4096,
      thinkingBudget: 6144,
      thinkingEnabled: true,
    },
    1500,
    800,
    12000,
    'Il était une fois dans un pays lointain...'
  );

describe('request-record-serializer', () => {
  describe('serializeRequestRecord', () => {
    it('should serialize all fields correctly', () => {
      const record = makeRecord();
      const doc = serializeRequestRecord(record);

      expect(doc._id).toBe('rec-001');
      expect(doc.userId).toBe('user-001');
      expect(doc.projectId).toBe('project-001');
      expect(doc.operation).toBe('chapter_generation');
      expect(doc.provider).toBe('Anthropic');
      expect(doc.model).toBe('claude-sonnet-4-5-20250929');
      expect(doc.prompt.systemPrompt).toBe('You are a writing assistant.');
      expect(doc.prompt.humanReadableSummary).toBe('Génération complète du chapitre');
      expect(doc.analysisContext.totalAvailable).toBe(1);
      expect(doc.analysisContext.totalPossible).toBe(6);
      expect(doc.analysisContext.entries).toHaveLength(2);
      expect(doc.parameters.temperature).toBeNull();
      expect(doc.parameters.maxTokens).toBe(4096);
      expect(doc.parameters.thinkingBudget).toBe(6144);
      expect(doc.parameters.thinkingEnabled).toBe(true);
      expect(doc.inputTokens).toBe(1500);
      expect(doc.outputTokens).toBe(800);
      expect(doc.durationMs).toBe(12000);
      expect(doc.responsePreview).toBe('Il était une fois dans un pays lointain...');
      expect(doc.createdAt).toBeInstanceOf(Date);
    });

    it('should handle absent analyses without summary', () => {
      const record = makeRecord();
      const doc = serializeRequestRecord(record);
      const absentEntry = doc.analysisContext.entries.find((e) => !e.present);

      expect(absentEntry?.summary).toBeUndefined();
    });
  });

  describe('deserializeRequestRecord', () => {
    it('should reconstruct record from document', () => {
      const record = makeRecord();
      const doc = serializeRequestRecord(record);
      const reconstructed = deserializeRequestRecord(doc);

      expect(reconstructed.getId()).toBe('rec-001');
      expect(reconstructed.getUserId()).toBe('user-001');
      expect(reconstructed.getProjectId()).toBe('project-001');
      expect(reconstructed.getOperation()).toBe('chapter_generation');
      expect(reconstructed.getProvider()).toBe('Anthropic');
      expect(reconstructed.getModel()).toBe('claude-sonnet-4-5-20250929');
      expect(reconstructed.getPrompt().humanReadableSummary).toBe('Génération complète du chapitre');
      expect(reconstructed.getAnalysisContext().totalAvailable).toBe(1);
      expect(reconstructed.getParameters().thinkingEnabled).toBe(true);
      expect(reconstructed.getInputTokens()).toBe(1500);
      expect(reconstructed.getOutputTokens()).toBe(800);
      expect(reconstructed.getTotalTokens()).toBe(2300);
      expect(reconstructed.getDurationMs()).toBe(12000);
      expect(reconstructed.getResponsePreview()).toBe('Il était une fois dans un pays lointain...');
    });

    it('should handle null token counts', () => {
      const record = AIRequestRecord.create(
        'rec-002',
        'user-001',
        'project-001',
        'chapter_generation',
        'Anthropic',
        'model',
        { systemPrompt: '', userMessage: '', humanReadableSummary: 'Test' },
        { entries: [], totalAvailable: 0, totalPossible: 6 },
        { temperature: 0.75, maxTokens: 2048, thinkingBudget: 0, thinkingEnabled: false },
        null,
        null,
        5000,
        'Preview'
      );
      const doc = serializeRequestRecord(record);
      const reconstructed = deserializeRequestRecord(doc);

      expect(reconstructed.getInputTokens()).toBeNull();
      expect(reconstructed.getOutputTokens()).toBeNull();
      expect(reconstructed.getTotalTokens()).toBeNull();
    });

    it('should be a lossless roundtrip for analysis context entries', () => {
      const record = makeRecord();
      const doc = serializeRequestRecord(record);
      const reconstructed = deserializeRequestRecord(doc);

      const entries = reconstructed.getAnalysisContext().entries;
      expect(entries[0].typeKey).toBe('narrative-analysis');
      expect(entries[0].label).toBe('Analyse Narrative');
      expect(entries[0].present).toBe(true);
      expect(entries[0].summary).toBe('Narrateur omniscient...');
      expect(entries[0].colorCode).toBe('#8b5cf6');

      expect(entries[1].present).toBe(false);
      expect(entries[1].summary).toBeUndefined();
    });
  });
});
