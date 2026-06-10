// ABOUTME: Validates JeuxDeMots (JDM) synonym coverage on French literary vocabulary.
// ABOUTME: Downloads r_syn_strict (R72, ~600 KB) and r_syn (R5, ~30 MB), parses them,
// ABOUTME: and reports a coverage rate to decide if JDM is viable as the lexical layer.

import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { createWriteStream } from 'fs';
import { fileURLToPath } from 'url';
import os from 'os';
import readline from 'readline';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = path.join(__dirname, '../.jdm-cache');

// --- JDM files (from https://www.jeuxdemots.org/JDM-LEXICALNET-FR/) ---
const FILES = {
  r_syn_strict: {
    url: 'https://www.jeuxdemots.org/JDM-LEXICALNET-FR/20250626-LEXICALNET-JEUXDEMOTS-R72.txt.zip',
    zip: path.join(CACHE_DIR, 'R72.txt.zip'),
    txt: path.join(CACHE_DIR, 'R72.txt'),
    label: 'r_syn_strict (R72, ~600 Ko)',
  },
  r_syn: {
    url: 'https://www.jeuxdemots.org/JDM-LEXICALNET-FR/20260319-LEXICALNET-JEUXDEMOTS-R5.txt.zip',
    zip: path.join(CACHE_DIR, 'R5.txt.zip'),
    txt: path.join(CACHE_DIR, 'R5.txt'),
    label: 'r_syn (R5, ~30 Mo)',
  },
};

// ---------------------------------------------------------------------------
// Literary vocabulary sample — 60 words, 6 categories
// Goal: cover both common and advanced literary French to stress-test JDM.
// ---------------------------------------------------------------------------
const VOCABULARY = {
  'Verbes archaïques': [
    'choir', 'gésir', 'clore', 'poindre', 'sourdre',
    'blémir', 'chanceler', 'tituber', 'haleter', 'pâtir',
  ],
  'Verbes littéraires d\'action': [
    'rôder', 'fléchir', 'languir', 'agoniser', 'défaillir',
    'palpiter', 'sombrer', 'tâtonner', 'gémir', 'tressauter',
  ],
  'Adjectifs rares': [
    'ténébreux', 'blafard', 'farouche', 'lugubre', 'sépulcral',
    'véhément', 'délétère', 'exsangue', 'étiolé', 'sinueux',
  ],
  'Noms d\'état intérieur': [
    'torpeur', 'accablement', 'affres', 'fébrilité', 'émoi',
    'tourment', 'abattement', 'désolation', 'soupir', 'résignation',
  ],
  'Vocabulaire sensoriel précis': [
    'bruissement', 'crépitement', 'effluve', 'scintillement', 'haleine',
    'pénombre', 'crépuscule', 'pressentiment', 'épanchement', 'lueur',
  ],
  'Mots très rares / poétiques': [
    'déliquescence', 'fulgurance', 'acuité', 'inéluctable', 'éblouissement',
    'anéantissement', 'imperceptible', 'méandre', 'circonvolution', 'inexorable',
  ],
};

const ALL_WORDS = Object.values(VOCABULARY).flat();

// ---------------------------------------------------------------------------
// Download
// ---------------------------------------------------------------------------
function download(url, dest) {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(dest)) {
      console.log(`  ✓ Déjà en cache : ${path.basename(dest)}`);
      return resolve();
    }
    console.log(`  ↓ Téléchargement de ${path.basename(dest)}…`);
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
        return reject(new Error(`HTTP ${res.statusCode} pour ${url}`));
      }
      const total = parseInt(res.headers['content-length'] || '0', 10);
      let received = 0;
      res.on('data', (chunk) => {
        received += chunk.length;
        if (total > 0) {
          const pct = Math.round((received / total) * 100);
          process.stdout.write(`\r    ${pct}% (${(received / 1024).toFixed(0)} Ko / ${(total / 1024).toFixed(0)} Ko)`);
        }
      });
      res.pipe(file);
      file.on('finish', () => { file.close(); process.stdout.write('\n'); resolve(); });
    });
    req.on('error', (err) => { fs.unlinkSync(dest); reject(err); });
  });
}

