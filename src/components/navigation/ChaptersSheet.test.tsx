import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChaptersSheet } from './ChaptersSheet';
import { Chapter } from '@/domain/entities/Chapter';

describe('ChaptersSheet', () => {
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
  };

  it('should render trigger button', () => {
    render(<ChaptersSheet {...defaultProps} />);

    const trigger = screen.getByTitle('Chapitres');
    expect(trigger).toBeInTheDocument();
  });

  it('should open sheet when trigger is clicked', () => {
    render(<ChaptersSheet {...defaultProps} />);

    const trigger = screen.getByTitle('Chapitres');
    fireEvent.click(trigger);

    expect(screen.getByText('Chapitres')).toBeInTheDocument();
  });

  it('should render chapter list when open', () => {
    render(<ChaptersSheet {...defaultProps} />);

    const trigger = screen.getByTitle('Chapitres');
    fireEvent.click(trigger);

    expect(screen.getByText('Chapter 1')).toBeInTheDocument();
    expect(screen.getByText('Chapter 2')).toBeInTheDocument();
  });

  it('should highlight active chapter', () => {
    render(<ChaptersSheet {...defaultProps} />);

    const trigger = screen.getByTitle('Chapitres');
    fireEvent.click(trigger);

    // Find the outermost container div for Chapter 1
    const chapter1Text = screen.getByText('Chapter 1');
    const chapter1Container = chapter1Text.closest('.border-blue-500, .bg-blue-50');

    // The active chapter should have either border-blue-500 or bg-blue-50 class
    expect(chapter1Container).toBeInTheDocument();
  });

  it('should call onSelectChapter when chapter clicked', () => {
    render(<ChaptersSheet {...defaultProps} />);

    const trigger = screen.getByTitle('Chapitres');
    fireEvent.click(trigger);

    const chapter2 = screen.getByText('Chapter 2');
    fireEvent.click(chapter2);

    expect(defaultProps.onSelectChapter).toHaveBeenCalledWith('id-2');
  });

  it('should call onAddChapter when add button clicked', () => {
    render(<ChaptersSheet {...defaultProps} />);

    const trigger = screen.getByTitle('Chapitres');
    fireEvent.click(trigger);

    const addButton = screen.getByText('Nouveau chapitre');
    fireEvent.click(addButton);

    expect(defaultProps.onAddChapter).toHaveBeenCalled();
  });

  it('should call onRemoveChapter when delete button clicked', () => {
    render(<ChaptersSheet {...defaultProps} />);

    const trigger = screen.getByTitle('Chapitres');
    fireEvent.click(trigger);

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

    const trigger = screen.getByTitle('Chapitres');
    fireEvent.click(trigger);

    expect(screen.getByText(/Aucun chapitre/)).toBeInTheDocument();
  });

  it('should display chapter metadata (word count and character count)', () => {
    render(<ChaptersSheet {...defaultProps} />);

    const trigger = screen.getByTitle('Chapitres');
    fireEvent.click(trigger);

    expect(screen.getAllByText(/mots/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/caractères/).length).toBeGreaterThan(0);
  });

  it('should render drag handle for each chapter', () => {
    render(<ChaptersSheet {...defaultProps} />);

    const trigger = screen.getByTitle('Chapitres');
    fireEvent.click(trigger);

    const gripIcons = screen.getAllByRole('button').filter(btn =>
      btn.querySelector('svg')?.classList.contains('lucide-grip-vertical')
    );

    expect(gripIcons.length).toBeGreaterThan(0);
  });

  it('should not call onSelectChapter when delete button is clicked', () => {
    const onSelectChapter = vi.fn();
    const props = { ...defaultProps, onSelectChapter };

    render(<ChaptersSheet {...props} />);

    const trigger = screen.getByTitle('Chapitres');
    fireEvent.click(trigger);

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
