// ABOUTME: Tests for BookCssBuilder — verifies it emits correct paged-media CSS from a PublicationProfile.
// ABOUTME: Each assertion targets a distinct CSS rule to catch any drift between profile data and CSS output.

import { describe, it, expect } from 'vitest';
import { BookCssBuilder } from './BookCssBuilder';
import { PublicationProfile } from '@/domain/value-objects/PublicationProfile';

const BASE_URL = 'http://localhost:3000';

function buildCss(profile = PublicationProfile.kdpSixByNine()): string {
  return new BookCssBuilder().build(profile, BASE_URL);
}

describe('BookCssBuilder', () => {
  describe('page geometry', () => {
    it('sets the correct page size for KDP 6×9', () => {
      const css = buildCss();
      expect(css).toContain('size: 6in 9in');
    });

    it('sets correct top and bottom margins', () => {
      const css = buildCss();
      expect(css).toContain('margin-top: 1.8cm');
      expect(css).toContain('margin-bottom: 1.8cm');
    });

    it('sets inside margin on :right page (recto)', () => {
      const css = buildCss();
      // :right = recto, inside = left
      expect(css).toContain('@page :right');
      expect(css).toMatch(/@page :right\s*\{[^}]*margin-left:\s*2cm/);
      expect(css).toMatch(/@page :right\s*\{[^}]*margin-right:\s*1\.5cm/);
    });

    it('sets inside margin on :left page (verso)', () => {
      const css = buildCss();
      // :left = verso, inside = right
      expect(css).toContain('@page :left');
      expect(css).toMatch(/@page :left\s*\{[^}]*margin-left:\s*1\.5cm/);
      expect(css).toMatch(/@page :left\s*\{[^}]*margin-right:\s*2cm/);
    });
  });

  describe('typography', () => {
    it('sets EB Garamond as body font', () => {
      const css = buildCss();
      expect(css).toContain("font-family: 'EB Garamond'");
    });

    it('sets correct body font size', () => {
      const css = buildCss();
      expect(css).toContain('font-size: 11pt');
    });

    it('sets correct line-height', () => {
      const css = buildCss();
      expect(css).toContain('line-height: 1.15');
    });

    it('sets correct first-line-indent', () => {
      const css = buildCss();
      expect(css).toContain('text-indent: 0.8cm');
    });
  });

  describe('font faces', () => {
    it('declares @font-face for regular weight', () => {
      const css = buildCss();
      expect(css).toContain('@font-face');
      expect(css).toContain('font-weight: 400');
      expect(css).toContain(`${BASE_URL}/fonts/eb-garamond-400.woff2`);
    });

    it('declares @font-face for bold weight', () => {
      const css = buildCss();
      expect(css).toContain('font-weight: 700');
      expect(css).toContain(`${BASE_URL}/fonts/eb-garamond-700.woff2`);
    });
  });

  describe('with a custom profile', () => {
    it('reflects a different page size', () => {
      const a4 = PublicationProfile.create({
        id: 'a4',
        pageWidthInches: 8.27,
        pageHeightInches: 11.69,
        marginTopCentimeters: 2.5,
        marginBottomCentimeters: 2.5,
        marginInsideCentimeters: 2.5,
        marginOutsideCentimeters: 2.5,
        bodyFontFamily: 'Arial',
        bodyFontSizePoints: 12,
        lineHeight: 1.5,
        firstLineIndentCentimeters: 0,
      });
      const css = new BookCssBuilder().build(a4, BASE_URL);
      expect(css).toContain('size: 8.27in 11.69in');
      expect(css).toContain('font-size: 12pt');
    });
  });
});
