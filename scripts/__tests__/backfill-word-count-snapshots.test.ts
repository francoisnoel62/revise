// ABOUTME: Tests for the word-count snapshot backfill planning logic
// ABOUTME: Verifies a baseline is seeded per project, skipping those already tracked

import { describe, it, expect } from 'vitest';
import { ObjectId } from 'mongodb';
import { planBackfill, computeSeedDate } from '../backfill-word-count-snapshots.mjs';

const project = (id: string, ownerId: string, wordCounts: number[]) => ({
  _id: id,
  ownerId,
  chapters: wordCounts.map((wc) => ({ metadata: { wordCount: wc } })),
});

describe('computeSeedDate', () => {
  it('returns the day before the current week Monday (UTC)', () => {
    // 2026-05-31 is a Sunday -> week Monday 2026-05-25 -> day before 2026-05-24
    expect(computeSeedDate(new Date('2026-05-31T12:00:00.000Z'))).toBe('2026-05-24');
  });

  it('predates the week start for a midweek run', () => {
    // 2026-05-29 Friday -> Monday 2026-05-25 -> 2026-05-24
    expect(computeSeedDate(new Date('2026-05-29T08:00:00.000Z'))).toBe('2026-05-24');
  });
});

describe('planBackfill', () => {
  const seedDate = '2026-05-24';
  const now = new Date('2026-05-31T12:00:00.000Z');

  it('seeds one baseline per untracked project, summing chapter word counts', () => {
    const projects = [project('p1', 'user-1', [1200, 800])];

    const inserts = planBackfill(projects, new Set(), seedDate, now);

    expect(inserts).toHaveLength(1);
    expect(inserts[0]._id).toBeInstanceOf(ObjectId);
    expect(inserts[0]).toMatchObject({
      projectId: 'p1',
      ownerId: 'user-1',
      localDate: '2026-05-24',
      totalWords: 2000,
      createdAt: now,
      updatedAt: now,
    });
  });

  it('skips projects that already have snapshot history', () => {
    const projects = [
      project('p1', 'user-1', [1000]),
      project('p2', 'user-1', [5000]),
    ];
    const existingKeys = new Set(['user-1:p1']);

    const inserts = planBackfill(projects, existingKeys, seedDate, now);

    expect(inserts).toHaveLength(1);
    expect(inserts[0].projectId).toBe('p2');
    expect(inserts[0].totalWords).toBe(5000);
  });

  it('seeds a zero baseline for an empty project', () => {
    const inserts = planBackfill([project('p3', 'user-2', [])], new Set(), seedDate, now);
    expect(inserts[0].totalWords).toBe(0);
  });
});
