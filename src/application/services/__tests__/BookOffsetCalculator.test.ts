// ABOUTME: Tests for BookOffsetCalculator — verifies book-wide page number computation.
// ABOUTME: Covers single chapters, odd-page alignment, cascading offsets, and unknown page counts.

import { describe, expect, it } from 'vitest';
import { computeBookOffsets } from '../BookOffsetCalculator';

describe('computeBookOffsets', () => {
  it('assigns page 1 to the sole chapter', () => {
    const chapters = [{ id: 'ch1' }];
    const cache = new Map([['ch1', 10]]);
    expect(computeBookOffsets(chapters, cache).get('ch1')).toBe(1);
  });

  it('assigns page 1 to the first chapter even without a page count', () => {
    const chapters = [{ id: 'ch1' }, { id: 'ch2' }];
    const cache = new Map<string, number>();
    expect(computeBookOffsets(chapters, cache).get('ch1')).toBe(1);
  });

  it('chapter 2 starts on next odd page when chapter 1 ends on an even page', () => {
    // ch1: 10 pages → ends on page 10 (even) → ch2 starts at page 11 (odd ✓)
    const chapters = [{ id: 'ch1' }, { id: 'ch2' }];
    const cache = new Map([['ch1', 10], ['ch2', 5]]);
    expect(computeBookOffsets(chapters, cache).get('ch2')).toBe(11);
  });

  it('inserts blank page when chapter 1 ends on an odd page', () => {
    // ch1: 9 pages → ends on page 9 (odd) → blank page 10 → ch2 starts at 11 (odd ✓)
    const chapters = [{ id: 'ch1' }, { id: 'ch2' }];
    const cache = new Map([['ch1', 9], ['ch2', 5]]);
    expect(computeBookOffsets(chapters, cache).get('ch2')).toBe(11);
  });

  it('chapter 2 starts at page 3 when chapter 1 has exactly 1 page', () => {
    // ch1: 1 page → ends on page 1 (odd) → blank page 2 → ch2 starts at 3 (odd ✓)
    const chapters = [{ id: 'ch1' }, { id: 'ch2' }];
    const cache = new Map([['ch1', 1], ['ch2', 4]]);
    expect(computeBookOffsets(chapters, cache).get('ch2')).toBe(3);
  });

  it('chapter 2 starts at page 3 when chapter 1 has 2 pages', () => {
    // ch1: 2 pages → ends on page 2 (even) → ch2 starts at 3 (odd ✓)
    const chapters = [{ id: 'ch1' }, { id: 'ch2' }];
    const cache = new Map([['ch1', 2], ['ch2', 4]]);
    expect(computeBookOffsets(chapters, cache).get('ch2')).toBe(3);
  });

  it('computes cascading offsets for a 3-chapter book', () => {
    // ch1: 10 pages → ends at 10 (even) → ch2 starts at 11
    // ch2: 5 pages  → ends at 15 (odd)  → blank 16 → ch3 starts at 17
    // ch3: 3 pages  → ends at 19 (odd)
    const chapters = [{ id: 'ch1' }, { id: 'ch2' }, { id: 'ch3' }];
    const cache = new Map([['ch1', 10], ['ch2', 5], ['ch3', 3]]);
    const offsets = computeBookOffsets(chapters, cache);
    expect(offsets.get('ch1')).toBe(1);
    expect(offsets.get('ch2')).toBe(11);
    expect(offsets.get('ch3')).toBe(17);
  });

  it('computes cascading offsets for a 5-chapter book mimicking a real novel', () => {
    // ch1: 20 pages → ends at 20 (even) → ch2 starts at 21
    // ch2: 18 pages → ends at 38 (even) → ch3 starts at 39
    // ch3: 15 pages → ends at 53 (odd)  → blank 54 → ch4 starts at 55
    // ch4: 22 pages → ends at 76 (even) → ch5 starts at 77
    const chapters = [
      { id: 'ch1' }, { id: 'ch2' }, { id: 'ch3' }, { id: 'ch4' }, { id: 'ch5' },
    ];
    const cache = new Map([
      ['ch1', 20], ['ch2', 18], ['ch3', 15], ['ch4', 22], ['ch5', 10],
    ]);
    const offsets = computeBookOffsets(chapters, cache);
    expect(offsets.get('ch1')).toBe(1);
    expect(offsets.get('ch2')).toBe(21);
    expect(offsets.get('ch3')).toBe(39);
    expect(offsets.get('ch4')).toBe(55);
    expect(offsets.get('ch5')).toBe(77);
  });

  it('stops computing when a chapter page count is missing and excludes subsequent chapters', () => {
    // ch1 page count unknown → ch2, ch3 offsets cannot be computed
    const chapters = [{ id: 'ch1' }, { id: 'ch2' }, { id: 'ch3' }];
    const cache = new Map<string, number>(); // empty
    const offsets = computeBookOffsets(chapters, cache);
    expect(offsets.get('ch1')).toBe(1);
    expect(offsets.has('ch2')).toBe(false);
    expect(offsets.has('ch3')).toBe(false);
  });

  it('stops computing beyond the first gap in the chain', () => {
    // ch1 known (10 pages) → ch2 start is computable (= 11)
    // ch2 page count unknown → ch3 start is NOT computable
    const chapters = [{ id: 'ch1' }, { id: 'ch2' }, { id: 'ch3' }];
    const cache = new Map([['ch1', 10], ['ch3', 5]]); // ch2 missing
    const offsets = computeBookOffsets(chapters, cache);
    expect(offsets.get('ch1')).toBe(1);
    expect(offsets.get('ch2')).toBe(11); // start IS computable (ch1 ends at page 10)
    expect(offsets.has('ch3')).toBe(false); // NOT computable (ch2's page count is unknown)
  });

  it('returns an empty map for an empty chapter list', () => {
    const offsets = computeBookOffsets([], new Map());
    expect(offsets.size).toBe(0);
  });

  it('returns only ch1 with a single chapter whose page count is unknown', () => {
    const chapters = [{ id: 'ch1' }];
    const cache = new Map<string, number>();
    const offsets = computeBookOffsets(chapters, cache);
    expect(offsets.size).toBe(1);
    expect(offsets.get('ch1')).toBe(1);
  });
});
