// ABOUTME: Builds the Lexique morphology index in MongoDB (lexique_forms + lexique_conjugations).
// ABOUTME: Run once before the first deploy, or when Lexique releases a new version.
// ABOUTME: Idempotent — safe to re-run (upserts, never duplicates). Verbs only (V1 scope).

import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';
import { MongoClient } from 'mongodb';
import { config as loadEnv } from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Lexique 3.83 is distributed at http://www.lexique.org (file "Lexique383.tsv", UTF-8, tab-separated).
// Download it once, then point LEXIQUE_TSV at it or drop it in .lexique-cache/.
const DEFAULT_TSV = path.join(__dirname, '../.lexique-cache/Lexique383.tsv');
const FORMS_COLLECTION = 'lexique_forms';
const CONJ_COLLECTION = 'lexique_conjugations';
const BATCH_SIZE = 5_000;

// Parse the infover field ("ind:imp:3s;ind:pre:1s;") into normalized morph tags
function parseMorphs(infover) {
  if (!infover) return [];
  return infover
    .split(';')
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
}

// ---------------------------------------------------------------------------
// Parse Lexique383.tsv → two Maps (verbs only)
// ---------------------------------------------------------------------------
async function buildIndex(filePath) {
  const forms = new Map(); // ortho → [{ lemma, cgram, morphs }]
  const conjugations = new Map(); // "lemme|VER" → [{ morphs, ortho }]

  const rl = readline.createInterface({
    input: fs.createReadStream(filePath, { encoding: 'utf8' }),
    crlfDelay: Infinity,
  });

  let header = null;
  let col = {};
  let lineCount = 0;
  let verbRows = 0;

  for await (const line of rl) {
    lineCount++;
    if (line.trim() === '') continue;

    const cells = line.split('\t');

    // First non-empty line is the header — map column names to indices
    if (!header) {
      header = cells.map((c) => c.trim());
      col = {
        ortho: header.indexOf('ortho'),
        lemme: header.indexOf('lemme'),
        cgram: header.indexOf('cgram'),
        infover: header.indexOf('infover'),
      };
      for (const [name, idx] of Object.entries(col)) {
        if (idx === -1) throw new Error(`Colonne manquante dans le TSV : "${name}"`);
      }
      continue;
    }

    if (cells[col.cgram] !== 'VER') continue;

    const ortho = (cells[col.ortho] || '').trim().toLowerCase();
    const lemme = (cells[col.lemme] || '').trim().toLowerCase();
    if (ortho.length < 2 || lemme.length === 0) continue;

    const morphs = parseMorphs(cells[col.infover]);
    verbRows++;

    if (!forms.has(ortho)) forms.set(ortho, []);
    forms.get(ortho).push({ lemma: lemme, cgram: 'VER', morphs });

    const key = `${lemme}|VER`;
    if (!conjugations.has(key)) conjugations.set(key, []);
    conjugations.get(key).push({ morphs, ortho });

    if (lineCount % 100_000 === 0) {
      process.stdout.write(
        `\r  Parsing… ${lineCount.toLocaleString()} lignes — ${forms.size.toLocaleString()} formes, ${conjugations.size.toLocaleString()} lemmes`
      );
    }
  }

  process.stdout.write('\n');
  console.log(`  Lignes lues       : ${lineCount.toLocaleString()}`);
  console.log(`  Formes verbales   : ${verbRows.toLocaleString()}`);
  console.log(`  Formes uniques    : ${forms.size.toLocaleString()}`);
  console.log(`  Lemmes conjugués  : ${conjugations.size.toLocaleString()}`);

  return { forms, conjugations };
}

// ---------------------------------------------------------------------------
// Upsert a Map<_id, payload> into a collection in batches
// ---------------------------------------------------------------------------
async function upsert(db, collectionName, entries, toDoc) {
  const collection = db.collection(collectionName);
  console.log(`\n  → ${collectionName} (${entries.size.toLocaleString()} docs)…`);

  let written = 0;
  let batch = [];

  for (const [id, value] of entries) {
    batch.push({
      replaceOne: {
        filter: { _id: id },
        replacement: { _id: id, ...toDoc(value) },
        upsert: true,
      },
    });

    if (batch.length >= BATCH_SIZE) {
      await collection.bulkWrite(batch, { ordered: false });
      written += batch.length;
      process.stdout.write(`\r  ${written.toLocaleString()} / ${entries.size.toLocaleString()}`);
      batch = [];
    }
  }

  if (batch.length > 0) {
    await collection.bulkWrite(batch, { ordered: false });
    written += batch.length;
  }

  process.stdout.write(`\r  ${written.toLocaleString()} / ${entries.size.toLocaleString()}\n`);
  return written;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function run() {
  loadEnv({ path: '.env.local' });

  const tsvPath = process.env.LEXIQUE_TSV || DEFAULT_TSV;
  if (!fs.existsSync(tsvPath)) {
    throw new Error(
      `Fichier Lexique introuvable : ${tsvPath}\n` +
        `  Télécharge "Lexique383.tsv" depuis http://www.lexique.org,\n` +
        `  place-le dans .lexique-cache/ ou définis LEXIQUE_TSV=<chemin>.`
    );
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI manquant dans .env.local');
  const dbName = process.env.MONGODB_DB_NAME || 'revise';

  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log("║       Construction de l'index Lexique → MongoDB          ║");
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  console.log(`[1/2] Parsing ${path.basename(tsvPath)}`);
  const { forms, conjugations } = await buildIndex(tsvPath);

  console.log('\n[2/2] Écriture dans MongoDB');
  const client = new MongoClient(uri);
  await client.connect();

  try {
    const db = client.db(dbName);
    await upsert(db, FORMS_COLLECTION, forms, (interpretations) => ({ interpretations }));
    await upsert(db, CONJ_COLLECTION, conjugations, (formList) => ({ forms: formList }));

    console.log(`\n✅ Index morphologique construit dans "${dbName}"`);
    console.log('\n  Pour vérifier :');
    console.log(`    db.${FORMS_COLLECTION}.findOne({ _id: "regardait" })`);
    console.log(`    db.${CONJ_COLLECTION}.findOne({ _id: "observer|VER" })`);
  } finally {
    await client.close();
  }
}

const isDirectRun = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isDirectRun) {
  run().catch((err) => {
    console.error('\n❌ Erreur :', err.message);
    process.exit(1);
  });
}
