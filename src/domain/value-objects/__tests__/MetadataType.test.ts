import { describe, it, expect } from 'vitest';
import { isValidMetadataType, getMetadataType, METADATA_TYPES } from '../MetadataType';

describe('MetadataType', () => {
  describe('isValidMetadataType', () => {
    it('should return true for valid type', () => {
      expect(isValidMetadataType('narrative-analysis')).toBe(true);
    });

    it('should return false for invalid type', () => {
      expect(isValidMetadataType('invalid-type')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isValidMetadataType('')).toBe(false);
    });
  });

  describe('getMetadataType', () => {
    it('should return type definition for valid key', () => {
      const type = getMetadataType('narrative-analysis');
      expect(type).toBeDefined();
      expect(type?.key).toBe('narrative-analysis');
      expect(type?.name).toBe('Analyse Narrative');
      expect(type?.description).toBe('Point de vue, structure narrative, temporalité, voix');
      expect(type?.isBuiltIn).toBe(true);
    });

    it('should return undefined for invalid key', () => {
      expect(getMetadataType('invalid')).toBeUndefined();
    });

    it('should return undefined for empty string', () => {
      expect(getMetadataType('')).toBeUndefined();
    });
  });

  describe('METADATA_TYPES', () => {
    it('should have narrative-analysis as built-in', () => {
      expect(METADATA_TYPES['narrative-analysis']).toBeDefined();
      expect(METADATA_TYPES['narrative-analysis'].isBuiltIn).toBe(true);
    });

    it('should have correct structure for narrative-analysis', () => {
      const type = METADATA_TYPES['narrative-analysis'];
      expect(type.key).toBe('narrative-analysis');
      expect(type.name).toBe('Analyse Narrative');
      expect(typeof type.description).toBe('string');
      expect(type.isBuiltIn).toBe(true);
    });
  });
});
