// ABOUTME: Regression tests for semantic migration when the TipTap editor becomes ready.
// ABOUTME: Ensures legacy content is migrated even when the chapter id was already known.

import { renderHook } from '@testing-library/react';
import type { Editor } from '@tiptap/core';
import { describe, expect, it, vi } from 'vitest';
import { useSemanticMigration } from './useSemanticMigration';

describe('useSemanticMigration', () => {
  it('migrates legacy content when the editor becomes ready after the chapter id', () => {
    const setContent = vi.fn();
    const editor = {
      getJSON: () => ({
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Manuscrit legacy' }],
          },
        ],
      }),
      commands: { setContent },
    } as unknown as Editor;

    const { rerender } = renderHook(
      ({ currentEditor }) => useSemanticMigration(currentEditor, 'chapter-1'),
      { initialProps: { currentEditor: null as Editor | null } },
    );

    rerender({ currentEditor: editor });

    expect(setContent).toHaveBeenCalledWith(
      expect.objectContaining({
        content: [
          expect.objectContaining({
            attrs: expect.objectContaining({ semanticRole: 'corps' }),
          }),
        ],
      }),
      { emitUpdate: true },
    );
  });
});
