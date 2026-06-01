// ABOUTME: Tests for the writing-goals migration planning logic
// ABOUTME: Verifies daily/weekly goals become quotas and total goals become clean milestones

import { describe, it, expect } from 'vitest';
import { ObjectId } from 'mongodb';
import { planWritingGoalMigration } from '../migrate-writing-goals.mjs';

const goalDoc = (overrides: Record<string, unknown>) => ({
  _id: new ObjectId(),
  projectId: 'project-1',
  ownerId: 'user-1',
  targetWords: 1000,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-02-01T00:00:00.000Z'),
  ...overrides,
});

describe('planWritingGoalMigration', () => {
  it('turns a daily goal into a quota and marks the source for deletion', () => {
    const doc = goalDoc({ type: 'daily', targetWords: 1000 });

    const plan = planWritingGoalMigration([doc]);

    expect(plan.quotaInserts).toHaveLength(1);
    expect(plan.quotaInserts[0]).toMatchObject({
      projectId: 'project-1',
      ownerId: 'user-1',
      period: 'daily',
      targetWords: 1000,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
    expect(plan.quotaSourceIds).toEqual([doc._id]);
    expect(plan.milestoneIdsToClean).toEqual([]);
  });

  it('turns a weekly goal into a weekly quota', () => {
    const doc = goalDoc({ type: 'weekly', targetWords: 5000 });

    const plan = planWritingGoalMigration([doc]);

    expect(plan.quotaInserts[0].period).toBe('weekly');
    expect(plan.quotaInserts[0].targetWords).toBe(5000);
  });

  it('marks a total goal as a milestone to clean (drop the type field)', () => {
    const doc = goalDoc({ type: 'total', targetWords: 80000 });

    const plan = planWritingGoalMigration([doc]);

    expect(plan.quotaInserts).toEqual([]);
    expect(plan.quotaSourceIds).toEqual([]);
    expect(plan.milestoneIdsToClean).toEqual([doc._id]);
  });

  it('ignores already-migrated goals that have no type field (idempotent)', () => {
    const doc = goalDoc({ targetWords: 80000 });

    const plan = planWritingGoalMigration([doc]);

    expect(plan.quotaInserts).toEqual([]);
    expect(plan.quotaSourceIds).toEqual([]);
    expect(plan.milestoneIdsToClean).toEqual([]);
  });

  it('handles a mixed batch', () => {
    const daily = goalDoc({ type: 'daily' });
    const weekly = goalDoc({ type: 'weekly' });
    const total = goalDoc({ type: 'total' });
    const migrated = goalDoc({});

    const plan = planWritingGoalMigration([daily, weekly, total, migrated]);

    expect(plan.quotaInserts).toHaveLength(2);
    expect(plan.quotaSourceIds).toEqual([daily._id, weekly._id]);
    expect(plan.milestoneIdsToClean).toEqual([total._id]);
  });
});
