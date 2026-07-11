// ABOUTME: Generates HTML sections for book back matter, rendered after the body.
// ABOUTME: Order: custom annexes first, then the legal notice ("mentions légales") on the last page.

import type { TipTapToHtmlConverter } from '@/application/interfaces/TipTapToHtmlConverter';
import type { BackMatterData } from '@/domain/interfaces/DocumentExporter';
import { escapeHtml } from './htmlEscape';
import { buildAnnexSection, hasRenderableText, renderRichContent } from './richContentHtml';

export class BackMatterHtmlBuilder {
  constructor(private readonly converter: TipTapToHtmlConverter) {}

  build(data: BackMatterData): string {
    const sections: string[] = [];

    for (const annex of data.customAnnexes ?? []) {
      if (hasRenderableText(annex.content)) {
        sections.push(buildAnnexSection(this.converter, annex, 'back-matter'));
      }
    }

    const legalNotice = this.buildLegalNoticePage(data);
    if (legalNotice) {
      sections.push(legalNotice);
    }

    return sections.join('\n');
  }

  /** Legal notice on the very last page (colophon): rich content + ISBN. Null when both are absent. */
  private buildLegalNoticePage(data: BackMatterData): string | null {
    const parts: string[] = [];

    if (hasRenderableText(data.legalNoticeContent)) {
      parts.push(`  <div class="legal-notice-text">${renderRichContent(this.converter, data.legalNoticeContent!)}</div>`);
    }

    if (data.isbn?.trim()) {
      parts.push(`  <p class="book-isbn">ISBN : ${escapeHtml(data.isbn)}</p>`);
    }

    if (parts.length === 0) return null;

    return `<section class="back-matter colophon legal-notice-page">
${parts.join('\n')}
</section>`;
  }
}
