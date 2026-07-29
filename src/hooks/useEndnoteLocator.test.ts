// ABOUTME: Tests for useEndnoteLocator — resolves a (chapter, rank) note address to a document
// ABOUTME: position, switching chapters first when needed and waiting for the real handshake.

import { describe, it, expect, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { Editor, type JSONContent } from '@tiptap/core';
import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import {
  EndnoteRef,
  collectEndnoteRefs,
  type EndnoteContent,
} from '@/components/editor/extensions/EndnoteRef';
import { useEndnoteLocator } from './useEndnoteLocator';

const makeNote = (text: string): EndnoteContent => ({
  type: 'doc',
  content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
});

const docWithNote = (noteText: string): JSONContent => ({
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'Texte ' },
        { type: 'endnoteRef', attrs: { content: makeNote(noteText) } },
      ],
    },
  ],
});

const createEditor = (content: JSONContent) =>
  new Editor({ extensions: [Document, Paragraph, Text, EndnoteRef], content });

describe('useEndnoteLocator', () => {
  it('resolves synchronously for the active chapter — switchToChapter is never called', async () => {
    const editor = createEditor(docWithNote('note active'));
    const onEdit = vi.fn();
    const switchToChapter = vi.fn();

    const { result } = renderHook(() =>
      useEndnoteLocator({
        editor,
        activeChapterId: 'ch1',
        readyChapterId: 'ch1',
        switchToChapter,
        onEdit,
        onDelete: vi.fn(),
      })
    );

    await act(async () => {
      await result.current.locateEndnote('ch1', 1, 'edit');
    });

    expect(switchToChapter).not.toHaveBeenCalled();
    expect(onEdit).toHaveBeenCalledWith(expect.any(Number), makeNote('note active'));
    editor.destroy();
  });

  it('does not act while the chapter switch has resolved but the ready signal has not arrived', async () => {
    const editor = createEditor(docWithNote('note ch1')); // still showing ch1's document
    const onEdit = vi.fn();
    const switchToChapter = vi.fn().mockResolvedValue(true);

    const { result } = renderHook(() =>
      useEndnoteLocator({
        editor,
        activeChapterId: 'ch1',
        readyChapterId: 'ch1', // has not moved to ch2 yet
        switchToChapter,
        onEdit,
        onDelete: vi.fn(),
      })
    );

    await act(async () => {
      await result.current.locateEndnote('ch2', 1, 'edit');
    });

    expect(switchToChapter).toHaveBeenCalledWith('ch2');
    expect(onEdit).not.toHaveBeenCalled();
    editor.destroy();
  });

  it('resolves once the ready signal arrives for the target chapter, against its own document', async () => {
    const editor = createEditor(docWithNote('note ch1'));
    const onEdit = vi.fn();
    const switchToChapter = vi.fn().mockResolvedValue(true);

    const { result, rerender } = renderHook(
      ({ readyChapterId }: { readyChapterId: string | null }) =>
        useEndnoteLocator({
          editor,
          activeChapterId: 'ch1',
          readyChapterId,
          switchToChapter,
          onEdit,
          onDelete: vi.fn(),
        }),
      { initialProps: { readyChapterId: 'ch1' as string | null } }
    );

    await act(async () => {
      await result.current.locateEndnote('ch2', 1, 'edit');
    });
    expect(onEdit).not.toHaveBeenCalled();

    // Simulate the handshake: the editor's document has been re-seeded for chapter 2...
    act(() => {
      editor.commands.setContent(docWithNote('note ch2'));
    });
    // ...and only now does the ready signal arrive.
    rerender({ readyChapterId: 'ch2' });

    const expectedPos = collectEndnoteRefs(editor.state.doc)[0].pos;
    expect(onEdit).toHaveBeenCalledWith(expectedPos, makeNote('note ch2'));
    editor.destroy();
  });

  it('dispatches a delete action to onDelete instead of onEdit', async () => {
    const editor = createEditor(docWithNote('note active'));
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    const { result } = renderHook(() =>
      useEndnoteLocator({
        editor,
        activeChapterId: 'ch1',
        readyChapterId: 'ch1',
        switchToChapter: vi.fn(),
        onEdit,
        onDelete,
      })
    );

    await act(async () => {
      await result.current.locateEndnote('ch1', 1, 'delete');
    });

    expect(onDelete).toHaveBeenCalledWith(expect.any(Number), makeNote('note active'));
    expect(onEdit).not.toHaveBeenCalled();
    editor.destroy();
  });

  it('surfaces an error and clears the pending action when the chapter switch fails', async () => {
    const editor = createEditor(docWithNote('note ch1'));
    const onEdit = vi.fn();
    const switchToChapter = vi.fn().mockResolvedValue(false);

    const { result } = renderHook(() =>
      useEndnoteLocator({
        editor,
        activeChapterId: 'ch1',
        readyChapterId: 'ch1',
        switchToChapter,
        onEdit,
        onDelete: vi.fn(),
      })
    );

    await act(async () => {
      await result.current.locateEndnote('ch2', 1, 'edit');
    });

    expect(onEdit).not.toHaveBeenCalled();
    expect(result.current.error).not.toBeNull();
    expect(result.current.isLocating).toBe(false);
    editor.destroy();
  });

  it('surfaces an error and takes no action when the rank does not exist in the loaded document', async () => {
    const editor = createEditor(docWithNote('only one note')); // rank 2 does not exist
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    const switchToChapter = vi.fn().mockResolvedValue(true);

    const { result, rerender } = renderHook(
      ({ readyChapterId }: { readyChapterId: string | null }) =>
        useEndnoteLocator({
          editor,
          activeChapterId: 'ch1',
          readyChapterId,
          switchToChapter,
          onEdit,
          onDelete,
        }),
      { initialProps: { readyChapterId: 'ch1' as string | null } }
    );

    await act(async () => {
      await result.current.locateEndnote('ch2', 2, 'edit');
    });
    rerender({ readyChapterId: 'ch2' });

    expect(onEdit).not.toHaveBeenCalled();
    expect(onDelete).not.toHaveBeenCalled();
    expect(result.current.error).not.toBeNull();
    expect(result.current.isLocating).toBe(false);
    editor.destroy();
  });

  it('exposes isLocating while waiting for the chapter switch', () => {
    const editor = createEditor(docWithNote('note ch1'));
    const switchToChapter = vi.fn(() => new Promise<boolean>(() => {})); // never settles in this test

    const { result } = renderHook(() =>
      useEndnoteLocator({
        editor,
        activeChapterId: 'ch1',
        readyChapterId: 'ch1',
        switchToChapter,
        onEdit: vi.fn(),
        onDelete: vi.fn(),
      })
    );

    expect(result.current.isLocating).toBe(false);

    act(() => {
      void result.current.locateEndnote('ch2', 1, 'edit');
    });

    expect(result.current.isLocating).toBe(true);
    editor.destroy();
  });

  it('ignores a ready signal for a chapter other than the one pending', async () => {
    const editor = createEditor(docWithNote('note ch1'));
    const onEdit = vi.fn();
    const switchToChapter = vi.fn().mockResolvedValue(true);

    const { result, rerender } = renderHook(
      ({ readyChapterId }: { readyChapterId: string | null }) =>
        useEndnoteLocator({
          editor,
          activeChapterId: 'ch1',
          readyChapterId,
          switchToChapter,
          onEdit,
          onDelete: vi.fn(),
        }),
      { initialProps: { readyChapterId: 'ch1' as string | null } }
    );

    await act(async () => {
      await result.current.locateEndnote('ch2', 1, 'edit'); // pending targets ch2
    });

    // A ready signal for an unrelated chapter must be ignored — not purge the pending action.
    rerender({ readyChapterId: 'ch3' });

    expect(onEdit).not.toHaveBeenCalled();
    expect(result.current.isLocating).toBe(true);
    editor.destroy();
  });
});
