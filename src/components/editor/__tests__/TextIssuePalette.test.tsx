// ABOUTME: Unit tests for TextIssuePalette — the single palette for spelling and grammar.
// ABOUTME: Verifies the category label, the actions offered per nature, and callback wiring.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import type { Editor } from '@tiptap/core';
import type { TextIssue } from '@/domain/value-objects/TextIssue';
import { TextIssuePalette } from '../TextIssuePalette';
import { textIssuePluginKey } from '../TextIssueExtension';

function createMockEditor() {
  return {
    view: {
      dom: document.createElement('div'),
      posAtCoords: vi.fn().mockReturnValue({ pos: 3 }),
    },
    isDestroyed: false,
    state: {},
    chain: vi.fn().mockReturnThis(),
    focus: vi.fn().mockReturnThis(),
    deleteRange: vi.fn().mockReturnThis(),
    insertContentAt: vi.fn().mockReturnThis(),
    run: vi.fn(),
  } as unknown as Editor;
}

vi.mock('../TextIssueExtension', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../TextIssueExtension')>();
  return {
    ...actual,
    textIssuePluginKey: {
      getState: vi.fn(),
    },
  };
});

const misspelling: TextIssue = {
  nature: 'spelling',
  from: 1,
  to: 7,
  text: 'spicce',
  message: '',
  suggestions: ['spice', 'épice'],
};

const agreementError: TextIssue = {
  nature: 'grammar',
  from: 1,
  to: 7,
  text: 'chien',
  message: 'Accord de nombre erroné : « chien » devrait être au pluriel.',
  suggestions: ['chiens'],
  ruleFamily: 'gn',
};

function showIssue(issue: TextIssue) {
  (textIssuePluginKey.getState as ReturnType<typeof vi.fn>).mockReturnValue({
    decorations: {},
    issues: [issue],
  });
}