// ---------------------------------------------------------------------------
// Extraction ZIP (cross-platform)
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Find extracted .txt file in cache dir (searches recursively one level deep)
// ---------------------------------------------------------------------------
function findExtractedTxt(cacheDir, expectedTxt) {
  if (fs.existsSync(expectedTxt)) return expectedTxt;
  const candidates = [];
  for (const entry of fs.readdirSync(cacheDir, { withFileTypes: true })) {
    if (entry.isFile() && entry.name.endsWith('.txt')) {
      candidates.push(path.join(cacheDir, entry.name));
    } else if (entry.isDirectory()) {
      const sub = path.join(cacheDir, entry.name);
      for (const sub_entry of fs.readdirSync(sub, { withFileTypes: true })) {
        if (sub_entry.isFile() && sub_entry.name.endsWith('.txt')) {
          candidates.push(path.join(sub, sub_entry.name));
        }
      }
    }
  }
  if (candidates.length === 0) throw new Error('Aucun .txt trouvé après extraction');
  return candidates.sort((a, b) =>
    fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs
  )[0];
}

// ---------------------------------------------------------------------------
// Decode HTML entities present in JDM term names
// ---------------------------------------------------------------------------
function decodeHtml(str) {
  if (!str || !str.includes('&')) return str ?? '';
  return str
    .replace(/&eacute;/g, 'é').replace(/&egrave;/g, 'è').replace(/&ecirc;/g, 'ê')
    .replace(/&agrave;/g, 'à').replace(/&acirc;/g, 'â').replace(/&auml;/g, 'ä')
    .replace(/&ocirc;/g, 'ô').replace(/&ouml;/g, 'ö').replace(/&ugrave;/g, 'ù')
    .replace(/&ucirc;/g, 'û').replace(/&uuml;/g, 'ü').replace(/&iuml;/g, 'ï')
    .replace(/&icirc;/g, 'î').replace(/&ccedil;/g, 'ç').replace(/&ntilde;/g, 'ñ')
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&#(\d+);/g, (_, c) => String.fromCharCode(c));
}

