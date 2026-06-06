// ABOUTME: Tests for AIMenuDropdown component
// ABOUTME: Verifies menu button rendering and basic state handling

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AIMenuDropdown } from './AIMenuDropdown';
import { SafeProvider } from '@/app/actions/provider-actions';

describe('AIMenuDropdown', () => {
  const mockProviders: SafeProvider[] = [
    { id: 'provider-1', name: 'GPT-4', type: 'openai', isValid: true, maskedApiKey: 'sk-...test', model: 'gpt-4o', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'provider-2', name: 'Claude', type: 'anthropic', isValid: true, maskedApiKey: 'sk-...test', model: 'claude-3', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  ];

  const defaultProps = {
    hasSelection: false,
    onRewrite: vi.fn(),
    rewriteLoading: false,
    isChapterEmpty: false,
    onGenerate: vi.fn(),
    generationLoading: false,
    activeGenerationType: null,
    providers: mockProviders,
    selectedProviderId: 'provider-1',
    onProviderChange: vi.fn(),
    providersLoading: false,
    onHistoryClick: vi.fn(),
    autocompleteEnabled: true,
    onAutocompleteChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the AI menu button', () => {
    render(<AIMenuDropdown {...defaultProps} />);

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('shows "IA" text on larger screens', () => {
    render(<AIMenuDropdown {...defaultProps} />);

    expect(screen.getByText('IA')).toBeInTheDocument();
  });

  it('disables button when rewrite is loading', () => {
    render(<AIMenuDropdown {...defaultProps} rewriteLoading={true} />);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('disables button when generation is loading', () => {
    render(<AIMenuDropdown {...defaultProps} generationLoading={true} />);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('enables button when not loading', () => {
    render(<AIMenuDropdown {...defaultProps} rewriteLoading={false} generationLoading={false} />);

    const button = screen.getByRole('button');
    expect(button).not.toBeDisabled();
  });

  it('renders with different loading states', () => {
    const { rerender } = render(<AIMenuDropdown {...defaultProps} rewriteLoading={false} />);

    let button = screen.getByRole('button');
    expect(button).not.toBeDisabled();

    rerender(<AIMenuDropdown {...defaultProps} rewriteLoading={true} />);
    button = screen.getByRole('button');
    expect(button).toBeDisabled();

    rerender(<AIMenuDropdown {...defaultProps} rewriteLoading={false} generationLoading={true} />);
    button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('accepts onOpenCommandPalette prop', () => {
    const onOpenCommandPalette = vi.fn();
    render(<AIMenuDropdown {...defaultProps} onOpenCommandPalette={onOpenCommandPalette} />);

    // Component should render without error
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('renders with no providers', () => {
    render(<AIMenuDropdown {...defaultProps} providers={[]} selectedProviderId={null} />);

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('renders with providers loading', () => {
    render(<AIMenuDropdown {...defaultProps} providersLoading={true} />);

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('renders when chapter is empty', () => {
    render(<AIMenuDropdown {...defaultProps} isChapterEmpty={true} />);

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('renders when has selection', () => {
    render(<AIMenuDropdown {...defaultProps} hasSelection={true} />);

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('renders with autocomplete disabled', () => {
    render(<AIMenuDropdown {...defaultProps} autocompleteEnabled={false} />);

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  describe('Chapter Analysis', () => {
    it('renders "Vérifier le chapitre" menu item when onAnalyze is provided', async () => {
      const user = await import('@testing-library/user-event');
      const onAnalyze = vi.fn();
      render(<AIMenuDropdown {...defaultProps} onAnalyze={onAnalyze} />);

      // Open the menu
      const menuButton = screen.getByRole('button');
      await user.default.setup().click(menuButton);

      expect(screen.getByText('Vérifier le chapitre')).toBeInTheDocument();
    });

    it('calls onAnalyze when "Vérifier le chapitre" is clicked', async () => {
      const user = await import('@testing-library/user-event');
      const onAnalyze = vi.fn();
      render(<AIMenuDropdown {...defaultProps} onAnalyze={onAnalyze} />);

      // Open the menu
      const menuButton = screen.getByRole('button');
      await user.default.setup().click(menuButton);

      // Click the analyze option
      const analyzeItem = screen.getByText('Vérifier le chapitre');
      await user.default.setup().click(analyzeItem);

      expect(onAnalyze).toHaveBeenCalledTimes(1);
    });

    it('disables "Vérifier le chapitre" when analysisLoading is true', async () => {
      const user = await import('@testing-library/user-event');
      const onAnalyze = vi.fn();
      render(<AIMenuDropdown {...defaultProps} onAnalyze={onAnalyze} analysisLoading={true} />);

      // Open the menu
      const menuButton = screen.getByRole('button');
      await user.default.setup().click(menuButton);

      const analyzeItem = screen.getByText('Vérifier le chapitre').closest('[role="menuitem"]');
      expect(analyzeItem).toHaveAttribute('data-disabled');
    });

    it('disables button when analysisLoading is true', () => {
      const onAnalyze = vi.fn();
      render(<AIMenuDropdown {...defaultProps} onAnalyze={onAnalyze} analysisLoading={true} />);

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });
  });
});
