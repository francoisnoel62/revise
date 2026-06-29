// ABOUTME: Tests profile-driven CSS emitted for paged preview and export.
// ABOUTME: Ensures font embedding and page geometry match each profile's declaration.

import { describe, expect, it } from 'vitest';
import { PublicationProfile } from '@/domain/value-objects/PublicationProfile';
import { BookCssBuilder } from './BookCssBuilder';

describe('BookCssBuilder', () => {
  it('uses the system Arial font for the passerelle profile', () => {
    const css = new BookCssBuilder().build(
      PublicationProfile.passerelle(),
      'http://localhost:3000'
    );

    expect(css).toContain("font-family: 'Arial', sans-serif");
    expect(css).not.toContain("font-family: 'Arial';\n        src:");
  });

  it('embeds EB Garamond for KDP 6×9', () => {
    const css = new BookCssBuilder().build(
      PublicationProfile.kdpSixByNine(),
      'http://localhost:3000'
    );

    expect(css).toContain("font-family: 'EB Garamond'");
    expect(css).toContain('eb-garamond-400.woff2');
    expect(css).toContain('size: 6in 9in');
  });

  it('embeds EB Garamond for KDP 5×8 and emits the correct page size', () => {
    const css = new BookCssBuilder().build(
      PublicationProfile.fromId('kdp-5x8'),
      'http://localhost:3000'
    );

    expect(css).toContain('eb-garamond-400.woff2');
    expect(css).toContain('size: 5in 8in');
  });

  it('embeds EB Garamond for KDP 5.25×8 and emits the correct page size', () => {
    const css = new BookCssBuilder().build(
      PublicationProfile.fromId('kdp-5_25x8'),
      'http://localhost:3000'
    );

    expect(css).toContain('eb-garamond-400.woff2');
    expect(css).toContain('size: 5.25in 8in');
  });

  it('embeds EB Garamond for KDP 5.5×8.5 and emits the correct page size', () => {
    const css = new BookCssBuilder().build(
      PublicationProfile.fromId('kdp-5_5x8_5'),
      'http://localhost:3000'
    );

    expect(css).toContain('eb-garamond-400.woff2');
    expect(css).toContain('size: 5.5in 8.5in');
  });

  it('embeds EB Garamond for A5 and emits the correct page size', () => {
    const css = new BookCssBuilder().build(
      PublicationProfile.fromId('a5'),
      'http://localhost:3000'
    );

    expect(css).toContain('eb-garamond-400.woff2');
    expect(css).toContain('size: 5.83in 8.27in');
  });
});
