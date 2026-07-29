// ABOUTME: Tests for EndnotesPanel — read-only sheet listing a project's endnotes by chapter.
// ABOUTME: Zero business logic in the component: the list comes entirely from buildEndnoteIndex.

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EndnotesPanel } from './EndnotesPanel';

const ENDNOTE_REF_NAME = 'endnoteRef';

const noteBody = (text: string) => ({
  type: 'doc',
  content: [{ type: 'paragraph', content: text ? [{ type: 'text', text }] : [] }],
});

const chapterContent = (blocks: object[]): string => JSON.stringify({ type: 'doc', content: blocks });

const paragraphWithNote = (text: string, noteText: string) => ({
  type: 'paragraph',
  content: [
    { type: 'text', text },
    { type: ENDNOTE_REF_NAME, attrs: { content: noteText ? noteBody(noteText) : null } },
  ],
});

const paragraph = (text: string) => ({ type: 'paragraph', content: [{ type: 'text', text }] });

describe('EndnotesPanel', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    activeChapterId: null as string | null,
    activeContent: null as string | null,
  };

  it('lists the notes of each chapter with their rank and an excerpt', () => {
    const chapters = [
      {
        id: 'ch1',
        title: 'Chapitre un',
        content: chapterContent([
          paragraphWithNote('Un ', 'première note'),
          paragraphWithNote('Deux ', 'seconde note'),
        ]),
      },
    ];

    render(<EndnotesPanel {...defaultProps} chapters={chapters} />);

    expect(screen.getByText('Chapitre un')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('première note')).toBeInTheDocument();
    expect(screen.getByText('seconde note')).toBeInTheDocument();
  });

  it('renders nothing when open is false', () => {
    const chapters = [
      { id: 'ch1', title: 'Chapitre un', content: chapterContent([paragraphWithNote('Un ', 'note')]) },
    ];

    render(<EndnotesPanel {...defaultProps} open={false} chapters={chapters} />);

    expect(screen.queryByText('Chapitre un')).not.toBeInTheDocument();
  });

  it('shows an explicit empty state when the project has no note at all', () => {
    const chapters = [{ id: 'ch1', title: 'Chapitre un', content: chapterContent([paragraph('Rien ici.')]) }];

    render(<EndnotesPanel {...defaultProps} chapters={chapters} />);

    expect(screen.getByText(/[Aa]ucune note/)).toBeInTheDocument();
  });

  it('does not render a heading for a chapter without a note', () => {
    const chapters = [
      { id: 'ch1', title: 'Sans note', content: chapterContent([paragraph('Rien.')]) },
      { id: 'ch2', title: 'Avec note', content: chapterContent([paragraphWithNote('Un ', 'note')]) },
    ];

    render(<EndnotesPanel {...defaultProps} chapters={chapters} />);

    expect(screen.queryByText('Sans note')).not.toBeInTheDocument();
    expect(screen.getByText('Avec note')).toBeInTheDocument();
  });

  it('shows "Note vide" for a note with no text rather than a mute row', () => {
    const chapters = [
      { id: 'ch1', title: 'Chapitre un', content: chapterContent([paragraphWithNote('Un ', '')]) },
    ];

    render(<EndnotesPanel {...defaultProps} chapters={chapters} />);

    expect(screen.getByText('Note vide')).toBeInTheDocument();
  });

  it('marks the current chapter as such', () => {
    const chapters = [
      { id: 'ch1', title: 'Chapitre un', content: chapterContent([paragraphWithNote('Un ', 'note a')]) },
      { id: 'ch2', title: 'Chapitre deux', content: chapterContent([paragraphWithNote('Un ', 'note b')]) },
    ];

    render(<EndnotesPanel {...defaultProps} chapters={chapters} activeChapterId="ch2" />);

    const chapterTwoHeading = screen.getByText('Chapitre deux').closest('h3');
    expect(chapterTwoHeading).not.toBeNull();
    expect(chapterTwoHeading?.textContent).toMatch(/actif/i);

    const chapterOneHeading = screen.getByText('Chapitre un').closest('h3');
    expect(chapterOneHeading?.textContent).not.toMatch(/actif/i);
  });

  it('reflects unsaved edits to the active chapter over its stored content', () => {
    const chapters = [
      { id: 'ch1', title: 'Chapitre un', content: chapterContent([paragraph('Rien de sauvegardé.')]) },
    ];
    const activeContent = chapterContent([paragraphWithNote('Frappé ', 'note en cours')]);

    render(
      <EndnotesPanel {...defaultProps} chapters={chapters} activeChapterId="ch1" activeContent={activeContent} />
    );

    expect(screen.getByText('note en cours')).toBeInTheDocument();
  });
});
