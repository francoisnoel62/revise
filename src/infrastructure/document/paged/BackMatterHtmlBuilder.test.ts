// ABOUTME: Tests for BackMatterHtmlBuilder — custom annexes then the legal notice on the last page.
// ABOUTME: Verifies rich TipTap content renders as text (never raw JSON) and empty data yields no pages.
// @vitest-environment node

import { describe, it, expect } from 'vitest';
import { BackMatterHtmlBuilder } from './BackMatterHtmlBuilder';
import { TipTapToBookHtml } from './TipTapToBookHtml';

const builder = new BackMatterHtmlBuilder(new TipTapToBookHtml());

function tiptapDoc(...paragraphs: string[]): string {
  return JSON.stringify({
    type: 'doc',
    content: paragraphs.map((text) => ({
      type: 'paragraph',
      content: [{ type: 'text', text }],
    })),
  });
}

describe('BackMatterHtmlBuilder', () => {
  it('produces no pages for empty back matter', () => {
    expect(builder.build({})).toBe('');
  });

  describe('legal notice', () => {
    it('renders the legal notice TipTap doc as text, never raw JSON', () => {
      const html = builder.build({
        legalNoticeContent: tiptapDoc('© 2026, François Noel', 'Reproduction intégrale ou partielle interdite'),
      });
      expect(html).toContain('© 2026, François Noel');
      expect(html).toContain('Reproduction intégrale ou partielle interdite');
      expect(html).not.toContain('"type":"doc"');
    });

    it('renders the legal notice on a colophon page (no folio)', () => {
      const html = builder.build({ legalNoticeContent: tiptapDoc('Mentions légales') });
      expect(html).toContain('colophon');
      expect(html).toContain('legal-notice-page');
    });

    it('appends the ISBN on the legal notice page', () => {
      const html = builder.build({ legalNoticeContent: tiptapDoc('Mentions'), isbn: '978-2-123456-78-9' });
      expect(html).toContain('book-isbn');
      expect(html).toContain('978-2-123456-78-9');
    });

    it('still renders a legal notice page for ISBN alone', () => {
      const html = builder.build({ isbn: '978-2-123456-78-9' });
      expect(html).toContain('legal-notice-page');
      expect(html).toContain('978-2-123456-78-9');
    });

    it('omits the legal notice when the doc carries no text and no ISBN', () => {
      const emptyDoc = JSON.stringify({ type: 'doc', content: [{ type: 'paragraph' }] });
      expect(builder.build({ legalNoticeContent: emptyDoc })).toBe('');
    });
  });

  describe('custom annexes', () => {
    it('renders custom annexes as back-matter sections with title and text', () => {
      const html = builder.build({
        customAnnexes: [{ title: 'Présentation de Revise Studio', content: tiptapDoc('Revise est un studio...') }],
      });
      expect(html).toContain('back-matter');
      expect(html).toContain('Présentation de Revise Studio');
      expect(html).toContain('Revise est un studio...');
      expect(html).not.toContain('"type":"doc"');
    });

    it('places custom annexes before the legal notice (which is last)', () => {
      const html = builder.build({
        customAnnexes: [{ title: 'Annexe A', content: tiptapDoc('Contenu A') }],
        legalNoticeContent: tiptapDoc('Mentions légales'),
      });
      expect(html.indexOf('Annexe A')).toBeGreaterThanOrEqual(0);
      expect(html.indexOf('Annexe A')).toBeLessThan(html.indexOf('legal-notice-page'));
    });

    it('skips a custom annex whose content is empty', () => {
      const emptyDoc = JSON.stringify({ type: 'doc', content: [{ type: 'paragraph' }] });
      const html = builder.build({ customAnnexes: [{ title: 'Vide', content: emptyDoc }] });
      expect(html).toBe('');
    });
  });
});
