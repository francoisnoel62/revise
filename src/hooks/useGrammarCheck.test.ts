// ABOUTME: Unit tests for the useGrammarCheck hook driving "Corriger le chapitre".
// ABOUTME: Verifies dispatch of positioned issues, stale-position rejection, and status reporting.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { Editor } from '@tiptap/react';
import type { TextIssue } from '@/domain/value-objects/TextIssue';
import { textIssuePluginKey } from '@/components/editor/TextIssueExtension';
import { useGrammarCheck } from './useGrammarCheck';

vi.mock('@/app/actions/grammar-actions', () => ({
  checkChapterGrammarAction: vi.fn(),
}));

import { checkChapterGrammarAction } from '@/app/actions/grammar-actions';
const mockCheckGrammar = checkChapterGrammarAction as ReturnType<typeof vi.fn>;

/**
 * Editor double whose document is a single paragraph, so a ProseMirror position
 * p maps to character p - 1 of `text`.
 */
function createMockEditor(text: string, isDestroyed = false) {
  const setMetaCalls: Array<{ key: unknown; meta: unknown }> = [];

  const tr = {
    setMeta: vi.fn((key: unknown, meta: unknown) => {
      setMetaCalls.push({ key, meta });
      return tr;
    }),
  };

  return {
    isDestroyed,
    state: {
      doc: {
        content: { size: text.length + 2 },
        textBetween: (from: number, to: number) => text.slice(from - 1, to - 1),
      },
      tr,
    },
    view: { dispatch: vi.fn() },
    _setMetaCalls: setMetaCalls,
  };
}

const agreementError: TextIssue = {
  nature: 'grammar',
  from: 5,
  to: 10,
  text: 'chien',
  message: 'Accord de nombre erroné.',
  suggestions: ['chiens'],
  ruleFamily: 'gn',
};

function dispatchedGrammar(call: { meta: unknown } | undefined): TextIssue[] {
  return (call?.meta as { grammar: TextIssue[] }).grammar;
}

describe('useGrammarCheck', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('dispatches the issues returned for the chapter', async () => {
    mockCheckGrammar.mockResolvedValue({ success: true, data: [agreementError] });
    const editor = createMockEditor('Les chien dorment');

    const { result } = renderHook(() =>
      useGrammarCheck(editor as unknown as Editor, 'proj-1', 'chap-1')
    );
    await act(async () => {
      await result.current.checkChapter();
    });

    expect(mockCheckGrammar).toHaveBeenCalledWith('proj-1', 'chap-1');
    expect(editor._setMetaCalls.at(-1)?.key).toBe(textIssuePluginKey);
    expect(dispatchedGrammar(editor._setMetaCalls.at(-1))).toEqual([agreementError]);
  });

  it('reports how many issues were found', async () => {
    mockCheckGrammar.mockResolvedValue({ success: true, data: [agreementError] });
    const editor = createMockEditor('Les chien dorment');

    const { result } = renderHook(() =>
      useGrammarCheck(editor as unknown as Editor, 'proj-1', 'chap-1')
    );
    await act(async () => {
      await result.current.checkChapter();
    });

    expect(result.current.status).toContain('1');
  });

  it('reports a clean chapter', async () => {
    mockCheckGrammar.mockResolvedValue({ success: true, data: [] });
    const editor = createMockEditor('Les chiens dorment');

    const { result } = renderHook(() =>
      useGrammarCheck(editor as unknown as Editor, 'proj-1', 'chap-1')
    );
    await act(async () => {
      await result.current.checkChapter();
    });

    expect(result.current.status).toMatch(/aucune/i);
  });

  it('drops an issue whose range no longer holds the flagged text', async () => {
    mockCheckGrammar.mockResolvedValue({ success: true, data: [agreementError] });
    // The author edited the paragraph since the last save: positions have shifted.
    const editor = createMockEditor('Oh les chien dorment');

    const { result } = renderHook(() =>
      useGrammarCheck(editor as unknown as Editor, 'proj-1', 'chap-1')
    );
    await act(async () => {
      await result.current.checkChapter();
    });

    expect(dispatchedGrammar(editor._setMetaCalls.at(-1))).toEqual([]);
  });

  it('drops an issue positioned beyond the end of the document', async () => {
    mockCheckGrammar.mockResolvedValue({
      success: true,
      data: [{ ...agreementError, from: 400, to: 405 }],
    });
    const editor = createMockEditor('Les chien dorment');

    const { result } = renderHook(() =>
      useGrammarCheck(editor as unknown as Editor, 'proj-1', 'chap-1')
    );
    await act(async () => {
      await result.current.checkChapter();
    });

    expect(dispatchedGrammar(editor._setMetaCalls.at(-1))).toEqual([]);
  });

  it('surfaces a failed check without dispatching anything', async () => {
    mockCheckGrammar.mockResolvedValue({ success: false, error: 'Chapter not found' });
    const editor = createMockEditor('Les chien dorment');

    const { result } = renderHook(() =>
      useGrammarCheck(editor as unknown as Editor, 'proj-1', 'chap-1')
    );
    await act(async () => {
      await result.current.checkChapter();
    });

    expect(result.current.status).toContain('Chapter not found');
    expect(editor._setMetaCalls).toHaveLength(0);
  });

  it('does not run without an editor, a project or a chapter', async () => {
    const editor = createMockEditor('Les chien dorment');

    const withoutChapter = renderHook(() =>
      useGrammarCheck(editor as unknown as Editor, 'proj-1', null)
    );
    await act(async () => {
      await withoutChapter.result.current.checkChapter();
    });

    const withoutEditor = renderHook(() => useGrammarCheck(null, 'proj-1', 'chap-1'));
    await act(async () => {
      await withoutEditor.result.current.checkChapter();
    });

    expect(mockCheckGrammar).not.toHaveBeenCalled();
  });

  it('is not loading once the check has settled', async () => {
    mockCheckGrammar.mockResolvedValue({ success: true, data: [] });
    const editor = createMockEditor('Les chiens dorment');

    const { result } = renderHook(() =>
      useGrammarCheck(editor as unknown as Editor, 'proj-1', 'chap-1')
    );

    expect(result.current.loading).toBe(false);

    await act(async () => {
      await result.current.checkChapter();
    });

    expect(result.current.loading).toBe(false);
  });

  it('clears the previous chapter issues when the chapter changes', async () => {
    mockCheckGrammar.mockResolvedValue({ success: true, data: [] });
    const editor = createMockEditor('Les chien dorment');

    const { rerender } = renderHook(
      ({ chapterId }: { chapterId: string }) =>
        useGrammarCheck(editor as unknown as Editor, 'proj-1', chapterId),
      { initialProps: { chapterId: 'chap-1' } }
    );

    await act(async () => {
      rerender({ chapterId: 'chap-2' });
    });

    expect(dispatchedGrammar(editor._setMetaCalls.at(-1))).toEqual([]);
  });
});
