// ABOUTME: Builds the JeuxDeMots synonym index in MongoDB (collection jdm_synonyms).
// ABOUTME: Run once before the first deploy, or when JDM releases a new dump.
// ABOUTME: Idempotent — safe to re-run (upserts, never duplicates).

import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import os from 'os';
import { execSync } from 'child_process';
import { createWriteStream } from 'fs';
import { fileURLToPath } from 'url';
import { MongoClient } from 'mongodb';
import { config as loadEnv } from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const R5_URL =
  'https://www.jeuxdemots.org/JDM-LEXICALNET-FR/20260319-LEXICALNET-JEUXDEMOTS-R5.txt.zip';
const CACHE_DIR = path.join(__dirname, '../.jdm-cache');
const ZIP_PATH = path.join(CACHE_DIR, 'R5.txt.zip');
const COLLECTION = 'jdm_synonyms';
const BATCH_SIZE = 5_000; // documents per bulkWrite call

// ---------------------------------------------------------------------------
// Helpers (shared with validate-jdm-coverage.mjs)
// ---------------------------------------------------------------------------

function download(url, dest) {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(dest)) {
      console.log(`  ✓ Déjà en cache : ${path.basename(dest)}`);
      return resolve();
    }
    console.log(`  ↓ Téléchargement…`);
    const file = createWriteStream(dest);
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close();
        fs.unlinkSync(dest);
        return download(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        file.close();
        fs.unlinkSync(dest);
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      const total = parseInt(res.headers['content-length'] || '0', 10);
      let received = 0;
      res.on('data', (chunk) => {
        received += chunk.length;
        if (total > 0) {
          const pct = Math.round((received / total) * 100);
          process.stdout.write(
            `\r    ${pct}% (${(received / 1024 / 1024).toFixed(1)} Mo / ${(total / 1024 / 1024).toFixed(1)} Mo)`
          );
        }
      });
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        process.stdout.write('\n');
        resolve();
      });
    });
    req.on('error', (err) => {
      if (fs.existsSync(dest)) fs.unlinkSync(dest);
      reject(err);
    });
  });
}

function extractZip(zipPath, destDir) {
  if (os.platform() === 'win32') {
    execSync(
      `powershell -NoProfile -Command "Expand-Archive -LiteralPath '${zipPath}' -DestinationPath '${destDir}' -Force"`,
      { stdio: 'inherit' }
    );
  } else {
    execSync(`unzip -o "${zipPath}" -d "${destDir}"`, { stdio: 'inherit' });
  }
}

function findExtractedTxt(cacheDir) {
  const candidates = [];
  for (const entry of fs.readdirSync(cacheDir, { withFileTypes: true })) {
    if (entry.isFile() && entry.name.endsWith('.txt')) {
      candidates.push(path.join(cacheDir, entry.name));
    } else if (entry.isDirectory()) {
      for (const sub of fs.readdirSync(path.join(cacheDir, entry.name), { withFileTypes: true })) {
        if (sub.isFile() && sub.name.endsWith('.txt')) {
          candidates.push(path.join(cacheDir, entry.name, sub.name));
        }
      }
    }
  }
  if (candidates.length === 0) throw new Error('Aucun .txt trouvé après extraction');
  return candidates.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)[0];
}

function decodeHtml(str) {
  if (!str || !str.includes('&')) return str ?? '';
  return str
    .replace(/&eacute;/g, 'é').replace(/&egrave;/g, 'è').replace(/&ecirc;/g, 'ê')
    .replace(/&agrave;/g, 'à').replace(/&acirc;/g, 'â').replace(/&auml;/g, 'ä')
    .replace(/&ocirc;/g, 'ô').replace(/&ouml;/g, 'ö').replace(/&ugrave;/g, 'ù')
    .replace(/&ucirc;/g, 'û').replace(/&uuml;/g, 'ü').replace(/&iuml;/g, 'ï')
    .replace(/&icirc;/g, 'î').replace(/&ccedil;/g, 'ç').replace(/&ntilde;/g, 'ñ')
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&aelig;/g, 'æ')
    .replace(/&oelig;/g, 'œ').replace(/&#(\d+);/g, (_, c) => String.fromCharCode(c));
}

// Strips JDM grammatical annotations and argument-structure markers.
// "aller>ver:inf" → "aller"  |  "accuser [qch]" → "accuser"
function cleanSynonym(raw) {
  return raw
    .replace(/>[^\s,]+/g, '')       // >ver:inf, >adj:, >nom:mas+sg, etc.
    .replace(/\s*\[[^\]]+\]/g, '')  // [qch], [qqn], [adj], [qch] à [qqn]
    .trim();
}

function isUsable(word) {
  return word.length >= 2 && !/^\d+$/.test(word);
}