describe('TextIssuePalette', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    showIssue(misspelling);
  });

  function openPalette(
    onIgnoreWord?: (w: string) => void,
    onAddToDictionary?: (w: string) => Promise<void>,
    onIgnoreGrammarIssue?: (issue: TextIssue) => Promise<void>
  ) {
    const editor = createMockEditor();
    render(
      <TextIssuePalette
        editor={editor}
        onIgnoreWord={onIgnoreWord}
        onAddToDictionary={onAddToDictionary}
        onIgnoreGrammarIssue={onIgnoreGrammarIssue}
      />
    );

    // Simulate a click on the editor DOM that hits pos 3 (inside the issue)
    act(() => {
      fireEvent.click(editor.view.dom, { clientX: 50, clientY: 50 });
    });

    return { editor };
  }

  describe('a misspelling', () => {
    it('names the category in words', () => {
      openPalette();
      expect(screen.getByText('Orthographe')).toBeInTheDocument();
    });

    it('shows the "Fermer" button', () => {
      openPalette();
      expect(screen.getByRole('button', { name: 'Fermer' })).toBeInTheDocument();
    });

    it('shows "Ignorer dans ce projet" button', () => {
      openPalette(vi.fn());
      expect(screen.getByRole('button', { name: 'Ignorer dans ce projet' })).toBeInTheDocument();
    });

    it('shows "Ajouter au dictionnaire" button when handler is provided', () => {
      openPalette(undefined, vi.fn());
      expect(screen.getByRole('button', { name: 'Ajouter au dictionnaire' })).toBeInTheDocument();
    });

    it('does not show "Ajouter au dictionnaire" when no handler provided', () => {
      openPalette(vi.fn(), undefined);
      expect(
        screen.queryByRole('button', { name: 'Ajouter au dictionnaire' })
      ).not.toBeInTheDocument();
    });

    it('"Fermer" closes the palette without calling any callback', () => {
      const onIgnore = vi.fn();
      openPalette(onIgnore);
      fireEvent.click(screen.getByRole('button', { name: 'Fermer' }));
      expect(screen.queryByRole('button', { name: 'Fermer' })).not.toBeInTheDocument();
      expect(onIgnore).not.toHaveBeenCalled();
    });

    it('"Ignorer dans ce projet" calls onIgnoreWord with the word', () => {
      const onIgnore = vi.fn();
      openPalette(onIgnore);
      fireEvent.click(screen.getByRole('button', { name: 'Ignorer dans ce projet' }));
      expect(onIgnore).toHaveBeenCalledWith('spicce');
    });

    it('shows a brief confirmation after ignoring', () => {
      vi.useFakeTimers();
      openPalette(vi.fn());
      fireEvent.click(screen.getByRole('button', { name: 'Ignorer dans ce projet' }));
      expect(screen.getByText(/ignoré/i)).toBeInTheDocument();
      vi.useRealTimers();
    });

    it('"Ajouter au dictionnaire" calls onAddToDictionary with the word', async () => {
      const onAdd = vi.fn().mockResolvedValue(undefined);
      openPalette(undefined, onAdd);
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Ajouter au dictionnaire' }));
      });
      expect(onAdd).toHaveBeenCalledWith('spicce');
    });

    it('shows a brief confirmation after adding to dictionary', async () => {
      vi.useFakeTimers();
      const onAdd = vi.fn().mockResolvedValue(undefined);
      openPalette(undefined, onAdd);
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Ajouter au dictionnaire' }));
      });
      expect(screen.getByText(/ajouté/i)).toBeInTheDocument();
      vi.useRealTimers();
    });

    it('applies a suggestion over the flagged range', () => {
      const { editor } = openPalette();
      fireEvent.click(screen.getByRole('button', { name: 'spice' }));
      expect(editor.deleteRange).toHaveBeenCalledWith({ from: 1, to: 7 });
      expect(editor.insertContentAt).toHaveBeenCalledWith(1, 'spice');
    });
  });

  describe('a grammar issue', () => {
    beforeEach(() => {
      showIssue(agreementError);
    });

    it('names the category in words', () => {
      openPalette();
      expect(screen.getByText('Accord')).toBeInTheDocument();
    });

    it('explains what is wrong', () => {
      openPalette();
      expect(screen.getByText(agreementError.message)).toBeInTheDocument();
    });

    it('offers the engine suggestions', () => {
      openPalette();
      expect(screen.getByRole('button', { name: 'chiens' })).toBeInTheDocument();
    });

    it('applies a suggestion over the flagged range', () => {
      const { editor } = openPalette();
      fireEvent.click(screen.getByRole('button', { name: 'chiens' }));
      expect(editor.deleteRange).toHaveBeenCalledWith({ from: 1, to: 7 });
      expect(editor.insertContentAt).toHaveBeenCalledWith(1, 'chiens');
    });

    it('offers no dictionary action, which only makes sense for a word', () => {
      openPalette(vi.fn(), vi.fn());
      expect(
        screen.queryByRole('button', { name: 'Ajouter au dictionnaire' })
      ).not.toBeInTheDocument();
    });

    it('lets the author decline the remark', () => {
      openPalette(undefined, undefined, vi.fn());
      expect(
        screen.getByRole('button', { name: 'Ignorer dans ce projet' })
      ).toBeInTheDocument();
    });

    it('declines with the whole issue, so the rule travels with the text', async () => {
      const onIgnoreGrammarIssue = vi.fn().mockResolvedValue(undefined);
      openPalette(undefined, undefined, onIgnoreGrammarIssue);

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Ignorer dans ce projet' }));
      });

      expect(onIgnoreGrammarIssue).toHaveBeenCalledWith(agreementError);
    });

    it('confirms the remark was declined', async () => {
      openPalette(undefined, undefined, vi.fn().mockResolvedValue(undefined));

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Ignorer dans ce projet' }));
      });

      expect(screen.getByText(/ignoré dans ce projet/i)).toBeInTheDocument();
    });

    it('offers no decline when the editor cannot record one', () => {
      openPalette(vi.fn(), vi.fn());
      expect(
        screen.queryByRole('button', { name: 'Ignorer dans ce projet' })
      ).not.toBeInTheDocument();
    });

    it('does not offer the word-level ignore, which would silence the word itself', () => {
      // A misspelling is ignored by word; a grammar remark by rule and wording.
      const onIgnoreWord = vi.fn();
      openPalette(onIgnoreWord, undefined, vi.fn());

      fireEvent.click(screen.getByRole('button', { name: 'Ignorer dans ce projet' }));

      expect(onIgnoreWord).not.toHaveBeenCalled();
    });
  });
});
