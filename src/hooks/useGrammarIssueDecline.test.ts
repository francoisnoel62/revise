// ABOUTME: Unit tests for declining a grammar remark from the issue palette.
// ABOUTME: Verifies the remark is recorded and every matching underline drops at once.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { Editor } from '@tiptap/react';
import type { TextIssue } from '@/domain/value-objects/TextIssue';
import { textIssuePluginKey } from '@/components/editor/TextIssueExtension';
import { useGrammarIssueDecline } from './useGrammarIssueDecline';

vi.mock('@/app/actions/grammar-actions', () => ({
  ignoreGrammarIssueAction: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock('@/components/editor/TextIssueExtension', () => ({
  textIssuePluginKey: { getState: vi.fn() },
}));

import { ignoreGrammarIssueAction } from '@/app/actions/grammar-actions';
const mockIgnore = ignoreGrammarIssueAction as ReturnType<typeof vi.fn>;
const mockGetState = textIssuePluginKey.getState as unknown as ReturnType<typeof vi.fn>;

const agreement: TextIssue = {
  nature: 'grammar',
  from: 5,
  to: 10,
  text: 'chien',
  message: 'Accord de nombre erroné.',
  suggestions: ['chiens'],
  ruleFamily: 'gn',
};

const elsewhere: TextIssue = { ...agreement, from: 40, to: 45 };
const otherWord: TextIssue = { ...agreement, from: 60, to: 64, text: 'chat' };

function createMockEditor(grammar: TextIssue[]) {
  const setMetaCalls: Array<{ key: unknown; meta: unknown }> = [];
  const tr = {
    setMeta: vi.fn((key: unknown, meta: unknown) => {
      setMetaCalls.push({ key, meta });
      return tr;
    }),
  };
  mockGetState.mockReturnValue({ grammar });

  return {
    isDestroyed: false,
    state: { tr },
    view: { dispatch: vi.fn() },
    _setMetaCalls: setMetaCalls,
  };
}

function dispatchedGrammar(call: { meta: unknown } | undefined): TextIssue[] {
  return (call?.meta as { grammar: TextIssue[] }).grammar;
}

describe('useGrammarIssueDecline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIgnore.mockResolvedValue({ success: true });
  });

  it('records the declined remark for the project', async () => {
    const editor = createMockEditor([agreement]);

    const { result } = renderHook(() =>
      useGrammarIssueDecline(editor as unknown as Editor, 'proj-1')
    );
    await act(async () => {
      await result.current(agreement);
    });

    expect(mockIgnore).toHaveBeenCalledWith('proj-1', { ruleFamily: 'gn', text: 'chien' });
  });

  it('drops every underline the author just declined, wherever it sits', async () => {
    const editor = createMockEditor([agreement, elsewhere, otherWord]);

    const { result } = renderHook(() =>
      useGrammarIssueDecline(editor as unknown as Editor, 'proj-1')
    );
    await act(async () => {
      await result.current(agreement);
    });

    expect(dispatchedGrammar(editor._setMetaCalls.at(-1))).toEqual([otherWord]);
  });

  it('leaves the underlines alone when the project refused to record it', async () => {
    mockIgnore.mockResolvedValue({ success: false, error: 'nope' });
    const editor = createMockEditor([agreement]);

    const { result } = renderHook(() =>
      useGrammarIssueDecline(editor as unknown as Editor, 'proj-1')
    );
    await act(async () => {
      await result.current(agreement);
    });

    expect(editor._setMetaCalls).toHaveLength(0);
  });

  it('does nothing without a project', async () => {
    const editor = createMockEditor([agreement]);

    const { result } = renderHook(() =>
      useGrammarIssueDecline(editor as unknown as Editor, undefined)
    );
    await act(async () => {
      await result.current(agreement);
    });

    expect(mockIgnore).not.toHaveBeenCalled();
  });

  it('ignores a misspelling, which is declined by word instead', async () => {
    const editor = createMockEditor([]);

    const { result } = renderHook(() =>
      useGrammarIssueDecline(editor as unknown as Editor, 'proj-1')
    );
    await act(async () => {
      await result.current({ ...agreement, nature: 'spelling', ruleFamily: undefined });
    });

    expect(mockIgnore).not.toHaveBeenCalled();
  });
});
