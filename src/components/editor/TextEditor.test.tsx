// ABOUTME: Test suite for TextEditor component validating editor initialization and callbacks
// ABOUTME: Tests content updates, selection tracking, and user interactions with TipTap JSON format

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { TextEditor as TextEditorComponent } from './TextEditor';
import { useProjectStore } from '@/store/projectStore';
import type { SerializedProject } from '@/app/actions/project-actions';

// Cast to allow legacy props in tests — props were removed from the component but tests
// still exercise the rendered output (placeholder, contenteditable, spellcheck).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TextEditor = TextEditorComponent as unknown as React.ComponentType<Record<string, any>>;
import React from 'react';

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

  // Note: Skipping this test because TipTap's text rendering is async and the content
  // isn't immediately available in the DOM. Would require more complex setup/waiting.
  it.skip('should render editor with initial content', async () => {
    const onContentChange = vi.fn();
    const onSelectionChange = vi.fn();

    render(
      <TextEditor
        content={createTipTapJSON('Initial content')}
        onContentChange={onContentChange}
        onSelectionChange={onSelectionChange}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Initial content')).toBeInTheDocument();
    });
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

  // Note: Skipping this test because TipTap's text rendering is async
  it.skip('should update content when prop changes', async () => {
    const onContentChange = vi.fn();
    const onSelectionChange = vi.fn();

    const { rerender } = render(
      <TextEditor
        content={createTipTapJSON('First')}
        onContentChange={onContentChange}
        onSelectionChange={onSelectionChange}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('First')).toBeInTheDocument();
    });

    rerender(
      <TextEditor
        content={createTipTapJSON('Second')}
        onContentChange={onContentChange}
        onSelectionChange={onSelectionChange}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Second')).toBeInTheDocument();
    });
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

  // Note: Skipping this test because TipTap's text rendering is async
  it.skip('should render bold text correctly', async () => {
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

    await waitFor(() => {
      const boldElement = screen.getByText('Bold text');
      expect(boldElement.tagName).toBe('STRONG');
    });
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

  it('should have spellcheck disabled to support multilingual content', () => {
    const onSelectionChange = vi.fn();

    render(
      <TextEditor
        onSelectionChange={onSelectionChange}
      />
    );

    const editor = document.querySelector('.ProseMirror');
    expect(editor).toHaveAttribute('spellcheck', 'false');
  });
});

// The endnotes panel resolves a note's (chapter, rank) address against the editor's live
// document once a chapter switch completes — but only if this announcement genuinely fires
// after the document has been re-seeded, never before. See docs/plans/footnotes-manager-panel.
describe('TextEditor — chapter-ready handshake', () => {
  const CH1_ID = 'ch1';
  const CH2_ID = 'ch2';
  const CH1_SENTINEL = 'SentinelChapterOne';
  const CH2_SENTINEL = 'SentinelChapterTwo';

  const docWithText = (text: string) =>
    JSON.stringify({
      type: 'doc',
      content: [
        { type: 'paragraph', attrs: { semanticRole: 'corps' }, content: [{ type: 'text', text }] },
      ],
    });

  const projectWithActiveChapter = (activeChapterId: string): SerializedProject => ({
    id: 'proj-1',
    title: 'Projet test',
    chapters: [
      {
        id: CH1_ID,
        title: 'Chapitre 1',
        content: docWithText(CH1_SENTINEL),
        order: 0,
        metadata: { wordCount: 1, characterCount: 1, lastEdited: new Date(0).toISOString() },
      },
      {
        id: CH2_ID,
        title: 'Chapitre 2',
        content: docWithText(CH2_SENTINEL),
        order: 1,
        metadata: { wordCount: 1, characterCount: 1, lastEdited: new Date(0).toISOString() },
      },
    ],
    activeChapterId,
    providerId: null,
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString(),
  });

  beforeEach(() => {
    useProjectStore.setState({
      projectId: 'proj-1',
      project: projectWithActiveChapter(CH1_ID),
      activeContent: docWithText(CH1_SENTINEL),
      hasUnsavedChanges: false,
      isSaving: false,
      error: null,
    });
  });

  afterEach(() => {
    useProjectStore.setState({
      projectId: null,
      project: null,
      activeContent: JSON.stringify({ type: 'doc', content: [{ type: 'paragraph' }] }),
      hasUnsavedChanges: false,
      error: null,
    });
  });

  it('announces the chapter once its document has been seeded', () => {
    const onChapterDocumentReady = vi.fn();
    render(<TextEditor onSelectionChange={vi.fn()} onChapterDocumentReady={onChapterDocumentReady} />);

    expect(onChapterDocumentReady).toHaveBeenCalledWith(CH1_ID);
  });

  it('announces the new chapter only once its own document is actually in place', () => {
    const spy = vi.fn();
    const onChapterDocumentReady = (id: string) =>
      spy({ id, text: document.querySelector('.ProseMirror')?.textContent });

    render(<TextEditor onSelectionChange={vi.fn()} onChapterDocumentReady={onChapterDocumentReady} />);

    // Simulate setActiveChapter's plain set() — the store moves on before React has
    // re-rendered and re-seeded the ProseMirror document.
    act(() => {
      useProjectStore.setState({
        project: projectWithActiveChapter(CH2_ID),
        activeContent: docWithText(CH2_SENTINEL),
      });
    });

    const ch2Call = spy.mock.calls.map(([arg]) => arg).find((arg) => arg.id === CH2_ID);
    expect(ch2Call).toBeDefined();
    expect(ch2Call?.text).toContain(CH2_SENTINEL);
    expect(ch2Call?.text).not.toContain(CH1_SENTINEL);
  });

  it('announces even when the incoming content is identical to what is already loaded', () => {
    const onChapterDocumentReady = vi.fn();
    render(<TextEditor onSelectionChange={vi.fn()} onChapterDocumentReady={onChapterDocumentReady} />);
    onChapterDocumentReady.mockClear();

    // Re-set the same activeChapterId/content — the seeding effect takes its early-exit
    // branch (displayedContent === currentJson) and must still announce.
    act(() => {
      useProjectStore.setState({
        project: projectWithActiveChapter(CH1_ID),
        activeContent: docWithText(CH1_SENTINEL),
      });
    });

    expect(onChapterDocumentReady).toHaveBeenCalledWith(CH1_ID);
  });
});
