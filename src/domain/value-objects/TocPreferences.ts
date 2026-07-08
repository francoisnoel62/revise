// ABOUTME: Value object for the whole-book table of contents settings (global to the project).
// ABOUTME: Depth controls whether sous-titre headings appear as nested entries; style picks a design.

export type TocDepth = 'chapters' | 'chapters-and-subtitles';
export type TocStyle = 'classique' | 'epure' | 'litteraire';

export interface TocPreferences {
  depth: TocDepth;
  style: TocStyle;
}

export const DEFAULT_TOC_PREFERENCES: TocPreferences = {
  depth: 'chapters',
  style: 'classique',
};
