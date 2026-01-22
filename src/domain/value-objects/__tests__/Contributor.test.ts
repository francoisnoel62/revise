// ABOUTME: Tests for Contributor value object
// ABOUTME: Verifies contributor structure and validation

import { describe, it, expect } from 'vitest';
import {
  Contributor,
  createContributor,
  isValidContributor,
  CONTRIBUTOR_ROLES,
  CONTRIBUTOR_ROLE_LABELS,
} from '../Contributor';

describe('Contributor', () => {
  describe('CONTRIBUTOR_ROLES', () => {
    it('contains expected roles', () => {
      expect(CONTRIBUTOR_ROLES).toContain('author');
      expect(CONTRIBUTOR_ROLES).toContain('editor');
      expect(CONTRIBUTOR_ROLES).toContain('illustrator');
      expect(CONTRIBUTOR_ROLES).toContain('translator');
      expect(CONTRIBUTOR_ROLES).toContain('proofreader');
      expect(CONTRIBUTOR_ROLES).toContain('beta_reader');
      expect(CONTRIBUTOR_ROLES).toContain('other');
      expect(CONTRIBUTOR_ROLES.length).toBeGreaterThanOrEqual(7);
    });
  });

  describe('CONTRIBUTOR_ROLE_LABELS', () => {
    it('has French labels for all roles', () => {
      expect(CONTRIBUTOR_ROLE_LABELS.author).toBe('Auteur');
      expect(CONTRIBUTOR_ROLE_LABELS.editor).toBe('Éditeur');
      expect(CONTRIBUTOR_ROLE_LABELS.illustrator).toBe('Illustrateur');
      expect(CONTRIBUTOR_ROLE_LABELS.translator).toBe('Traducteur');
      expect(CONTRIBUTOR_ROLE_LABELS.proofreader).toBe('Correcteur');
      expect(CONTRIBUTOR_ROLE_LABELS.beta_reader).toBe('Bêta-lecteur');
      expect(CONTRIBUTOR_ROLE_LABELS.other).toBe('Autre');
    });
  });

  describe('createContributor', () => {
    it('creates a valid contributor with name and role', () => {
      const contributor = createContributor('John Doe', 'author');
      expect(contributor.name).toBe('John Doe');
      expect(contributor.role).toBe('author');
    });

    it('trims whitespace from name', () => {
      const contributor = createContributor('  John Doe  ', 'editor');
      expect(contributor.name).toBe('John Doe');
    });

    it('throws error for empty name', () => {
      expect(() => createContributor('', 'author')).toThrow('Contributor name cannot be empty');
    });

    it('throws error for whitespace-only name', () => {
      expect(() => createContributor('   ', 'author')).toThrow('Contributor name cannot be empty');
    });

    it('throws error for invalid role', () => {
      expect(() => createContributor('John Doe', 'invalid' as any)).toThrow('Invalid contributor role');
    });
  });

  describe('isValidContributor', () => {
    it('returns true for valid contributor', () => {
      const contributor: Contributor = { name: 'John Doe', role: 'author' };
      expect(isValidContributor(contributor)).toBe(true);
    });

    it('returns false for empty name', () => {
      const contributor = { name: '', role: 'author' };
      expect(isValidContributor(contributor as Contributor)).toBe(false);
    });

    it('returns false for invalid role', () => {
      const contributor = { name: 'John Doe', role: 'invalid' };
      expect(isValidContributor(contributor as Contributor)).toBe(false);
    });

    it('returns false for missing fields', () => {
      expect(isValidContributor({} as Contributor)).toBe(false);
      expect(isValidContributor({ name: 'John' } as Contributor)).toBe(false);
      expect(isValidContributor({ role: 'author' } as Contributor)).toBe(false);
    });
  });
});
