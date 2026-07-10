// ABOUTME: Route segment config for /book-preview — the page itself is a Client Component,
// ABOUTME: which can't export route segment config, so maxDuration lives here instead.

// Cold-cache whole-book pagination waits up to 120s for Paged.js alone (see
// BookPreviewCacheComputer's PAGE_READY_TIMEOUT_MS); raise the function budget for the
// getBookPreviewDataAction server action invoked from this route accordingly.
// Vercel Hobby plans hard-cap at 60s regardless of this value — Pro/Enterprise honor it.
export const maxDuration = 300;

export default function BookPreviewLayout({ children }: { children: React.ReactNode }) {
  return children;
}
