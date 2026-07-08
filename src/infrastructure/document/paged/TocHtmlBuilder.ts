// ABOUTME: Generates the HTML table of contents (nav.toc) from a list of chapter entries.
// ABOUTME: Entries link to chapter section IDs; Paged.js resolves page numbers via target-counter.

import type { TocEntry, TocSubEntry } from '@/application/interfaces/PagedRenderer';
import type { TocStyle } from '@/domain/value-objects/TocPreferences';
import { escapeHtml } from './htmlEscape';

export class TocHtmlBuilder {
  build(entries: TocEntry[], style: TocStyle = 'classique'): string {
    if (entries.length === 0) return '';

    const items = entries.map((entry) => this.renderEntry(entry)).join('\n');

    return `<nav class="toc liminal toc--${style}">
  <h2>Table des matières</h2>
  <ol>
${items}
  </ol>
</nav>`;
  }

  private renderEntry(entry: TocEntry): string {
    const href = this.escape(entry.chapterId);
    const title = this.escape(entry.title);
    const subList =
      entry.subEntries && entry.subEntries.length > 0
        ? `\n      <ol>\n${entry.subEntries.map((sub) => this.renderSubEntry(sub)).join('\n')}\n      </ol>\n    `
        : '';
    return `    <li><a href="#${href}"><span class="toc-title">${title}</span></a>${subList}</li>`;
  }

  private renderSubEntry(sub: TocSubEntry): string {
    const href = this.escape(sub.anchorId);
    const title = this.escape(sub.title);
    return `        <li><a href="#${href}"><span class="toc-title">${title}</span></a></li>`;
  }

  private escape(value: string): string {
    return escapeHtml(value);
  }
}
