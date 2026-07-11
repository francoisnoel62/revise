// ABOUTME: Generates HTML sections for book front matter (liminaires) pages.
// ABOUTME: Order: half-title, title, copyright (auto ©), dedication, epigraph, custom annexes.

import type { JSONContent } from '@tiptap/core';
import type { TipTapToHtmlConverter } from '@/application/interfaces/TipTapToHtmlConverter';
import type { FrontMatterData } from '@/domain/interfaces/DocumentExporter';
import { escapeHtml } from './htmlEscape';
import {
  buildAnnexSection,
  hasRenderableText,
  parseTipTapDoc,
  renderRichContent,
} from './richContentHtml';

export class FrontMatterHtmlBuilder {
  constructor(private readonly converter: TipTapToHtmlConverter) {}

  build(data: FrontMatterData): string {
    const sections: string[] = [];

    sections.push(this.buildHalfTitle(data.title));
    sections.push(this.buildTitlePage(data));
    sections.push(this.buildCopyrightPage(data));

    if (hasRenderableText(data.dedicationContent)) {
      sections.push(this.buildDedicationPage(data.dedicationContent!));
    }

    if (hasRenderableText(data.epigraphContent)) {
      sections.push(this.buildEpigraphPage(data.epigraphContent!));
    }

    for (const annex of data.customAnnexes ?? []) {
      if (hasRenderableText(annex.content)) {
        sections.push(buildAnnexSection(this.converter, annex, 'liminal'));
      }
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

  /** Copyright page: always emitted, systematic © auto-generated from year + author. */
  private buildCopyrightPage(data: FrontMatterData): string {
    const year = data.copyrightYear ?? new Date().getFullYear();
    const author = data.authorName?.trim() ?? '';
    const notice = author
      ? `© ${year} ${author}. Tous droits réservés.`
      : `© ${year}. Tous droits réservés.`;
    return `<section class="liminal copyright-page">
  <p class="copyright-text">${this.escape(notice)}</p>
</section>`;
  }

  private buildDedicationPage(content: string): string {
    return `<section class="liminal dedication-page">
  <div class="dedication-text">${renderRichContent(this.converter, content)}</div>
</section>`;
  }

  private buildEpigraphPage(content: string): string {
    const doc = parseTipTapDoc(content);

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

  /** Inline HTML of a single block node, without its wrapping block tag. */
  private inlineHtml(node: JSONContent): string {
    const html = this.converter.convert({ type: 'doc', content: [node] });
    return html.replace(/^<[a-z][^>]*>/i, '').replace(/<\/[a-z]+>\s*$/i, '');
  }

  private escape(value: string): string {
    return escapeHtml(value);
  }
}