// ---------------------------------------------------------------------------
// Parse R5 → Map<word, Set<synonym>>
// ---------------------------------------------------------------------------
async function buildIndex(filePath) {
  const index = new Map(); // word → Set<synonym>
  let lineCount = 0;
  let relationCount = 0;
  let skipped = 0;

  const rl = readline.createInterface({
    input: fs.createReadStream(filePath, { encoding: 'latin1' }),
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    lineCount++;

    if (lineCount % 500_000 === 0) {
      process.stdout.write(
        `\r  Parsing… ${(lineCount / 1_000_000).toFixed(1)}M lignes — ${index.size.toLocaleString()} mots indexés`
      );
    }

    if (line.startsWith(' ****') || line.trim() === '') continue;
    if (!line.includes(' ; ')) continue;

    const parts = line.split(' ; ');
    const w1 = cleanSynonym(decodeHtml(parts[0]?.trim())).toLowerCase();
    const w2 = cleanSynonym(decodeHtml(parts[1]?.trim())).toLowerCase();
    const weight = parseInt(parts[2]?.trim() || '0', 10);

    if (weight < 1) { skipped++; continue; }
    if (!isUsable(w1) || !isUsable(w2) || w1 === w2) { skipped++; continue; }

    if (!index.has(w1)) index.set(w1, new Set());
    index.get(w1).add(w2);

    // bidirectionnel : si B est synonyme de A, A est synonyme de B
    if (!index.has(w2)) index.set(w2, new Set());
    index.get(w2).add(w1);

    relationCount++;
  }

  process.stdout.write('\n');
  console.log(`  Lignes lues      : ${lineCount.toLocaleString()}`);
  console.log(`  Relations retenues: ${relationCount.toLocaleString()}`);
  console.log(`  Relations écartées: ${skipped.toLocaleString()} (poids négatif ou bruit)`);
  console.log(`  Mots uniques      : ${index.size.toLocaleString()}`);

  return index;
}

// ---------------------------------------------------------------------------
// Upsert index → MongoDB
// ---------------------------------------------------------------------------
async function upsertToMongo(db, index) {
  const collection = db.collection(COLLECTION);

  console.log(`\n  Insertion dans MongoDB (collection "${COLLECTION}")…`);

  let inserted = 0;
  let batch = [];

  for (const [word, synonymSet] of index) {
    const synonyms = [...synonymSet].filter(isUsable);
    if (synonyms.length === 0) continue;

    batch.push({
      replaceOne: {
        filter: { _id: word },
        replacement: { _id: word, synonyms },
        upsert: true,
      },
    });

    if (batch.length >= BATCH_SIZE) {
      await collection.bulkWrite(batch, { ordered: false });
      inserted += batch.length;
      process.stdout.write(`\r  ${inserted.toLocaleString()} / ${index.size.toLocaleString()} mots`);
      batch = [];
    }
  }

  if (batch.length > 0) {
    await collection.bulkWrite(batch, { ordered: false });
    inserted += batch.length;
  }

  process.stdout.write(`\r  ${inserted.toLocaleString()} / ${index.size.toLocaleString()} mots\n`);
  return inserted;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function run() {
  loadEnv({ path: '.env.local' });

  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI manquant dans .env.local');
  const dbName = process.env.MONGODB_DB_NAME || 'revise';

  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║       Construction de l\'index JeuxDeMots → MongoDB       ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  // 1. Téléchargement
  console.log('[1/4] Fichier source JDM r_syn (R5, ~30 Mo)');
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  await download(R5_URL, ZIP_PATH);

  // 2. Extraction
  console.log('\n[2/4] Extraction du ZIP');
  console.log('  Extraction…');
  extractZip(ZIP_PATH, CACHE_DIR);
  const txtPath = findExtractedTxt(CACHE_DIR);
  console.log(`  ✓ ${path.basename(txtPath)}`);

  // 3. Parsing + nettoyage
  console.log('\n[3/4] Parsing et nettoyage');
  const index = await buildIndex(txtPath);

  // 4. MongoDB
  console.log('\n[4/4] Écriture dans MongoDB');
  const client = new MongoClient(uri);
  await client.connect();

  try {
    const db = client.db(dbName);
    const t0 = Date.now();
    const count = await upsertToMongo(db, index);
    const elapsed = ((Date.now() - t0) / 1000).toFixed(1);

    console.log(`\n✅ Index construit en ${elapsed}s`);
    console.log(`   ${count.toLocaleString()} mots dans "${dbName}.${COLLECTION}"`);
    console.log(`   Lookup : db.${COLLECTION}.findOne({ _id: "mot" })`);
    console.log('\n  Pour vérifier :');
    console.log(`    db.${COLLECTION}.findOne({ _id: "murmurer" })`);
    console.log(`    db.${COLLECTION}.findOne({ _id: "blémir" })   // doit retourner null`);
  } finally {
    await client.close();
  }
}

const isDirectRun =
  process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isDirectRun) {
  run().catch((err) => {
    console.error('\n❌ Erreur :', err.message);
    process.exit(1);
  });
}
