// ABOUTME: Generates the HTML table of contents (nav.toc) from a list of chapter entries.
// ABOUTME: Entries link to chapter section IDs; the paged renderer resolves physical page numbers.

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
    return `    <li class="toc-chapter"><a href="#${href}">${this.link(title)}</a>${subList}</li>`;
  }

  private renderSubEntry(sub: TocSubEntry): string {
    const href = this.escape(sub.anchorId);
    const title = this.escape(sub.title);
    return `        <li class="toc-subtitle"><a href="#${href}">${this.link(title)}</a></li>`;
  }

  // The title and a dedicated leader element. The leader carries a dotted bottom border in CSS
  // and stretches with flex to fill exactly the space left up to the page number — one line, no
  // wrapping. It is decorative, hence aria-hidden. The renderer fills the CSS ::after value.
  private link(escapedTitle: string): string {
    return `<span class="toc-title">${escapedTitle}</span><span class="toc-leader" aria-hidden="true"></span>`;
  }

  private escape(value: string): string {
    return escapeHtml(value);
  }
}
