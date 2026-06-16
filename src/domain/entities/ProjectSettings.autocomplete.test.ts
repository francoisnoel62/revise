// ABOUTME: Tests for AutocompletePreferences getter and mutator on ProjectSettings
// ABOUTME: Verifies defaults, updates, and round-trip via toProperties()

import { describe, it, expect } from 'vitest';
import { ProjectSettings } from './ProjectSettings';
import { DEFAULT_AUTOCOMPLETE_PREFERENCES } from '../value-objects/AutocompletePreferences';

function createSettings(): ProjectSettings {
  return ProjectSettings.create('settings-1', 'proj-1', 'owner-1', 'Test Project');
}

describe('ProjectSettings.getAutocompletePreferences', () => {
  it('returns all defaults for a freshly-created settings', () => {
    const settings = createSettings();
    expect(settings.getAutocompletePreferences()).toEqual(DEFAULT_AUTOCOMPLETE_PREFERENCES);
  });

  it('returns all defaults for a settings reconstructed without autocomplete fields', () => {
    const settings = ProjectSettings.reconstruct({
      id: 'id-1',
      projectId: 'proj-1',
      ownerId: 'owner-1',
      title: 'Test',
      summary: '',
      genre: '',
      synopsis: '',
      contributors: [],
      relatedWorks: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      // No autocomplete fields
    });
    expect(settings.getAutocompletePreferences()).toEqual(DEFAULT_AUTOCOMPLETE_PREFERENCES);
  });
});

describe('ProjectSettings.updateAutocompletePreferences', () => {
  it('updates a single field, preserving others at defaults', () => {
    const settings = createSettings();
    const updated = settings.updateAutocompletePreferences({ audace: 'bold' });

    const prefs = updated.getAutocompletePreferences();
    expect(prefs.audace).toBe('bold');
    expect(prefs.enabled).toBe(DEFAULT_AUTOCOMPLETE_PREFERENCES.enabled);
    expect(prefs.suggestionLength).toBe(DEFAULT_AUTOCOMPLETE_PREFERENCES.suggestionLength);
    expect(prefs.learnFromRejections).toBe(DEFAULT_AUTOCOMPLETE_PREFERENCES.learnFromRejections);
    expect(prefs.partialAcceptance).toBe(DEFAULT_AUTOCOMPLETE_PREFERENCES.partialAcceptance);
  });

  it('updates multiple fields at once', () => {
    const settings = createSettings();
    const updated = settings.updateAutocompletePreferences({
      enabled: false,
      suggestionLength: 'long',
      learnFromRejections: true,
    });

    const prefs = updated.getAutocompletePreferences();
    expect(prefs.enabled).toBe(false);
    expect(prefs.suggestionLength).toBe('long');
    expect(prefs.learnFromRejections).toBe(true);
    expect(prefs.audace).toBe(DEFAULT_AUTOCOMPLETE_PREFERENCES.audace);
  });

  it('is immutable — original is unchanged', () => {
    const original = createSettings();
    original.updateAutocompletePreferences({ enabled: false });
    expect(original.getAutocompletePreferences().enabled).toBe(true);
  });

  it('round-trips through toProperties()', () => {
    const settings = createSettings().updateAutocompletePreferences({
      audace: 'prudent',
      partialAcceptance: false,
    });

    const reconstructed = ProjectSettings.reconstruct(settings.toProperties());
    const prefs = reconstructed.getAutocompletePreferences();
    expect(prefs.audace).toBe('prudent');
    expect(prefs.partialAcceptance).toBe(false);
    expect(prefs.enabled).toBe(true);
  });
});
