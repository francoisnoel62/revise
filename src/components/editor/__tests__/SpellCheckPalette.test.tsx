// ABOUTME: Unit tests for SpellCheckPalette component
// ABOUTME: Verifies three-button UI, inline confirmation, and callback wiring

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { SpellCheckPalette } from '../SpellCheckPalette';
import { spellCheckPluginKey } from '../SpellCheckExtension';
import type { Editor } from '@tiptap/core';

function createMockEditor(_errors = [{ word: 'spicce', from: 1, to: 7, suggestions: ['spice'] }]) {
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

vi.mock('../SpellCheckExtension', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../SpellCheckExtension')>();
  return {
    ...actual,
    spellCheckPluginKey: {
      getState: vi.fn(),
    },
  };
});

describe('SpellCheckPalette', () => {
  const mockError = { word: 'spicce', from: 1, to: 7, suggestions: ['spice', 'épice'] };

  beforeEach(() => {
    vi.clearAllMocks();
    (spellCheckPluginKey.getState as ReturnType<typeof vi.fn>).mockReturnValue({
      decorations: {},
      errors: [mockError],
    });
  });

  function openPalette(
    onIgnoreWord?: (w: string) => void,
    onAddToDictionary?: (w: string) => Promise<void>
  ) {
    const editor = createMockEditor();
    const { getByRole } = render(
      <SpellCheckPalette
        editor={editor}
        onIgnoreWord={onIgnoreWord}
        onAddToDictionary={onAddToDictionary}
      />
    );

    // Simulate a click on the editor DOM that hits pos 3 (inside the error)
    act(() => {
      fireEvent.click(editor.view.dom, { clientX: 50, clientY: 50 });
    });

    return { getByRole, editor };
  }

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
    expect(screen.queryByRole('button', { name: 'Ajouter au dictionnaire' })).not.toBeInTheDocument();
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

  it('shows a brief confirmation after ignoring', async () => {
    vi.useFakeTimers();
    openPalette(vi.fn());
    fireEvent.click(screen.getByRole('button', { name: 'Ignorer dans ce projet' }));
    // Confirmation text visible immediately
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
});
