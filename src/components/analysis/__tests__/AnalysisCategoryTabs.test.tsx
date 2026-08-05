// ABOUTME: Tests for AnalysisCategoryTabs component
// ABOUTME: Verifies tab rendering and selection behavior

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AnalysisCategoryTabs } from '../AnalysisCategoryTabs';
import { AnalysisCategory } from '@/domain/value-objects/AnalysisCategory';

describe('AnalysisCategoryTabs', () => {
  const mockOnChange = vi.fn();
  const defaultCounts: Record<AnalysisCategory | 'all', number> = {
    all: 10,
    repetition: 4,
    style: 2,
  };

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('renders all category tabs', () => {
    render(
      <AnalysisCategoryTabs
        selectedCategory="all"
        counts={defaultCounts}
        onChange={mockOnChange}
      />
    );

    expect(screen.getByRole('tab', { name: /tous/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /répétitions/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /style/i })).toBeInTheDocument();
    expect(screen.getAllByRole('tab')).toHaveLength(3);
  });

  it('shows counts on each tab', () => {
    render(
      <AnalysisCategoryTabs
        selectedCategory="all"
        counts={defaultCounts}
        onChange={mockOnChange}
      />
    );

    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('marks the selected tab as active', () => {
    render(
      <AnalysisCategoryTabs
        selectedCategory="repetition"
        counts={defaultCounts}
        onChange={mockOnChange}
      />
    );

    const repetitionTab = screen.getByRole('tab', { name: /répétitions/i });
    expect(repetitionTab).toHaveAttribute('data-state', 'active');
  });

  it('calls onChange when a tab is clicked', async () => {
    const user = userEvent.setup();
    render(
      <AnalysisCategoryTabs
        selectedCategory="all"
        counts={defaultCounts}
        onChange={mockOnChange}
      />
    );

    const repetitionTab = screen.getByRole('tab', { name: /répétitions/i });
    await user.click(repetitionTab);

    expect(mockOnChange).toHaveBeenCalledWith('repetition');
  });

  it('hides tabs with zero count when hideEmpty is true', () => {
    const countsWithZero = {
      ...defaultCounts,
      repetition: 0,
    };

    render(
      <AnalysisCategoryTabs
        selectedCategory="all"
        counts={countsWithZero}
        onChange={mockOnChange}
        hideEmpty
      />
    );

    expect(screen.queryByRole('tab', { name: /répétitions/i })).not.toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /style/i })).toBeInTheDocument();
  });

  it('renders icons for each category', () => {
    const { container } = render(
      <AnalysisCategoryTabs
        selectedCategory="all"
        counts={defaultCounts}
        onChange={mockOnChange}
      />
    );

    // One SVG icon per visible tab: all, repetition, style.
    const svgElements = container.querySelectorAll('svg');
    expect(svgElements.length).toBeGreaterThanOrEqual(3);
  });

  it('disables tabs when disabled prop is true', () => {
    render(
      <AnalysisCategoryTabs
        selectedCategory="all"
        counts={defaultCounts}
        onChange={mockOnChange}
        disabled
      />
    );

    expect(screen.getByRole('tab', { name: /style/i })).toBeDisabled();
  });
});
