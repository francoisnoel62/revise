// ABOUTME: One-shot DB migration script — converts legacy TipTap content to semantic content.
// ABOUTME: Run with: npx tsx scripts/migrate-semantic-content.ts [--dry-run] [--owner <userId>]

import { MongoClient } from 'mongodb';
import { config as loadEnv } from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import { MongoDBProjectRepository } from '../src/infrastructure/persistence/MongoDBProjectRepository';
import { MigrateProjectContentUseCase } from '../src/application/migration/MigrateProjectContentUseCase';
import type { MigrationReport } from '../src/application/migration/MigrateProjectContentUseCase';

loadEnv({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB_NAME ?? 'revise';

function parseArgs(): { dryRun: boolean; ownerIds: string[] | null } {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const ownerIdx = args.indexOf('--owner');
  const ownerIds = ownerIdx !== -1 && args[ownerIdx + 1]
    ? [args[ownerIdx + 1]]
    : null;
  return { dryRun, ownerIds };
}

async function getAllOwnerIds(client: MongoClient): Promise<string[]> {
  const db = client.db(DB_NAME);
  const distinct = await db.collection('projects').distinct('ownerId');
  return distinct as string[];
}

function printReport(report: MigrationReport, ownerId: string, dryRun: boolean): void {
  const prefix = dryRun ? '[DRY-RUN] ' : '';
  console.log(`\n${prefix}Owner: ${ownerId}`);
  console.log(`  Scanned : ${report.totalChaptersScanned} chapter(s)`);
  console.log(`  Migrated: ${report.totalChaptersMigrated} chapter(s)`);
  console.log(`  Ambiguous: ${report.totalAmbiguities} node(s) flagged for review`);

  for (const proj of report.projects) {
    console.log(`\n  Project: ${proj.projectTitle} (${proj.projectId})`);
    for (const ch of proj.chapters) {
      const status = ch.wasAlreadyMigrated ? '✓ already' : dryRun ? '~ would migrate' : '✓ migrated';
      console.log(`    [${status}] ${ch.chapterTitle}`);
      for (const amb of ch.ambiguities) {
        console.log(`      ⚠ node[${amb.nodeIndex}]: ${amb.reason}`);
      }
    }
  }
}

async function run(): Promise<void> {
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  const { dryRun, ownerIds } = parseArgs();

  if (dryRun) {
    console.log('[DRY-RUN] No changes will be written to the database.');
  }

  const client = new MongoClient(MONGODB_URI);
  await client.connect();

  try {
    const db = client.db(DB_NAME);
    const repo = new MongoDBProjectRepository(db);
    const useCase = new MigrateProjectContentUseCase(repo);

    const targets = ownerIds ?? (await getAllOwnerIds(client));

    if (targets.length === 0) {
      console.log('No owners found. Nothing to migrate.');
      return;
    }

    console.log(`Migrating ${targets.length} owner(s)…`);

    let grandTotal = { scanned: 0, migrated: 0, ambiguities: 0 };

    for (const ownerId of targets) {
      const report = await useCase.execute(ownerId, { dryRun });
      printReport(report, ownerId, dryRun);
      grandTotal.scanned += report.totalChaptersScanned;
      grandTotal.migrated += report.totalChaptersMigrated;
      grandTotal.ambiguities += report.totalAmbiguities;
    }

    console.log('\n─────────────────────────────────');
    console.log(`Total scanned : ${grandTotal.scanned}`);
    console.log(`Total migrated: ${grandTotal.migrated}`);
    console.log(`Total ambiguous nodes: ${grandTotal.ambiguities}`);
    if (grandTotal.ambiguities > 0) {
      console.log('\n⚠  Some nodes need manual reclassification by the author (see above).');
    }
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
