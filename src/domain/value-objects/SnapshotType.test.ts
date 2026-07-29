// ABOUTME: Tests for the SnapshotType value object
// ABOUTME: Verifies the valid provenance values for a project snapshot

import { describe, it, expect } from 'vitest';
import { SNAPSHOT_TYPES, isValidSnapshotType } from './SnapshotType';

describe('SnapshotType', () => {
  it('lists manual, automatic, restore, and safety as the valid types', () => {
    expect(SNAPSHOT_TYPES).toEqual(['manual', 'automatic', 'restore', 'safety']);
  });

  it('accepts each declared type', () => {
    for (const type of SNAPSHOT_TYPES) {
      expect(isValidSnapshotType(type)).toBe(true);
    }
  });

  it('rejects an unknown type', () => {
    expect(isValidSnapshotType('draft')).toBe(false);
  });
});
