// ABOUTME: Generates the HTML table of contents (nav.toc) from a list of chapter entries.
// ABOUTME: Entries link to chapter section IDs; Paged.js resolves page numbers via target-counter.

import type { TocEntry } from '@/application/interfaces/PagedRenderer';
import { escapeHtml } from './htmlEscape';

export class TocHtmlBuilder {
  build(entries: TocEntry[]): string {
    if (entries.length === 0) return '';

    const items = entries
      .map((entry) => {
        const href = this.escape(entry.chapterId);
        const title = this.escape(entry.title);
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

  private escape(value: string): string {
    return escapeHtml(value);
  }
}
