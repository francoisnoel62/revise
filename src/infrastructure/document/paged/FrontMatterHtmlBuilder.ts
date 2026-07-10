// ABOUTME: Generates HTML sections for book front matter (liminaires) pages.
// ABOUTME: Pages are in canonical order: half-title, title, copyright, dedication, epigraph.

import type { JSONContent } from '@tiptap/core';
import type { TipTapToHtmlConverter } from '@/application/interfaces/TipTapToHtmlConverter';
import type { FrontMatterData } from '@/domain/interfaces/DocumentExporter';
import { escapeHtml } from './htmlEscape';

export class FrontMatterHtmlBuilder {
  constructor(private readonly converter: TipTapToHtmlConverter) {}

  build(data: FrontMatterData): string {
    const sections: string[] = [];

    sections.push(this.buildHalfTitle(data.title));
    sections.push(this.buildTitlePage(data));
    sections.push(this.buildCopyrightPage(data));

    if (this.hasRenderableContent(data.dedicationContent)) {
      sections.push(this.buildDedicationPage(data.dedicationContent!));
    }

    if (this.hasRenderableContent(data.epigraphContent)) {
      sections.push(this.buildEpigraphPage(data.epigraphContent!));
    }

    return sections.join('\n');
  }

  private buildHalfTitle(title: string): string {
    return `<section class="liminal half-title">
  <p class="book-half-title">${this.escape(title)}</p>
</section>`;
  }

  private buildTitlePage(data: FrontMatterData): string {
    const parts: string[] = [
      `  <p class="book-title">${this.escape(data.title)}</p>`,
    ];
    if (data.subtitle?.trim()) {
      parts.push(`  <p class="book-subtitle">${this.escape(data.subtitle)}</p>`);
    }
    if (data.authorName?.trim()) {
      parts.push(`  <p class="book-author">${this.escape(data.authorName)}</p>`);
    }
    return `<section class="liminal title-page">
${parts.join('\n')}
</section>`;
  }

  private buildCopyrightPage(data: FrontMatterData): string {
    const parts: string[] = [];

    if (data.copyrightContent?.trim()) {
      parts.push(`  <p class="copyright-text">${this.escape(data.copyrightContent)}</p>`);
    } else {
      const year = data.copyrightYear ?? new Date().getFullYear();
      const author = data.authorName?.trim() ?? '';
      const notice = author
        ? `© ${year} ${author}. Tous droits réservés.`
        : `© ${year}. Tous droits réservés.`;
      parts.push(`  <p class="copyright-text">${this.escape(notice)}</p>`);
    }

    if (data.isbn?.trim()) {
      parts.push(`  <p class="book-isbn">ISBN : ${this.escape(data.isbn)}</p>`);
    }

    return `<section class="liminal copyright-page">
${parts.join('\n')}
</section>`;
  }

  private buildDedicationPage(content: string): string {
    return `<section class="liminal dedication-page">
  <div class="dedication-text">${this.renderRichContent(content)}</div>
</section>`;
  }

  private buildEpigraphPage(content: string): string {
    const doc = this.parseDoc(content);

    // Legacy plain text (or non-doc JSON): keep the simple escaped quote.
    if (!doc) {
      return `<section class="liminal epigraph-page">
  <blockquote class="epigraph-text">${this.escape(content)}</blockquote>
</section>`;
    }

    const paragraphs = Array.isArray(doc.content) ? doc.content : [];

    // Convention: an epigraph's last paragraph is the attribution (author/source).
    // With two or more paragraphs, split it off and right-align it; a lone paragraph
    // stays a pure quote with no attribution.
    if (paragraphs.length >= 2) {
      const quote = this.converter.convert({ type: 'doc', content: paragraphs.slice(0, -1) });
      const attribution = this.inlineHtml(paragraphs[paragraphs.length - 1]);
      return `<section class="liminal epigraph-page">
  <blockquote class="epigraph-text">${quote}</blockquote>
  <p class="epigraph-attribution">${attribution}</p>
</section>`;
    }

    return `<section class="liminal epigraph-page">
  <blockquote class="epigraph-text">${this.converter.convert(doc)}</blockquote>
</section>`;
  }

  /** Renders a stored string as HTML: TipTap doc JSON via the converter, plain text escaped. */
  private renderRichContent(content: string): string {
    const doc = this.parseDoc(content);
    return doc ? this.converter.convert(doc) : this.escape(content);
  }

  /** Inline HTML of a single block node, without its wrapping block tag. */
  private inlineHtml(node: JSONContent): string {
    const html = this.converter.convert({ type: 'doc', content: [node] });
    return html.replace(/^<[a-z][^>]*>/i, '').replace(/<\/[a-z]+>\s*$/i, '');
  }

  /** Parses a TipTap doc JSON string; null for plain text or any non-doc value. */
  private parseDoc(content: string): JSONContent | null {
    try {
      const json = JSON.parse(content) as JSONContent;
      return json && json.type === 'doc' ? json : null;
    } catch {
      return null;
    }
  }

  /** True when the string carries visible text — a bare TipTap doc yields no page. */
  private hasRenderableContent(content: string | undefined): boolean {
    if (!content?.trim()) return false;
    const doc = this.parseDoc(content);
    if (!doc) return true; // legacy plain text
    return this.docText(doc).trim().length > 0;
  }

  private docText(node: JSONContent): string {
    if (node.type === 'text') return node.text ?? '';
    return (node.content ?? []).map((child) => this.docText(child)).join('');
  }

  private escape(value: string): string {
    return escapeHtml(value);
  }
}
