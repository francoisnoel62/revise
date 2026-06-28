// ABOUTME: Tests profile-driven CSS emitted for paged preview and export.
// ABOUTME: Ensures passerelle typography does not alias the print-ready embedded font.

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
});
