// ABOUTME: Tests for WholeBookHtmlAssembler — book-wide body HTML and TOC assembly.
// ABOUTME: Verifies chapter wrapping, TOC entries/ordering, and title fidelity (no injection, no fallback).

import { describe, it, expect } from 'vitest';
import { WholeBookHtmlAssembler } from '../WholeBookHtmlAssembler';
import { TipTapToBookHtml } from '@/infrastructure/document/paged/TipTapToBookHtml';
import type { JSONContent } from '@tiptap/core';

const converter = new TipTapToBookHtml();
const assembler = new WholeBookHtmlAssembler(converter);

const paragraphDoc = (text: string): JSONContent => ({
  type: 'doc',
  content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
});

const chapterDoc = (title: string, bodyText: string): JSONContent => ({
  type: 'doc',
  content: [
    { type: 'heading', attrs: { level: 1, semanticRole: 'titre-de-chapitre' }, content: [{ type: 'text', text: title }] },
    { type: 'paragraph', content: [{ type: 'text', text: bodyText }] },
  ],
});

const chapterWithSubtitlesDoc = (title: string, subtitles: string[]): JSONContent => ({
  type: 'doc',
  content: [
    { type: 'heading', attrs: { level: 1, semanticRole: 'titre-de-chapitre' }, content: [{ type: 'text', text: title }] },
    ...subtitles.flatMap((subtitle) => [
      {
        type: 'heading',
        attrs: { level: 2, semanticRole: 'sous-titre' },
        content: [{ type: 'text', text: subtitle }],
      },
      { type: 'paragraph', content: [{ type: 'text', text: 'Texte.' }] },
    ]),
  ],
});

