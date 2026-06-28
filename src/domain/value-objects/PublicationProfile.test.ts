// ABOUTME: Verifies publication profiles exposed to the editor and paged renderer.
// ABOUTME: Covers identifier restoration and profile-specific rendering constraints.

import { describe, expect, it } from 'vitest';
import { PublicationProfile } from './PublicationProfile';

describe('PublicationProfile', () => {
  it('restores the passerelle profile with its A4 rendering constraints', () => {
    const profile = PublicationProfile.fromId('passerelle');

    expect(profile.values).toMatchObject({
      id: 'passerelle',
      pageWidthInches: 8.27,
      pageHeightInches: 11.69,
      bodyFontFamily: 'Arial',
      bodyFontSizePoints: 12,
    });
  });
});
