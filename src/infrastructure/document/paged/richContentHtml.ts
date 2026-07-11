// ABOUTME: Shared helpers turning a stored annex string into book HTML.
// ABOUTME: Ensures every annex renders TipTap JSON as text (never raw JSON) with a plain-text fallback.

import type { JSONContent } from '@tiptap/core';
import type { TipTapToHtmlConverter } from '@/application/interfaces/TipTapToHtmlConverter';
import { escapeHtml } from './htmlEscape';

/** Parses a TipTap doc JSON string; null for plain text or any non-doc value. */
export function parseTipTapDoc(content: string): JSONContent | null {
  try {
    const json = JSON.parse(content) as JSONContent;
    return json && json.type === 'doc' ? json : null;
  } catch {
    return null;
  }
}

/** Renders a stored string as HTML: TipTap doc JSON via the converter, plain text escaped. */
export function renderRichContent(converter: TipTapToHtmlConverter, content: string): string {
  const doc = parseTipTapDoc(content);
  return doc ? converter.convert(doc) : escapeHtml(content);
}

/** Concatenated visible text of a TipTap node (recursively). */
function docText(node: JSONContent): string {
  if (node.type === 'text') return node.text ?? '';
  return (node.content ?? []).map((child) => docText(child)).join('');
}

/** True when the string carries visible text — a bare TipTap doc yields no page. */
export function hasRenderableText(content: string | undefined): boolean {
  if (!content?.trim()) return false;
  const doc = parseTipTapDoc(content);
  if (!doc) return true; // legacy plain text
  return docText(doc).trim().length > 0;
}

/** A named custom annex section (title heading + rich body), for front or back matter. */
export function buildAnnexSection(
  converter: TipTapToHtmlConverter,
  annex: { title: string; content: string },
  sectionClass: string,
): string {
  const heading = annex.title?.trim()
    ? `  <h2 class="annex-title">${escapeHtml(annex.title)}</h2>\n`
    : '';
  return `<section class="${sectionClass} annex-page">
${heading}  <div class="annex-body">${renderRichContent(converter, annex.content)}</div>
</section>`;
}
