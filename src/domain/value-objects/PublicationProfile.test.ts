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

  it('restores the KDP 5×8 profile with its trim dimensions', () => {
    const profile = PublicationProfile.fromId('kdp-5x8');

    expect(profile.values).toMatchObject({
      id: 'kdp-5x8',
      pageWidthInches: 5,
      pageHeightInches: 8,
      bodyFontFamily: 'EB Garamond',
    });
  });

  it('restores the KDP 5.25×8 profile with its trim dimensions', () => {
    const profile = PublicationProfile.fromId('kdp-5_25x8');

    expect(profile.values).toMatchObject({
      id: 'kdp-5_25x8',
      pageWidthInches: 5.25,
      pageHeightInches: 8,
      bodyFontFamily: 'EB Garamond',
    });
  });

  it('restores the KDP 5.5×8.5 profile with its trim dimensions', () => {
    const profile = PublicationProfile.fromId('kdp-5_5x8_5');

    expect(profile.values).toMatchObject({
      id: 'kdp-5_5x8_5',
      pageWidthInches: 5.5,
      pageHeightInches: 8.5,
      bodyFontFamily: 'EB Garamond',
    });
  });

  it('restores the A5 profile with its trim dimensions', () => {
    const profile = PublicationProfile.fromId('a5');

    expect(profile.values).toMatchObject({
      id: 'a5',
      pageWidthInches: 5.83,
      pageHeightInches: 8.27,
      bodyFontFamily: 'EB Garamond',
    });
  });
});
