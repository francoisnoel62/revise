// ABOUTME: Unit tests for AIContextBuilder — builds ready-to-inject AI context blocks
// ABOUTME: Validates structured projection, the "author edit wins" fallback, truncation, graceful failure

import { describe, it, expect, vi } from 'vitest';
import { AIContextBuilder } from '../AIContextBuilder';

const makeMetadata = (
  typeKey: string,
  opts: { structuredData?: string | null; edited?: boolean; contentText?: string }
) => ({
  getTypeKey: () => typeKey,
  getStructuredData: () => opts.structuredData ?? null,
  wasEditedSinceGeneration: () => opts.edited ?? false,
  getContentText: () => opts.contentText ?? '',
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
const stylisticDNA = { registerAndLexicon: 'Literary', syntax: 'Complex', figuresOfStyle: '', ticsAndSignatures: '', rhythmAndBreathing: 'Slow', writingRules: ['Rule 1', 'Rule 2'], summary: '' };
const characters = { characterProfiles: [{ name: 'Emma', identity: 'Protagonist', psychology: 'Anxious', appearance: '', voiceAndLanguage: '', backstory: '', relationships: '', narrativeFunction: '', openQuestions: '' }], relationalMap: '', narrativeHierarchy: '', summary: '' };
const plot = { initialSituation: '', incitingIncident: '', stakes: 'Life or death', dramaticQuestions: '', conflicts: 'Man vs self', narrativeThreads: '', detectedStructure: '', sceneBreakdown: [], plotState: 'Rising', possibleDirections: '', summary: '' };
const worldbuilding = { explicitThemes: 'Love', implicitThemes: '', symbolism: '', subtext: '', worldview: '', intertextuality: '', spatiotemporalSetting: '', atmosphere: 'Gloomy', worldRules: 'No magic', socialContext: '', immersionDetails: '', coherence: '', summary: '' };
const chapterSummaries = { chapters: [{ chapterNumber: 1, chapterTitle: 'Ch 1', summary: 'Summary 1' }], overallArc: 'Redemption arc' };

describe('AIContextBuilder', () => {
  describe('buildCompletionContext', () => {
    it('should project reliable structuredData with the expected labels', async () => {
      const repo = mockRepo([
        makeMetadata('stylistic-dna', { structuredData: JSON.stringify(stylisticDNA) }),
        makeMetadata('narrative-analysis', { structuredData: JSON.stringify(narrative) }),
        makeMetadata('characters', { structuredData: JSON.stringify(characters) }),
        makeMetadata('plot', { structuredData: JSON.stringify(plot) }),
        makeMetadata('worldbuilding', { structuredData: JSON.stringify(worldbuilding) }),
      ]);
      const builder = new AIContextBuilder(repo as never);
      const ctx = await builder.buildCompletionContext('u1', 'p1');

      expect(ctx).toContain('[MÉTADONNÉES - STYLE]');
      expect(ctx).toContain('Registre: Literary');
      expect(ctx).toContain('Rythme: Slow');
      expect(ctx).toContain('[MÉTADONNÉES - NARRATION]');
      expect(ctx).toContain('Point de vue: Third person');
      expect(ctx).toContain('Focalisation: Internal');
      expect(ctx).toContain('[MÉTADONNÉES - PERSONNAGES]');
      expect(ctx).toContain('- Emma: Protagonist');
      expect(ctx).toContain('[MÉTADONNÉES - INTRIGUE]');
      expect(ctx).toContain('État actuel: Rising');
      expect(ctx).toContain('[MÉTADONNÉES - UNIVERS]');
      expect(ctx).toContain('Règles du monde: No magic');
      expect(ctx).toContain('Atmosphère: Gloomy');
    });

    it('should fall back to the content text when the fiche was edited by the author', async () => {
      const repo = mockRepo([
        makeMetadata('stylistic-dna', {
          structuredData: JSON.stringify(stylisticDNA),
          edited: true,
          contentText: 'Style edité à la main par l’auteur',
        }),
      ]);
      const builder = new AIContextBuilder(repo as never);
      const ctx = await builder.buildCompletionContext('u1', 'p1');

      expect(ctx).toContain("édité par l'auteur");
      expect(ctx).toContain('Style edité à la main par l’auteur');
      expect(ctx).not.toContain('Registre: Literary');
    });

    it('should omit a type with neither reliable structuredData nor content text', async () => {
      const repo = mockRepo([
        makeMetadata('stylistic-dna', { structuredData: null, contentText: '' }),
      ]);
      const builder = new AIContextBuilder(repo as never);
      const ctx = await builder.buildCompletionContext('u1', 'p1');

      expect(ctx).toBe('');
    });

    it('should return empty string (not throw) when the repository rejects', async () => {
      const repo = { findByProjectId: vi.fn().mockRejectedValue(new Error('DB down')) };
      const builder = new AIContextBuilder(repo as never);
      const ctx = await builder.buildCompletionContext('u1', 'p1');

      expect(ctx).toBe('');
    });

    it('should truncate an over-long edited excerpt', async () => {
      const longText = 'x'.repeat(2000);
      const repo = mockRepo([
        makeMetadata('plot', { structuredData: '{}', edited: true, contentText: longText }),
      ]);
      const builder = new AIContextBuilder(repo as never);
      const ctx = await builder.buildCompletionContext('u1', 'p1');

      expect(ctx).toContain('…');
      expect(ctx.length).toBeLessThan(longText.length);
    });
  });

  describe('buildChapterContext', () => {
    it('should include chapter summaries and overall arc', async () => {
      const repo = mockRepo([
        makeMetadata('narrative-analysis', { structuredData: JSON.stringify(narrative) }),
        makeMetadata('chapter-summaries', { structuredData: JSON.stringify(chapterSummaries) }),
      ]);
      const builder = new AIContextBuilder(repo as never);
      const ctx = await builder.buildChapterContext('u1', 'p1');

      expect(ctx).toContain('--- ANALYSE NARRATIVE ---');
      expect(ctx).toContain('Temporalité: Past');
      expect(ctx).toContain('--- RÉSUMÉS DES CHAPITRES PRÉCÉDENTS ---');
      expect(ctx).toContain('Chapitre 1 (Ch 1): Summary 1');
      expect(ctx).toContain('Arc narratif global: Redemption arc');
    });
  });

  describe('buildRewriteContext', () => {
    it('should build the author profile section from reliable stylisticDNA and narrative', async () => {
      const repo = mockRepo([
        makeMetadata('stylistic-dna', { structuredData: JSON.stringify(stylisticDNA) }),
        makeMetadata('narrative-analysis', { structuredData: JSON.stringify(narrative) }),
      ]);
      const builder = new AIContextBuilder(repo as never);
      const ctx = await builder.buildRewriteContext('u1', 'p1');

      expect(ctx).toContain("PROFIL STYLISTIQUE DE L'AUTEUR");
      expect(ctx).toContain('REGISTRE ET LEXIQUE: Literary');
      expect(ctx).toContain('RYTHME: Slow');
      expect(ctx).toContain("RÈGLES D'ÉCRITURE À RESPECTER:");
      expect(ctx).toContain('POINT DE VUE: Third person');
    });

    it('should return empty string when no reliable stylistic/narrative data exists', async () => {
      const repo = mockRepo([
        makeMetadata('stylistic-dna', { structuredData: null, contentText: '' }),
      ]);
      const builder = new AIContextBuilder(repo as never);
      const ctx = await builder.buildRewriteContext('u1', 'p1');

      expect(ctx).toBe('');
    });
  });
});
