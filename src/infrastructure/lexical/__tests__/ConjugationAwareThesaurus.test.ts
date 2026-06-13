// ABOUTME: Tests for ConjugationAwareThesaurus — verifies synonyms for conjugated verbs
// ABOUTME: Mocks the base Thesaurus and Morphology to isolate the re-inflection logic

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConjugationAwareThesaurus } from '../ConjugationAwareThesaurus';
import type { Thesaurus } from '@/domain/interfaces/Thesaurus';
import type { Morphology } from '@/domain/interfaces/Morphology';

const baseLookup = vi.fn();
const lemmatize = vi.fn();
const inflectBatch = vi.fn();

const base = { lookup: baseLookup } as unknown as Thesaurus;
const morphology = { lemmatize, inflectBatch } as unknown as Morphology;

describe('ConjugationAwareThesaurus', () => {
  let thesaurus: ConjugationAwareThesaurus;

  beforeEach(() => {
    vi.clearAllMocks();
    thesaurus = new ConjugationAwareThesaurus(base, morphology);
  });

  it('re-inflects synonyms to match a conjugated verb', async () => {
    lemmatize.mockResolvedValue([{ lemma: 'regarder', cgram: 'VER', morphs: ['ind:imp:3s'] }]);
    baseLookup.mockResolvedValue(['observer', 'scruter', 'épier']);
    inflectBatch.mockResolvedValue(
      new Map([
        ['observer', 'observait'],
        ['scruter', 'scrutait'],
        ['épier', 'épiait'],
      ])
    );

    const result = await thesaurus.lookup('regardait');

    expect(baseLookup).toHaveBeenCalledWith('regarder');
    expect(inflectBatch).toHaveBeenCalledWith(['observer', 'scruter', 'épier'], 'VER', 'ind:imp:3s');
    expect(result).toEqual(['observait', 'scrutait', 'épiait']);
  });

  it('preserves the synonym order when re-inflecting', async () => {
    lemmatize.mockResolvedValue([{ lemma: 'regarder', cgram: 'VER', morphs: ['ind:imp:3s'] }]);
    baseLookup.mockResolvedValue(['scruter', 'observer']);
    inflectBatch.mockResolvedValue(
      new Map([
        ['observer', 'observait'],
        ['scruter', 'scrutait'],
      ])
    );

    const result = await thesaurus.lookup('regardait');

    expect(result).toEqual(['scrutait', 'observait']);
  });

  it('drops synonyms that cannot be re-inflected', async () => {
    lemmatize.mockResolvedValue([{ lemma: 'regarder', cgram: 'VER', morphs: ['ind:imp:3s'] }]);
    baseLookup.mockResolvedValue(['observer', 'scruter']);
    inflectBatch.mockResolvedValue(new Map([['observer', 'observait']]));

    const result = await thesaurus.lookup('regardait');

    expect(result).toEqual(['observait']);
  });

  it('falls back to infinitive synonyms when nothing can be re-inflected', async () => {
    lemmatize.mockResolvedValue([{ lemma: 'regarder', cgram: 'VER', morphs: ['ind:imp:3s'] }]);
    baseLookup.mockResolvedValue(['observer', 'scruter']);
    inflectBatch.mockResolvedValue(new Map());

    const result = await thesaurus.lookup('regardait');

    expect(result).toEqual(['observer', 'scruter']);
  });

  it('uses a plain lookup for an infinitive (word equals its lemma)', async () => {
    lemmatize.mockResolvedValue([{ lemma: 'regarder', cgram: 'VER', morphs: ['inf:'] }]);
    baseLookup.mockResolvedValue(['observer', 'scruter']);

    const result = await thesaurus.lookup('regarder');

    expect(result).toEqual(['observer', 'scruter']);
    expect(inflectBatch).not.toHaveBeenCalled();
  });

  it('uses a plain lookup when the word is not a known verb form', async () => {
    lemmatize.mockResolvedValue([{ lemma: 'maison', cgram: 'NOM', morphs: ['pl'] }]);
    baseLookup.mockResolvedValue(['demeure']);

    const result = await thesaurus.lookup('maisons');

    expect(baseLookup).toHaveBeenCalledWith('maisons');
    expect(result).toEqual(['demeure']);
    expect(inflectBatch).not.toHaveBeenCalled();
  });

  it('uses a plain lookup when the form is unknown to the morphology', async () => {
    lemmatize.mockResolvedValue([]);
    baseLookup.mockResolvedValue([]);

    await thesaurus.lookup('zzzzz');

    expect(baseLookup).toHaveBeenCalledWith('zzzzz');
  });

  it('de-duplicates re-inflected forms across lemmas', async () => {
    lemmatize.mockResolvedValue([
      { lemma: 'finir', cgram: 'VER', morphs: ['ind:imp:3s'] },
      { lemma: 'achever', cgram: 'VER', morphs: ['ind:imp:3s'] },
    ]);
    baseLookup.mockResolvedValue(['terminer']);
    inflectBatch.mockResolvedValue(new Map([['terminer', 'terminait']]));

    const result = await thesaurus.lookup('finissait');

    expect(result).toEqual(['terminait']);
  });

  it('returns an empty array for empty input without touching collaborators', async () => {
    const result = await thesaurus.lookup('   ');

    expect(result).toEqual([]);
    expect(lemmatize).not.toHaveBeenCalled();
    expect(baseLookup).not.toHaveBeenCalled();
  });
});
