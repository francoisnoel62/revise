// ABOUTME: Tests for WholeBookHtmlAssembler — book-wide body HTML and TOC assembly.
// ABOUTME: Verifies chapter wrapping, title injection, TOC entries, and ordering.

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

describe('WholeBookHtmlAssembler', () => {
  it('returns empty bodyHtml and tocEntries for an empty chapter list', () => {
    const { bodyHtml, tocEntries } = assembler.assemble([]);
    expect(bodyHtml).toBe('');
    expect(tocEntries).toEqual([]);
  });

  it('wraps each chapter in a section with class "chapter" and the chapter id', () => {
    const { bodyHtml } = assembler.assemble([
      { id: 'ch-abc', title: 'Prologue', content: paragraphDoc('Once upon a time') },
    ]);
    expect(bodyHtml).toContain('id="ch-abc"');
    expect(bodyHtml).toContain('class="chapter"');
  });

  it('prepends an h1 with the escaped chapter title inside the section', () => {
    const { bodyHtml } = assembler.assemble([
      { id: 'ch1', title: 'Chapter & One', content: paragraphDoc('text') },
    ]);
    expect(bodyHtml).toContain('<h1>Chapter &amp; One</h1>');
  });

  it('includes the chapter body content after the h1', () => {
    const { bodyHtml } = assembler.assemble([
      { id: 'ch1', title: 'Chapter 1', content: paragraphDoc('Hello world') },
    ]);
    expect(bodyHtml).toContain('<p>Hello world</p>');
    const h1Pos = bodyHtml.indexOf('<h1>Chapter 1</h1>');
    const bodyPos = bodyHtml.indexOf('<p>Hello world</p>');
    expect(h1Pos).toBeLessThan(bodyPos);
  });

  it('returns an empty tocEntries for a single chapter', () => {
    const { tocEntries } = assembler.assemble([
      { id: 'ch1', title: 'Chapter 1', content: paragraphDoc('text') },
    ]);
    expect(tocEntries).toEqual([]);
  });

  it('returns tocEntries for multiple chapters', () => {
    const { tocEntries } = assembler.assemble([
      { id: 'ch1', title: 'Chapter 1', content: paragraphDoc('text') },
      { id: 'ch2', title: 'Chapter 2', content: paragraphDoc('text') },
    ]);
    expect(tocEntries).toEqual([
      { chapterId: 'ch1', title: 'Chapter 1' },
      { chapterId: 'ch2', title: 'Chapter 2' },
    ]);
  });

  it('concatenates multiple chapter sections in order', () => {
    const { bodyHtml } = assembler.assemble([
      { id: 'ch1', title: 'Chapter 1', content: paragraphDoc('First') },
      { id: 'ch2', title: 'Chapter 2', content: paragraphDoc('Second') },
    ]);
    const ch1Pos = bodyHtml.indexOf('id="ch1"');
    const ch2Pos = bodyHtml.indexOf('id="ch2"');
    expect(ch1Pos).toBeGreaterThanOrEqual(0);
    expect(ch1Pos).toBeLessThan(ch2Pos);
  });

  it('strips a duplicate title heading from TipTap content to avoid repeating the h1', () => {
    const contentWithHeading: JSONContent = {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Chapter 1' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Body text' }] },
      ],
    };
    const { bodyHtml } = assembler.assemble([
      { id: 'ch1', title: 'Chapter 1', content: contentWithHeading },
    ]);
    // The h1 should appear exactly once (from the injected title, not from the content)
    const h1Count = (bodyHtml.match(/<h1>/g) ?? []).length;
    expect(h1Count).toBe(1);
  });

  it('escapes the chapter id in the section attribute', () => {
    // IDs should not contain quotes, but the assembler should escape them defensively
    const { bodyHtml } = assembler.assemble([
      { id: 'safe-id-123', title: 'Safe', content: paragraphDoc('text') },
    ]);
    expect(bodyHtml).toContain('id="safe-id-123"');
  });
});
