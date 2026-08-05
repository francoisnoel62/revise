// ABOUTME: Guards that a chapter analysis stays in memory and is never written to the database.
// ABOUTME: While that holds, changing the analysis categories needs no data migration.

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const SOURCE_ROOTS = ['src/infrastructure', 'src/domain/interfaces'];
const CODE_EXTENSIONS = ['.ts', '.tsx'];

function collectCodeFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) return collectCodeFiles(path);
    return CODE_EXTENSIONS.some((extension) => path.endsWith(extension)) ? [path] : [];
  });
}

describe('ChapterAnalysis persistence', () => {
  it('is never serialized or stored, so the category list carries no migration', () => {
    const referencing = SOURCE_ROOTS.flatMap((root) =>
      collectCodeFiles(resolve(process.cwd(), root))
    ).filter((path) => readFileSync(path, 'utf8').includes('ChapterAnalysis'));

    expect(referencing).toEqual([]);
  });
});
