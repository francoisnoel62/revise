// ABOUTME: Tests for FrenchMorphology — verifies lemmatization and re-inflection via MongoDB
// ABOUTME: Uses vi mocks for Db to avoid real database dependency

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FrenchMorphology } from '../FrenchMorphology';
import type { Db } from 'mongodb';

const formsFindOne = vi.fn();
const conjugationsFindOne = vi.fn();

const mockDb = {
  collection: vi.fn((name: string) => ({
    findOne: name === 'lexique_forms' ? formsFindOne : conjugationsFindOne,
  })),
} as unknown as Db;

describe('FrenchMorphology', () => {
  let morphology: FrenchMorphology;

  beforeEach(() => {
    vi.clearAllMocks();
    morphology = new FrenchMorphology(mockDb);
  });

  describe('lemmatize', () => {
    it('returns interpretations for a known inflected form', async () => {
      formsFindOne.mockResolvedValue({
        _id: 'regardait',
        interpretations: [{ lemma: 'regarder', cgram: 'VER', morphs: ['ind:imp:3s'] }],
      });

      const result = await morphology.lemmatize('regardait');

      expect(result).toEqual([{ lemma: 'regarder', cgram: 'VER', morphs: ['ind:imp:3s'] }]);
    });

    it('returns an empty array for an unknown form', async () => {
      formsFindOne.mockResolvedValue(null);

      expect(await morphology.lemmatize('zzzzz')).toEqual([]);
    });

    it('lowercases and trims before querying', async () => {
      formsFindOne.mockResolvedValue(null);

      await morphology.lemmatize('  Regardait  ');

      expect(formsFindOne).toHaveBeenCalledWith({ _id: 'regardait' });
    });

    it('skips the DB call for empty input', async () => {
      expect(await morphology.lemmatize('   ')).toEqual([]);
      expect(formsFindOne).not.toHaveBeenCalled();
    });

    it('queries the lexique_forms collection', async () => {
      formsFindOne.mockResolvedValue(null);
      await morphology.lemmatize('regardait');
      expect(mockDb.collection).toHaveBeenCalledWith('lexique_forms');
    });
  });

  describe('inflect', () => {
    it('returns the surface form whose morphs include the target tag', async () => {
      conjugationsFindOne.mockResolvedValue({
        _id: 'observer|VER',
        forms: [
          { morphs: ['inf:'], ortho: 'observer' },
          { morphs: ['ind:imp:3s'], ortho: 'observait' },
        ],
      });

      const result = await morphology.inflect('observer', 'VER', 'ind:imp:3s');

      expect(result).toBe('observait');
    });

    it('matches a tag inside a multi-tag form (ambiguous spelling)', async () => {
      conjugationsFindOne.mockResolvedValue({
        _id: 'observer|VER',
        forms: [{ morphs: ['ind:imp:1s', 'ind:imp:2s'], ortho: 'observais' }],
      });

      expect(await morphology.inflect('observer', 'VER', 'ind:imp:2s')).toBe('observais');
    });

    it('returns null when the lemma is unknown', async () => {
      conjugationsFindOne.mockResolvedValue(null);

      expect(await morphology.inflect('blémir', 'VER', 'ind:imp:3s')).toBeNull();
    });

    it('returns null when no form carries the target tag', async () => {
      conjugationsFindOne.mockResolvedValue({
        _id: 'observer|VER',
        forms: [{ morphs: ['inf:'], ortho: 'observer' }],
      });

      expect(await morphology.inflect('observer', 'VER', 'ind:imp:3s')).toBeNull();
    });

    it('queries the lexique_conjugations collection by lemma|cgram key', async () => {
      conjugationsFindOne.mockResolvedValue(null);

      await morphology.inflect('Observer', 'VER', 'ind:imp:3s');

      expect(mockDb.collection).toHaveBeenCalledWith('lexique_conjugations');
      expect(conjugationsFindOne).toHaveBeenCalledWith({ _id: 'observer|VER' });
    });
  });
});
