// ABOUTME: Tests for CharacterCounter component
// ABOUTME: Validates character and word count display from TipTap editor

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CharacterCounter } from './CharacterCounter';
import { Editor } from '@tiptap/react';

describe('CharacterCounter', () => {
  it('returns null when editor is null', () => {
    const { container } = render(<CharacterCounter editor={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('displays character and word counts from editor storage', () => {
    const mockEditor = {
      storage: {
        characterCount: {
          characters: vi.fn().mockReturnValue(1234),
          words: vi.fn().mockReturnValue(256),
        },
      },
    } as unknown as Editor;

    render(<CharacterCounter editor={mockEditor} />);

    // French locale uses non-breaking space as thousands separator
    expect(screen.getByText(/1[\s\u00A0]?234 caractères/)).toBeInTheDocument();
    expect(screen.getByText(/256 mots/)).toBeInTheDocument();
  });

  it('displays zero counts when characterCount storage is empty', () => {
    const mockEditor = {
      storage: {
        characterCount: {
          characters: vi.fn().mockReturnValue(0),
          words: vi.fn().mockReturnValue(0),
        },
      },
    } as unknown as Editor;

    render(<CharacterCounter editor={mockEditor} />);

    expect(screen.getByText('0 caractères')).toBeInTheDocument();
    expect(screen.getByText('0 mots')).toBeInTheDocument();
  });

  it('handles missing characterCount storage gracefully', () => {
    const mockEditor = {
      storage: {},
    } as unknown as Editor;

    render(<CharacterCounter editor={mockEditor} />);

    expect(screen.getByText('0 caractères')).toBeInTheDocument();
    expect(screen.getByText('0 mots')).toBeInTheDocument();
  });

  it('formats large numbers with French locale', () => {
    const mockEditor = {
      storage: {
        characterCount: {
          characters: vi.fn().mockReturnValue(123456),
          words: vi.fn().mockReturnValue(20000),
        },
      },
    } as unknown as Editor;

    render(<CharacterCounter editor={mockEditor} />);

    // French locale formats with spaces as thousand separators
    expect(screen.getByText(/123[\s\u00A0]?456 caractères/)).toBeInTheDocument();
    expect(screen.getByText(/20[\s\u00A0]?000 mots/)).toBeInTheDocument();
  });
});
