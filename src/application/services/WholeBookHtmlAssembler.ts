// ABOUTME: Assembles the complete book body HTML from ordered chapter inputs.
// ABOUTME: Wraps each chapter in a semantic section so Paged.js page-breaks and TOC anchors work.

import type { JSONContent } from '@tiptap/core';
import type { TocEntry, TocSubEntry } from '@/application/interfaces/PagedRenderer';
import type { TipTapToBookHtml } from '@/infrastructure/document/paged/TipTapToBookHtml';
import type { TocDepth } from '@/domain/value-objects/TocPreferences';
import { tagSubtitleHeadings } from './subtitleAnchors';

export interface ChapterInput {
  readonly id: string;
  readonly title: string;
  readonly content: JSONContent;
}

export interface AssembleOptions {
  /** Whether to collect sous-titre headings as nested TOC sub-entries. Defaults to 'chapters' (unchanged). */
  readonly tocDepth?: TocDepth;
}

export interface AssembledBook {
  readonly bodyHtml: string;
  readonly tocEntries: readonly TocEntry[];
}

export class WholeBookHtmlAssembler {
  constructor(private readonly converter: TipTapToBookHtml) {}

  assemble(chapters: readonly ChapterInput[], options: AssembleOptions = {}): AssembledBook {
    if (chapters.length === 0) return { bodyHtml: '', tocEntries: [] };

    const collectSubtitles = options.tocDepth === 'chapters-and-subtitles';
    const bodyParts: string[] = [];
    const tocEntries: TocEntry[] = [];

    for (const chapter of chapters) {
      const { id, title, content } = chapter;
      const anchorId = `chapter-${id}`;

      let renderContent = content;
      let subEntries: readonly TocSubEntry[] = [];
      if (collectSubtitles) {
        const tagged = tagSubtitleHeadings(content, anchorId);
        renderContent = tagged.content;
        subEntries = tagged.subEntries;
      }

      const bodyContent = this.converter.convert(renderContent);
      bodyParts.push(
        `<section id="${this.escapeAttr(anchorId)}" data-chapter-id="${this.escapeAttr(id)}" class="chapter">${bodyContent}</section>`,
      );
      tocEntries.push({
        chapterId: anchorId,
        title,
        ...(subEntries.length > 0 ? { subEntries } : {}),
      });
    }

    // TOC only when there are at least 2 titled chapters (matches PDF exporter rule)
    const toc: readonly TocEntry[] = tocEntries.length > 1 ? tocEntries : [];

    return { bodyHtml: bodyParts.join('\n'), tocEntries: toc };
  }

  private escapeAttr(text: string): string {
    return text.replace(/"/g, '&quot;');
  }
}
