// ABOUTME: Tests for ChapterAnalysisPanel component
// ABOUTME: Verifies main analysis panel rendering and interactions

import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChapterAnalysisPanel } from '../ChapterAnalysisPanel';
import type { AnalysisIssueData } from '../AnalysisIssueCard';
import type { AnalysisSummaryStats } from '../AnalysisSummaryCard';

// Mock ResizeObserver for ScrollArea component
class MockResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

beforeAll(() => {
  globalThis.ResizeObserver = MockResizeObserver as unknown as typeof globalThis.ResizeObserver;
  globalThis.Element.prototype.scrollIntoView = vi.fn();
});

describe('ChapterAnalysisPanel', () => {
  const mockIssues: AnalysisIssueData[] = [
    {
      id: 'issue-1',
      category: 'repetition',
      severity: 'error',
      originalText: 'teh',
      suggestedText: 'the',
      explanation: 'Typo',
      position: { start: 0, end: 3 },
      status: 'pending',
    },
    {
      id: 'issue-2',
      category: 'repetition',
      severity: 'warning',
      originalText: 'he go',
      suggestedText: 'he goes',
      explanation: 'Subject-verb agreement',
      position: { start: 10, end: 15 },
      status: 'pending',
    },
    {
      id: 'issue-3',
      category: 'style',
      severity: 'suggestion',
      originalText: 'very very',
      suggestedText: 'extremely',
      explanation: 'Avoid repetition',
      position: { start: 20, end: 29 },
      status: 'applied',
    },
  ];

  const mockStats: AnalysisSummaryStats = {
    totalIssues: 3,
    pendingIssues: 2,
    appliedIssues: 1,
    ignoredIssues: 0,
    byCategory: {
      repetition: 2,
      style: 1,
    },
  };

  const mockOnApply = vi.fn();
  const mockOnIgnore = vi.fn();
  const mockOnApplyAll = vi.fn();
  const mockOnClose = vi.fn();

  const defaultProps = {
    open: true,
    issues: mockIssues,
    stats: mockStats,
    onApply: mockOnApply,
    onIgnore: mockOnIgnore,
    onApplyAll: mockOnApplyAll,
    onClose: mockOnClose,
    chapterTitle: 'Chapter 1',
  };

  beforeEach(() => {
    mockOnApply.mockClear();
    mockOnIgnore.mockClear();
    mockOnApplyAll.mockClear();
    mockOnClose.mockClear();
  });

  it('renders panel title with chapter name', () => {
    render(<ChapterAnalysisPanel {...defaultProps} />);

    expect(screen.getByText(/chapter 1/i)).toBeInTheDocument();
    expect(screen.getByText(/vérification/i)).toBeInTheDocument();
  });

  it('renders summary stats', () => {
    render(<ChapterAnalysisPanel {...defaultProps} />);

    // Total appears in multiple places, just check the message is visible
    const threes = screen.getAllByText('3');
    expect(threes.length).toBeGreaterThan(0);
    expect(screen.getByText(/problèmes détectés/i)).toBeInTheDocument();
  });

  it('renders issue cards', () => {
    render(<ChapterAnalysisPanel {...defaultProps} />);

    expect(screen.getByText('teh')).toBeInTheDocument();
    expect(screen.getByText('he go')).toBeInTheDocument();
    expect(screen.getByText('very very')).toBeInTheDocument();
  });

  it('renders category tabs', () => {
    render(<ChapterAnalysisPanel {...defaultProps} />);

    expect(screen.getByRole('tab', { name: /tous/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /répétitions/i })).toBeInTheDocument();
  });

  it('filters issues when category tab is clicked', async () => {
    const user = userEvent.setup();
    render(<ChapterAnalysisPanel {...defaultProps} />);

    const styleTab = screen.getByRole('tab', { name: /style/i });
    await user.click(styleTab);

    // Should only show style issue
    expect(screen.getByText('very very')).toBeInTheDocument();
    expect(screen.queryByText('he go')).not.toBeInTheDocument();
  });

  it('calls onApply when apply button is clicked on an issue', async () => {
    const user = userEvent.setup();
    render(<ChapterAnalysisPanel {...defaultProps} />);

    // Find all apply buttons (excluding "Tout appliquer")
    const applyButtons = screen.getAllByRole('button', { name: /^appliquer$/i });
    await user.click(applyButtons[0]);

    expect(mockOnApply).toHaveBeenCalledWith('issue-1');
  });

  it('calls onIgnore when ignore button is clicked on an issue', async () => {
    const user = userEvent.setup();
    render(<ChapterAnalysisPanel {...defaultProps} />);

    const ignoreButtons = screen.getAllByRole('button', { name: /^ignorer$/i });
    await user.click(ignoreButtons[0]);

    expect(mockOnIgnore).toHaveBeenCalledWith('issue-1');
  });

  it('calls onApplyAll when apply all button is clicked', async () => {
    const user = userEvent.setup();
    render(<ChapterAnalysisPanel {...defaultProps} />);

    const applyAllButton = screen.getByRole('button', { name: /tout appliquer/i });
    await user.click(applyAllButton);

    expect(mockOnApplyAll).toHaveBeenCalled();
  });

  it('does not render when open is false', () => {
    render(<ChapterAnalysisPanel {...defaultProps} open={false} />);

    expect(screen.queryByText(/vérification/i)).not.toBeInTheDocument();
  });

  it('renders loading state when isLoading is true', () => {
    render(<ChapterAnalysisPanel {...defaultProps} isLoading />);

    // Should show loading skeleton
    const skeletons = document.querySelectorAll('[class*="animate-pulse"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders empty state when no issues', () => {
    const emptyStats: AnalysisSummaryStats = {
      totalIssues: 0,
      pendingIssues: 0,
      appliedIssues: 0,
      ignoredIssues: 0,
      byCategory: {
        repetition: 0,
        style: 0,
      },
    };

    render(
      <ChapterAnalysisPanel
        {...defaultProps}
        issues={[]}
        stats={emptyStats}
      />
    );

    // The text appears in both summary card and panel - use getAllByText
    const emptyMessages = screen.getAllByText(/aucun problème détecté/i);
    expect(emptyMessages.length).toBeGreaterThan(0);
  });

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    render(<ChapterAnalysisPanel {...defaultProps} />);

    // Find the close button (Dialog's built-in close button has aria-label="Close")
    const closeButton = screen.getByRole('button', { name: /close/i });
    await user.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });
});
