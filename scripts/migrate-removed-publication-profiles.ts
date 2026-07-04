// ABOUTME: One-shot DB migration script — moves projects off KDP trims removed from the catalogue.
// ABOUTME: Run with: npx tsx scripts/migrate-removed-publication-profiles.ts [--dry-run]

import { MongoClient } from 'mongodb';
import { config as loadEnv } from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import { resolveMigratedProfileId } from '../src/application/migration/RemovedPublicationProfileMigration';

loadEnv({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB_NAME ?? 'revise';
const COLLECTION_NAME = 'project_settings';

function parseArgs(): { dryRun: boolean } {
  return { dryRun: process.argv.slice(2).includes('--dry-run') };
}

async function run(): Promise<void> {
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  const { dryRun } = parseArgs();
  if (dryRun) {
    console.log('[DRY-RUN] No changes will be written to the database.');
  }

  const client = new MongoClient(MONGODB_URI);
  await client.connect();

  try {
    const db = client.db(DB_NAME);
    const collection = db.collection<{ _id: unknown; projectId: string; publicationProfileId?: string }>(
      COLLECTION_NAME
    );

    const docs = await collection.find({}).toArray();
    let migrated = 0;

    for (const doc of docs) {
      if (!doc.publicationProfileId) continue;

      const replacement = resolveMigratedProfileId(doc.publicationProfileId);
      if (!replacement) continue;

      migrated++;
      console.log(
        `${dryRun ? '[DRY-RUN] would migrate' : 'Migrating'} project ${doc.projectId}: ${doc.publicationProfileId} -> ${replacement}`
      );

      if (!dryRun) {
        await collection.updateOne({ _id: doc._id }, { $set: { publicationProfileId: replacement } });
      }
    }

    console.log(`\nScanned ${docs.length} project settings document(s).`);
    console.log(`${dryRun ? 'Would migrate' : 'Migrated'} ${migrated} document(s) off removed profiles.`);
  } finally {
    await client.close();
  }
}

const isDirectRun =
  process.argv[1] &&
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isDirectRun) {
  run().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
