// ABOUTME: Test suite for ProposalsPanel component
// ABOUTME: Validates proposal display, insertion, and panel closure

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProposalsPanel } from './ProposalsPanel';

describe('ProposalsPanel', () => {
  const mockProposals = [
    { content: 'First proposal', styleLabel: 'épuré' },
    { content: 'Second proposal', styleLabel: 'lyrique' },
    { content: 'Third proposal', styleLabel: 'nerveux' },
    { content: 'Fourth proposal', styleLabel: 'baroque' },
    { content: 'Fifth proposal', styleLabel: 'amplifié' },
  ];

  it('should not render when proposals are empty', () => {
    const onInsert = vi.fn();
    const onClose = vi.fn();

    render(
      <ProposalsPanel proposals={[]} onInsert={onInsert} onClose={onClose} />
    );

    expect(screen.queryByText('Propositions')).not.toBeInTheDocument();
  });

  it('should render all 5 proposals', () => {
    const onInsert = vi.fn();
    const onClose = vi.fn();

    render(
      <ProposalsPanel
        proposals={mockProposals}
        onInsert={onInsert}
        onClose={onClose}
      />
    );

    expect(screen.getByText('First proposal')).toBeInTheDocument();
    expect(screen.getByText('Second proposal')).toBeInTheDocument();
    expect(screen.getByText('Third proposal')).toBeInTheDocument();
    expect(screen.getByText('Fourth proposal')).toBeInTheDocument();
    expect(screen.getByText('Fifth proposal')).toBeInTheDocument();
  });

  it('should display style labels', () => {
    const onInsert = vi.fn();
    const onClose = vi.fn();

    render(
      <ProposalsPanel
        proposals={mockProposals}
        onInsert={onInsert}
        onClose={onClose}
      />
    );

    expect(screen.getByText('épuré')).toBeInTheDocument();
    expect(screen.getByText('lyrique')).toBeInTheDocument();
    expect(screen.getByText('nerveux')).toBeInTheDocument();
  });

  it('should call onInsert when insert button is clicked', async () => {
    const user = userEvent.setup();
    const onInsert = vi.fn();
    const onClose = vi.fn();

    render(
      <ProposalsPanel
        proposals={mockProposals}
        onInsert={onInsert}
        onClose={onClose}
      />
    );

    const insertButtons = screen.getAllByText('Insérer');
    await user.click(insertButtons[0]);

    expect(onInsert).toHaveBeenCalledWith('First proposal');
  });

  it('should call onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    const onInsert = vi.fn();
    const onClose = vi.fn();

    render(
      <ProposalsPanel
        proposals={mockProposals}
        onInsert={onInsert}
        onClose={onClose}
      />
    );

    await user.click(screen.getByText('✕'));

    expect(onClose).toHaveBeenCalledOnce();
  });
});
