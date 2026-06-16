// ABOUTME: Tests for AutocompleteStatsCard component
// ABOUTME: Verifies autocomplete lifecycle metrics rendering, empty state and errors

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AutocompleteStatsCard } from '../AutocompleteStatsCard';
import type { AutocompleteStats } from '@/domain/interfaces/AutocompleteEventRepository';
import type { ActionResult } from '@/app/actions/utils';

vi.mock('@/app/actions/usage-actions', () => ({
  getProjectAutocompleteStatsAction: vi.fn(),
}));

import { getProjectAutocompleteStatsAction } from '@/app/actions/usage-actions';

const statsWithData: ActionResult<AutocompleteStats> = {
  success: true,
  data: {
    total: 6,
    byOutcome: {
      accepted_full: 2,
      accepted_partial: 1,
      rejected_escape: 1,
      superseded_typing: 1,
      empty: 1,
    },
    byProviderModel: [
      {
        providerType: 'anthropic',
        model: 'claude-sonnet-4-5',
        total: 4,
        acceptanceRate: 0.5,
        firstTokenMsP50: 250,
        firstTokenMsP95: 390,
      },
      {
        providerType: 'openai',
        model: 'gpt-4o-mini',
        total: 2,
        acceptanceRate: 0,
        firstTokenMsP50: 450,
        firstTokenMsP95: 495,
      },
    ],
    acceptanceRate: 2 / 6,
    partialAcceptanceRate: 1 / 6,
    postInsertionDeletionRate: 1 / 2,
    firstTokenMsP50: 300,
    firstTokenMsP95: 480,
    totalMsP50: 800,
  },
};

const emptyStats: ActionResult<AutocompleteStats> = {
  success: true,
  data: {
    total: 0,
    byOutcome: {
      accepted_full: 0,
      accepted_partial: 0,
      rejected_escape: 0,
      superseded_typing: 0,
      empty: 0,
    },
    byProviderModel: [],
    acceptanceRate: 0,
    partialAcceptanceRate: 0,
    postInsertionDeletionRate: 0,
    firstTokenMsP50: null,
    firstTokenMsP95: null,
    totalMsP50: null,
  },
};

describe('AutocompleteStatsCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    vi.mocked(getProjectAutocompleteStatsAction).mockImplementation(
      () => new Promise(() => {})
    );

    render(<AutocompleteStatsCard projectId="project-1" />);

    const skeletons = document.querySelectorAll('[data-slot="skeleton"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('displays autocomplete metrics when data is loaded', async () => {
    vi.mocked(getProjectAutocompleteStatsAction).mockResolvedValue(statsWithData);

    render(<AutocompleteStatsCard projectId="project-1" />);

    await waitFor(() => {
      expect(screen.getByTestId('autocomplete-stats-card')).toBeInTheDocument();
    });

    expect(screen.getByText('Autocomplétion')).toBeInTheDocument();
    expect(screen.getByText('Suggestions')).toBeInTheDocument();
    expect(screen.getByText('Acceptées')).toBeInTheDocument();
    expect(screen.getByText('Partielles')).toBeInTheDocument();
    expect(screen.getByText('Supprimées')).toBeInTheDocument();
    expect(screen.getByText('300 ms')).toBeInTheDocument();
    expect(screen.getByText('480 ms')).toBeInTheDocument();
    expect(screen.getByText('Provider / modele')).toBeInTheDocument();
    expect(screen.getByText('Anthropic')).toBeInTheDocument();
    expect(screen.getByText('claude-sonnet-4-5')).toBeInTheDocument();
    expect(screen.getByText('OpenAI')).toBeInTheDocument();
    expect(screen.getByText('gpt-4o-mini')).toBeInTheDocument();
    expect(screen.getByText('Réponses vides')).toBeInTheDocument();
  });

  it('shows empty state when no autocomplete telemetry exists', async () => {
    vi.mocked(getProjectAutocompleteStatsAction).mockResolvedValue(emptyStats);

    render(<AutocompleteStatsCard projectId="project-1" />);

    await waitFor(() => {
      expect(
        screen.getByText('Aucune suggestion mesurée pour ce projet.')
      ).toBeInTheDocument();
    });
  });

  it('shows error message on failure', async () => {
    vi.mocked(getProjectAutocompleteStatsAction).mockResolvedValue({
      success: false,
      error: 'Failed to load autocomplete stats',
    });

    render(<AutocompleteStatsCard projectId="project-1" />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load autocomplete stats')).toBeInTheDocument();
    });
  });

  it('calls the action with the project id', async () => {
    vi.mocked(getProjectAutocompleteStatsAction).mockResolvedValue(statsWithData);

    render(<AutocompleteStatsCard projectId="project-42" />);

    await waitFor(() => {
      expect(getProjectAutocompleteStatsAction).toHaveBeenCalledWith('project-42');
    });
  });
});
