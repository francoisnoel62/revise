// ABOUTME: Tests for TocHtmlBuilder — verifies TOC is generated with correct entries,
// ABOUTME: in order, with proper links and HTML structure.
// @vitest-environment node

import { describe, it, expect } from 'vitest';
import { TocHtmlBuilder } from './TocHtmlBuilder';
import type { TocEntry } from '@/application/interfaces/PagedRenderer';

const builder = new TocHtmlBuilder();

describe('TocHtmlBuilder', () => {
  it('returns empty string when given an empty entry list', () => {
    expect(builder.build([])).toBe('');
  });

  it('wraps output in nav.toc with liminal class', () => {
    const html = builder.build([{ title: 'Chapitre 1', chapterId: 'ch-0' }]);
    expect(html).toMatch(/<nav[^>]*class="[^"]*toc[^"]*liminal/);
  });

  it('includes "Table des matières" heading', () => {
    const html = builder.build([{ title: 'Chapitre 1', chapterId: 'ch-0' }]);
    expect(html).toContain('Table des matières');
  });

  it('includes each chapter title', () => {
    const html = builder.build([
      { title: 'Chapitre Un', chapterId: 'ch-0' },
      { title: 'Chapitre Deux', chapterId: 'ch-1' },
    ]);
    expect(html).toContain('Chapitre Un');
    expect(html).toContain('Chapitre Deux');
  });

  it('preserves order of entries', () => {
    const html = builder.build([
      { title: 'Premier', chapterId: 'ch-0' },
      { title: 'Deuxième', chapterId: 'ch-1' },
      { title: 'Troisième', chapterId: 'ch-2' },
    ]);
    const firstIdx = html.indexOf('Premier');
    const secondIdx = html.indexOf('Deuxième');
    const thirdIdx = html.indexOf('Troisième');
    expect(firstIdx).toBeLessThan(secondIdx);
    expect(secondIdx).toBeLessThan(thirdIdx);
  });

  it('links each entry to its chapter section via href', () => {
    const html = builder.build([
      { title: 'Chapitre Un', chapterId: 'ch-0' },
    ]);
    expect(html).toContain('href="#ch-0"');
  });

  it('escapes HTML special characters in chapter titles', () => {
    const html = builder.build([{ title: "L'Été & l'Hiver", chapterId: 'ch-0' }]);
    expect(html).not.toContain("L'Été & l'Hiver");
    expect(html).toContain('&amp;');
    expect(html).toContain('&#039;');
  });

  it('escapes chapterId used in href', () => {
    const html = builder.build([{ title: 'Test', chapterId: 'ch-"0"' }]);
    expect(html).not.toContain('href="#ch-"0""');
    expect(html).toContain('&quot;');
  });
});
