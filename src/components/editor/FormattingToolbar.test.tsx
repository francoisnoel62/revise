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

  it('should render endnote button when onInsertEndnote is provided', () => {
    const editor = createMockEditor();
    render(<FormattingToolbar editor={editor} onInsertEndnote={vi.fn()} />);

    expect(screen.getByTitle(/Note de fin/)).toBeInTheDocument();
  });

  it('should call onInsertEndnote when endnote button is clicked', () => {
    const editor = createMockEditor();
    const onInsertEndnote = vi.fn();
    render(<FormattingToolbar editor={editor} onInsertEndnote={onInsertEndnote} />);

    fireEvent.click(screen.getByTitle(/Note de fin/));

    expect(onInsertEndnote).toHaveBeenCalledTimes(1);
  });

  it('should not render endnote button when onInsertEndnote is not provided', () => {
    const editor = createMockEditor();
    render(<FormattingToolbar editor={editor} />);

    expect(screen.queryByTitle(/Note de fin/)).not.toBeInTheDocument();
  });

  it('should render endnote button in print-ready profile', () => {
    const editor = createMockEditor();
    render(<FormattingToolbar editor={editor} profile="print-ready" onInsertEndnote={vi.fn()} />);

    expect(screen.getByTitle(/Note de fin/)).toBeInTheDocument();
  });

  it('should render the endnote list button when onOpenEndnotes is provided', () => {
    const editor = createMockEditor();
    render(<FormattingToolbar editor={editor} onOpenEndnotes={vi.fn()} />);

    expect(screen.getByTitle('Liste des notes')).toBeInTheDocument();
  });

  it('should call onOpenEndnotes when the endnote list button is clicked', () => {
    const editor = createMockEditor();
    const onOpenEndnotes = vi.fn();
    render(<FormattingToolbar editor={editor} onOpenEndnotes={onOpenEndnotes} />);

    fireEvent.click(screen.getByTitle('Liste des notes'));

    expect(onOpenEndnotes).toHaveBeenCalledTimes(1);
  });

  it('should not render the endnote list button when onOpenEndnotes is not provided', () => {
    const editor = createMockEditor();
    render(<FormattingToolbar editor={editor} />);

    expect(screen.queryByTitle('Liste des notes')).not.toBeInTheDocument();
  });

  it('should render the endnote list button in print-ready profile', () => {
    const editor = createMockEditor();
    render(<FormattingToolbar editor={editor} profile="print-ready" onOpenEndnotes={vi.fn()} />);

    expect(screen.getByTitle('Liste des notes')).toBeInTheDocument();
  });

  it('should not confuse the endnote list button with the insertion button title', () => {
    const editor = createMockEditor();
    render(<FormattingToolbar editor={editor} onInsertEndnote={vi.fn()} onOpenEndnotes={vi.fn()} />);

    expect(screen.getByTitle(/Note de fin/)).toBeInTheDocument();
    expect(screen.getByTitle('Liste des notes')).toBeInTheDocument();
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

  describe('Profile-adaptive toolbar', () => {
    const createSemanticEditor = (options: {
      semanticRole?: string;
      headingLevel?: number;
      activeFormats?: string[];
    } = {}): Editor => {
      const { semanticRole = 'corps', headingLevel, activeFormats = [] } = options;

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
          setSemanticRole: vi.fn().mockReturnThis(),
          setNode: vi.fn().mockReturnThis(),
          updateAttributes: vi.fn().mockReturnThis(),
          setHorizontalRule: vi.fn().mockReturnThis(),
          run: vi.fn().mockReturnThis(),
        };
        return chain;
      };

      return {
        isActive: vi.fn((format: string, attrs?: Record<string, unknown>) => {
          if (format === 'heading' && attrs?.level !== undefined) {
            return headingLevel === attrs.level;
          }
          if (format === 'heading') return !!headingLevel;
          if (format === 'paragraph') return !headingLevel;
          return activeFormats.includes(format);
        }),
        getAttributes: vi.fn((type: string) => {
          if (type === 'paragraph') return { semanticRole, textAlign: 'justify' };
          if (type === 'textStyle') return { fontSize: '13pt' };
          if (type === 'heading') return { level: headingLevel };
          return {};
        }),
        can: vi.fn(() => ({
          chain: () => ({
            focus: () => ({
              toggleBold: () => ({ run: vi.fn().mockReturnValue(true) }),
              toggleItalic: () => ({ run: vi.fn().mockReturnValue(true) }),
              toggleUnderline: () => ({ run: vi.fn().mockReturnValue(true) }),
              toggleHighlight: () => ({ run: vi.fn().mockReturnValue(true) }),
            }),
          }),
          undo: () => true,
          redo: () => true,
        })),
        chain: vi.fn(() => createMockChain()),
        view: {},
        isDestroyed: false,
      } as unknown as Editor;
    };

    describe('print-ready profile', () => {
      it('shows semantic style dropdown', () => {
        const editor = createSemanticEditor();
        render(<FormattingToolbar editor={editor} profile="print-ready" />);
        expect(screen.getByTitle(/Style sémantique/)).toBeInTheDocument();
      });

      it('hides font size control in print-ready', () => {
        const editor = createSemanticEditor();
        render(<FormattingToolbar editor={editor} profile="print-ready" />);
        expect(screen.queryByTitle(/Taille de police/)).not.toBeInTheDocument();
      });

      it('hides alignment control in print-ready', () => {
        const editor = createSemanticEditor();
        render(<FormattingToolbar editor={editor} profile="print-ready" />);
        expect(screen.queryByTitle(/Alignement/)).not.toBeInTheDocument();
      });

      it('hides font family control in print-ready', () => {
        const editor = createSemanticEditor();
        render(<FormattingToolbar editor={editor} profile="print-ready" />);
        expect(screen.queryByTitle(/Police \(Georgia/)).not.toBeInTheDocument();
      });

      it('shows bold button in print-ready', () => {
        const editor = createSemanticEditor();
        render(<FormattingToolbar editor={editor} profile="print-ready" />);
        expect(screen.getByTitle(/Bold/)).toBeInTheDocument();
      });

      it('shows italic button in print-ready', () => {
        const editor = createSemanticEditor();
        render(<FormattingToolbar editor={editor} profile="print-ready" />);
        expect(screen.getByTitle(/Italic/)).toBeInTheDocument();
      });

      it('shows indent toggle button in print-ready', () => {
        const editor = createSemanticEditor();
        render(<FormattingToolbar editor={editor} profile="print-ready" />);
        expect(screen.getByTitle(/Retrait 1ère ligne/)).toBeInTheDocument();
      });

      it('calls toggleIndent when indent button is clicked in print-ready', async () => {
        const user = userEvent.setup();
        const editor = createSemanticEditor();
        render(<FormattingToolbar editor={editor} profile="print-ready" />);

        await user.click(screen.getByTitle(/Retrait 1ère ligne/));

        const chain = vi.mocked(editor.chain).mock.results[0].value as {
          toggleIndent: ReturnType<typeof vi.fn>;
        };
        expect(chain.toggleIndent).toHaveBeenCalled();
      });

      it('shows all semantic roles in dropdown', async () => {
        const user = userEvent.setup();
        const editor = createSemanticEditor();
        render(<FormattingToolbar editor={editor} profile="print-ready" />);

        await user.click(screen.getByTitle(/Style sémantique/));

        await waitFor(() => {
          expect(screen.getByRole('menuitem', { name: /Corps/ })).toBeInTheDocument();
        });
        expect(screen.getByRole('menuitem', { name: /Titre de chapitre/ })).toBeInTheDocument();
        expect(screen.getByRole('menuitem', { name: /Sous-titre/ })).toBeInTheDocument();
        expect(screen.getByRole('menuitem', { name: /Citation/ })).toBeInTheDocument();
        expect(screen.getByRole('menuitem', { name: /Épigraphe/ })).toBeInTheDocument();
        expect(screen.getByRole('menuitem', { name: /Séparateur/ })).toBeInTheDocument();
      });

      it('reflects active semantic role as dropdown label', () => {
        const editor = createSemanticEditor({ semanticRole: 'citation' });
        render(<FormattingToolbar editor={editor} profile="print-ready" />);
        expect(screen.getByTitle(/Style sémantique/)).toHaveTextContent(/Citation/);
      });

      it('reflects titre-de-chapitre when cursor is on heading level 1', () => {
        const editor = createSemanticEditor({ headingLevel: 1 });
        render(<FormattingToolbar editor={editor} profile="print-ready" />);
        expect(screen.getByTitle(/Style sémantique/)).toHaveTextContent(/Titre de chapitre/);
      });

      it('calls chain when Corps style is applied', async () => {
        const user = userEvent.setup();
        const editor = createSemanticEditor({ semanticRole: 'citation' });
        render(<FormattingToolbar editor={editor} profile="print-ready" />);

        await user.click(screen.getByTitle(/Style sémantique/));
        await waitFor(() => {
          expect(screen.getByRole('menuitem', { name: /Corps/ })).toBeInTheDocument();
        });
        await user.click(screen.getByRole('menuitem', { name: /Corps/ }));

        expect(editor.chain).toHaveBeenCalled();
      });

      it('calls chain when Titre de chapitre is applied', async () => {
        const user = userEvent.setup();
        const editor = createSemanticEditor();
        render(<FormattingToolbar editor={editor} profile="print-ready" />);

        await user.click(screen.getByTitle(/Style sémantique/));
        await waitFor(() => {
          expect(screen.getByRole('menuitem', { name: /Titre de chapitre/ })).toBeInTheDocument();
        });
        await user.click(screen.getByRole('menuitem', { name: /Titre de chapitre/ }));

        expect(editor.chain).toHaveBeenCalled();
        const chain = vi.mocked(editor.chain).mock.results[0].value as {
          setNode: ReturnType<typeof vi.fn>;
        };
        expect(chain.setNode).toHaveBeenCalledWith('heading', {
          level: 1,
          semanticRole: 'titre-de-chapitre',
        });
      });

      it('marks an applied subtitle with its semantic role', async () => {
        const user = userEvent.setup();
        const editor = createSemanticEditor();
        render(<FormattingToolbar editor={editor} profile="print-ready" />);

        await user.click(screen.getByRole('button', { name: 'Corps' }));
        await user.click(screen.getByRole('menuitem', { name: /Sous-titre/ }));

        const chain = vi.mocked(editor.chain).mock.results[0].value as {
          setNode: ReturnType<typeof vi.fn>;
        };
        expect(chain.setNode).toHaveBeenCalledWith('heading', {
          level: 2,
          semanticRole: 'sous-titre',
        });
      });
    });

    describe('passerelle profile', () => {
      it('shows font size control in passerelle', () => {
        const editor = createSemanticEditor();
        render(<FormattingToolbar editor={editor} profile="passerelle" />);
        expect(screen.getByTitle(/Taille de police/)).toBeInTheDocument();
      });

      it('shows alignment control in passerelle', () => {
        const editor = createSemanticEditor();
        render(<FormattingToolbar editor={editor} profile="passerelle" />);
        expect(screen.getByTitle(/Alignement/)).toBeInTheDocument();
      });

      it('does not show semantic style dropdown in passerelle', () => {
        const editor = createSemanticEditor();
        render(<FormattingToolbar editor={editor} profile="passerelle" />);
        expect(screen.queryByTitle(/Style sémantique/)).not.toBeInTheDocument();
      });
    });

    describe('default (no profile)', () => {
      it('behaves like passerelle when no profile given', () => {
        const editor = createSemanticEditor();
        render(<FormattingToolbar editor={editor} />);
        expect(screen.getByTitle(/Taille de police/)).toBeInTheDocument();
        expect(screen.queryByTitle(/Style sémantique/)).not.toBeInTheDocument();
      });
    });
  });

  describe('Analysis Props', () => {
    it('should pass onAnalyze to AIMenuDropdown when showAIFeatures is true', () => {
      const editor = createMockEditor();
      const mockOnAnalyze = vi.fn();
      const mockProps = {
        onRewrite: vi.fn(),
        onProviderChange: vi.fn(),
        onHistoryClick: vi.fn(),
        onAutocompleteChange: vi.fn(),
        showAIFeatures: true,
        onAnalyze: mockOnAnalyze,
      };

      render(<FormattingToolbar editor={editor} {...mockProps} />);

      // The AIMenuDropdown should be rendered - find it by text content "IA"
      expect(screen.getByText('IA')).toBeInTheDocument();
    });

    it('should pass analysisLoading to AIMenuDropdown', () => {
      const editor = createMockEditor();
      const mockProps = {
        onRewrite: vi.fn(),
        onProviderChange: vi.fn(),
        onHistoryClick: vi.fn(),
        onAutocompleteChange: vi.fn(),
        showAIFeatures: true,
        onAnalyze: vi.fn(),
        analysisLoading: true,
      };

      render(<FormattingToolbar editor={editor} {...mockProps} />);

      // When analysisLoading is true, the AI menu button should be disabled
      // Find the button containing "IA" text
      const aiButton = screen.getByText('IA').closest('button');
      expect(aiButton).toBeDisabled();
    });
  });

  describe('Chapter correction', () => {
    const correctionProps = {
      onRewrite: vi.fn(),
      onProviderChange: vi.fn(),
      onHistoryClick: vi.fn(),
      onAutocompleteChange: vi.fn(),
    };

    it('gives the local corrector its own button, outside the AI menu', () => {
      const editor = createMockEditor();
      render(
        <FormattingToolbar editor={editor} {...correctionProps} onCorrect={vi.fn()} />
      );

      const button = screen.getByRole('button', { name: 'Corriger le chapitre' });
      expect(button).toBeInTheDocument();
      expect(button.closest('[role="menu"]')).toBeNull();
    });

    it('calls onCorrect when the button is clicked', () => {
      const editor = createMockEditor();
      const onCorrect = vi.fn();
      render(
        <FormattingToolbar editor={editor} {...correctionProps} onCorrect={onCorrect} />
      );

      fireEvent.click(screen.getByRole('button', { name: 'Corriger le chapitre' }));

      expect(onCorrect).toHaveBeenCalledTimes(1);
    });

    it('stays enabled with no AI provider — the engine is local', () => {
      const editor = createMockEditor();
      render(
        <FormattingToolbar
          editor={editor}
          {...correctionProps}
          showAIFeatures={false}
          onCorrect={vi.fn()}
        />
      );

      expect(screen.getByRole('button', { name: 'Corriger le chapitre' })).toBeEnabled();
    });

    it('disables the button while a correction is running', () => {
      const editor = createMockEditor();
      render(
        <FormattingToolbar
          editor={editor}
          {...correctionProps}
          onCorrect={vi.fn()}
          correctionLoading
        />
      );

      expect(screen.getByRole('button', { name: 'Corriger le chapitre' })).toBeDisabled();
    });

    it('shows no correction button when the editor offers no correction', () => {
      const editor = createMockEditor();
      render(<FormattingToolbar editor={editor} {...correctionProps} />);

      expect(
        screen.queryByRole('button', { name: 'Corriger le chapitre' })
      ).not.toBeInTheDocument();
    });

    it('offers the punctuation switch beside the correction button', async () => {
      const editor = createMockEditor();
      render(
        <FormattingToolbar
          editor={editor}
          {...correctionProps}
          onCorrect={vi.fn()}
          punctuationChecked
          onPunctuationChange={vi.fn()}
        />
      );

      await userEvent.setup().click(
        screen.getByRole('button', { name: 'Options de correction' })
      );

      expect(screen.getByRole('switch', { name: 'Ponctuation' })).toBeChecked();
    });

    it('reports the punctuation switch as off when the project turned it off', async () => {
      const editor = createMockEditor();
      render(
        <FormattingToolbar
          editor={editor}
          {...correctionProps}
          onCorrect={vi.fn()}
          punctuationChecked={false}
          onPunctuationChange={vi.fn()}
        />
      );

      await userEvent.setup().click(
        screen.getByRole('button', { name: 'Options de correction' })
      );

      expect(screen.getByRole('switch', { name: 'Ponctuation' })).not.toBeChecked();
    });

    it('asks to switch punctuation off when the author unchecks it', async () => {
      const editor = createMockEditor();
      const onPunctuationChange = vi.fn();
      render(
        <FormattingToolbar
          editor={editor}
          {...correctionProps}
          onCorrect={vi.fn()}
          punctuationChecked
          onPunctuationChange={onPunctuationChange}
        />
      );

      const user = userEvent.setup();
      await user.click(screen.getByRole('button', { name: 'Options de correction' }));
      await user.click(screen.getByRole('switch', { name: 'Ponctuation' }));

      expect(onPunctuationChange).toHaveBeenCalledWith(false);
    });

    it('keeps the menu open so the author can see what changed', async () => {
      const editor = createMockEditor();
      render(
        <FormattingToolbar
          editor={editor}
          {...correctionProps}
          onCorrect={vi.fn()}
          punctuationChecked
          onPunctuationChange={vi.fn()}
        />
      );

      const user = userEvent.setup();
      await user.click(screen.getByRole('button', { name: 'Options de correction' }));
      await user.click(screen.getByRole('switch', { name: 'Ponctuation' }));

      expect(screen.getByRole('switch', { name: 'Ponctuation' })).toBeInTheDocument();
    });

    it('shows no options button when the project offers no punctuation switch', () => {
      const editor = createMockEditor();
      render(
        <FormattingToolbar editor={editor} {...correctionProps} onCorrect={vi.fn()} />
      );

      expect(
        screen.queryByRole('button', { name: 'Options de correction' })
      ).not.toBeInTheDocument();
    });

    it('renders the correction button in the print-ready profile too', () => {
      const editor = createMockEditor();
      render(
        <FormattingToolbar
          editor={editor}
          {...correctionProps}
          onCorrect={vi.fn()}
          isPrintReady
        />
      );

      expect(
        screen.getByRole('button', { name: 'Corriger le chapitre' })
      ).toBeInTheDocument();
    });
  });
});
