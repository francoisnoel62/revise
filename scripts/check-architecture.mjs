// ABOUTME: Enforces the dependency direction declared in docs/architecture.md.
// ABOUTME: Scans production TypeScript source without adding a runtime dependency.

import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const workspaceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceRoot = path.join(workspaceRoot, 'src');
const sourceExtensions = new Set(['.ts', '.tsx']);
const importPattern = /(?:from\s+|import\s*\()\s*['"]([^'"]+)['"]/g;

const prohibitedTargets = {
  domain: new Set(['application', 'infrastructure', 'app', 'components', 'hooks', 'store', 'lib']),
  application: new Set(['infrastructure', 'app', 'components', 'hooks', 'store']),
  infrastructure: new Set(['app', 'components', 'hooks', 'store']),
  components: new Set(['infrastructure']),
  hooks: new Set(['infrastructure']),
  lib: new Set(['infrastructure', 'components']),
  store: new Set(['infrastructure']),
};

function isProductionSource(filePath) {
  return (
    sourceExtensions.has(path.extname(filePath)) &&
    !filePath.endsWith('.test.ts') &&
    !filePath.endsWith('.test.tsx') &&
    !filePath.endsWith('.spec.ts') &&
    !filePath.endsWith('.spec.tsx') &&
    !filePath.includes(`${path.sep}__tests__${path.sep}`)
  );
}

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name);
      return entry.isDirectory() ? collectFiles(entryPath) : [entryPath];
    }),
  );
  return nested.flat();
}

function sourceLayer(filePath) {
  return path.relative(sourceRoot, filePath).split(path.sep)[0];
}

function targetLayer(filePath, specifier) {
  if (specifier.startsWith('@/')) return specifier.slice(2).split('/')[0];
  if (!specifier.startsWith('.')) return null;

  const resolved = path.resolve(path.dirname(filePath), specifier);
  const relative = path.relative(sourceRoot, resolved);
  if (relative.startsWith('..') || path.isAbsolute(relative)) return null;
  return relative.split(path.sep)[0];
}

const errors = [];
for (const filePath of (await collectFiles(sourceRoot)).filter(isProductionSource)) {
  const layer = sourceLayer(filePath);
  const content = await readFile(filePath, 'utf8');
  const relativePath = path.relative(workspaceRoot, filePath);
  const blocked = prohibitedTargets[layer];

  for (const match of content.matchAll(importPattern)) {
    const specifier = match[1];
    const target = targetLayer(filePath, specifier);
    if (blocked?.has(target)) {
      errors.push(`${relativePath}: ${layer} must not import ${specifier}`);
    }
    if (layer === 'domain' && /^(node:)?crypto$/.test(specifier)) {
      errors.push(`${relativePath}: ${layer} must not import ${specifier}`);
    }
  }
}

if (errors.length > 0) {
  console.error('Architecture dependency violations:');
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log('Architecture dependency check passed.');
}
