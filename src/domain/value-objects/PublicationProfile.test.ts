// ABOUTME: Tests for PublicationProfile value object — invariants and KDP 6×9 preset.
// ABOUTME: Validates that the preset matches DocxExporter constants (single source of truth for KDP spec).

import { describe, it, expect } from 'vitest';
import { PublicationProfile } from './PublicationProfile';

// Conversion factor: twips → cm (1 twip = 1/1440 inch, 1 inch = 2.54 cm)
const TWIPS_TO_CM = 2.54 / 1440;

// DocxExporter KDP constants (source of truth — do not change these values)
const DOC_KDP_PAGE_WIDTH = 8640;    // twips → 6"
const DOC_KDP_PAGE_HEIGHT = 12960;  // twips → 9"
const DOC_KDP_MARGIN_INSIDE = 1134; // twips → ~2.0 cm
const DOC_KDP_MARGIN_OUTSIDE = 851; // twips → ~1.5 cm
const DOC_KDP_MARGIN_TOP = 1021;    // twips → ~1.8 cm
const DOC_KDP_MARGIN_BOTTOM = 1021; // twips → ~1.8 cm
const DOC_KDP_FIRST_LINE_INDENT = 454; // twips → ~0.8 cm
const DOC_KDP_LINE_SPACING = 276;   // 276/240 → 1.15×
const DOC_KDP_BODY_FONT_SIZE_HALFPT = 22; // half-points → 11 pt

describe('PublicationProfile', () => {
  describe('kdpSixByNine preset', () => {
    it('has the correct page dimensions matching DocxExporter', () => {
      const profile = PublicationProfile.kdpSixByNine();
      expect(profile.values.pageWidthInches).toBeCloseTo(DOC_KDP_PAGE_WIDTH / 1440, 4);
      expect(profile.values.pageHeightInches).toBeCloseTo(DOC_KDP_PAGE_HEIGHT / 1440, 4);
    });

    it('has the correct margins matching DocxExporter constants', () => {
      const profile = PublicationProfile.kdpSixByNine();
      const v = profile.values;
      expect(v.marginInsideCentimeters).toBeCloseTo(DOC_KDP_MARGIN_INSIDE * TWIPS_TO_CM, 2);
      expect(v.marginOutsideCentimeters).toBeCloseTo(DOC_KDP_MARGIN_OUTSIDE * TWIPS_TO_CM, 2);
      expect(v.marginTopCentimeters).toBeCloseTo(DOC_KDP_MARGIN_TOP * TWIPS_TO_CM, 2);
      expect(v.marginBottomCentimeters).toBeCloseTo(DOC_KDP_MARGIN_BOTTOM * TWIPS_TO_CM, 2);
    });

    it('has the correct typography matching DocxExporter constants', () => {
      const profile = PublicationProfile.kdpSixByNine();
      const v = profile.values;
      expect(v.bodyFontSizePoints).toBeCloseTo(DOC_KDP_BODY_FONT_SIZE_HALFPT / 2, 1);
      expect(v.lineHeight).toBeCloseTo(DOC_KDP_LINE_SPACING / 240, 3);
      expect(v.firstLineIndentCentimeters).toBeCloseTo(DOC_KDP_FIRST_LINE_INDENT * TWIPS_TO_CM, 2);
    });

    it('uses EB Garamond as body font', () => {
      const profile = PublicationProfile.kdpSixByNine();
      expect(profile.values.bodyFontFamily).toBe('EB Garamond');
    });

    it('has id kdp-6x9', () => {
      const profile = PublicationProfile.kdpSixByNine();
      expect(profile.values.id).toBe('kdp-6x9');
    });
  });

  describe('invariants', () => {
    it('throws when pageWidthInches is zero', () => {
      expect(() =>
        PublicationProfile.create({ ...validProps(), pageWidthInches: 0 })
      ).toThrow();
    });

    it('throws when pageHeightInches is negative', () => {
      expect(() =>
        PublicationProfile.create({ ...validProps(), pageHeightInches: -1 })
      ).toThrow();
    });

    it('throws when a margin is negative', () => {
      expect(() =>
        PublicationProfile.create({ ...validProps(), marginTopCentimeters: -0.1 })
      ).toThrow();
    });

    it('throws when bodyFontSizePoints is zero', () => {
      expect(() =>
        PublicationProfile.create({ ...validProps(), bodyFontSizePoints: 0 })
      ).toThrow();
    });

    it('throws when lineHeight is zero', () => {
      expect(() =>
        PublicationProfile.create({ ...validProps(), lineHeight: 0 })
      ).toThrow();
    });

    it('throws when bodyFontFamily is empty', () => {
      expect(() =>
        PublicationProfile.create({ ...validProps(), bodyFontFamily: '' })
      ).toThrow();
    });

    it('accepts a valid custom profile', () => {
      expect(() => PublicationProfile.create(validProps())).not.toThrow();
    });
  });

  describe('equality', () => {
    it('two profiles with same properties are equal', () => {
      const a = PublicationProfile.kdpSixByNine();
      const b = PublicationProfile.kdpSixByNine();
      expect(a.equals(b)).toBe(true);
    });

    it('two profiles with different ids are not equal', () => {
      const a = PublicationProfile.kdpSixByNine();
      const b = PublicationProfile.create({ ...validProps(), id: 'a4' });
      expect(a.equals(b)).toBe(false);
    });
  });
});

function validProps() {
  return {
    id: 'test',
    pageWidthInches: 6,
    pageHeightInches: 9,
    marginTopCentimeters: 1.8,
    marginBottomCentimeters: 1.8,
    marginInsideCentimeters: 2.0,
    marginOutsideCentimeters: 1.5,
    bodyFontFamily: 'EB Garamond',
    bodyFontSizePoints: 11,
    lineHeight: 1.15,
    firstLineIndentCentimeters: 0.8,
  };
}
