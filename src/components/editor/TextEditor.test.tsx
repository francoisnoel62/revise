// ABOUTME: Test suite for TextEditor component validating editor initialization and callbacks
// ABOUTME: Tests content updates, selection tracking, and user interactions with TipTap JSON format

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor, act } from '@testing-library/react';
import { TextEditor } from './TextEditor';

// Note: TipTap content rendering doesn't work correctly in jsdom.
// Content-based tests (verifying text appears in editor) should be in E2E tests.
// These unit tests focus on component initialization, callbacks, and error handling.

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

  // Helper to get ProseMirror editor element
  const getEditor = () => document.querySelector('.ProseMirror') as HTMLElement;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization', () => {
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

      const editor = getEditor();
      expect(editor).toBeInTheDocument();
      expect(editor).toHaveAttribute('contenteditable', 'true');
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

      const editor = getEditor();
      expect(editor).toBeInTheDocument();
    });

    it('should handle malformed JSON gracefully', () => {
      const onContentChange = vi.fn();
      const onSelectionChange = vi.fn();

      // Should not throw
      expect(() => {
        render(
          <TextEditor
            content="not-valid-json"
            onContentChange={onContentChange}
            onSelectionChange={onSelectionChange}
          />
        );
      }).not.toThrow();

      const editor = getEditor();
      expect(editor).toBeInTheDocument();
    });
  });

  describe('placeholder', () => {
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

    it('should render without errors when placeholder is not provided', () => {
      const onContentChange = vi.fn();
      const onSelectionChange = vi.fn();

      expect(() => {
        render(
          <TextEditor
            content={createTipTapJSON('')}
            onContentChange={onContentChange}
            onSelectionChange={onSelectionChange}
          />
        );
      }).not.toThrow();

      expect(getEditor()).toBeInTheDocument();
    });
  });

  describe('content handling', () => {
    it('should accept valid TipTap JSON content without errors', () => {
      const onContentChange = vi.fn();
      const onSelectionChange = vi.fn();

      expect(() => {
        render(
          <TextEditor
            content={createTipTapJSON('Initial content')}
            onContentChange={onContentChange}
            onSelectionChange={onSelectionChange}
          />
        );
      }).not.toThrow();

      expect(getEditor()).toBeInTheDocument();
    });

    it('should accept bold formatted content without errors', () => {
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

      expect(() => {
        render(
          <TextEditor
            content={boldContent}
            onContentChange={onContentChange}
            onSelectionChange={onSelectionChange}
          />
        );
      }).not.toThrow();

      expect(getEditor()).toBeInTheDocument();
    });

    it('should accept multi-paragraph content without errors', () => {
      const onContentChange = vi.fn();
      const onSelectionChange = vi.fn();

      const multiParaContent = JSON.stringify({
        type: 'doc',
        content: [
          { type: 'paragraph', content: [{ type: 'text', text: 'First paragraph' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'Second paragraph' }] },
        ]
      });

      expect(() => {
        render(
          <TextEditor
            content={multiParaContent}
            onContentChange={onContentChange}
            onSelectionChange={onSelectionChange}
          />
        );
      }).not.toThrow();

      expect(getEditor()).toBeInTheDocument();
    });
  });

  describe('content updates', () => {
    it('should handle rerender with new content without errors', async () => {
      const onContentChange = vi.fn();
      const onSelectionChange = vi.fn();

      const { rerender } = render(
        <TextEditor
          content={createTipTapJSON('First')}
          onContentChange={onContentChange}
          onSelectionChange={onSelectionChange}
        />
      );

      await act(async () => {
        rerender(
          <TextEditor
            content={createTipTapJSON('Second')}
            onContentChange={onContentChange}
            onSelectionChange={onSelectionChange}
          />
        );
      });

      expect(getEditor()).toBeInTheDocument();
    });

    it('should not emit update event during external content change', async () => {
      const onContentChange = vi.fn();
      const onSelectionChange = vi.fn();

      const { rerender } = render(
        <TextEditor
          content={createTipTapJSON('First')}
          onContentChange={onContentChange}
          onSelectionChange={onSelectionChange}
        />
      );

      // Wait for initial render
      await waitFor(() => {
        expect(getEditor()).toBeInTheDocument();
      });

      onContentChange.mockClear();

      await act(async () => {
        rerender(
          <TextEditor
            content={createTipTapJSON('Second')}
            onContentChange={onContentChange}
            onSelectionChange={onSelectionChange}
          />
        );
      });

      // Should not call onContentChange when content is updated externally
      expect(onContentChange).not.toHaveBeenCalled();
    });
  });

  describe('editor interactions', () => {
    it('should have focusable editor', () => {
      const onContentChange = vi.fn();
      const onSelectionChange = vi.fn();

      render(
        <TextEditor
          content={createTipTapJSON('Test')}
          onContentChange={onContentChange}
          onSelectionChange={onSelectionChange}
        />
      );

      const editor = getEditor();
      expect(editor).toBeInTheDocument();

      // Focus the editor
      editor.focus();
      expect(document.activeElement).toBe(editor);
    });

    it('should render without errors when className prop is provided', () => {
      const onContentChange = vi.fn();
      const onSelectionChange = vi.fn();

      // Should not throw when className is provided
      expect(() => {
        render(
          <TextEditor
            content={createTipTapJSON('Test')}
            onContentChange={onContentChange}
            onSelectionChange={onSelectionChange}
            className="custom-editor-class"
          />
        );
      }).not.toThrow();

      // Editor should still be rendered
      expect(getEditor()).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle rapid content changes without errors', async () => {
      const onContentChange = vi.fn();
      const onSelectionChange = vi.fn();

      const { rerender } = render(
        <TextEditor
          content={createTipTapJSON('Content 1')}
          onContentChange={onContentChange}
          onSelectionChange={onSelectionChange}
        />
      );

      for (let i = 2; i <= 5; i++) {
        await act(async () => {
          rerender(
            <TextEditor
              content={createTipTapJSON(`Content ${i}`)}
              onContentChange={onContentChange}
              onSelectionChange={onSelectionChange}
            />
          );
        });
      }

      // Verify editor still exists after rapid changes
      expect(getEditor()).toBeInTheDocument();
    });

    it('should handle unicode content in props', () => {
      const onContentChange = vi.fn();
      const onSelectionChange = vi.fn();
      const unicodeText = 'Héllo Wörld! 日本語 🎉 中文';

      // Test that component doesn't throw with unicode content
      expect(() => {
        render(
          <TextEditor
            content={createTipTapJSON(unicodeText)}
            onContentChange={onContentChange}
            onSelectionChange={onSelectionChange}
          />
        );
      }).not.toThrow();

      // Editor should be rendered
      expect(getEditor()).toBeInTheDocument();
    });

    it('should handle deeply nested content structure', () => {
      const onContentChange = vi.fn();
      const onSelectionChange = vi.fn();

      const complexContent = JSON.stringify({
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: 'Normal ' },
              { type: 'text', text: 'bold ', marks: [{ type: 'bold' }] },
              { type: 'text', text: 'italic ', marks: [{ type: 'italic' }] },
              { type: 'text', text: 'both', marks: [{ type: 'bold' }, { type: 'italic' }] },
            ]
          },
          {
            type: 'heading',
            attrs: { level: 1 },
            content: [{ type: 'text', text: 'Heading' }]
          },
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'More content' }]
          }
        ]
      });

      expect(() => {
        render(
          <TextEditor
            content={complexContent}
            onContentChange={onContentChange}
            onSelectionChange={onSelectionChange}
          />
        );
      }).not.toThrow();

      expect(getEditor()).toBeInTheDocument();
    });
  });
});