// ---------------------------------------------------------------------------
// Parse JDM dump file
// Handles two known formats:
//   New (pipe): eid=ID|n="WORD"|t=TYPE|w=WEIGHT  /  rid=ID|n1=N1|n2=N2|t=T|w=W
//   Old (semi):  e;ID;TYPE;WEIGHT;;"WORD"         /  r;ID;N1;TYPE;N2;W
// Returns: Map<word (lowercase), Set<synonym (lowercase)>>
// ---------------------------------------------------------------------------
async function parseJdmFile(filePath) {
  const nodes = new Map();   // nodeId (string) → word (string)
  const relations = [];      // { n1, n2, weight }

  let lineCount = 0;
  let sampleLines = [];
  let formatDetected = null;

  const rl = readline.createInterface({
    input: fs.createReadStream(filePath, { encoding: 'latin1' }),
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    lineCount++;
    if (lineCount <= 15) sampleLines.push(line);

    if (line.startsWith(' ****') || line.trim() === '') continue;

    // Auto-detect format on first data line
    if (!formatDetected) {
      if (line.startsWith('eid=') || line.startsWith('rid=') || line.startsWith('rtid=')) {
        formatDetected = 'pipe';
      } else if (line.startsWith('e;') || line.startsWith('r;') || line.startsWith('nt;')) {
        formatDetected = 'semi';
      } else if (line.includes(' ; ')) {
        // Format JDM direct : term1 ; term2 ; weight  (with HTML entities)
        formatDetected = 'direct';
      }
    }

    if (formatDetected === 'direct') {
      // term1 ; term2 ; weight
      const parts = line.split(' ; ');
      const w1 = decodeHtml(parts[0]?.trim()).toLowerCase();
      const w2 = decodeHtml(parts[1]?.trim()).toLowerCase();
      const weight = parseInt(parts[2]?.trim() || '1', 10);
      if (w1 && w2 && w1 !== w2) relations.push({ n1: w1, n2: w2, weight });
    } else if (formatDetected === 'pipe') {
      if (line.startsWith('eid=')) {
        const idM = line.match(/eid=(\d+)/);
        const nameM = line.match(/n="([^"]+)"/);
        if (idM && nameM) nodes.set(idM[1], nameM[1].toLowerCase());
      } else if (line.startsWith('rid=')) {
        const n1M = line.match(/n1=(\d+)/);
        const n2M = line.match(/n2=(\d+)/);
        const wM = line.match(/w=(\d+)/);
        if (n1M && n2M) relations.push({ n1: n1M[1], n2: n2M[1], weight: parseInt(wM?.[1] || '1', 10) });
      }
    } else if (formatDetected === 'semi') {
      const parts = line.split(';');
      if (line.startsWith('e;') && parts.length >= 6) {
        const id = parts[1];
        const raw = parts[5]?.trim() ?? '';
        const word = raw.replace(/^"|"$/g, '').toLowerCase();
        if (id && word) nodes.set(id, word);
      } else if (line.startsWith('r;') && parts.length >= 6) {
        const n1 = parts[2];
        const n2 = parts[4];
        const weight = parseInt(parts[5] || '1', 10);
        if (n1 && n2) relations.push({ n1, n2, weight });
      }
    }
  }

  console.log(`\n  Format détecté : ${formatDetected ?? 'inconnu'}`);
  console.log(`  Lignes lues : ${lineCount.toLocaleString()}`);
  console.log(`  Nœuds : ${nodes.size.toLocaleString()} | Relations : ${relations.length.toLocaleString()}`);
  console.log('\n  Échantillon (10 premières lignes du fichier) :');
  sampleLines.forEach(l => console.log(`    ${l}`));

  if (!formatDetected) {
    throw new Error('Format non reconnu. Inspecte les lignes ci-dessus et mets à jour le parseur.');
  }

  // Build word → synonyms index
  // In 'direct' format, n1/n2 are already words; otherwise resolve via nodes map.
  const index = new Map(); // word → Set<synonym>
  for (const { n1, n2, weight } of relations) {
    const w1 = formatDetected === 'direct' ? n1 : nodes.get(n1);
    const w2 = formatDetected === 'direct' ? n2 : nodes.get(n2);
    if (!w1 || !w2 || w1 === w2) continue;
    if (weight < 1) continue;
    if (!index.has(w1)) index.set(w1, new Set());
    index.get(w1).add(w2);
    if (!index.has(w2)) index.set(w2, new Set());
    index.get(w2).add(w1);
  }

  return index;
}

