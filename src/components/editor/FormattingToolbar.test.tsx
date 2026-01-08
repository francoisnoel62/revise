import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FormattingToolbar } from './FormattingToolbar';
import { Editor } from '@tiptap/react';

describe('FormattingToolbar', () => {
  const createMockEditor = (activeFormats: string[] = []): Editor => {
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
        })
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
});
