// ABOUTME: Tests for ThesaurusPalette component
// ABOUTME: Verifies layer1 loading, insert behavior, AI layer trigger, and voiceAnchored badge

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThesaurusPalette } from './ThesaurusPalette';

// Mock server actions
vi.mock('@/app/actions/thesaurus-actions', () => ({
  getLexicalAlternativesAction: vi.fn(),
  getAIAlternativesAction: vi.fn(),
}));

import {
  getLexicalAlternativesAction,
  getAIAlternativesAction,
} from '@/app/actions/thesaurus-actions';

const mockChain = {
  focus: vi.fn().mockReturnThis(),
  setTextSelection: vi.fn().mockReturnThis(),
  insertContent: vi.fn().mockReturnThis(),
  setHighlight: vi.fn().mockReturnThis(),
  unsetHighlight: vi.fn().mockReturnThis(),
  run: vi.fn().mockReturnValue(true),
};

// Real DOM element so the component can attach its contextmenu listener
const mockDom = document.createElement('div');

const mockView = {
  dom: mockDom,
  posAtCoords: vi.fn().mockReturnValue({ pos: 3 }),
  coordsAtPos: vi.fn().mockReturnValue({ top: 100, left: 50 }),
};

const mockEditor = {
  chain: vi.fn().mockReturnValue(mockChain),
  on: vi.fn(),
  off: vi.fn(),
  view: mockView,
  state: {
    selection: { from: 0, to: 0 },
    doc: {
      // The word "regarder" spans positions 0..8 in its paragraph
      resolve: vi.fn().mockReturnValue({ start: () => 0, end: () => 8 }),
      textBetween: vi.fn().mockReturnValue('regarder'),
    },
  },
} as unknown as import('@tiptap/core').Editor;

// Render the palette and right-click on a word to open it
function renderAndRightClick(showAILayer = true) {
  const utils = render(
    <ThesaurusPalette editor={mockEditor} projectId="p1" showAILayer={showAILayer} />
  );
  fireEvent.contextMenu(mockDom, { clientX: 50, clientY: 120 });
  return utils;
}

describe('ThesaurusPalette', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getLexicalAlternativesAction).mockResolvedValue({
      success: true,
      data: { layer1: ['observer', 'scruter', 'épier'] },
    });
    vi.mocked(getAIAlternativesAction).mockResolvedValue({
      success: true,
      data: {
        layer1: ['observer'],
        layer2: [
          { word: 'épier', sceneEffect: 'installe une menace silencieuse' },
        ],
        voiceAnchored: true,
      },
    });
  });

  it('renders nothing when editor is null', () => {
    const { container } = render(
      <ThesaurusPalette editor={null} projectId="p1" showAILayer={true} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('does not show the palette before any right-click', () => {
    render(<ThesaurusPalette editor={mockEditor} projectId="p1" showAILayer={true} />);
    expect(screen.queryByText('Synonymes')).not.toBeInTheDocument();
  });

  it('opens with layer1 synonyms on right-click of a word', async () => {
    renderAndRightClick();

    await waitFor(() => {
      expect(screen.getByText('observer')).toBeInTheDocument();
      expect(screen.getByText('scruter')).toBeInTheDocument();
    });
  });

  it('does not open when right-click misses a word', async () => {
    vi.mocked(mockView.posAtCoords).mockReturnValueOnce(null);
    renderAndRightClick();

    // Give the action a tick; the palette must stay closed
    await Promise.resolve();
    expect(screen.queryByText('Synonymes')).not.toBeInTheDocument();
  });

  it('shows "Aller plus loin" button when showAILayer is true', async () => {
    renderAndRightClick(true);

    await waitFor(() => {
      expect(screen.getByText('Aller plus loin')).toBeInTheDocument();
    });
  });

  it('does NOT show "Aller plus loin" when showAILayer is false', async () => {
    renderAndRightClick(false);

    await waitFor(() => expect(screen.getByText('observer')).toBeInTheDocument());
    expect(screen.queryByText('Aller plus loin')).not.toBeInTheDocument();
  });

  it('triggers AI action and shows layer2 on "Aller plus loin" click', async () => {
    renderAndRightClick();

    await waitFor(() => expect(screen.getByText('Aller plus loin')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Aller plus loin'));

    await waitFor(() => {
      expect(screen.getByText('installe une menace silencieuse')).toBeInTheDocument();
    });
  });

  it('shows voiceAnchored badge when voiceAnchored is true after AI load', async () => {
    renderAndRightClick();

    await waitFor(() => expect(screen.getByText('Aller plus loin')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Aller plus loin'));

    await waitFor(() => {
      expect(screen.getByText('Accordé à ta voix')).toBeInTheDocument();
    });
  });

  it('calls editor chain to insert word on synonym click', async () => {
    renderAndRightClick();

    await waitFor(() => expect(screen.getByText('observer')).toBeInTheDocument());
    fireEvent.click(screen.getByText('observer'));

    expect(mockEditor.chain).toHaveBeenCalled();
    expect(mockChain.insertContent).toHaveBeenCalledWith('observer');
  });
});