// ---------------------------------------------------------------------------
// Coverage report
// ---------------------------------------------------------------------------
function reportCoverage(index, label) {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`COUVERTURE — ${label}`);
  console.log('═'.repeat(60));

  const results = [];
  for (const [category, words] of Object.entries(VOCABULARY)) {
    const catResults = words.map(w => ({
      word: w,
      category,
      synonyms: [...(index.get(w) ?? [])],
      count: (index.get(w) ?? new Set()).size,
    }));
    results.push(...catResults);
  }

  // Per-category stats
  for (const [category, words] of Object.entries(VOCABULARY)) {
    const catWords = results.filter(r => r.category === category);
    const covered = catWords.filter(r => r.count > 0).length;
    const avgSyns = catWords.reduce((s, r) => s + r.count, 0) / catWords.length;
    const status = covered === catWords.length ? '✅' : covered >= catWords.length * 0.8 ? '⚠️' : '❌';
    console.log(`\n${status} ${category} (${covered}/${catWords.length} couverts, moy. ${avgSyns.toFixed(1)} syn)`);
    for (const { word, count, synonyms } of catWords) {
      const icon = count === 0 ? '  ✗' : count < 3 ? '  △' : '  ✓';
      const preview = synonyms.slice(0, 5).join(', ') + (synonyms.length > 5 ? `… (+${synonyms.length - 5})` : '');
      console.log(`${icon} ${word.padEnd(20)} ${count} syn  ${preview}`);
    }
  }

  // Global stats
  const totalCovered = results.filter(r => r.count > 0).length;
  const totalWords = results.length;
  const avg = results.reduce((s, r) => s + r.count, 0) / totalWords;
  const pct = Math.round((totalCovered / totalWords) * 100);
  const uncovered = results.filter(r => r.count === 0).map(r => r.word);

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`GLOBAL : ${totalCovered}/${totalWords} mots couverts (${pct}%)`);
  console.log(`Moyenne synonymes : ${avg.toFixed(1)} par mot`);
  if (uncovered.length > 0) {
    console.log(`\nMots sans synonymes (${uncovered.length}) :`);
    console.log(`  ${uncovered.join(', ')}`);
  }
  console.log('─'.repeat(60));

  // Verdict
  console.log('\n📊 VERDICT :');
  if (pct >= 90 && avg >= 5) {
    console.log('  ✅ Excellente couverture — JDM est viable pour la couche 1.');
  } else if (pct >= 75 && avg >= 3) {
    console.log('  ⚠️  Bonne couverture mais des lacunes sur le vocab littéraire avancé.');
    console.log('      Envisager Wiktionnaire en complément pour les mots rares.');
  } else {
    console.log('  ❌ Couverture insuffisante — Wiktionnaire nécessaire comme backup.');
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const args = process.argv.slice(2);
  const runR5 = args.includes('--r5');

  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║  Validation couverture JeuxDeMots — vocabulaire littéraire ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');
  console.log(`Mots testés : ${ALL_WORDS.length} (${Object.keys(VOCABULARY).length} catégories)\n`);

  fs.mkdirSync(CACHE_DIR, { recursive: true });

  // --- R72 : r_syn_strict ---
  const r72 = FILES.r_syn_strict;
  console.log(`\n[1/2] ${r72.label}`);
  await download(r72.url, r72.zip);

  let r72Txt = r72.txt;
  if (!fs.existsSync(r72Txt)) {
    console.log('  Extraction…');
    extractZip(r72.zip, CACHE_DIR);
    r72Txt = findExtractedTxt(CACHE_DIR, r72.txt);
  } else {
    console.log(`  ✓ Déjà extrait : ${path.basename(r72Txt)}`);
  }

  console.log('  Parsing…');
  const indexStrict = await parseJdmFile(r72Txt);
  reportCoverage(indexStrict, r72.label);

  // --- R5 : r_syn (optionnel, ~30 Mo) ---
  if (runR5) {
    const r5 = FILES.r_syn;
    console.log(`\n[2/2] ${r5.label}`);
    await download(r5.url, r5.zip);

    let r5Txt = r5.txt;
    if (!fs.existsSync(r5Txt)) {
      console.log('  Extraction…');
      extractZip(r5.zip, CACHE_DIR);
      r5Txt = findExtractedTxt(CACHE_DIR, r5.txt);
    } else {
      console.log(`  ✓ Déjà extrait : ${path.basename(r5Txt)}`);
    }

    console.log('  Parsing…');
    const indexSyn = await parseJdmFile(r5Txt);
    reportCoverage(indexSyn, r5.label);
  } else {
    console.log('\n[2/2] r_syn (R5) ignoré — lance avec --r5 pour inclure les synonymes larges.');
  }

  console.log('\n✅ Terminé. Cache dans .jdm-cache/ (ajouter au .gitignore si nécessaire)\n');
}

main().catch(err => { console.error('\n❌ Erreur :', err.message); process.exit(1); });
