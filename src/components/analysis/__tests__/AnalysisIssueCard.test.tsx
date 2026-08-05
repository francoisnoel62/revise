// ABOUTME: Tests for AnalysisIssueCard component
// ABOUTME: Verifies issue display, severity badges, and action buttons

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AnalysisIssueCard } from '../AnalysisIssueCard';
import { AnalysisCategory } from '@/domain/value-objects/AnalysisCategory';
import { AnalysisSeverity } from '@/domain/value-objects/AnalysisSeverity';

describe('AnalysisIssueCard', () => {
  const defaultIssue = {
    id: 'issue-1',
    category: 'repetition' as AnalysisCategory,
    severity: 'error' as AnalysisSeverity,
    originalText: 'teh',
    suggestedText: 'the',
    explanation: 'Common typo',
    position: { start: 0, end: 3 },
    status: 'pending' as const,
  };

  const mockOnApply = vi.fn();
  const mockOnIgnore = vi.fn();

  beforeEach(() => {
    mockOnApply.mockClear();
    mockOnIgnore.mockClear();
  });

  it('renders original and suggested text', () => {
    render(
      <AnalysisIssueCard
        issue={defaultIssue}
        onApply={mockOnApply}
        onIgnore={mockOnIgnore}
      />
    );

    expect(screen.getByText('teh')).toBeInTheDocument();
    expect(screen.getByText('the')).toBeInTheDocument();
  });

  it('renders explanation when provided', () => {
    render(
      <AnalysisIssueCard
        issue={defaultIssue}
        onApply={mockOnApply}
        onIgnore={mockOnIgnore}
      />
    );

    expect(screen.getByText('Common typo')).toBeInTheDocument();
  });

  it('renders severity badge with correct color for error', () => {
    render(
      <AnalysisIssueCard
        issue={defaultIssue}
        onApply={mockOnApply}
        onIgnore={mockOnIgnore}
      />
    );

    const badge = screen.getByText('Erreur');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-destructive');
  });

  it('renders severity badge with correct color for warning', () => {
    const warningIssue = { ...defaultIssue, severity: 'warning' as AnalysisSeverity };
    render(
      <AnalysisIssueCard
        issue={warningIssue}
        onApply={mockOnApply}
        onIgnore={mockOnIgnore}
      />
    );

    const badge = screen.getByText('Attention');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-amber-500');
  });

  it('renders severity badge with correct color for suggestion', () => {
    const suggestionIssue = { ...defaultIssue, severity: 'suggestion' as AnalysisSeverity };
    render(
      <AnalysisIssueCard
        issue={suggestionIssue}
        onApply={mockOnApply}
        onIgnore={mockOnIgnore}
      />
    );

    const badge = screen.getByText('Suggestion');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-blue-500');
  });

  it('calls onApply when apply button is clicked', () => {
    render(
      <AnalysisIssueCard
        issue={defaultIssue}
        onApply={mockOnApply}
        onIgnore={mockOnIgnore}
      />
    );

    const applyButton = screen.getByRole('button', { name: /appliquer/i });
    fireEvent.click(applyButton);

    expect(mockOnApply).toHaveBeenCalledWith('issue-1');
  });

  it('calls onIgnore when ignore button is clicked', () => {
    render(
      <AnalysisIssueCard
        issue={defaultIssue}
        onApply={mockOnApply}
        onIgnore={mockOnIgnore}
      />
    );

    const ignoreButton = screen.getByRole('button', { name: /ignorer/i });
    fireEvent.click(ignoreButton);

    expect(mockOnIgnore).toHaveBeenCalledWith('issue-1');
  });

  it('disables buttons when disabled prop is true', () => {
    render(
      <AnalysisIssueCard
        issue={defaultIssue}
        onApply={mockOnApply}
        onIgnore={mockOnIgnore}
        disabled
      />
    );

    const applyButton = screen.getByRole('button', { name: /appliquer/i });
    const ignoreButton = screen.getByRole('button', { name: /ignorer/i });

    expect(applyButton).toBeDisabled();
    expect(ignoreButton).toBeDisabled();
  });

  it('shows applied state when issue status is applied', () => {
    const appliedIssue = { ...defaultIssue, status: 'applied' as const };
    render(
      <AnalysisIssueCard
        issue={appliedIssue}
        onApply={mockOnApply}
        onIgnore={mockOnIgnore}
      />
    );

    expect(screen.getByText('Appliqué')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /appliquer/i })).not.toBeInTheDocument();
  });

  it('shows ignored state when issue status is ignored', () => {
    const ignoredIssue = { ...defaultIssue, status: 'ignored' as const };
    render(
      <AnalysisIssueCard
        issue={ignoredIssue}
        onApply={mockOnApply}
        onIgnore={mockOnIgnore}
      />
    );

    expect(screen.getByText('Ignoré')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /ignorer/i })).not.toBeInTheDocument();
  });

  it('renders category icon', () => {
    const { container } = render(
      <AnalysisIssueCard
        issue={defaultIssue}
        onApply={mockOnApply}
        onIgnore={mockOnIgnore}
      />
    );

    // Should have an SVG icon for the category
    const svgElement = container.querySelector('svg');
    expect(svgElement).toBeInTheDocument();
  });

  it('shows loading state when isApplying is true', () => {
    render(
      <AnalysisIssueCard
        issue={defaultIssue}
        onApply={mockOnApply}
        onIgnore={mockOnIgnore}
        isApplying
      />
    );

    const applyButton = screen.getByRole('button', { name: /application/i });
    expect(applyButton).toBeDisabled();
  });
});
