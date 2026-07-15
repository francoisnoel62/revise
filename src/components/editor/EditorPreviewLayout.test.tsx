// ABOUTME: Tests the CSS-only preview toggle: mount is preserved, grid columns react,
// ABOUTME: and the author's choice is read from and written to localStorage.

import { render, screen, fireEvent } from '@testing-library/react';
import { useEffect } from 'react';
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { EditorPreviewLayout, PREVIEW_VISIBILITY_STORAGE_KEY } from './EditorPreviewLayout';

let mountCount = 0;
let unmountCount = 0;

function TrackedPreview() {
  useEffect(() => {
    mountCount += 1;
    return () => {
      unmountCount += 1;
    };
  }, []);
  return null;
}

class MockResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

describe('EditorPreviewLayout', () => {
  beforeEach(() => {
    window.localStorage.clear();
    mountCount = 0;
    unmountCount = 0;
    globalThis.ResizeObserver = MockResizeObserver as unknown as typeof globalThis.ResizeObserver;
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it('defaults to a visible, two-column layout when localStorage has no preference', () => {
    render(
      <EditorPreviewLayout
        editorSlot={<div data-testid="editor-slot" />}
        previewSlot={<div data-testid="preview-slot" />}
      />
    );

    const aside = screen.getByTestId('preview-slot').closest('aside');
    expect(aside).not.toHaveClass('hidden');
    expect(screen.getByTestId('editor-preview-grid')).toHaveClass('xl:grid-cols-2');
  });

  it('reads a stored "hidden" preference and opens with the preview masked', () => {
    window.localStorage.setItem(PREVIEW_VISIBILITY_STORAGE_KEY, 'hidden');

    render(
      <EditorPreviewLayout
        editorSlot={<div data-testid="editor-slot" />}
        previewSlot={<div data-testid="preview-slot" />}
      />
    );

    const aside = screen.getByTestId('preview-slot').closest('aside');
    expect(aside).toHaveClass('hidden');
    expect(screen.getByTestId('editor-preview-grid')).not.toHaveClass('xl:grid-cols-2');
  });

  it('toggles the grid to a single, full-width column without unmounting the preview', () => {
    render(
      <EditorPreviewLayout
        editorSlot={<div data-testid="editor-slot" />}
        previewSlot={<div data-testid="preview-slot" />}
      />
    );

    const preview = screen.getByTestId('preview-slot');
    fireEvent.click(screen.getByTestId('preview-toggle-button'));

    // Still attached to the DOM (never unmounted), just visually hidden.
    expect(preview).toBeInTheDocument();
    expect(preview.closest('aside')).toHaveClass('hidden');
    expect(screen.getByTestId('editor-preview-grid')).not.toHaveClass('xl:grid-cols-2');

    fireEvent.click(screen.getByTestId('preview-toggle-button'));
    expect(preview.closest('aside')).not.toHaveClass('hidden');
    expect(screen.getByTestId('editor-preview-grid')).toHaveClass('xl:grid-cols-2');
  });

  it('never remounts the preview slot component across toggles', () => {
    render(
      <EditorPreviewLayout editorSlot={<div />} previewSlot={<TrackedPreview />} />
    );
    expect(mountCount).toBe(1);

    fireEvent.click(screen.getByTestId('preview-toggle-button'));
    fireEvent.click(screen.getByTestId('preview-toggle-button'));

    expect(mountCount).toBe(1);
    expect(unmountCount).toBe(0);
  });

  it('writes the new preference to localStorage on toggle', () => {
    render(
      <EditorPreviewLayout
        editorSlot={<div />}
        previewSlot={<div data-testid="preview-slot" />}
      />
    );

    fireEvent.click(screen.getByTestId('preview-toggle-button'));
    expect(window.localStorage.getItem(PREVIEW_VISIBILITY_STORAGE_KEY)).toBe('hidden');

    fireEvent.click(screen.getByTestId('preview-toggle-button'));
    expect(window.localStorage.getItem(PREVIEW_VISIBILITY_STORAGE_KEY)).toBe('visible');
  });

  it('keeps the preview pane pinned to the viewport while the editor scrolls', () => {
    render(
      <EditorPreviewLayout
        editorSlot={<div data-testid="editor-slot" />}
        previewSlot={<div data-testid="preview-slot" />}
      />
    );

    const aside = screen.getByTestId('preview-slot').closest('aside');
    expect(aside).toHaveClass('xl:sticky');
    expect(aside).toHaveClass('xl:self-start');
  });

  it('keeps the sticky classes even when the preview is toggled hidden', () => {
    render(
      <EditorPreviewLayout
        editorSlot={<div />}
        previewSlot={<div data-testid="preview-slot" />}
      />
    );

    fireEvent.click(screen.getByTestId('preview-toggle-button'));

    const aside = screen.getByTestId('preview-slot').closest('aside');
    expect(aside).toHaveClass('xl:sticky');
    expect(aside).toHaveClass('hidden');
  });

  it('reports editor scroll progress as segment 0 / ratio 0 when content is shorter than the viewport', () => {
    const onEditorScrollProgress = vi.fn();
    render(
      <EditorPreviewLayout
        editorSlot={<div data-testid="editor-slot" />}
        previewSlot={<div />}
        onEditorScrollProgress={onEditorScrollProgress}
      />
    );

    expect(onEditorScrollProgress).toHaveBeenCalledWith({ segmentIndex: 0, localRatio: 0 });
  });

  describe('piecewise scroll sync (recalibrated every 1000 words)', () => {
    function mockWrapperGeometry(heightPx: number) {
      // The wrapper sits at absolute page position 0: its viewport-relative top is
      // `0 - window.scrollY`, exactly like a real element fixed in document flow.
      vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(() => ({
        top: -window.scrollY,
        bottom: heightPx - window.scrollY,
        height: heightPx,
        left: 0,
        right: 0,
        width: 0,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }));
      Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true });
    }

    function scrollTo(y: number) {
      Object.defineProperty(window, 'scrollY', { value: y, configurable: true });
      fireEvent.scroll(window);
    }

    beforeEach(() => {
      // jsdom never runs real rAF callbacks; run them synchronously so scroll-driven
      // progress updates are observable without advancing fake timers.
      vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
        cb(0);
        return 0;
      });
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('falls back to a single global segment when no editor is supplied', () => {
      mockWrapperGeometry(4800); // scrollableRange = 4800 - 800 = 4000
      const onEditorScrollProgress = vi.fn();
      render(
        <EditorPreviewLayout
          editorSlot={<div />}
          previewSlot={<div />}
          onEditorScrollProgress={onEditorScrollProgress}
        />
      );
      onEditorScrollProgress.mockClear();

      scrollTo(2000); // halfway through the 4000px scrollable range

      expect(onEditorScrollProgress).toHaveBeenCalledWith({ segmentIndex: 0, localRatio: 0.5 });
    });

    it('reports the segment and local ratio matching the nearest word-anchor boundaries', () => {
      mockWrapperGeometry(4800); // scrollableRange = 4000
      // Two anchors (1000w, 2000w) sitting at pixel offsets 1000 and 3000.
      const editor = {
        state: {
          doc: {
            forEach(cb: (node: { textContent: string }, offset: number) => void) {
              cb({ textContent: Array.from({ length: 1200 }, (_, i) => `m${i}`).join(' ') }, 0);
              cb({ textContent: Array.from({ length: 1200 }, (_, i) => `m${i}`).join(' ') }, 1200);
            },
          },
        },
        view: {
          // coordsAtPos is viewport-relative in a real browser: an element fixed at an
          // absolute page position P reports `P - window.scrollY` as its top.
          coordsAtPos: (pos: number) => ({ top: (pos === 1 ? 1000 : 3000) - window.scrollY }),
        },
      };
      const onEditorScrollProgress = vi.fn();
      render(
        <EditorPreviewLayout
          editorSlot={<div />}
          previewSlot={<div />}
          onEditorScrollProgress={onEditorScrollProgress}
          editor={editor}
        />
      );
      onEditorScrollProgress.mockClear();

      // pos = scrollY - wrapperTop = 1500 - 0 = 1500, between boundaries [1000, 3000] -> segment 1
      scrollTo(1500);

      expect(onEditorScrollProgress).toHaveBeenCalledWith({
        segmentIndex: 1,
        localRatio: (1500 - 1000) / (3000 - 1000),
      });
    });
  });
});
