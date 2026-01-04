// ABOUTME: Utility for calculating position of rewrite button relative to text selection
// ABOUTME: Ensures button appears near selected text without overlapping

export function getSelectionPosition(): { top: number; left: number } | null {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    return null;
  }

  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();

  if (rect.width === 0 && rect.height === 0) {
    return null;
  }

  return {
    top: rect.bottom + window.scrollY + 8, // 8px below selection
    left: rect.left + window.scrollX,
  };
}
