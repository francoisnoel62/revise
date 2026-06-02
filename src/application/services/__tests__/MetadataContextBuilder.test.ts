// ABOUTME: Unit tests for MetadataContextBuilder service
// ABOUTME: Validates typed context building from structuredData, graceful fallbacks

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
const characters = { characterProfiles: [{ name: 'Emma', identity: 'Protagonist', psychology: '', appearance: '', voiceAndLanguage: '', backstory: '', relationships: '', narrativeFunction: '', openQuestions: '' }], relationalMap: '', narrativeHierarchy: '', summary: '' };
const plot = { initialSituation: '', incitingIncident: '', stakes: 'Life or death', dramaticQuestions: '', conflicts: '', narrativeThreads: '', detectedStructure: '', sceneBreakdown: [], plotState: 'Rising', possibleDirections: '', summary: '' };
const worldbuilding = { explicitThemes: 'Love', implicitThemes: '', symbolism: '', subtext: '', worldview: '', intertextuality: '', spatiotemporalSetting: '', atmosphere: 'Gloomy', worldRules: 'No magic', socialContext: '', immersionDetails: '', coherence: '', summary: '' };
const chapterSummaries = { chapters: [{ chapterNumber: 1, chapterTitle: 'Ch 1', summary: 'Summary 1' }], overallArc: 'Arc' };

describe('MetadataContextBuilder', () => {
  describe('buildForRewrite', () => {
    it('should return stylisticDNA and narrative when available', async () => {
      const repo = mockRepo([
        makeMetadata('stylistic-dna', JSON.stringify(stylisticDNA)),
        makeMetadata('narrative-analysis', JSON.stringify(narrative)),
        makeMetadata('characters', JSON.stringify(characters)), // should be ignored
      ]);
      const builder = new MetadataContextBuilder(repo as never);
      const ctx = await builder.buildForRewrite('u1', 'p1');

      expect(ctx.stylisticDNA).toEqual(stylisticDNA);
      expect(ctx.narrative).toEqual(narrative);
      expect((ctx as Record<string, unknown>).characters).toBeUndefined();
    });

    it('should return empty object when no structuredData', async () => {
      const repo = mockRepo([
        makeMetadata('stylistic-dna', null),
        makeMetadata('narrative-analysis', null),
      ]);
      const builder = new MetadataContextBuilder(repo as never);
      const ctx = await builder.buildForRewrite('u1', 'p1');

      expect(ctx.stylisticDNA).toBeUndefined();
      expect(ctx.narrative).toBeUndefined();
    });

    it('should not throw when repository rejects', async () => {
      const repo = { findByProjectId: vi.fn().mockRejectedValue(new Error('DB down')) };
      const builder = new MetadataContextBuilder(repo as never);
      const ctx = await builder.buildForRewrite('u1', 'p1');

      expect(ctx).toEqual({});
    });
  });

  describe('buildForCompletion', () => {
    it('should return 5 types including worldbuilding', async () => {
      const repo = mockRepo([
        makeMetadata('narrative-analysis', JSON.stringify(narrative)),
        makeMetadata('stylistic-dna', JSON.stringify(stylisticDNA)),
        makeMetadata('characters', JSON.stringify(characters)),
        makeMetadata('plot', JSON.stringify(plot)),
        makeMetadata('worldbuilding', JSON.stringify(worldbuilding)),
        makeMetadata('chapter-summaries', JSON.stringify(chapterSummaries)), // should be ignored
      ]);
      const builder = new MetadataContextBuilder(repo as never);
      const ctx = await builder.buildForCompletion('u1', 'p1');

      expect(ctx.narrative).toEqual(narrative);
      expect(ctx.stylisticDNA).toEqual(stylisticDNA);
      expect(ctx.characters).toEqual(characters);
      expect(ctx.plot).toEqual(plot);
      expect(ctx.worldbuilding).toEqual(worldbuilding);
      expect((ctx as Record<string, unknown>).chapterSummaries).toBeUndefined();
    });

    it('should return partial context when some types missing', async () => {
      const repo = mockRepo([
        makeMetadata('narrative-analysis', JSON.stringify(narrative)),
      ]);
      const builder = new MetadataContextBuilder(repo as never);
      const ctx = await builder.buildForCompletion('u1', 'p1');

      expect(ctx.narrative).toEqual(narrative);
      expect(ctx.stylisticDNA).toBeUndefined();
      expect(ctx.worldbuilding).toBeUndefined();
    });
  });

  describe('buildForChapterGeneration', () => {
    it('should return 6 types including chapterSummaries', async () => {
      const repo = mockRepo([
        makeMetadata('narrative-analysis', JSON.stringify(narrative)),
        makeMetadata('stylistic-dna', JSON.stringify(stylisticDNA)),
        makeMetadata('characters', JSON.stringify(characters)),
        makeMetadata('plot', JSON.stringify(plot)),
        makeMetadata('worldbuilding', JSON.stringify(worldbuilding)),
        makeMetadata('chapter-summaries', JSON.stringify(chapterSummaries)),
      ]);
      const builder = new MetadataContextBuilder(repo as never);
      const ctx = await builder.buildForChapterGeneration('u1', 'p1');

      expect(ctx.narrative).toEqual(narrative);
      expect(ctx.chapterSummaries).toEqual(chapterSummaries);
      expect(ctx.worldbuilding).toEqual(worldbuilding);
    });
  });

  describe('buildForSynthesis', () => {
    it('should return 5 types without chapterSummaries', async () => {
      const repo = mockRepo([
        makeMetadata('narrative-analysis', JSON.stringify(narrative)),
        makeMetadata('worldbuilding', JSON.stringify(worldbuilding)),
        makeMetadata('chapter-summaries', JSON.stringify(chapterSummaries)), // ignored
      ]);
      const builder = new MetadataContextBuilder(repo as never);
      const ctx = await builder.buildForSynthesis('u1', 'p1');

      expect(ctx.narrative).toEqual(narrative);
      expect(ctx.worldbuilding).toEqual(worldbuilding);
      expect((ctx as Record<string, unknown>).chapterSummaries).toBeUndefined();
    });
  });

  describe('graceful fallbacks', () => {
    it('should skip metadata with invalid JSON in structuredData', async () => {
      const repo = mockRepo([
        makeMetadata('narrative-analysis', 'not valid json{{{'),
        makeMetadata('stylistic-dna', JSON.stringify(stylisticDNA)),
      ]);
      const builder = new MetadataContextBuilder(repo as never);
      const ctx = await builder.buildForRewrite('u1', 'p1');

      expect(ctx.narrative).toBeUndefined();
      expect(ctx.stylisticDNA).toEqual(stylisticDNA);
    });

    it('should return empty context when all structuredData are null', async () => {
      const repo = mockRepo([
        makeMetadata('narrative-analysis', null),
        makeMetadata('stylistic-dna', null),
        makeMetadata('characters', null),
        makeMetadata('plot', null),
        makeMetadata('worldbuilding', null),
      ]);
      const builder = new MetadataContextBuilder(repo as never);
      const ctx = await builder.buildForCompletion('u1', 'p1');

      expect(Object.keys(ctx)).toHaveLength(0);
    });
  });
});
