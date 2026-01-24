import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormattingToolbar } from './FormattingToolbar';
import { Editor } from '@tiptap/react';

describe('FormattingToolbar', () => {
  const createMockEditor = (activeFormats: string[] = [], options?: { canUndo?: boolean; canRedo?: boolean }): Editor => {
    const { canUndo = true, canRedo = true } = options || {};
    const createMockChain = () => {
      const chain = {
        focus: vi.fn().mockReturnThis(),
        toggleBold: vi.fn().mockReturnThis(),
        toggleItalic: vi.fn().mockReturnThis(),
        toggleUnderline: vi.fn().mockReturnThis(),
        toggleHighlight: vi.fn().mockReturnThis(),
        setFontFamily: vi.fn().mockReturnThis(),
        setFontSize: vi.fn().mockReturnThis(),
        setTextAlign: vi.fn().mockReturnThis(),
        toggleIndent: vi.fn().mockReturnThis(),
        undo: vi.fn().mockReturnThis(),
        redo: vi.fn().mockReturnThis(),
        run: vi.fn().mockReturnThis(),
      };
      return chain;
    };

    return {
      isActive: vi.fn((format: string) => activeFormats.includes(format)),
      getAttributes: vi.fn((type: string) => {
        if (type === 'textStyle') {
          return { fontFamily: 'Georgia', fontSize: '13pt' };
        }
        if (type === 'paragraph') {
          return { textAlign: 'justify', indent: false };
        }
        return {};
      }),
      can: vi.fn(() => ({
        chain: () => ({
          focus: () => ({
            toggleBold: () => ({ run: vi.fn().mockReturnValue(true) }),
            toggleItalic: () => ({ run: vi.fn().mockReturnValue(true) }),
            toggleUnderline: () => ({ run: vi.fn().mockReturnValue(true) }),
            toggleHighlight: () => ({ run: vi.fn().mockReturnValue(true) }),
          })
        }),
        undo: () => canUndo,
        redo: () => canRedo,
      })),
      chain: vi.fn(() => createMockChain()),
      view: {}, // Add view property so component renders
      isDestroyed: false, // Add isDestroyed property
    } as unknown as Editor;
  };

  it('should render all formatting buttons', () => {
    const editor = createMockEditor();
    render(<FormattingToolbar editor={editor} />);

    expect(screen.getByTitle(/Bold/)).toBeInTheDocument();
    expect(screen.getByTitle(/Italic/)).toBeInTheDocument();
    expect(screen.getByTitle(/Underline/)).toBeInTheDocument();
    expect(screen.getByTitle(/Highlight/)).toBeInTheDocument();
  });

  it('should return null when editor is null', () => {
    const { container } = render(<FormattingToolbar editor={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('should apply bold formatting when bold button clicked', () => {
    const editor = createMockEditor();
    render(<FormattingToolbar editor={editor} />);

    const boldButton = screen.getByTitle(/Bold/);
    fireEvent.click(boldButton);

    expect(editor.chain).toHaveBeenCalled();
  });

  it('should apply italic formatting when italic button clicked', () => {
    const editor = createMockEditor();
    render(<FormattingToolbar editor={editor} />);

    const italicButton = screen.getByTitle(/Italic/);
    fireEvent.click(italicButton);

    expect(editor.chain).toHaveBeenCalled();
  });

  it('should apply underline formatting when underline button clicked', () => {
    const editor = createMockEditor();
    render(<FormattingToolbar editor={editor} />);

    const underlineButton = screen.getByTitle(/Underline/);
    fireEvent.click(underlineButton);

    expect(editor.chain).toHaveBeenCalled();
  });

  it('should apply highlight formatting when highlight button clicked', () => {
    const editor = createMockEditor();
    render(<FormattingToolbar editor={editor} />);

    const highlightButton = screen.getByTitle(/Highlight/);
    fireEvent.click(highlightButton);

    expect(editor.chain).toHaveBeenCalled();
  });

  it('should show active state for bold when text is bold', () => {
    const editor = createMockEditor(['bold']);
    render(<FormattingToolbar editor={editor} />);

    const boldButton = screen.getByTitle(/Bold/);
    expect(boldButton).toHaveClass('bg-primary'); // shadcn default variant has bg-primary
  });

  it('should show active state for italic when text is italic', () => {
    const editor = createMockEditor(['italic']);
    render(<FormattingToolbar editor={editor} />);

    const italicButton = screen.getByTitle(/Italic/);
    expect(italicButton).toHaveClass('bg-primary');
  });

  it('should show active state for multiple formats simultaneously', () => {
    const editor = createMockEditor(['bold', 'italic', 'underline']);
    render(<FormattingToolbar editor={editor} />);

    expect(screen.getByTitle(/Bold/)).toHaveClass('bg-primary');
    expect(screen.getByTitle(/Italic/)).toHaveClass('bg-primary');
    expect(screen.getByTitle(/Underline/)).toHaveClass('bg-primary');
  });

  it('should render undo and redo buttons', () => {
    const editor = createMockEditor();
    render(<FormattingToolbar editor={editor} />);

    expect(screen.getByTitle(/Annuler/)).toBeInTheDocument();
    expect(screen.getByTitle(/Rétablir/)).toBeInTheDocument();
  });

  it('should call undo when undo button is clicked', () => {
    const editor = createMockEditor();
    render(<FormattingToolbar editor={editor} />);

    const undoButton = screen.getByTitle(/Annuler/);
    fireEvent.click(undoButton);

    expect(editor.chain).toHaveBeenCalled();
  });

  it('should call redo when redo button is clicked', () => {
    const editor = createMockEditor();
    render(<FormattingToolbar editor={editor} />);

    const redoButton = screen.getByTitle(/Rétablir/);
    fireEvent.click(redoButton);

    expect(editor.chain).toHaveBeenCalled();
  });

  it('should disable undo button when undo is not available', () => {
    const editor = createMockEditor([], { canUndo: false });
    render(<FormattingToolbar editor={editor} />);

    const undoButton = screen.getByTitle(/Annuler/);
    expect(undoButton).toBeDisabled();
  });

  it('should disable redo button when redo is not available', () => {
    const editor = createMockEditor([], { canRedo: false });
    render(<FormattingToolbar editor={editor} />);

    const redoButton = screen.getByTitle(/Rétablir/);
    expect(redoButton).toBeDisabled();
  });

  it('should render search button when onSearchClick is provided', () => {
    const editor = createMockEditor();
    const mockOnSearchClick = vi.fn();
    render(<FormattingToolbar editor={editor} onSearchClick={mockOnSearchClick} />);

    expect(screen.getByTitle(/Rechercher/)).toBeInTheDocument();
  });

  it('should call onSearchClick when search button is clicked', () => {
    const editor = createMockEditor();
    const mockOnSearchClick = vi.fn();
    render(<FormattingToolbar editor={editor} onSearchClick={mockOnSearchClick} />);

    const searchButton = screen.getByTitle(/Rechercher/);
    fireEvent.click(searchButton);

    expect(mockOnSearchClick).toHaveBeenCalled();
  });

  it('should not render search button when onSearchClick is not provided', () => {
    const editor = createMockEditor();
    render(<FormattingToolbar editor={editor} />);

    expect(screen.queryByTitle(/Rechercher/)).not.toBeInTheDocument();
  });

  describe('Font Size Selector', () => {
    it('should display current font size', () => {
      const editor = createMockEditor();
      render(<FormattingToolbar editor={editor} />);

      expect(screen.getByTitle(/Taille de police/)).toHaveTextContent('13pt');
    });

    it('should open dropdown with common font sizes when clicked', async () => {
      const user = userEvent.setup();
      const editor = createMockEditor();
      render(<FormattingToolbar editor={editor} />);

      const fontSizeButton = screen.getByTitle(/Taille de police/);
      await user.click(fontSizeButton);

      // Should have common sizes available (check a few representative sizes)
      await waitFor(() => {
        expect(screen.getByRole('menuitem', { name: '8' })).toBeInTheDocument();
      });
      expect(screen.getByRole('menuitem', { name: '12' })).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: '24' })).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: '48' })).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: '72' })).toBeInTheDocument();
    });

    it('should have a custom size input field', async () => {
      const user = userEvent.setup();
      const editor = createMockEditor();
      render(<FormattingToolbar editor={editor} />);

      const fontSizeButton = screen.getByTitle(/Taille de police/);
      await user.click(fontSizeButton);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Taille/)).toBeInTheDocument();
      });
    });

    it('should apply font size when selecting from dropdown', async () => {
      const user = userEvent.setup();
      const editor = createMockEditor();
      render(<FormattingToolbar editor={editor} />);

      const fontSizeButton = screen.getByTitle(/Taille de police/);
      await user.click(fontSizeButton);

      await waitFor(() => {
        expect(screen.getByRole('menuitem', { name: '24' })).toBeInTheDocument();
      });

      const size24 = screen.getByRole('menuitem', { name: '24' });
      await user.click(size24);

      expect(editor.chain).toHaveBeenCalled();
    });

    it('should apply custom font size when entering value in input', async () => {
      const user = userEvent.setup();
      const editor = createMockEditor();
      render(<FormattingToolbar editor={editor} />);

      const fontSizeButton = screen.getByTitle(/Taille de police/);
      await user.click(fontSizeButton);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Taille/)).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText(/Taille/);
      await user.type(input, '42');
      await user.keyboard('{Enter}');

      expect(editor.chain).toHaveBeenCalled();
    });

    it('should not apply font size below 8', async () => {
      const user = userEvent.setup();
      // Track setFontSize calls
      const setFontSizeCalls: string[] = [];
      const createMockChainWithTracking = () => {
        const chain = {
          focus: vi.fn().mockReturnThis(),
          toggleBold: vi.fn().mockReturnThis(),
          toggleItalic: vi.fn().mockReturnThis(),
          toggleUnderline: vi.fn().mockReturnThis(),
          toggleHighlight: vi.fn().mockReturnThis(),
          setFontFamily: vi.fn().mockReturnThis(),
          setFontSize: vi.fn((size: string) => {
            setFontSizeCalls.push(size);
            return chain;
          }),
          setTextAlign: vi.fn().mockReturnThis(),
          toggleIndent: vi.fn().mockReturnThis(),
          undo: vi.fn().mockReturnThis(),
          redo: vi.fn().mockReturnThis(),
          run: vi.fn().mockReturnThis(),
        };
        return chain;
      };

      const editor = {
        isActive: vi.fn(() => false),
        getAttributes: vi.fn((type: string) => {
          if (type === 'textStyle') return { fontFamily: 'Georgia', fontSize: '13pt' };
          if (type === 'paragraph') return { textAlign: 'justify', indent: false };
          return {};
        }),
        can: vi.fn(() => ({
          chain: () => ({
            focus: () => ({
              toggleBold: () => ({ run: vi.fn().mockReturnValue(true) }),
              toggleItalic: () => ({ run: vi.fn().mockReturnValue(true) }),
              toggleUnderline: () => ({ run: vi.fn().mockReturnValue(true) }),
              toggleHighlight: () => ({ run: vi.fn().mockReturnValue(true) }),
            })
          }),
          undo: () => true,
          redo: () => true,
        })),
        chain: vi.fn(() => createMockChainWithTracking()),
        view: {},
        isDestroyed: false,
      } as unknown as Editor;

      render(<FormattingToolbar editor={editor} />);

      const fontSizeButton = screen.getByTitle(/Taille de police/);
      await user.click(fontSizeButton);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Taille/)).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText(/Taille/);
      await user.type(input, '5');
      await user.keyboard('{Enter}');

      // Should apply minimum of 8pt instead
      expect(setFontSizeCalls).toContain('8pt');
    });

    it('should not apply font size above 100', async () => {
      const user = userEvent.setup();
      // Track setFontSize calls
      const setFontSizeCalls: string[] = [];
      const createMockChainWithTracking = () => {
        const chain = {
          focus: vi.fn().mockReturnThis(),
          toggleBold: vi.fn().mockReturnThis(),
          toggleItalic: vi.fn().mockReturnThis(),
          toggleUnderline: vi.fn().mockReturnThis(),
          toggleHighlight: vi.fn().mockReturnThis(),
          setFontFamily: vi.fn().mockReturnThis(),
          setFontSize: vi.fn((size: string) => {
            setFontSizeCalls.push(size);
            return chain;
          }),
          setTextAlign: vi.fn().mockReturnThis(),
          toggleIndent: vi.fn().mockReturnThis(),
          undo: vi.fn().mockReturnThis(),
          redo: vi.fn().mockReturnThis(),
          run: vi.fn().mockReturnThis(),
        };
        return chain;
      };

      const editor = {
        isActive: vi.fn(() => false),
        getAttributes: vi.fn((type: string) => {
          if (type === 'textStyle') return { fontFamily: 'Georgia', fontSize: '13pt' };
          if (type === 'paragraph') return { textAlign: 'justify', indent: false };
          return {};
        }),
        can: vi.fn(() => ({
          chain: () => ({
            focus: () => ({
              toggleBold: () => ({ run: vi.fn().mockReturnValue(true) }),
              toggleItalic: () => ({ run: vi.fn().mockReturnValue(true) }),
              toggleUnderline: () => ({ run: vi.fn().mockReturnValue(true) }),
              toggleHighlight: () => ({ run: vi.fn().mockReturnValue(true) }),
            })
          }),
          undo: () => true,
          redo: () => true,
        })),
        chain: vi.fn(() => createMockChainWithTracking()),
        view: {},
        isDestroyed: false,
      } as unknown as Editor;

      render(<FormattingToolbar editor={editor} />);

      const fontSizeButton = screen.getByTitle(/Taille de police/);
      await user.click(fontSizeButton);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Taille/)).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText(/Taille/);
      // Use fireEvent.change to bypass input type=number restrictions in jsdom
      fireEvent.change(input, { target: { value: '150' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      // Should apply maximum of 100pt instead
      expect(setFontSizeCalls).toContain('100pt');
    });
  });
});
