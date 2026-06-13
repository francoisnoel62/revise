// ABOUTME: Tests for JeuxDeMotsThesaurus — verifies MongoDB lookup and edge cases
// ABOUTME: Uses vi mocks for Db to avoid real database dependency

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { JeuxDeMotsThesaurus } from '../JeuxDeMotsThesaurus';
import type { Db } from 'mongodb';

const mockFindOne = vi.fn();

const mockCollection = {
  findOne: mockFindOne,
};

const mockDb = {
  collection: vi.fn().mockReturnValue(mockCollection),
} as unknown as Db;

describe('JeuxDeMotsThesaurus', () => {
  let thesaurus: JeuxDeMotsThesaurus;

  beforeEach(() => {
    vi.clearAllMocks();
    thesaurus = new JeuxDeMotsThesaurus(mockDb);
  });

  describe('lookup', () => {
    it('returns synonyms for a known word', async () => {
      const synonyms = ['observer', 'scruter', 'épier', 'contempler'];
      mockFindOne.mockResolvedValue({ _id: 'regarder', synonyms });

      const result = await thesaurus.lookup('regarder');

      expect(result).toEqual(synonyms);
    });

    it('returns empty array for an unknown word', async () => {
      mockFindOne.mockResolvedValue(null);

      const result = await thesaurus.lookup('blémir');

      expect(result).toEqual([]);
    });

    it('normalizes word to lowercase before querying', async () => {
      mockFindOne.mockResolvedValue(null);

      await thesaurus.lookup('REGARDER');

      expect(mockFindOne).toHaveBeenCalledWith({ _id: 'regarder' });
    });

    it('trims whitespace before querying', async () => {
      mockFindOne.mockResolvedValue(null);

      await thesaurus.lookup('  regarder  ');

      expect(mockFindOne).toHaveBeenCalledWith({ _id: 'regarder' });
    });

    it('returns empty array and skips DB call for empty string', async () => {
      const result = await thesaurus.lookup('');

      expect(result).toEqual([]);
      expect(mockFindOne).not.toHaveBeenCalled();
    });

    it('returns empty array and skips DB call for whitespace-only input', async () => {
      const result = await thesaurus.lookup('   ');

      expect(result).toEqual([]);
      expect(mockFindOne).not.toHaveBeenCalled();
    });

    it('queries the jdm_synonyms collection', () => {
      expect(mockDb.collection).toHaveBeenCalledWith('jdm_synonyms');
    });
  });
});
