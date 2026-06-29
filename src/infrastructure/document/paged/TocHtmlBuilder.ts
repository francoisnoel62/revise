// ABOUTME: Generates the HTML table of contents (nav.toc) from a list of chapter entries.
// ABOUTME: Entries link to chapter section IDs; Paged.js resolves page numbers via target-counter.

import type { TocEntry } from '@/application/interfaces/PagedRenderer';

export class TocHtmlBuilder {
  build(entries: TocEntry[]): string {
    if (entries.length === 0) return '';

    const items = entries
      .map((entry) => {
        const href = this.escapeAttr(entry.chapterId);
        const title = this.escapeHtml(entry.title);
        return `    <li><a href="#${href}">${title}</a></li>`;
      })
      .join('\n');

    return `<nav class="toc liminal">
  <h2>Table des matières</h2>
  <ol>
${items}
  </ol>
</nav>`;
  }

  private escapeHtml(value: string): string {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  private escapeAttr(value: string): string {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;');
  }
}
