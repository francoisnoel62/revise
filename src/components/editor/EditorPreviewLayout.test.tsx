// ABOUTME: Tests the CSS-only preview toggle: mount is preserved, grid columns react,
// ABOUTME: and the author's choice is read from and written to localStorage.

import { render, screen, fireEvent } from '@testing-library/react';
import { useEffect } from 'react';
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
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

describe('EditorPreviewLayout', () => {
  beforeEach(() => {
    window.localStorage.clear();
    mountCount = 0;
    unmountCount = 0;
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
});
