// ABOUTME: Unit tests for useSpellCheck hook
// ABOUTME: Verifies word extraction, deduplication, error dispatch, and cleanup behaviour

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSpellCheck } from './useSpellCheck';
import {
  textIssuePluginKey,
  type TextIssueState,
} from '@/components/editor/TextIssueExtension';
import type { TextIssue } from '@/domain/value-objects/TextIssue';
import type { Editor } from '@tiptap/react';

// Mock the server action — spell-check-actions has its own unit tests
vi.mock('@/app/actions/spell-check-actions', () => ({
  checkSpellingAction: vi.fn(),
  getCustomDictionaryAction: vi.fn().mockResolvedValue([]),
  addWordToCustomDictionaryAction: vi.fn().mockResolvedValue(undefined),
  getIgnoredWordsAction: vi.fn().mockResolvedValue([]),
  addIgnoredWordAction: vi.fn().mockResolvedValue(undefined),
}));

import {
  checkSpellingAction,
  getCustomDictionaryAction,
  addWordToCustomDictionaryAction,
  getIgnoredWordsAction,
  addIgnoredWordAction,
} from '@/app/actions/spell-check-actions';
const mockCheckSpelling = checkSpellingAction as ReturnType<typeof vi.fn>;
const mockGetCustomDictionary = getCustomDictionaryAction as ReturnType<typeof vi.fn>;
const mockAddWordToCustomDictionary = addWordToCustomDictionaryAction as ReturnType<typeof vi.fn>;
const mockGetIgnoredWords = getIgnoredWordsAction as ReturnType<typeof vi.fn>;
const mockAddIgnoredWord = addIgnoredWordAction as ReturnType<typeof vi.fn>;

// ---------------------------------------------------------------------------
// Minimal TipTap Editor mock
// ---------------------------------------------------------------------------

interface TextNode {
  text: string;
  pos: number;
}

function createMockEditor(text: string, textNodes: TextNode[] = [], isDestroyed = false) {
  const setMetaCalls: Array<{ key: unknown; meta: unknown }> = [];

  const tr = {
    setMeta: vi.fn((key: unknown, meta: unknown) => {
      setMetaCalls.push({ key, meta });
      return tr;
    }),
  };

  const updateHandlers: Array<() => void> = [];

  const editor = {
    getText: vi.fn().mockReturnValue(text),
    isDestroyed,
    state: {
      doc: {
        descendants: vi.fn(
          (cb: (node: { isText: boolean; text: string }, pos: number) => void) => {
            for (const node of textNodes) {
              cb({ isText: true, text: node.text }, node.pos);
            }
          }
        ),
      },
      tr,
    },
    view: {
      dispatch: vi.fn(),
    },
    on: vi.fn((event: string, handler: () => void) => {
      if (event === 'update') updateHandlers.push(handler);
    }),
    off: vi.fn(),
    // Test helpers
    _triggerUpdate: () => updateHandlers.forEach((h) => h()),
    _setMetaCalls: setMetaCalls,
  };

  return editor;
}

// ---------------------------------------------------------------------------
// Plugin-state helpers
// ---------------------------------------------------------------------------

function misspelling(
  text: string,
  from: number,
  to: number,
  suggestions: string[]
): TextIssue {
  return { nature: 'spelling', from, to, text, message: '', suggestions };
}

function pluginStateWith(spelling: TextIssue[]): TextIssueState {
  return {
    spelling,
    grammar: [],
    issues: spelling,
    decorations: {} as import('@tiptap/pm/view').DecorationSet,
  };
}

function dispatchedSpelling(call: { meta: unknown } | undefined): TextIssue[] {
  return (call?.meta as { spelling: TextIssue[] }).spelling;
}

