// ABOUTME: Tests resolving the replacement profile id for projects stored on a removed KDP trim.
// ABOUTME: Idempotent: valid/unknown ids are left untouched, only the 3 removed trims are migrated.

import { describe, expect, it } from 'vitest';
import { resolveMigratedProfileId } from './RemovedPublicationProfileMigration';

describe('resolveMigratedProfileId', () => {
  it('migrates kdp-5x8 to kdp-6x9', () => {
    expect(resolveMigratedProfileId('kdp-5x8')).toBe('kdp-6x9');
  });

  it('migrates kdp-5_25x8 to kdp-6x9', () => {
    expect(resolveMigratedProfileId('kdp-5_25x8')).toBe('kdp-6x9');
  });

  it('migrates kdp-5_5x8_5 to kdp-6x9', () => {
    expect(resolveMigratedProfileId('kdp-5_5x8_5')).toBe('kdp-6x9');
  });

  it('returns null for a still-valid profile id (no migration needed)', () => {
    expect(resolveMigratedProfileId('kdp-6x9')).toBeNull();
    expect(resolveMigratedProfileId('a5')).toBeNull();
    expect(resolveMigratedProfileId('passerelle')).toBeNull();
  });

  it('returns null for an unrecognized id (not one of the removed trims)', () => {
    expect(resolveMigratedProfileId('some-other-value')).toBeNull();
  });
});
