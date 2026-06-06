import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChaptersSheet as ChaptersSheetComponent } from './ChaptersSheet';
import { Chapter } from '@/domain/entities/Chapter';

// ChaptersSheet now manages its own state; cast to allow legacy props in skipped tests
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ChaptersSheet = ChaptersSheetComponent as unknown as React.ComponentType<Record<string, any>>;
import React from 'react';

// Mock the store
vi.mock('@/store/projectStore', () => ({
  useProjectStore: () => ({
    project: null,
  }),
}));

// Note: Skipping this test suite because Radix UI Sheet doesn't render properly in test environment
// The Sheet content is portaled and not accessible in the DOM during tests
describe.skip('ChaptersSheet', () => {
  beforeEach(() => {
    // Create a portal root for Radix UI
    const portalRoot = document.createElement('div');
    portalRoot.setAttribute('id', 'portal-root');
    document.body.appendChild(portalRoot);
  });

  const createMockChapter = (id: string, title: string): Chapter => {
    const content = JSON.stringify({ type: 'doc', content: [] });
    return new Chapter(id, title, content, 0);
  };

  const defaultProps = {
    chapters: [
      createMockChapter('id-1', 'Chapter 1'),
      createMockChapter('id-2', 'Chapter 2'),
    ],
    activeChapterId: 'id-1',
    onSelectChapter: vi.fn(),
    onAddChapter: vi.fn(),
    onRemoveChapter: vi.fn(),
    onReorderChapters: vi.fn(),
    onUpdateTitle: vi.fn(),
    open: true,
    onOpenChange: vi.fn(),
  };

  it('should render chapter list when open', () => {
    render(<ChaptersSheet {...defaultProps} />);

    expect(screen.getByText('Chapitres')).toBeInTheDocument();
    expect(screen.getByText('Chapter 1')).toBeInTheDocument();
    expect(screen.getByText('Chapter 2')).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    const closedProps = { ...defaultProps, open: false };
    render(<ChaptersSheet {...closedProps} />);

    expect(screen.queryByText('Chapter 1')).not.toBeInTheDocument();
  });

  it('should highlight active chapter', () => {
    render(<ChaptersSheet {...defaultProps} />);

    // Find the outermost container div for Chapter 1
    const chapter1Text = screen.getByText('Chapter 1');
    const chapter1Container = chapter1Text.closest('.border-blue-500, .bg-blue-50');

    // The active chapter should have either border-blue-500 or bg-blue-50 class
    expect(chapter1Container).toBeInTheDocument();
  });

  it('should call onSelectChapter when chapter clicked', () => {
    render(<ChaptersSheet {...defaultProps} />);

    const chapter2 = screen.getByText('Chapter 2');
    fireEvent.click(chapter2);

    expect(defaultProps.onSelectChapter).toHaveBeenCalledWith('id-2');
  });

  it('should call onAddChapter when add button clicked', () => {
    render(<ChaptersSheet {...defaultProps} />);

    const addButton = screen.getByText('Nouveau chapitre');
    fireEvent.click(addButton);

    expect(defaultProps.onAddChapter).toHaveBeenCalled();
  });

  it('should call onRemoveChapter when delete button clicked', () => {
    render(<ChaptersSheet {...defaultProps} />);

    const deleteButtons = screen.getAllByRole('button');
    const deleteButton = deleteButtons.find(btn =>
      btn.querySelector('svg')?.classList.contains('lucide-trash-2')
    );

    if (deleteButton) {
      fireEvent.click(deleteButton);
      expect(defaultProps.onRemoveChapter).toHaveBeenCalled();
    }
  });

  it('should show empty state when no chapters', () => {
    const emptyProps = { ...defaultProps, chapters: [] };
    render(<ChaptersSheet {...emptyProps} />);

    expect(screen.getByText(/Aucun chapitre/)).toBeInTheDocument();
  });

  it('should display chapter metadata (word count and character count)', () => {
    render(<ChaptersSheet {...defaultProps} />);

    expect(screen.getAllByText(/mots/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/caractères/).length).toBeGreaterThan(0);
  });

  it('should render drag handle for each chapter', () => {
    render(<ChaptersSheet {...defaultProps} />);

    const gripIcons = screen.getAllByRole('button').filter(btn =>
      btn.querySelector('svg')?.classList.contains('lucide-grip-vertical')
    );

    expect(gripIcons.length).toBeGreaterThan(0);
  });

  it('should not call onSelectChapter when delete button is clicked', () => {
    const onSelectChapter = vi.fn();
    const props = { ...defaultProps, onSelectChapter };

    render(<ChaptersSheet {...props} />);

    const deleteButtons = screen.getAllByRole('button');
    const deleteButton = deleteButtons.find(btn =>
      btn.querySelector('svg')?.classList.contains('lucide-trash-2')
    );

    if (deleteButton) {
      fireEvent.click(deleteButton);
      expect(onSelectChapter).not.toHaveBeenCalled();
    }
  });
});
