// ABOUTME: Unit tests for useSpellCheck hook
// ABOUTME: Verifies word extraction, deduplication, error dispatch, and cleanup behaviour

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSpellCheck } from './useSpellCheck';
import { spellCheckPluginKey } from '@/components/editor/SpellCheckExtension';
import type { Editor } from '@tiptap/react';

// Mock the server action — spell-check-actions has its own unit tests
vi.mock('@/app/actions/spell-check-actions', () => ({
  checkSpellingAction: vi.fn(),
}));

import { checkSpellingAction } from '@/app/actions/spell-check-actions';
const mockCheckSpelling = checkSpellingAction as ReturnType<typeof vi.fn>;

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

  it('dispatches spell errors with correct word and positions when misspelled words are found', async () => {
    mockCheckSpelling.mockResolvedValue([{ word: 'maisson', suggestions: ['maison'] }]);

    // "maisson" starts at pos 1 (ProseMirror positions are 1-indexed inside the doc)
    const editor = createMockEditor('maisson', [{ text: 'maisson', pos: 1 }]);

    renderHook(() => useSpellCheck(editor as unknown as Editor));
    await flushDebounce();

    expect(editor.state.tr.setMeta).toHaveBeenCalled();

    const [pluginKey, payload] = editor._setMetaCalls[0].key === spellCheckPluginKey
      ? [editor._setMetaCalls[0].key, editor._setMetaCalls[0].meta as { errors: Array<{ word: string; from: number; to: number; suggestions: string[] }> }]
      : (() => { throw new Error('setMeta not called with spellCheckPluginKey'); })();

    expect(pluginKey).toBe(spellCheckPluginKey);
    expect(payload.errors).toHaveLength(1);
    expect(payload.errors[0].word).toBe('maisson');
    expect(payload.errors[0].suggestions).toEqual(['maison']);
    expect(typeof payload.errors[0].from).toBe('number');
    expect(typeof payload.errors[0].to).toBe('number');
  });

  it('dispatches empty errors and skips the server action when the document has no letter-words', async () => {
    // Text is non-empty (avoids the lastText dedup short-circuit) but contains only
    // punctuation — the word regex /[\p{L}\p{M}]{2,}/gu produces no matches.
    const editor = createMockEditor('...', [{ text: '...', pos: 1 }]);

    renderHook(() => useSpellCheck(editor as unknown as Editor));
    await flushDebounce();

    expect(mockCheckSpelling).not.toHaveBeenCalled();
    expect(editor.state.tr.setMeta).toHaveBeenCalled();

    const payload = editor._setMetaCalls[0].meta as { errors: unknown[] };
    expect(payload.errors).toEqual([]);
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
});
