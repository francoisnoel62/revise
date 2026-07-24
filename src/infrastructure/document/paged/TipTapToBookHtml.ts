// ABOUTME: Converts TipTap JSON into the semantic HTML consumed by the book renderer.
// ABOUTME: Preserves author content while leaving all presentation to publication profiles.

import type { JSONContent } from '@tiptap/core';
import type { ConvertOptions, TipTapToHtmlConverter } from '@/application/interfaces/TipTapToHtmlConverter';
import { endnoteCallId, endnoteNoteId } from '@/application/rendering/endnoteCompilation';
import { applyFrenchSpacing } from './frenchSpacing';

// Paged.js's break-after: avoid glues a heading to whatever element comes right after it
// in the DOM — not to the next visible content. A blank line an author leaves after a
// heading (pressing Enter for spacing) becomes an empty paragraph that steals that glue,
// leaving the heading free to strand alone at the bottom of a page. These are the roles
// BookCssBuilder marks break-after: avoid; blank paragraphs right after them are dropped.
const HEADING_ROLES_GLUED_TO_NEXT = new Set(['titre-de-chapitre', 'sous-titre']);

export class TipTapToBookHtml implements TipTapToHtmlConverter {
  // Prefix + running index used to number and anchor endnote calls in export mode. Reset per
  // convert() call so each chapter restarts at 1 — matching extractChapterEndnotes, which numbers
  // the same document in the same order. null prefix = reading view (hover bubble, no anchors).
  private endnoteAnchorPrefix: string | null = null;
  private endnoteIndex = 0;

  convert(content: JSONContent, options?: ConvertOptions): string {
    if (content.type !== 'doc') {
      throw new Error('Paged rendering requires a TipTap document root');
    }

    this.endnoteAnchorPrefix = options?.endnoteAnchorPrefix ?? null;
    this.endnoteIndex = 0;

    return this.renderChildren(content);
  }

  private renderChildren(node: JSONContent): string {
    return this.dropBlankLinesAfterGluedHeadings(node.content ?? [])
      .map((child) => this.renderNode(child))
      .join('');
  }

  // Drops every blank paragraph immediately following a titre-de-chapitre/sous-titre, so
  // the heading's next DOM sibling is always its real body content, not an empty line.
  private dropBlankLinesAfterGluedHeadings(nodes: readonly JSONContent[]): JSONContent[] {
    const kept: JSONContent[] = [];
    let precededByGluedHeading = false;
    for (const node of nodes) {
      if (precededByGluedHeading && this.isBlankParagraph(node)) continue;
      kept.push(node);
      precededByGluedHeading =
        node.type === 'heading' && HEADING_ROLES_GLUED_TO_NEXT.has(String(node.attrs?.semanticRole));
    }
    return kept;
  }

  private isBlankParagraph(node: JSONContent): boolean {
    if (node.type !== 'paragraph') return false;
    return (node.content ?? []).every(
      (child) => child.type === 'text' && !(child.text ?? '').trim(),
    );
  }

  private renderNode(node: JSONContent): string {
    const children = this.renderChildren(node);

    switch (node.type) {
      case 'text':
        return this.renderText(node);
      case 'paragraph':
        return `<p${this.renderBlockAttributes(node)}>${children}</p>`;
      case 'heading': {
        const level = Math.min(6, Math.max(1, Number(node.attrs?.level) || 1));
        return `<h${level}${this.renderBlockAttributes(node)}>${children}</h${level}>`;
      }
      case 'blockquote':
        return `<blockquote>${children}</blockquote>`;
      case 'bulletList':
        return `<ul>${children}</ul>`;
      case 'orderedList':
        return `<ol${
          typeof node.attrs?.start === 'number' && node.attrs.start !== 1
            ? ` start="${node.attrs.start}"`
            : ''
        }>${children}</ol>`;
      case 'listItem':
        return `<li>${children}</li>`;
      case 'codeBlock':
        return `<pre><code>${children}</code></pre>`;
      case 'horizontalRule':
        return '<hr>';
      case 'hardBreak':
        return '<br>';
      case 'endnoteRef':
        return this.renderEndnoteRef(node);
      default:
        return children;
    }
  }