// Advance past the 900ms debounce and flush all async work.
// vi.runAllTimersAsync() fires timers then yields to the event loop for promise chains.
async function flushDebounce() {
  await act(async () => {
    await vi.runAllTimersAsync();
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useSpellCheck', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('calls checkSpellingAction with unique words extracted from the document', async () => {
    mockCheckSpelling.mockResolvedValue([]);

    // "bonjour" appears twice — only sent once to the action
    const editor = createMockEditor('bonjour monde bonjour', [
      { text: 'bonjour monde bonjour', pos: 1 },
    ]);

    renderHook(() => useSpellCheck(editor as unknown as Editor));
    await flushDebounce();

    expect(mockCheckSpelling).toHaveBeenCalledTimes(1);
    const calledWith: string[] = mockCheckSpelling.mock.calls[0][0];
    expect(calledWith).toContain('bonjour');
    expect(calledWith).toContain('monde');
    // Deduplication: "bonjour" must appear only once
    expect(calledWith.filter((w) => w === 'bonjour')).toHaveLength(1);
  });

  it('dispatches spelling issues with correct word and positions when misspelled words are found', async () => {
    mockCheckSpelling.mockResolvedValue([{ word: 'maisson', suggestions: ['maison'] }]);

    // "maisson" starts at pos 1 (ProseMirror positions are 1-indexed inside the doc)
    const editor = createMockEditor('maisson', [{ text: 'maisson', pos: 1 }]);

    renderHook(() => useSpellCheck(editor as unknown as Editor));
    await flushDebounce();

    expect(editor.state.tr.setMeta).toHaveBeenCalled();

    expect(editor._setMetaCalls[0].key).toBe(textIssuePluginKey);
    const dispatched = dispatchedSpelling(editor._setMetaCalls[0]);
    expect(dispatched).toHaveLength(1);
    expect(dispatched[0].nature).toBe('spelling');
    expect(dispatched[0].text).toBe('maisson');
    expect(dispatched[0].suggestions).toEqual(['maison']);
    expect(typeof dispatched[0].from).toBe('number');
    expect(typeof dispatched[0].to).toBe('number');
  });

  // The server accepts a word starting with a capital unconditionally — proper nouns and
  // sentence starts, deliberately. It reports "maisson" and stays silent about "Maisson".
  // Matching its answer case-insensitively hands the capitalised word the underline the
  // server just chose not to give it, and the author is told a proper noun is misspelled.
  it('leaves a capitalised word alone when the server only reported its lowercase twin', async () => {
    mockCheckSpelling.mockResolvedValue([{ word: 'maisson', suggestions: ['maison'] }]);

    const editor = createMockEditor('maisson Maisson', [{ text: 'maisson Maisson', pos: 1 }]);

    renderHook(() => useSpellCheck(editor as unknown as Editor));
    await flushDebounce();

    const dispatched = dispatchedSpelling(editor._setMetaCalls.at(-1));
    expect(dispatched.map((issue) => issue.text)).toEqual(['maisson']);
  });

  // The author keeps writing while the round trip is in flight. Positions located in the
  // document as it was before the await are applied to the document as it is after, so a
  // correction replaces the wrong range — one character adrift is enough to swallow the
  // space in front of the word.
  it('locates issues in the document as it stands when the result arrives', async () => {
    const nodes = [{ text: 'bois maisson', pos: 1 }];
    const editor = createMockEditor('bois maisson', nodes);

    mockCheckSpelling.mockImplementation(async () => {
      // "Cher " typed at the start shifts everything after it by five characters.
      nodes[0] = { text: 'Cher bois maisson', pos: 1 };
      editor.getText.mockReturnValue('Cher bois maisson');
      return [{ word: 'maisson', suggestions: ['maison'] }];
    });

    renderHook(() => useSpellCheck(editor as unknown as Editor));
    await flushDebounce();

    const dispatched = dispatchedSpelling(editor._setMetaCalls.at(-1));
    expect(dispatched).toHaveLength(1);
    // 'maisson' sits at index 10 of the text that is actually on screen — position 11.
    expect(dispatched[0].from).toBe(11);
    expect(dispatched[0].to).toBe(18);
  });

  it('dispatches an empty list and skips the server action when the document has no letter-words', async () => {
    // Text is non-empty (avoids the lastText dedup short-circuit) but contains only
    // punctuation — the word regex /[\p{L}\p{M}]{2,}/gu produces no matches.
    const editor = createMockEditor('...', [{ text: '...', pos: 1 }]);

    renderHook(() => useSpellCheck(editor as unknown as Editor));
    await flushDebounce();

    expect(mockCheckSpelling).not.toHaveBeenCalled();
    expect(editor.state.tr.setMeta).toHaveBeenCalled();

    expect(dispatchedSpelling(editor._setMetaCalls[0])).toEqual([]);
  });

  it('does not call checkSpellingAction again when the text has not changed', async () => {
    mockCheckSpelling.mockResolvedValue([]);
    const editor = createMockEditor('bonjour', [{ text: 'bonjour', pos: 1 }]);

    renderHook(() => useSpellCheck(editor as unknown as Editor));

    // First run
    await flushDebounce();
    expect(mockCheckSpelling).toHaveBeenCalledTimes(1);

    // Trigger an editor update without changing the text
    act(() => {
      editor._triggerUpdate();
    });
    await flushDebounce();

    // Same text → no additional server call
    expect(mockCheckSpelling).toHaveBeenCalledTimes(1);
  });

  it('registers an update listener on the editor on mount', () => {
    const editor = createMockEditor('', []);
    mockCheckSpelling.mockResolvedValue([]);

    renderHook(() => useSpellCheck(editor as unknown as Editor));

    expect(editor.on).toHaveBeenCalledWith('update', expect.any(Function));
  });

  it('unregisters the update listener on unmount', () => {
    const editor = createMockEditor('', []);
    mockCheckSpelling.mockResolvedValue([]);

    const { unmount } = renderHook(() => useSpellCheck(editor as unknown as Editor));
    unmount();

    expect(editor.off).toHaveBeenCalledWith('update', expect.any(Function));
  });

  it('does nothing when editor is null', () => {
    expect(() => {
      renderHook(() => useSpellCheck(null));
    }).not.toThrow();

    expect(mockCheckSpelling).not.toHaveBeenCalled();
  });

  it('returns an ignoreWord function', () => {
    mockCheckSpelling.mockResolvedValue([]);
    const editor = createMockEditor('bonjour', [{ text: 'bonjour', pos: 1 }]);
    const { result } = renderHook(() => useSpellCheck(editor as unknown as Editor));
    expect(typeof result.current.ignoreWord).toBe('function');
  });

  it('ignoreWord removes the word decoration without a server round-trip', async () => {
    mockCheckSpelling.mockResolvedValue([
      { word: 'maisson', suggestions: ['maison'] },
    ]);

    const editor = createMockEditor('maisson', [{ text: 'maisson', pos: 1 }]);

    // Override getState so ignoreWord can read the current plugin issues
    const mockIssues = [misspelling('maisson', 1, 8, ['maison'])];
    vi.spyOn(textIssuePluginKey, 'getState').mockReturnValue(
      pluginStateWith(mockIssues)
    );

    const { result } = renderHook(() => useSpellCheck(editor as unknown as Editor));
    await flushDebounce();

    const callsBefore = mockCheckSpelling.mock.calls.length;

    act(() => {
      result.current.ignoreWord('maisson');
    });

    // No additional server call
    expect(mockCheckSpelling.mock.calls.length).toBe(callsBefore);

    // dispatch must have been called with an empty list (the ignored word filtered out)
    expect(dispatchedSpelling(editor._setMetaCalls.at(-1))).toEqual([]);
  });

  it('ignored word stays removed on subsequent editor updates', async () => {
    mockCheckSpelling.mockResolvedValue([
      { word: 'maisson', suggestions: ['maison'] },
    ]);

    const editor = createMockEditor('maisson', [{ text: 'maisson', pos: 1 }]);

    vi.spyOn(textIssuePluginKey, 'getState').mockReturnValue(
      pluginStateWith([misspelling('maisson', 1, 8, ['maison'])])
    );

    const { result } = renderHook(() => useSpellCheck(editor as unknown as Editor));
    await flushDebounce();

    act(() => { result.current.ignoreWord('maisson'); });

    // Simulate a text change that would re-trigger the check
    editor.getText.mockReturnValue('maisson monde');
    act(() => { editor._triggerUpdate(); });
    await flushDebounce();

    // The last dispatch must not include 'maisson'
    const lastIssues = dispatchedSpelling(editor._setMetaCalls.at(-1));
    expect(lastIssues.map((issue) => issue.text)).not.toContain('maisson');
  });

  it('returns an addToDictionary function', () => {
    mockCheckSpelling.mockResolvedValue([]);
    const editor = createMockEditor('bonjour', [{ text: 'bonjour', pos: 1 }]);
    const { result } = renderHook(() => useSpellCheck(editor as unknown as Editor, 'proj-1'));
    expect(typeof result.current.addToDictionary).toBe('function');
  });

  it('loads the custom dictionary on mount when projectId is provided', async () => {
    mockCheckSpelling.mockResolvedValue([]);
    mockGetCustomDictionary.mockResolvedValue(['spicce']);

    const editor = createMockEditor('spicce', [{ text: 'spicce', pos: 1 }]);

    renderHook(() => useSpellCheck(editor as unknown as Editor, 'proj-1'));
    await flushDebounce();

    expect(mockGetCustomDictionary).toHaveBeenCalledWith('proj-1');
    // checkSpellingAction should have been called with the custom dictionary as second arg
    const [, customWords] = mockCheckSpelling.mock.calls[0];
    expect(customWords).toContain('spicce');
  });

  it('loads ignored words on mount when projectId is provided', async () => {
    mockCheckSpelling.mockResolvedValue([]);
    mockGetIgnoredWords.mockResolvedValue(['gonna']);
    const editor = createMockEditor('gonna', [{ text: 'gonna', pos: 1 }]);

    renderHook(() => useSpellCheck(editor as unknown as Editor, 'proj-1'));
    await flushDebounce();

    expect(mockGetIgnoredWords).toHaveBeenCalledWith('proj-1');
    // checkSpellingAction should have been called with 'gonna' in the accepted list
    const [, customWords] = mockCheckSpelling.mock.calls[0];
    expect(customWords).toContain('gonna');
  });

  it('ignoreWord calls addIgnoredWordAction for persistence when projectId is set', async () => {
    mockCheckSpelling.mockResolvedValue([{ word: 'maisson', suggestions: ['maison'] }]);
    mockGetIgnoredWords.mockResolvedValue([]);

    const editor = createMockEditor('maisson', [{ text: 'maisson', pos: 1 }]);

    vi.spyOn(textIssuePluginKey, 'getState').mockReturnValue(
      pluginStateWith([misspelling('maisson', 1, 8, ['maison'])])
    );

    const { result } = renderHook(() => useSpellCheck(editor as unknown as Editor, 'proj-1'));
    await flushDebounce();

    await act(async () => {
      result.current.ignoreWord('maisson');
    });

    expect(mockAddIgnoredWord).toHaveBeenCalledWith('proj-1', 'maisson');
  });

  // The word is dropped from the underlines the moment the author asks, without waiting for
  // the server — that responsiveness is the point. But the write was launched and never
  // looked at again: a rejection became an unhandled promise, and the author's choice was
  // silently lost on the next reload. It still cannot block the UI; it can be reported.
  it('reports a failed ignored-word write instead of dropping it on the floor', async () => {
    mockCheckSpelling.mockResolvedValue([]);
    mockAddIgnoredWord.mockRejectedValue(new Error('base injoignable'));
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    const editor = createMockEditor('maisson', [{ text: 'maisson', pos: 1 }]);
    const { result } = renderHook(() =>
      useSpellCheck(editor as unknown as Editor, 'project-1')
    );

    await act(async () => {
      result.current.ignoreWord('maisson');
      await vi.runAllTimersAsync();
    });

    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('ignoreWord does NOT call addIgnoredWordAction when no projectId', async () => {
    mockCheckSpelling.mockResolvedValue([{ word: 'maisson', suggestions: ['maison'] }]);

    const editor = createMockEditor('maisson', [{ text: 'maisson', pos: 1 }]);
    vi.spyOn(textIssuePluginKey, 'getState').mockReturnValue(
      pluginStateWith([misspelling('maisson', 1, 8, ['maison'])])
    );

    const { result } = renderHook(() => useSpellCheck(editor as unknown as Editor));
    await flushDebounce();

    act(() => { result.current.ignoreWord('maisson'); });

    expect(mockAddIgnoredWord).not.toHaveBeenCalled();
  });

  it('addToDictionary calls addWordToCustomDictionaryAction and removes the decoration', async () => {
    mockCheckSpelling.mockResolvedValue([
      { word: 'spicce', suggestions: [] },
    ]);
    mockGetCustomDictionary.mockResolvedValue([]);

    const editor = createMockEditor('spicce', [{ text: 'spicce', pos: 1 }]);

    vi.spyOn(textIssuePluginKey, 'getState').mockReturnValue(
      pluginStateWith([misspelling('spicce', 1, 7, [])])
    );

    const { result } = renderHook(() => useSpellCheck(editor as unknown as Editor, 'proj-1'));
    await flushDebounce();

    await act(async () => {
      await result.current.addToDictionary('spicce');
    });

    expect(mockAddWordToCustomDictionary).toHaveBeenCalledWith('proj-1', 'spicce');

    // Decoration for 'spicce' should be removed immediately
    const lastIssues = dispatchedSpelling(editor._setMetaCalls.at(-1));
    expect(lastIssues.map((issue) => issue.text)).not.toContain('spicce');
  });
});
