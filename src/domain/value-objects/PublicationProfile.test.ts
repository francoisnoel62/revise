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

  it('falls back to kdp-6x9 for a removed profile id instead of throwing', () => {
    const profile = PublicationProfile.fromId('kdp-5x8' as never);

    expect(profile.values).toMatchObject({
      id: 'kdp-6x9',
      pageWidthInches: 6,
      pageHeightInches: 9,
    });
  });

  it('falls back to kdp-6x9 for any unknown profile id', () => {
    const profile = PublicationProfile.fromId('unknown-profile' as never);

    expect(profile.values.id).toBe('kdp-6x9');
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