  // The endnote call. In the reading view (no anchor prefix) it is a numbered superscript — the
  // digit is a CSS counter (see BookCssBuilder) — carrying its rich body in a hidden .endnote-body
  // that a floating bubble reveals on hover/click; there is no compiled notes section.
  // In export mode (anchor prefix set) it becomes a round-trip link: the call carries an id (the
  // back-link target from its compiled note) and links forward to that note, printing the literal
  // per-chapter number. The bubble body rides along so the on-screen preview still previews it.
  private renderEndnoteRef(node: JSONContent): string {
    const body = this.renderEndnoteBody(node.attrs?.content as JSONContent | null | undefined);

    if (this.endnoteAnchorPrefix) {
      this.endnoteIndex += 1;
      const n = this.endnoteIndex;
      const callId = endnoteCallId(this.endnoteAnchorPrefix, n);
      const noteId = endnoteNoteId(this.endnoteAnchorPrefix, n);
      return `<sup class="endnote-ref endnote-ref--linked" id="${this.escapeHtml(callId)}" data-endnote><a class="endnote-ref__link" href="#${this.escapeHtml(noteId)}">${n}</a><span class="endnote-body">${body}</span></sup>`;
    }

    return `<sup class="endnote-ref" data-endnote tabindex="0" role="button" aria-label="Note de fin"><span class="endnote-body">${body}</span></sup>`;
  }

  // Renders the note body (a one-paragraph rich TipTap doc) as inline HTML — marks preserved,
  // no block wrapper, so it nests cleanly inside the superscript. Empty/absent body → ''.
  private renderEndnoteBody(content: JSONContent | null | undefined): string {
    if (!content || !Array.isArray(content.content)) return '';
    return content.content
      .map((block) => (block.content ?? []).map((inline) => this.renderNode(inline)).join(''))
      .filter((line) => line.length > 0)
      .join('<br>');
  }

  private renderText(node: JSONContent): string {
    let html = this.escapeHtml(applyFrenchSpacing(node.text ?? ''));

    for (const mark of node.marks ?? []) {
      switch (mark.type) {
        case 'bold':
          html = `<strong>${html}</strong>`;
          break;
        case 'italic':
          html = `<em>${html}</em>`;
          break;
        case 'underline':
          html = `<u>${html}</u>`;
          break;
        case 'strike':
          html = `<s>${html}</s>`;
          break;
        case 'code':
          html = `<code>${html}</code>`;
          break;
        case 'highlight':
          html = `<mark>${html}</mark>`;
          break;
        case 'textStyle': {
          const style = this.renderStyle(mark.attrs);
          html = style ? `<span style="${style}">${html}</span>` : html;
          break;
        }
        case 'link': {
          const href =
            typeof mark.attrs?.href === 'string' ? this.escapeHtml(mark.attrs.href) : '';
          const target =
            typeof mark.attrs?.target === 'string'
              ? ` target="${this.escapeHtml(mark.attrs.target)}"`
              : '';
          const rel =
            typeof mark.attrs?.rel === 'string'
              ? ` rel="${this.escapeHtml(mark.attrs.rel)}"`
              : '';
          html = `<a href="${href}"${target}${rel}>${html}</a>`;
          break;
        }
      }
    }

    return html;
  }

  private renderBlockAttributes(node: JSONContent): string {
    const attributes: string[] = [];
    const id = node.attrs?.id;
    if (typeof id === 'string' && id.length > 0) {
      attributes.push(`id="${this.escapeHtml(id)}"`);
    }
    const semanticRole = node.attrs?.semanticRole;
    if (typeof semanticRole === 'string') {
      attributes.push(`data-semantic-role="${this.escapeHtml(semanticRole)}"`);
    }
    const wordAnchor = node.attrs?.wordAnchor;
    if (typeof wordAnchor === 'number') {
      attributes.push(`data-word-anchor="${wordAnchor}"`);
    }
    if (node.attrs?.indent === true) {
      attributes.push('data-indent="true"');
    }
    const style = this.renderStyle(node.attrs);
    if (style) attributes.push(`style="${style}"`);
    return attributes.length > 0 ? ` ${attributes.join(' ')}` : '';
  }

  private renderStyle(attributes: Record<string, unknown> | undefined): string {
    if (!attributes) return '';
    const declarations: string[] = [];
    if (typeof attributes.fontFamily === 'string') {
      declarations.push(`font-family:${this.escapeHtml(attributes.fontFamily)}`);
    }
    if (typeof attributes.fontSize === 'string') {
      declarations.push(`font-size:${this.escapeHtml(attributes.fontSize)}`);
    }
    if (typeof attributes.textAlign === 'string') {
      declarations.push(`text-align:${this.escapeHtml(attributes.textAlign)}`);
    }
    return declarations.join(';');
  }

  private escapeHtml(value: string): string {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }
}
