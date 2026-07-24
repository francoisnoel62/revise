// ABOUTME: Tests for EndnoteModal — the centered modal with a mini TipTap editor.
// ABOUTME: Covers open/close, rich-text controls, submit round-trip, and edit pre-fill.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EndnoteModal } from './EndnoteModal';
import type { EndnoteContent } from './extensions/EndnoteRef';

const makeNote = (text: string): EndnoteContent => ({
  type: 'doc',
  content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
});

describe('EndnoteModal', () => {
  const defaultProps = {
    open: true,
    initialContent: null,
    onSubmit: vi.fn(),
    onCancel: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render its content when closed', () => {
    render(<EndnoteModal {...defaultProps} open={false} />);
    expect(screen.queryByText('Valider')).not.toBeInTheDocument();
  });

  it('renders the rich-text controls and actions when open', async () => {
    render(<EndnoteModal {...defaultProps} />);
    await waitFor(() => expect(screen.getByText('Valider')).toBeInTheDocument());

    expect(screen.getByRole('button', { name: /gras/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /italique/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /lien/i })).toBeInTheDocument();
    expect(screen.getByText('Annuler')).toBeInTheDocument();
  });

  it('submits the note content when Valider is clicked', async () => {
    const onSubmit = vi.fn();
    render(<EndnoteModal {...defaultProps} initialContent={makeNote('hello note')} onSubmit={onSubmit} />);
    await waitFor(() => expect(screen.getByText('Valider')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Valider'));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const submitted = onSubmit.mock.calls[0][0];
    expect(JSON.stringify(submitted)).toContain('hello note');
  });

  it('pre-fills the editor with the existing note in edit mode', async () => {
    render(<EndnoteModal {...defaultProps} initialContent={makeNote('existing body')} />);
    await waitFor(() => expect(screen.getByText('existing body')).toBeInTheDocument());
  });

  it('calls onCancel when Annuler is clicked', async () => {
    const onCancel = vi.fn();
    render(<EndnoteModal {...defaultProps} onCancel={onCancel} />);
    await waitFor(() => expect(screen.getByText('Annuler')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Annuler'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
