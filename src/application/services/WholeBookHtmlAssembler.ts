// ABOUTME: Assembles the complete book body HTML from ordered chapter inputs.
// ABOUTME: Wraps each chapter in a semantic section so Paged.js page-breaks and TOC anchors work.

import type { JSONContent } from '@tiptap/core';
import type { TocEntry } from '@/application/interfaces/PagedRenderer';
import type { TipTapToBookHtml } from '@/infrastructure/document/paged/TipTapToBookHtml';

export interface ChapterInput {
  readonly id: string;
  readonly title: string;
  readonly content: JSONContent;
}

export interface AssembledBook {
  readonly bodyHtml: string;
  readonly tocEntries: readonly TocEntry[];
}

export class WholeBookHtmlAssembler {
  constructor(private readonly converter: TipTapToBookHtml) {}

  assemble(chapters: readonly ChapterInput[]): AssembledBook {
    if (chapters.length === 0) return { bodyHtml: '', tocEntries: [] };

    const bodyParts: string[] = [];
    const tocEntries: TocEntry[] = [];

    for (const chapter of chapters) {
      const { id, title, content } = chapter;
      const h1 = `<h1>${this.escapeHtml(title)}</h1>`;
      const bodyContent = this.converter.convertChapter(content, title);
      bodyParts.push(
        `<section id="${this.escapeAttr(id)}" class="chapter">${h1}\n${bodyContent}</section>`,
      );
      tocEntries.push({ chapterId: id, title });
    }

    // TOC only when there are at least 2 titled chapters (matches PDF exporter rule)
    const toc: readonly TocEntry[] = tocEntries.length > 1 ? tocEntries : [];

    return { bodyHtml: bodyParts.join('\n'), tocEntries: toc };
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  }

  private escapeAttr(text: string): string {
    return text.replace(/"/g, '&quot;');
  }
}
