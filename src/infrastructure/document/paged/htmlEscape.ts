// ABOUTME: Shared HTML escaping for paged-media HTML builders.
// ABOUTME: Single source so FrontMatterHtmlBuilder and TocHtmlBuilder cannot drift.

export function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
