// ABOUTME: Tests for AnalysisConfigDialog component
// ABOUTME: Verifies configuration options for chapter analysis

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AnalysisConfigDialog } from '../AnalysisConfigDialog';

describe('AnalysisConfigDialog', () => {
  const mockOnStart = vi.fn();
  const mockOnCancel = vi.fn();

  const defaultProps = {
    open: true,
    onStart: mockOnStart,
    onCancel: mockOnCancel,
  };

  beforeEach(() => {
    mockOnStart.mockClear();
    mockOnCancel.mockClear();
  });

  it('renders dialog title', () => {
    render(<AnalysisConfigDialog {...defaultProps} />);

    expect(screen.getByText(/vérification du chapitre/i)).toBeInTheDocument();
  });

  it('renders all category checkboxes', () => {
    render(<AnalysisConfigDialog {...defaultProps} />);

    expect(screen.getByRole('checkbox', { name: /orthographe/i })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /grammaire/i })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /ponctuation/i })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /répétitions/i })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /style/i })).toBeInTheDocument();
  });

  it('renders style rigor selector', () => {
    render(<AnalysisConfigDialog {...defaultProps} />);

    expect(screen.getByText(/niveau de rigueur/i)).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('calls onStart with selected categories when start button is clicked', async () => {
    const user = userEvent.setup();
    render(<AnalysisConfigDialog {...defaultProps} />);

    const startButton = screen.getByRole('button', { name: /lancer/i });
    await user.click(startButton);

    expect(mockOnStart).toHaveBeenCalled();
    const callArgs = mockOnStart.mock.calls[0][0];
    expect(callArgs.categories).toBeDefined();
    expect(Array.isArray(callArgs.categories)).toBe(true);
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(<AnalysisConfigDialog {...defaultProps} />);

    const cancelButton = screen.getByRole('button', { name: /annuler/i });
    await user.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('disables start button when no categories are selected', async () => {
    const user = userEvent.setup();
    render(<AnalysisConfigDialog {...defaultProps} />);

    // Uncheck all checkboxes one by one
    await user.click(screen.getByRole('checkbox', { name: /orthographe/i }));
    await user.click(screen.getByRole('checkbox', { name: /grammaire/i }));
    await user.click(screen.getByRole('checkbox', { name: /ponctuation/i }));
    await user.click(screen.getByRole('checkbox', { name: /répétitions/i }));
    await user.click(screen.getByRole('checkbox', { name: /style/i }));

    const startButton = screen.getByRole('button', { name: /lancer/i });
    expect(startButton).toBeDisabled();
  });

  it('has all categories selected by default', () => {
    render(<AnalysisConfigDialog {...defaultProps} />);

    const checkboxes = screen.getAllByRole('checkbox');
    checkboxes.forEach((checkbox) => {
      expect(checkbox).toBeChecked();
    });
  });

  it('passes correct rigor level to onStart', async () => {
    const user = userEvent.setup();
    render(<AnalysisConfigDialog {...defaultProps} />);

    // Click start with default values
    const startButton = screen.getByRole('button', { name: /lancer/i });
    await user.click(startButton);

    const callArgs = mockOnStart.mock.calls[0][0];
    expect(callArgs.styleRigor).toBeDefined();
    expect(['permissive', 'moderate', 'strict']).toContain(callArgs.styleRigor);
  });

  it('does not render when open is false', () => {
    render(<AnalysisConfigDialog {...defaultProps} open={false} />);

    expect(screen.queryByText(/vérification du chapitre/i)).not.toBeInTheDocument();
  });

  it('renders loading state when isLoading is true', () => {
    render(<AnalysisConfigDialog {...defaultProps} isLoading />);

    const startButton = screen.getByRole('button', { name: /analyse en cours/i });
    expect(startButton).toBeDisabled();
  });
});
