// ABOUTME: Value object for per-project canon extraction preferences
// ABOUTME: Controls whether extraction triggers automatically at session end or manually

export type CanonExtractionMode = 'manual' | 'session-end';

export interface CanonExtractionPreferences {
  mode: CanonExtractionMode;
}

export const DEFAULT_CANON_EXTRACTION_PREFERENCES: CanonExtractionPreferences = {
  mode: 'manual',
};
