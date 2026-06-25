// ABOUTME: Tests for AnalysisSummaryCard component
// ABOUTME: Verifies summary stats display and category breakdown

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AnalysisSummaryCard } from '../AnalysisSummaryCard';
import { AnalysisCategory } from '@/domain/value-objects/AnalysisCategory';

describe('AnalysisSummaryCard', () => {
  const defaultStats = {
    totalIssues: 17,
    pendingIssues: 9,
    appliedIssues: 5,
    ignoredIssues: 3,
    byCategory: {
      spelling: 0,
      grammar: 6,
      punctuation: 4,
      repetition: 4,
      style: 3,
    } as Record<AnalysisCategory, number>,
  };

  it('renders total issues count', () => {
    render(<AnalysisSummaryCard stats={defaultStats} />);

    expect(screen.getByText('17')).toBeInTheDocument();
    expect(screen.getByText(/problèmes détectés/i)).toBeInTheDocument();
  });

  it('renders pending issues count', () => {
    render(<AnalysisSummaryCard stats={defaultStats} />);

    expect(screen.getByText('9')).toBeInTheDocument();
    expect(screen.getByText(/à traiter/i)).toBeInTheDocument();
  });

  it('renders applied issues count', () => {
    render(<AnalysisSummaryCard stats={defaultStats} />);

    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText(/appliqués/i)).toBeInTheDocument();
  });

  it('renders ignored issues count', () => {
    render(<AnalysisSummaryCard stats={defaultStats} />);

    // Use getAllByText since "3" appears in both ignoredIssues and style category
    const threeElements = screen.getAllByText('3');
    expect(threeElements.length).toBeGreaterThan(0);
    expect(screen.getByText(/ignorés/i)).toBeInTheDocument();
  });

  it('renders category breakdown', () => {
    render(<AnalysisSummaryCard stats={defaultStats} />);

    expect(screen.getByText(/grammaire/i)).toBeInTheDocument();
    expect(screen.getByText(/ponctuation/i)).toBeInTheDocument();
    expect(screen.getByText(/répétitions/i)).toBeInTheDocument();
    expect(screen.getByText(/style/i)).toBeInTheDocument();
  });

  it('renders loading skeleton when isLoading is true', () => {
    const { container } = render(
      <AnalysisSummaryCard stats={defaultStats} isLoading />
    );

    const skeletons = container.querySelectorAll('[class*="animate-pulse"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('displays success message when all issues are resolved', () => {
    const resolvedStats = {
      ...defaultStats,
      pendingIssues: 0,
    };

    render(<AnalysisSummaryCard stats={resolvedStats} />);

    expect(screen.getByText(/tous les problèmes traités/i)).toBeInTheDocument();
  });

  it('calls onApplyAll when apply all button is clicked', () => {
    const mockOnApplyAll = vi.fn();
    render(
      <AnalysisSummaryCard
        stats={defaultStats}
        onApplyAll={mockOnApplyAll}
      />
    );

    const applyAllButton = screen.getByRole('button', { name: /tout appliquer/i });
    fireEvent.click(applyAllButton);

    expect(mockOnApplyAll).toHaveBeenCalled();
  });

  it('disables apply all button when no pending issues', () => {
    const resolvedStats = { ...defaultStats, pendingIssues: 0 };
    const mockOnApplyAll = vi.fn();

    render(
      <AnalysisSummaryCard
        stats={resolvedStats}
        onApplyAll={mockOnApplyAll}
      />
    );

    const applyAllButton = screen.getByRole('button', { name: /tout appliquer/i });
    expect(applyAllButton).toBeDisabled();
  });

  it('renders empty state when no issues found', () => {
    const emptyStats = {
      totalIssues: 0,
      pendingIssues: 0,
      appliedIssues: 0,
      ignoredIssues: 0,
      byCategory: {
        spelling: 0,
        grammar: 0,
        punctuation: 0,
        repetition: 0,
        style: 0,
      } as Record<AnalysisCategory, number>,
    };

    render(<AnalysisSummaryCard stats={emptyStats} />);

    expect(screen.getByText(/aucun problème détecté/i)).toBeInTheDocument();
  });
});
