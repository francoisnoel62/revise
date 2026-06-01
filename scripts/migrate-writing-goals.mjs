// ABOUTME: One-shot migration splitting legacy writingGoals into milestones and quotas
// ABOUTME: daily/weekly goals -> writingQuotas; total goals -> milestones with the type field dropped

import { MongoClient, ObjectId } from 'mongodb';
import { config as loadEnv } from 'dotenv';
import { fileURLToPath } from 'url';

/**
 * Pure planning step: given the existing writingGoals documents, decide what to
 * insert into writingQuotas, which goal docs to delete (they became quotas), and
 * which goal docs to clean (legacy milestones that still carry a `type` field).
 *
 * Idempotent: a goal doc with no `type` field has already been migrated and is left alone.
 */
export function planWritingGoalMigration(goalDocs) {
  const quotaInserts = [];
  const quotaSourceIds = [];
  const milestoneIdsToClean = [];

  for (const doc of goalDocs) {
    if (doc.type === 'daily' || doc.type === 'weekly') {
      quotaInserts.push({
        _id: new ObjectId(),
        projectId: doc.projectId,
        ownerId: doc.ownerId,
        period: doc.type,
        targetWords: doc.targetWords,
        createdAt: doc.createdAt ?? new Date(),
        updatedAt: doc.updatedAt ?? new Date(),
      });
      quotaSourceIds.push(doc._id);
    } else if (doc.type !== undefined) {
      // 'total' (or any other legacy type) is a milestone; just drop the type field.
      milestoneIdsToClean.push(doc._id);
    }
    // doc.type === undefined -> already migrated, skip.
  }

  return { quotaInserts, quotaSourceIds, milestoneIdsToClean };
}

async function run() {
  loadEnv({ path: '.env.local' });

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not set');
  }
  const dbName = process.env.MONGODB_DB_NAME || 'revise';

  const client = new MongoClient(uri);
  await client.connect();

  try {
    const db = client.db(dbName);
    const goals = db.collection('writingGoals');
    const quotas = db.collection('writingQuotas');

    const goalDocs = await goals.find({}).toArray();
    const { quotaInserts, quotaSourceIds, milestoneIdsToClean } =
      planWritingGoalMigration(goalDocs);

    if (quotaInserts.length > 0) {
      await quotas.insertMany(quotaInserts);
    }
    if (quotaSourceIds.length > 0) {
      await goals.deleteMany({ _id: { $in: quotaSourceIds } });
    }
    if (milestoneIdsToClean.length > 0) {
      await goals.updateMany(
        { _id: { $in: milestoneIdsToClean } },
        { $unset: { type: '' } }
      );
    }

    console.log(
      `Migration done: created ${quotaInserts.length} quota(s), ` +
        `cleaned ${milestoneIdsToClean.length} milestone(s), ` +
        `removed ${quotaSourceIds.length} legacy goal doc(s).`
    );
  } finally {
    await client.close();
  }
}

// Execute only when run directly (node scripts/migrate-writing-goals.mjs), not when imported by tests.
const isDirectRun =
  process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isDirectRun) {
  run().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
