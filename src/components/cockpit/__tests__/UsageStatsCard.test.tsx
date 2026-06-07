// ABOUTME: Tests for UsageStatsCard component
// ABOUTME: Verifies display of AI usage statistics

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { UsageStatsCard } from '../UsageStatsCard';
import type { UsageStats } from '@/domain/interfaces/AIUsageRepository';
import type { ActionResult } from '@/app/actions/utils';

// Mock the server action
vi.mock('@/app/actions/usage-actions', () => ({
  getProjectUsageStatsAction: vi.fn(),
}));

import { getProjectUsageStatsAction } from '@/app/actions/usage-actions';

const mockStatsWithData: ActionResult<UsageStats> = {
  success: true,
  data: {
    totalOperations: 42,
    totalInputTokens: 15000,
    totalOutputTokens: 5000,
    totalDurationMs: 60000,
    byOperation: {
      rewrite: { count: 20, inputTokens: 8000, outputTokens: 2000 },
      narrative_analysis: { count: 5, inputTokens: 3000, outputTokens: 1000 },
      stylistic_dna: { count: 3, inputTokens: 1000, outputTokens: 500 },
      characters: { count: 2, inputTokens: 1000, outputTokens: 500 },
      plot: { count: 2, inputTokens: 1000, outputTokens: 500 },
      worldbuilding: { count: 0, inputTokens: 0, outputTokens: 0 },
      synthesis: { count: 0, inputTokens: 0, outputTokens: 0 },
      chapter_summaries: { count: 0, inputTokens: 0, outputTokens: 0 },
      chapter_generation: { count: 0, inputTokens: 0, outputTokens: 0 },
      completion: { count: 10, inputTokens: 1000, outputTokens: 500 },
      character_chat: { count: 0, inputTokens: 0, outputTokens: 0 },
      character_sheet: { count: 0, inputTokens: 0, outputTokens: 0 },
    },
  },
};

const mockStatsEmpty: ActionResult<UsageStats> = {
  success: true,
  data: {
    totalOperations: 0,
    totalInputTokens: 0,
    totalOutputTokens: 0,
    totalDurationMs: 0,
    byOperation: {
      rewrite: { count: 0, inputTokens: 0, outputTokens: 0 },
      narrative_analysis: { count: 0, inputTokens: 0, outputTokens: 0 },
      stylistic_dna: { count: 0, inputTokens: 0, outputTokens: 0 },
      characters: { count: 0, inputTokens: 0, outputTokens: 0 },
      plot: { count: 0, inputTokens: 0, outputTokens: 0 },
      worldbuilding: { count: 0, inputTokens: 0, outputTokens: 0 },
      synthesis: { count: 0, inputTokens: 0, outputTokens: 0 },
      chapter_summaries: { count: 0, inputTokens: 0, outputTokens: 0 },
      chapter_generation: { count: 0, inputTokens: 0, outputTokens: 0 },
      completion: { count: 0, inputTokens: 0, outputTokens: 0 },
      character_chat: { count: 0, inputTokens: 0, outputTokens: 0 },
      character_sheet: { count: 0, inputTokens: 0, outputTokens: 0 },
    },
  },
};

describe('UsageStatsCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    vi.mocked(getProjectUsageStatsAction).mockImplementation(
      () => new Promise(() => {})
    );

    render(<UsageStatsCard projectId="project-1" />);

    // Should show skeleton during loading (data-slot="skeleton")
    const skeletons = document.querySelectorAll('[data-slot="skeleton"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('displays usage statistics when data is loaded', async () => {
    vi.mocked(getProjectUsageStatsAction).mockResolvedValue(mockStatsWithData);

    render(<UsageStatsCard projectId="project-1" />);

    await waitFor(() => {
      expect(screen.getByText('42')).toBeInTheDocument();
    });

    // Check total operations
    expect(screen.getByText('Opérations')).toBeInTheDocument();

    // Check tokens (formatted as "20.0k")
    expect(screen.getByText('Tokens')).toBeInTheDocument();

    // Check duration (60000ms = 1m)
    expect(screen.getByText('1m')).toBeInTheDocument();

    // Check operation breakdown - top operations
    expect(screen.getByText('Réécriture')).toBeInTheDocument();
    expect(screen.getByText('20')).toBeInTheDocument();
  });

  it('shows empty state when no usage data', async () => {
    vi.mocked(getProjectUsageStatsAction).mockResolvedValue(mockStatsEmpty);

    render(<UsageStatsCard projectId="project-1" />);

    await waitFor(() => {
      expect(
        screen.getByText('Aucune utilisation IA enregistrée pour ce projet.')
      ).toBeInTheDocument();
    });
  });

  it('shows error message on failure', async () => {
    vi.mocked(getProjectUsageStatsAction).mockResolvedValue({
      success: false,
      error: 'Failed to load usage stats',
    });

    render(<UsageStatsCard projectId="project-1" />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load usage stats')).toBeInTheDocument();
    });
  });

  it('calls the action with correct project ID', async () => {
    vi.mocked(getProjectUsageStatsAction).mockResolvedValue(mockStatsWithData);

    render(<UsageStatsCard projectId="test-project-123" />);

    await waitFor(() => {
      expect(getProjectUsageStatsAction).toHaveBeenCalledWith('test-project-123');
    });
  });
});
