// ABOUTME: Tests for ConjugationAwareThesaurus — verifies synonyms for conjugated verbs
// ABOUTME: Mocks the base Thesaurus and Morphology to isolate the re-inflection logic

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConjugationAwareThesaurus } from '../ConjugationAwareThesaurus';
import type { Thesaurus } from '@/domain/interfaces/Thesaurus';
import type { Morphology } from '@/domain/interfaces/Morphology';

const baseLookup = vi.fn();
const lemmatize = vi.fn();
const inflect = vi.fn();

const base = { lookup: baseLookup } as unknown as Thesaurus;
const morphology = { lemmatize, inflect } as unknown as Morphology;

describe('ConjugationAwareThesaurus', () => {
  let thesaurus: ConjugationAwareThesaurus;

  beforeEach(() => {
    vi.clearAllMocks();
    thesaurus = new ConjugationAwareThesaurus(base, morphology);
  });

  it('re-inflects synonyms to match a conjugated verb', async () => {
    lemmatize.mockResolvedValue([{ lemma: 'regarder', cgram: 'VER', morphs: ['ind:imp:3s'] }]);
    baseLookup.mockResolvedValue(['observer', 'scruter', 'épier']);
    inflect.mockImplementation(async (lemma: string) => `${lemma.slice(0, -2)}ait`);

    const result = await thesaurus.lookup('regardait');

    expect(baseLookup).toHaveBeenCalledWith('regarder');
    expect(result).toEqual(['observait', 'scrutait', 'épiait']);
  });

  it('drops synonyms that cannot be re-inflected', async () => {
    lemmatize.mockResolvedValue([{ lemma: 'regarder', cgram: 'VER', morphs: ['ind:imp:3s'] }]);
    baseLookup.mockResolvedValue(['observer', 'scruter']);
    inflect.mockImplementation(async (lemma: string) =>
      lemma === 'observer' ? 'observait' : null
    );

    const result = await thesaurus.lookup('regardait');

    expect(result).toEqual(['observait']);
  });

  it('falls back to infinitive synonyms when nothing can be re-inflected', async () => {
    lemmatize.mockResolvedValue([{ lemma: 'regarder', cgram: 'VER', morphs: ['ind:imp:3s'] }]);
    baseLookup.mockResolvedValue(['observer', 'scruter']);
    inflect.mockResolvedValue(null);

    const result = await thesaurus.lookup('regardait');

    expect(result).toEqual(['observer', 'scruter']);
  });

  it('uses a plain lookup for an infinitive (word equals its lemma)', async () => {
    lemmatize.mockResolvedValue([{ lemma: 'regarder', cgram: 'VER', morphs: ['inf:'] }]);
    baseLookup.mockResolvedValue(['observer', 'scruter']);

    const result = await thesaurus.lookup('regarder');

    expect(result).toEqual(['observer', 'scruter']);
    expect(inflect).not.toHaveBeenCalled();
  });

  it('uses a plain lookup when the word is not a known verb form', async () => {
    lemmatize.mockResolvedValue([{ lemma: 'maison', cgram: 'NOM', morphs: ['pl'] }]);
    baseLookup.mockResolvedValue(['demeure']);

    const result = await thesaurus.lookup('maisons');

    expect(baseLookup).toHaveBeenCalledWith('maisons');
    expect(result).toEqual(['demeure']);
    expect(inflect).not.toHaveBeenCalled();
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
    inflect.mockResolvedValue('terminait');

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
