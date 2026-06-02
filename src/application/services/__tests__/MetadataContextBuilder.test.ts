// ABOUTME: Unit tests for MetadataContextBuilder service
// ABOUTME: Validates typed synthesis context building from structuredData, graceful fallbacks

import { describe, it, expect, vi } from 'vitest';
import { MetadataContextBuilder } from '../MetadataContextBuilder';

const makeMetadata = (typeKey: string, structuredData: string | null) => ({
  getTypeKey: () => typeKey,
  getStructuredData: () => structuredData,
});

const mockRepo = (items: ReturnType<typeof makeMetadata>[]) => ({
  findByProjectId: vi.fn().mockResolvedValue(items),
  create: vi.fn(),
  findById: vi.fn(),
  findByProjectAndType: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  deleteByProjectId: vi.fn(),
  deleteAllByOwner: vi.fn(),
});

const narrative = { narratorType: 'Third person', focalization: 'Internal', temporality: 'Past', chapterStructure: '', narrativeVoice: ['Irony'], summary: '' };
const stylisticDNA = { registerAndLexicon: 'Literary', syntax: 'Complex', figuresOfStyle: '', ticsAndSignatures: '', rhythmAndBreathing: 'Slow', writingRules: ['Rule 1'], summary: '' };
const worldbuilding = { explicitThemes: 'Love', implicitThemes: '', symbolism: '', subtext: '', worldview: '', intertextuality: '', spatiotemporalSetting: '', atmosphere: 'Gloomy', worldRules: 'No magic', socialContext: '', immersionDetails: '', coherence: '', summary: '' };
const chapterSummaries = { chapters: [{ chapterNumber: 1, chapterTitle: 'Ch 1', summary: 'Summary 1' }], overallArc: 'Arc' };

describe('MetadataContextBuilder', () => {
  describe('buildForSynthesis', () => {
    it('should return the 5 analysis types without chapterSummaries', async () => {
      const repo = mockRepo([
        makeMetadata('narrative-analysis', JSON.stringify(narrative)),
        makeMetadata('stylistic-dna', JSON.stringify(stylisticDNA)),
        makeMetadata('worldbuilding', JSON.stringify(worldbuilding)),
        makeMetadata('chapter-summaries', JSON.stringify(chapterSummaries)), // ignored
      ]);
      const builder = new MetadataContextBuilder(repo as never);
      const ctx = await builder.buildForSynthesis('u1', 'p1');

      expect(ctx.narrative).toEqual(narrative);
      expect(ctx.stylisticDNA).toEqual(stylisticDNA);
      expect(ctx.worldbuilding).toEqual(worldbuilding);
      expect((ctx as Record<string, unknown>).chapterSummaries).toBeUndefined();
    });

    it('should return partial context when some types are missing', async () => {
      const repo = mockRepo([
        makeMetadata('narrative-analysis', JSON.stringify(narrative)),
      ]);
      const builder = new MetadataContextBuilder(repo as never);
      const ctx = await builder.buildForSynthesis('u1', 'p1');

      expect(ctx.narrative).toEqual(narrative);
      expect(ctx.stylisticDNA).toBeUndefined();
      expect(ctx.worldbuilding).toBeUndefined();
    });
  });

  describe('graceful fallbacks', () => {
    it('should skip metadata with invalid JSON in structuredData', async () => {
      const repo = mockRepo([
        makeMetadata('narrative-analysis', 'not valid json{{{'),
        makeMetadata('stylistic-dna', JSON.stringify(stylisticDNA)),
      ]);
      const builder = new MetadataContextBuilder(repo as never);
      const ctx = await builder.buildForSynthesis('u1', 'p1');

      expect(ctx.narrative).toBeUndefined();
      expect(ctx.stylisticDNA).toEqual(stylisticDNA);
    });

    it('should not throw when the repository rejects', async () => {
      const repo = { findByProjectId: vi.fn().mockRejectedValue(new Error('DB down')) };
      const builder = new MetadataContextBuilder(repo as never);
      const ctx = await builder.buildForSynthesis('u1', 'p1');

      expect(ctx).toEqual({});
    });

    it('should return empty context when all structuredData are null', async () => {
      const repo = mockRepo([
        makeMetadata('narrative-analysis', null),
        makeMetadata('stylistic-dna', null),
        makeMetadata('worldbuilding', null),
      ]);
      const builder = new MetadataContextBuilder(repo as never);
      const ctx = await builder.buildForSynthesis('u1', 'p1');

      expect(Object.keys(ctx)).toHaveLength(0);
    });
  });
});
