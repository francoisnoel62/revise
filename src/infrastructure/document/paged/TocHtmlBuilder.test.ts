// ABOUTME: Tests for TocHtmlBuilder — verifies TOC is generated with correct entries,
// ABOUTME: in order, with proper links and HTML structure.
// @vitest-environment node

import { describe, it, expect } from 'vitest';
import { TocHtmlBuilder } from './TocHtmlBuilder';

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

  it('wraps each entry title in a .toc-title span so classique can clip a dotted fill onto it', () => {
    const html = builder.build([{ title: 'Chapitre 1', chapterId: 'ch-0' }]);
    expect(html).toContain('<span class="toc-title">Chapitre 1</span>');
  });

  it('wraps sub-entry titles in a .toc-title span too', () => {
    const html = builder.build([
      {
        title: 'Chapitre 1',
        chapterId: 'ch-0',
        subEntries: [{ title: 'Sous-titre A', anchorId: 'ch-0-soustitre-0' }],
      },
    ]);
    expect(html).toContain('<span class="toc-title">Sous-titre A</span>');
  });

  describe('design (tocStyle)', () => {
    it('applies the classique class by default', () => {
      const html = builder.build([{ title: 'Chapitre 1', chapterId: 'ch-0' }]);
      expect(html).toMatch(/<nav[^>]*class="[^"]*toc--classique/);
    });

    it('applies the requested design class', () => {
      const html = builder.build([{ title: 'Chapitre 1', chapterId: 'ch-0' }], 'epure');
      expect(html).toMatch(/<nav[^>]*class="[^"]*toc--epure/);
    });

    it('applies the litteraire design class', () => {
      const html = builder.build([{ title: 'Chapitre 1', chapterId: 'ch-0' }], 'litteraire');
      expect(html).toMatch(/<nav[^>]*class="[^"]*toc--litteraire/);
    });
  });

  describe('nested sub-entries (sous-titres)', () => {
    it('renders no nested list when a chapter has no subEntries', () => {
      const html = builder.build([{ title: 'Chapitre 1', chapterId: 'ch-0' }]);
      const chapterLi = html.split('\n').find((line) => line.includes('Chapitre 1'));
      expect(chapterLi).not.toContain('<ol>');
    });

    it('renders a nested <ol> with each sub-entry link when subEntries are present', () => {
      const html = builder.build([
        {
          title: 'Chapitre 1',
          chapterId: 'ch-0',
          subEntries: [
            { title: 'Sous-titre A', anchorId: 'ch-0-soustitre-0' },
            { title: 'Sous-titre B', anchorId: 'ch-0-soustitre-1' },
          ],
        },
      ]);
      expect(html).toContain('href="#ch-0-soustitre-0"');
      expect(html).toContain('Sous-titre A');
      expect(html).toContain('href="#ch-0-soustitre-1"');
      expect(html).toContain('Sous-titre B');
    });

    it('nests sub-entries inside the chapter <li>, not as siblings', () => {
      const html = builder.build([
        {
          title: 'Chapitre 1',
          chapterId: 'ch-0',
          subEntries: [{ title: 'Sous-titre A', anchorId: 'ch-0-soustitre-0' }],
        },
      ]);
      const chapterEntryStart = html.indexOf('<li><a href="#ch-0">');
      const subEntryIdx = html.indexOf('href="#ch-0-soustitre-0"');
      const closingLi = html.indexOf('</li>', subEntryIdx);
      expect(chapterEntryStart).toBeGreaterThanOrEqual(0);
      expect(subEntryIdx).toBeGreaterThan(chapterEntryStart);
      expect(closingLi).toBeGreaterThan(subEntryIdx);
    });

    it('escapes sub-entry title and anchor id', () => {
      const html = builder.build([
        {
          title: 'Chapitre 1',
          chapterId: 'ch-0',
          subEntries: [{ title: "L'Été & l'Hiver", anchorId: 'ch-0-"soustitre"' }],
        },
      ]);
      expect(html).not.toContain("L'Été & l'Hiver");
      expect(html).toContain('&amp;');
      expect(html).toContain('&quot;');
    });
  });
});
