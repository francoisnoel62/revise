// ABOUTME: One-shot backfill seeding a baseline word-count snapshot for existing projects
// ABOUTME: Prevents pre-existing words from counting as written today/this week once quotas start

import { MongoClient, ObjectId } from 'mongodb';
import { config as loadEnv } from 'dotenv';
import { fileURLToPath } from 'url';

/**
 * Day before the current week's Monday (UTC), as YYYY-MM-DD. Dating the baseline
 * before the week start neutralises both the daily and the weekly quota for the
 * first period of tracking.
 */
export function computeSeedDate(now) {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const dayOfWeek = d.getUTCDay(); // 0 = Sunday .. 6 = Saturday
  const offsetToMonday = (dayOfWeek + 6) % 7;
  d.setUTCDate(d.getUTCDate() - offsetToMonday - 1);
  return d.toISOString().slice(0, 10);
}

/**
 * Pure planning step: one baseline snapshot per project that has no snapshot yet,
 * carrying the project's current total word count (sum of chapter word counts).
 */
export function planBackfill(projects, existingKeys, seedDate, now) {
  const inserts = [];

  for (const project of projects) {
    const key = `${project.ownerId}:${project._id}`;
    if (existingKeys.has(key)) continue;

    const totalWords = (project.chapters ?? []).reduce(
      (sum, chapter) => sum + (chapter?.metadata?.wordCount ?? 0),
      0
    );

    inserts.push({
      _id: new ObjectId(),
      projectId: String(project._id),
      ownerId: project.ownerId,
      localDate: seedDate,
      totalWords,
      createdAt: now,
      updatedAt: now,
    });
  }

  return inserts;
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
    const projects = db.collection('projects');
    const snapshots = db.collection('wordCountSnapshots');

    const projectDocs = await projects
      .find({}, { projection: { ownerId: 1, chapters: 1 } })
      .toArray();

    const existingDocs = await snapshots
      .find({}, { projection: { ownerId: 1, projectId: 1 } })
      .toArray();
    const existingKeys = new Set(existingDocs.map((d) => `${d.ownerId}:${d.projectId}`));

    const now = new Date();
    const seedDate = computeSeedDate(now);
    const inserts = planBackfill(projectDocs, existingKeys, seedDate, now);

    if (inserts.length > 0) {
      await snapshots.insertMany(inserts);
    }

    console.log(
      `Backfill done: seeded ${inserts.length} project baseline(s) dated ${seedDate} ` +
        `(${existingKeys.size} project(s) already had history).`
    );
  } finally {
    await client.close();
  }
}

// Execute only when run directly, not when imported by tests.
const isDirectRun =
  process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isDirectRun) {
  run().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
