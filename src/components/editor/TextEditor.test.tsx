// ABOUTME: Test suite for TextEditor component validating editor initialization and callbacks
// ABOUTME: Tests content updates, selection tracking, and user interactions with TipTap JSON format

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TextEditor } from './TextEditor';

describe('TextEditor', () => {
  const createTipTapJSON = (text: string) => {
    return JSON.stringify({
      type: 'doc',
      content: text ? [
        {
          type: 'paragraph',
          content: [{ type: 'text', text }]
        }
      ] : []
    });
  };

  it('should render editor with initial content', () => {
    const onContentChange = vi.fn();
    const onSelectionChange = vi.fn();

    render(
      <TextEditor
        content={createTipTapJSON('Initial content')}
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
        content={createTipTapJSON('')}
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
        content={createTipTapJSON('')}
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
        content={createTipTapJSON('First')}
        onContentChange={onContentChange}
        onSelectionChange={onSelectionChange}
      />
    );

    expect(screen.getByText('First')).toBeInTheDocument();

    rerender(
      <TextEditor
        content={createTipTapJSON('Second')}
        onContentChange={onContentChange}
        onSelectionChange={onSelectionChange}
      />
    );

    expect(screen.getByText('Second')).toBeInTheDocument();
  });

  it('should handle empty content', () => {
    const onContentChange = vi.fn();
    const onSelectionChange = vi.fn();

    render(
      <TextEditor
        content=""
        onContentChange={onContentChange}
        onSelectionChange={onSelectionChange}
      />
    );

    const editor = document.querySelector('.ProseMirror');
    expect(editor).toBeInTheDocument();
  });

  it('should call onEditorReady when editor is initialized', () => {
    const onContentChange = vi.fn();
    const onSelectionChange = vi.fn();
    const onEditorReady = vi.fn();

    render(
      <TextEditor
        content={createTipTapJSON('Test')}
        onContentChange={onContentChange}
        onSelectionChange={onSelectionChange}
        onEditorReady={onEditorReady}
      />
    );

    expect(onEditorReady).toHaveBeenCalled();
  });

  it('should render bold text correctly', () => {
    const onContentChange = vi.fn();
    const onSelectionChange = vi.fn();

    const boldContent = JSON.stringify({
      type: 'doc',
      content: [{
        type: 'paragraph',
        content: [{
          type: 'text',
          text: 'Bold text',
          marks: [{ type: 'bold' }]
        }]
      }]
    });

    render(
      <TextEditor
        content={boldContent}
        onContentChange={onContentChange}
        onSelectionChange={onSelectionChange}
      />
    );

    const boldElement = screen.getByText('Bold text');
    expect(boldElement.tagName).toBe('STRONG');
  });

  it('should not emit update event during external content change', () => {
    const onContentChange = vi.fn();
    const onSelectionChange = vi.fn();

    const { rerender } = render(
      <TextEditor
        content={createTipTapJSON('First')}
        onContentChange={onContentChange}
        onSelectionChange={onSelectionChange}
      />
    );

    onContentChange.mockClear();

    rerender(
      <TextEditor
        content={createTipTapJSON('Second')}
        onContentChange={onContentChange}
        onSelectionChange={onSelectionChange}
      />
    );

    // Should not call onContentChange when content is updated externally
    expect(onContentChange).not.toHaveBeenCalled();
  });
});
