// ABOUTME: Generates HTML sections for book front matter (liminaires) pages.
// ABOUTME: Pages are in canonical order: half-title, title, copyright, dedication, epigraph.

import type { FrontMatterData } from '@/domain/interfaces/DocumentExporter';
import { escapeHtml } from './htmlEscape';

export class FrontMatterHtmlBuilder {
  build(data: FrontMatterData): string {
    const sections: string[] = [];

    sections.push(this.buildHalfTitle(data.title));
    sections.push(this.buildTitlePage(data));
    sections.push(this.buildCopyrightPage(data));

    if (data.dedicationContent?.trim()) {
      sections.push(this.buildDedicationPage(data.dedicationContent));
    }

    if (data.epigraphContent?.trim()) {
      sections.push(this.buildEpigraphPage(data.epigraphContent));
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
  <p class="dedication-text">${this.escape(content)}</p>
</section>`;
  }

  private buildEpigraphPage(content: string): string {
    return `<section class="liminal epigraph-page">
  <blockquote class="epigraph-text">${this.escape(content)}</blockquote>
</section>`;
  }

  private escape(value: string): string {
    return escapeHtml(value);
  }
}