describe('WholeBookHtmlAssembler', () => {
  it('returns empty bodyHtml and tocEntries for an empty chapter list', () => {
    const { bodyHtml, tocEntries } = assembler.assemble([]);
    expect(bodyHtml).toBe('');
    expect(tocEntries).toEqual([]);
  });

  it('wraps each chapter in a section with a CSS-safe anchor and the domain chapter id', () => {
    const { bodyHtml } = assembler.assemble([
      { id: 'ch-abc', title: 'Prologue', content: paragraphDoc('Once upon a time') },
    ]);
    expect(bodyHtml).toContain('id="chapter-ch-abc"');
    expect(bodyHtml).toContain('data-chapter-id="ch-abc"');
    expect(bodyHtml).toContain('class="chapter"');
  });

  it('never injects an h1: the body renders exactly what the converter produces', () => {
    const { bodyHtml } = assembler.assemble([
      { id: 'ch1', title: 'Chapter & One', content: chapterDoc('Chapter One', 'Hello world') },
    ]);
    expect(bodyHtml).toContain('<h1 data-semantic-role="titre-de-chapitre">Chapter One</h1>');
    expect(bodyHtml).not.toContain('Chapter &amp; One');
  });

  it('renders no heading at all when the chapter body has none (no fallback to chapter.title)', () => {
    const { bodyHtml } = assembler.assemble([
      { id: 'ch1', title: 'Chapter 1', content: paragraphDoc('Hello world') },
    ]);
    expect(bodyHtml).not.toContain('<h1');
    expect(bodyHtml).toContain('<p>Hello world</p>');
  });

  it('returns an empty tocEntries for a single chapter', () => {
    const { tocEntries } = assembler.assemble([
      { id: 'ch1', title: 'Chapter 1', content: paragraphDoc('text') },
    ]);
    expect(tocEntries).toEqual([]);
  });

  it('returns tocEntries for multiple chapters, labeled from chapter.title regardless of body heading', () => {
    const { tocEntries } = assembler.assemble([
      { id: 'ch1', title: 'Chapter 1', content: paragraphDoc('text') },
      { id: 'ch2', title: 'Chapter 2', content: paragraphDoc('text') },
    ]);
    expect(tocEntries).toEqual([
      { chapterId: 'chapter-ch1', title: 'Chapter 1' },
      { chapterId: 'chapter-ch2', title: 'Chapter 2' },
    ]);
  });

  it('concatenates multiple chapter sections in order', () => {
    const { bodyHtml } = assembler.assemble([
      { id: 'ch1', title: 'Chapter 1', content: paragraphDoc('First') },
      { id: 'ch2', title: 'Chapter 2', content: paragraphDoc('Second') },
    ]);
    const ch1Pos = bodyHtml.indexOf('id="chapter-ch1"');
    const ch2Pos = bodyHtml.indexOf('id="chapter-ch2"');
    expect(ch1Pos).toBeGreaterThanOrEqual(0);
    expect(ch1Pos).toBeLessThan(ch2Pos);
  });

  it('renders the body heading exactly once when the content already has a titre-de-chapitre heading', () => {
    const { bodyHtml } = assembler.assemble([
      { id: 'ch1', title: 'Chapter 1', content: chapterDoc('Chapter 1', 'Body text') },
    ]);
    const h1Count = (bodyHtml.match(/<h1/g) ?? []).length;
    expect(h1Count).toBe(1);
  });

  it('prefixes UUID anchors so a leading digit remains a valid CSS selector', () => {
    const { bodyHtml } = assembler.assemble([
      { id: '004bee1e-9ba3-48c3-aedd-2c0a026598dd', title: 'Safe', content: paragraphDoc('text') },
    ]);
    expect(bodyHtml).toContain('id="chapter-004bee1e-9ba3-48c3-aedd-2c0a026598dd"');
    expect(bodyHtml).toContain('data-chapter-id="004bee1e-9ba3-48c3-aedd-2c0a026598dd"');
  });

  describe('tocDepth: chapters-and-subtitles', () => {
    it('does not collect subtitles when tocDepth is omitted (default unchanged)', () => {
      const { tocEntries } = assembler.assemble([
        { id: 'ch1', title: 'Chapter 1', content: chapterWithSubtitlesDoc('Chapter 1', ['Sous-titre A']) },
        { id: 'ch2', title: 'Chapter 2', content: paragraphDoc('text') },
      ]);
      expect(tocEntries[0].subEntries).toBeUndefined();
    });

    it('does not collect subtitles when tocDepth is "chapters"', () => {
      const { tocEntries } = assembler.assemble(
        [
          { id: 'ch1', title: 'Chapter 1', content: chapterWithSubtitlesDoc('Chapter 1', ['Sous-titre A']) },
          { id: 'ch2', title: 'Chapter 2', content: paragraphDoc('text') },
        ],
        { tocDepth: 'chapters' },
      );
      expect(tocEntries[0].subEntries).toBeUndefined();
    });

    it('collects sous-titre headings as nested subEntries when tocDepth is "chapters-and-subtitles"', () => {
      const { tocEntries } = assembler.assemble(
        [
          { id: 'ch1', title: 'Chapter 1', content: chapterWithSubtitlesDoc('Chapter 1', ['Sous-titre A', 'Sous-titre B']) },
          { id: 'ch2', title: 'Chapter 2', content: paragraphDoc('text') },
        ],
        { tocDepth: 'chapters-and-subtitles' },
      );
      expect(tocEntries[0].subEntries).toEqual([
        { title: 'Sous-titre A', anchorId: 'chapter-ch1-soustitre-0' },
        { title: 'Sous-titre B', anchorId: 'chapter-ch1-soustitre-1' },
      ]);
    });

    it('omits subEntries for a chapter that has no sous-titre heading', () => {
      const { tocEntries } = assembler.assemble(
        [
          { id: 'ch1', title: 'Chapter 1', content: chapterDoc('Chapter 1', 'Body') },
          { id: 'ch2', title: 'Chapter 2', content: paragraphDoc('text') },
        ],
        { tocDepth: 'chapters-and-subtitles' },
      );
      expect(tocEntries[0].subEntries).toBeUndefined();
    });

    it('tags the rendered sous-titre heading with the matching anchor id', () => {
      const { bodyHtml } = assembler.assemble(
        [{ id: 'ch1', title: 'Chapter 1', content: chapterWithSubtitlesDoc('Chapter 1', ['Sous-titre A']) }],
        { tocDepth: 'chapters-and-subtitles' },
      );
      expect(bodyHtml).toContain('<h2 id="chapter-ch1-soustitre-0" data-semantic-role="sous-titre">Sous-titre A</h2>');
    });

    it('does not tag the body heading with an id when tocDepth is "chapters" (unchanged HTML)', () => {
      const { bodyHtml } = assembler.assemble(
        [{ id: 'ch1', title: 'Chapter 1', content: chapterWithSubtitlesDoc('Chapter 1', ['Sous-titre A']) }],
        { tocDepth: 'chapters' },
      );
      expect(bodyHtml).toContain('<h2 data-semantic-role="sous-titre">Sous-titre A</h2>');
      expect(bodyHtml).not.toContain('id="chapter-ch1-soustitre-0"');
    });
  });

  describe('presentation stripping (profile typography wins)', () => {
    // The editor's TextAlign extension stamps every heading/paragraph with an inline
    // textAlign (default 'justify'). Emitted as inline style it out-specifies the profile's
    // [data-semantic-role] rule, so a centered chapter title renders left. The whole-book
    // body must be stripped to semantic content — exactly like the single-chapter preview —
    // so the profile's levelStyles drive alignment.
    const titledWithInlineAlign = (title: string, align: string): JSONContent => ({
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1, semanticRole: 'titre-de-chapitre', textAlign: align },
          content: [{ type: 'text', text: title }],
        },
        {
          type: 'heading',
          attrs: { level: 2, semanticRole: 'sous-titre', textAlign: align },
          content: [{ type: 'text', text: 'Un sous-titre' }],
        },
      ],
    });

    it('strips inline textAlign so the profile alignment is not overridden', () => {
      const { bodyHtml } = assembler.assemble([
        { id: 'ch1', title: 'Chapitre Un', content: titledWithInlineAlign('Chapitre Un', 'justify') },
      ]);
      expect(bodyHtml).not.toContain('text-align');
      expect(bodyHtml).toContain('<h1 data-semantic-role="titre-de-chapitre">Chapitre Un</h1>');
    });

    it('strips inline textAlign even when sous-titre anchors are collected', () => {
      const { bodyHtml } = assembler.assemble(
        [{ id: 'ch1', title: 'Chapitre Un', content: titledWithInlineAlign('Chapitre Un', 'left') }],
        { tocDepth: 'chapters-and-subtitles' },
      );
      expect(bodyHtml).not.toContain('text-align');
      // The anchor id survives stripping (id is not a presentation attr).
      expect(bodyHtml).toContain('id="chapter-ch1-soustitre-0"');
    });
  });

  describe('parity with PDF exporter pipeline', () => {
    function buildPdfExporterBody(
      chapters: Array<{ content: JSONContent }>,
    ): string {
      return chapters
        .map((ch, i) => {
          const chapterId = `ch-${i}`;
          return `<section id="${chapterId}" class="chapter">${converter.convert(ch.content)}</section>`;
        })
        .join('\n');
    }

    // Normalise section IDs so we can compare structure independent of ID format
    const normalizeIds = (html: string) => html
      .replace(/ data-chapter-id="[^"]*"/g, '')
      .replace(/id="[^"]*"/g, 'id="X"');

    it('produces chapter HTML identical to the PDF exporter pipeline for a single chapter', () => {
      const fixture = [{ id: 'ch-real', title: 'Chapitre Un', content: chapterDoc('Chapitre Un', 'Premier contenu.') }];
      const { bodyHtml } = assembler.assemble(fixture);
      const exportBody = buildPdfExporterBody(fixture);
      expect(normalizeIds(bodyHtml)).toBe(normalizeIds(exportBody));
    });

    it('produces chapter HTML identical to the PDF exporter pipeline for multiple chapters', () => {
      const fixture = [
        { id: 'ch-001', title: 'Chapitre Un', content: chapterDoc('Chapitre Un', 'Contenu premier.') },
        { id: 'ch-002', title: 'Chapitre Deux', content: chapterDoc('Chapitre Deux', 'Contenu second.') },
      ];
      const { bodyHtml } = assembler.assemble(fixture);
      const exportBody = buildPdfExporterBody(fixture);
      expect(normalizeIds(bodyHtml)).toBe(normalizeIds(exportBody));
    });

    it('preserves special characters identically between both pipelines', () => {
      const fixture = [
        { id: 'ch-001', title: "L'Été & l'Hiver", content: paragraphDoc('Texte avec <balise> & apostrophe\'s.') },
      ];
      const { bodyHtml } = assembler.assemble(fixture);
      const exportBody = buildPdfExporterBody(fixture);
      expect(normalizeIds(bodyHtml)).toBe(normalizeIds(exportBody));
    });
  });
});
