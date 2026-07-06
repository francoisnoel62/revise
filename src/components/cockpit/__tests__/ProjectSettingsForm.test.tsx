// ABOUTME: Tests for ProjectSettingsForm — focused on the "Sommaire" settings card (0021).
// ABOUTME: Verifies the author's tocDepth/tocStyle choices render and are included in the save payload.

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProjectSettingsForm } from '../ProjectSettingsForm';
import type { SerializedProjectSettings } from '@/app/actions/project-settings-actions';
import { DEFAULT_AUTOCOMPLETE_PREFERENCES } from '@/domain/value-objects/AutocompletePreferences';
import { DEFAULT_CANON_EXTRACTION_PREFERENCES } from '@/domain/value-objects/CanonExtractionPreferences';

vi.mock('@/app/actions/project-settings-actions', () => ({
  updateProjectSettingsAction: vi.fn().mockResolvedValue({ success: true, settings: {} }),
  uploadCoverImageAction: vi.fn(),
  deleteCoverImageAction: vi.fn(),
}));

import { updateProjectSettingsAction } from '@/app/actions/project-settings-actions';

function baseSettings(overrides: Partial<SerializedProjectSettings> = {}): SerializedProjectSettings {
  return {
    id: 'settings-1',
    projectId: 'proj-1',
    title: 'Mon Roman',
    subtitle: undefined,
    summary: '',
    coverImageUrl: undefined,
    genre: '',
    synopsis: '',
    pointOfView: undefined,
    tense: undefined,
    targetAudience: undefined,
    isbn: undefined,
    contributors: [],
    relatedWorks: [],
    createdAt: new Date('2026-01-01').toISOString(),
    updatedAt: new Date('2026-01-01').toISOString(),
    autocompletePreferences: DEFAULT_AUTOCOMPLETE_PREFERENCES,
    canonExtractionPreferences: DEFAULT_CANON_EXTRACTION_PREFERENCES,
    customDictionary: [],
    ignoredWords: [],
    publicationProfileId: 'kdp-6x9',
    levelStylesByProfile: {},
    tocPreferences: { depth: 'chapters', style: 'classique' },
    ...overrides,
  };
}

describe('ProjectSettingsForm — Sommaire card', () => {
  it('renders the Sommaire card with defaults (chapters only, classique)', () => {
    render(<ProjectSettingsForm projectId="proj-1" initialSettings={baseSettings()} />);

    expect(screen.getByText('Sommaire')).toBeInTheDocument();
    expect(screen.getByText('Chapitres seuls')).toBeInTheDocument();
    expect(screen.getByText('Classique')).toBeInTheDocument();
  });

  it('renders the stored depth and style when set to chapters-and-subtitles / épuré', () => {
    render(
      <ProjectSettingsForm
        projectId="proj-1"
        initialSettings={baseSettings({ tocPreferences: { depth: 'chapters-and-subtitles', style: 'epure' } })}
      />,
    );

    expect(screen.getByText('Chapitres et sous-titres')).toBeInTheDocument();
    expect(screen.getByText('Épuré')).toBeInTheDocument();
  });

  it('includes the current toc preferences in the save payload', async () => {
    render(
      <ProjectSettingsForm
        projectId="proj-1"
        initialSettings={baseSettings({ tocPreferences: { depth: 'chapters-and-subtitles', style: 'litteraire' } })}
      />,
    );

    // The save button only enables once a field changes; genre is unrelated to the toc
    // settings under test but is enough to flip hasChanges without touching them.
    fireEvent.change(screen.getByLabelText('Genre'), { target: { value: 'Fantasy' } });
    fireEvent.click(screen.getByRole('button', { name: /enregistrer/i }));

    await waitFor(() => {
      expect(updateProjectSettingsAction).toHaveBeenCalledWith(
        'proj-1',
        expect.objectContaining({
          tocPreferences: { depth: 'chapters-and-subtitles', style: 'litteraire' },
        }),
      );
    });
  });
});
