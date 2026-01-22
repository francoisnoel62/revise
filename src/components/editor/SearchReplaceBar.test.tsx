// ABOUTME: Tests for the SearchReplaceBar component
// ABOUTME: Verifies search, navigation, and replace functionality

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchReplaceBar } from './SearchReplaceBar';
import { Editor } from '@tiptap/react';

describe('SearchReplaceBar', () => {
  const createMockEditor = (textContent = 'Hello world, hello again!'): Editor => {
    const createMockChain = () => {
      const chain = {
        focus: vi.fn().mockReturnThis(),
        setTextSelection: vi.fn().mockReturnThis(),
        insertContent: vi.fn().mockReturnThis(),
        scrollIntoView: vi.fn().mockReturnThis(),
        run: vi.fn().mockReturnThis(),
      };
      return chain;
    };

    // Track all text nodes and their positions
    const textNodes: { text: string; pos: number }[] = [];
    textNodes.push({ text: textContent, pos: 0 });

    return {
      state: {
        doc: {
          descendants: vi.fn((callback: (node: { isText: boolean; text?: string }, pos: number) => void) => {
            callback({ isText: true, text: textContent }, 0);
          }),
        },
      },
      chain: vi.fn(() => createMockChain()),
      commands: {
        focus: vi.fn(),
      },
      view: {},
      isDestroyed: false,
    } as unknown as Editor;
  };

  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when isOpen is false', () => {
    render(
      <SearchReplaceBar
        editor={createMockEditor()}
        isOpen={false}
        onClose={mockOnClose}
      />
    );

    expect(screen.queryByPlaceholderText('Rechercher...')).not.toBeInTheDocument();
  });

  it('should render search and replace inputs when isOpen is true', () => {
    render(
      <SearchReplaceBar
        editor={createMockEditor()}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByPlaceholderText('Rechercher...')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Remplacer par...')).toBeInTheDocument();
  });

  it('should render navigation buttons', () => {
    render(
      <SearchReplaceBar
        editor={createMockEditor()}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByTitle(/Précédent/)).toBeInTheDocument();
    expect(screen.getByTitle(/Suivant/)).toBeInTheDocument();
    expect(screen.getByTitle(/Fermer/)).toBeInTheDocument();
  });

  it('should render replace buttons', () => {
    render(
      <SearchReplaceBar
        editor={createMockEditor()}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByTitle('Remplacer')).toBeInTheDocument();
    expect(screen.getByTitle('Tout remplacer')).toBeInTheDocument();
  });

  it('should find matches when typing in search input', async () => {
    render(
      <SearchReplaceBar
        editor={createMockEditor('Hello world, hello again!')}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    const searchInput = screen.getByPlaceholderText('Rechercher...');
    await userEvent.type(searchInput, 'hello');

    await waitFor(() => {
      // Should find 2 matches (case-insensitive)
      expect(screen.getByText('1/2')).toBeInTheDocument();
    });
  });

  it('should show 0/0 when no matches found', async () => {
    render(
      <SearchReplaceBar
        editor={createMockEditor('Hello world!')}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    const searchInput = screen.getByPlaceholderText('Rechercher...');
    await userEvent.type(searchInput, 'xyz');

    await waitFor(() => {
      expect(screen.getByText('0/0')).toBeInTheDocument();
    });
  });

  it('should disable navigation buttons when no matches', async () => {
    render(
      <SearchReplaceBar
        editor={createMockEditor('Hello world!')}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    const searchInput = screen.getByPlaceholderText('Rechercher...');
    await userEvent.type(searchInput, 'xyz');

    await waitFor(() => {
      expect(screen.getByTitle(/Précédent/)).toBeDisabled();
      expect(screen.getByTitle(/Suivant/)).toBeDisabled();
    });
  });

  it('should call onClose when close button clicked', () => {
    render(
      <SearchReplaceBar
        editor={createMockEditor()}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    fireEvent.click(screen.getByTitle(/Fermer/));

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should call onClose when Escape key pressed', () => {
    render(
      <SearchReplaceBar
        editor={createMockEditor()}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should focus search input when opened', () => {
    render(
      <SearchReplaceBar
        editor={createMockEditor()}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    const searchInput = screen.getByPlaceholderText('Rechercher...');
    expect(document.activeElement).toBe(searchInput);
  });

  it('should disable replace buttons when no matches', async () => {
    render(
      <SearchReplaceBar
        editor={createMockEditor('Hello world!')}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    const searchInput = screen.getByPlaceholderText('Rechercher...');
    await userEvent.type(searchInput, 'xyz');

    await waitFor(() => {
      expect(screen.getByTitle('Remplacer')).toBeDisabled();
      expect(screen.getByTitle('Tout remplacer')).toBeDisabled();
    });
  });

  it('should select text when navigating to match', async () => {
    const mockEditor = createMockEditor('Hello world, hello again!');
    render(
      <SearchReplaceBar
        editor={mockEditor}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    const searchInput = screen.getByPlaceholderText('Rechercher...');
    await userEvent.type(searchInput, 'hello');

    await waitFor(() => {
      expect(screen.getByText('1/2')).toBeInTheDocument();
    });

    // Click next to trigger navigation and selection
    fireEvent.click(screen.getByTitle(/Suivant/));

    await waitFor(() => {
      expect(mockEditor.chain).toHaveBeenCalled();
    });
  });

  it('should navigate to next match when next button clicked', async () => {
    const mockEditor = createMockEditor('Hello world, hello again!');
    render(
      <SearchReplaceBar
        editor={mockEditor}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    const searchInput = screen.getByPlaceholderText('Rechercher...');
    await userEvent.type(searchInput, 'hello');

    await waitFor(() => {
      expect(screen.getByText('1/2')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTitle(/Suivant/));

    await waitFor(() => {
      expect(screen.getByText('2/2')).toBeInTheDocument();
    });
  });

  it('should navigate to previous match when previous button clicked', async () => {
    const mockEditor = createMockEditor('Hello world, hello again!');
    render(
      <SearchReplaceBar
        editor={mockEditor}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    const searchInput = screen.getByPlaceholderText('Rechercher...');
    await userEvent.type(searchInput, 'hello');

    await waitFor(() => {
      expect(screen.getByText('1/2')).toBeInTheDocument();
    });

    // Go to next then back to previous
    fireEvent.click(screen.getByTitle(/Suivant/));

    await waitFor(() => {
      expect(screen.getByText('2/2')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTitle(/Précédent/));

    await waitFor(() => {
      expect(screen.getByText('1/2')).toBeInTheDocument();
    });
  });

  it('should wrap around when navigating past last match', async () => {
    const mockEditor = createMockEditor('Hello world, hello again!');
    render(
      <SearchReplaceBar
        editor={mockEditor}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    const searchInput = screen.getByPlaceholderText('Rechercher...');
    await userEvent.type(searchInput, 'hello');

    await waitFor(() => {
      expect(screen.getByText('1/2')).toBeInTheDocument();
    });

    // Navigate: 1 -> 2 -> 1 (wrap)
    fireEvent.click(screen.getByTitle(/Suivant/));

    await waitFor(() => {
      expect(screen.getByText('2/2')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTitle(/Suivant/));

    await waitFor(() => {
      expect(screen.getByText('1/2')).toBeInTheDocument();
    });
  });

  it('should return null when editor is null', () => {
    render(
      <SearchReplaceBar
        editor={null}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    // Component should still render but show no matches
    expect(screen.getByPlaceholderText('Rechercher...')).toBeInTheDocument();
  });
});
