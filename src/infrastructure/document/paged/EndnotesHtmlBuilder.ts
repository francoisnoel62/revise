// ABOUTME: Compiles a book's endnotes into a back-matter section, grouped by chapter.
// ABOUTME: Numbering restarts per chapter and every note links back to its body call (round trip).

import type { JSONContent } from '@tiptap/core';
import type { TipTapToHtmlConverter } from '@/application/interfaces/TipTapToHtmlConverter';
import type { EndnoteCompilationChapter } from '@/application/interfaces/PagedRenderer';
import {
  endnoteCallId,
  endnoteNoteId,
  extractChapterEndnotes,
  ENDNOTES_SECTION_ID,
  DEFAULT_ENDNOTES_TITLE,
  type ExtractedEndnote,
} from '@/application/rendering/endnoteCompilation';
import { escapeHtml } from './htmlEscape';

export class EndnotesHtmlBuilder {
  constructor(private readonly converter: TipTapToHtmlConverter) {}

  build(chapters: readonly EndnoteCompilationChapter[], sectionTitle?: string): string {
    const groups: string[] = [];
    for (const chapter of chapters) {
      const notes = extractChapterEndnotes(chapter.content);
      if (notes.length === 0) continue;
      groups.push(this.renderGroup(chapter, notes));
    }

    if (groups.length === 0) return '';

    const title = escapeHtml(sectionTitle?.trim() || DEFAULT_ENDNOTES_TITLE);
    return `<section class="back-matter endnotes" id="${ENDNOTES_SECTION_ID}">
  <h2 class="endnotes-title">${title}</h2>
${groups.join('\n')}
</section>`;
  }

  private renderGroup(chapter: EndnoteCompilationChapter, notes: readonly ExtractedEndnote[]): string {
    const heading = escapeHtml(chapter.title.trim() || `Chapitre ${chapter.index}`);
    const items = notes.map((note) => this.renderNote(chapter.anchorId, note)).join('\n');
    return `  <div class="endnotes-chapter">
    <h3 class="endnotes-chapter-title">${heading}</h3>
    <ol class="endnotes-list">
${items}
    </ol>
  </div>`;
  }

  private renderNote(anchorPrefix: string, note: ExtractedEndnote): string {
    const noteId = escapeHtml(endnoteNoteId(anchorPrefix, note.number));
    const callId = escapeHtml(endnoteCallId(anchorPrefix, note.number));
    const body = this.renderBody(note.content);
    return `      <li class="endnote-item" id="${noteId}"><a class="endnote-backlink" href="#${callId}">${note.number}.</a> ${body}</li>`;
  }

  // The note body is a one-paragraph rich TipTap doc. Reuse the book converter so marks/links render
  // exactly as in the body; the paragraph is displayed inline (see BookCssBuilder) so the number and
  // the first line share a line for the hanging indent. Empty/absent bodies render nothing.
  private renderBody(content: JSONContent | null): string {
    if (!content || content.type !== 'doc') return '';
    return this.converter.convert(content);
  }
}
