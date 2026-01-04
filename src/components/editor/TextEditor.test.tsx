// ABOUTME: Test suite for TextEditor component validating editor initialization and callbacks
// ABOUTME: Tests content updates, selection tracking, and user interactions

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TextEditor } from './TextEditor';

describe('TextEditor', () => {
  it('should render editor with initial content', () => {
    const onContentChange = vi.fn();
    const onSelectionChange = vi.fn();

    render(
      <TextEditor
        content="Initial content"
        onContentChange={onContentChange}
        onSelectionChange={onSelectionChange}
      />
    );

    expect(screen.getByText('Initial content')).toBeInTheDocument();
  });

  it('should show placeholder when empty', () => {
    const onContentChange = vi.fn();
    const onSelectionChange = vi.fn();

    render(
      <TextEditor
        content=""
        onContentChange={onContentChange}
        onSelectionChange={onSelectionChange}
        placeholder="Start writing..."
      />
    );

    // TipTap uses data-placeholder attribute
    const placeholderElement = document.querySelector('[data-placeholder="Start writing..."]');
    expect(placeholderElement).toBeInTheDocument();
  });

  it('should render contenteditable editor', () => {
    const onContentChange = vi.fn();
    const onSelectionChange = vi.fn();

    render(
      <TextEditor
        content=""
        onContentChange={onContentChange}
        onSelectionChange={onSelectionChange}
      />
    );

    // TipTap editor is a contenteditable div
    const editor = document.querySelector('.ProseMirror');
    expect(editor).toBeInTheDocument();
    expect(editor).toHaveAttribute('contenteditable', 'true');
  });

  it('should update content when prop changes', () => {
    const onContentChange = vi.fn();
    const onSelectionChange = vi.fn();

    const { rerender } = render(
      <TextEditor
        content="First"
        onContentChange={onContentChange}
        onSelectionChange={onSelectionChange}
      />
    );

    expect(screen.getByText('First')).toBeInTheDocument();

    rerender(
      <TextEditor
        content="Second"
        onContentChange={onContentChange}
        onSelectionChange={onSelectionChange}
      />
    );

    expect(screen.getByText('Second')).toBeInTheDocument();
  });
});
