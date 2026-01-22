// ABOUTME: Value object defining narration settings for a project
// ABOUTME: Provides type safety and validation for point of view, tense, and target audience

export const POINTS_OF_VIEW = ['first_person', 'third_person_limited', 'third_person_omniscient'] as const;

export type PointOfView = (typeof POINTS_OF_VIEW)[number];

export function isValidPointOfView(value: string): value is PointOfView {
  return POINTS_OF_VIEW.includes(value as PointOfView);
}

export const POINT_OF_VIEW_LABELS: Record<PointOfView, string> = {
  first_person: 'Première personne',
  third_person_limited: 'Troisième personne limitée',
  third_person_omniscient: 'Omniscient',
};

export const NARRATION_TENSES = ['past', 'present'] as const;

export type NarrationTense = (typeof NARRATION_TENSES)[number];

export function isValidNarrationTense(value: string): value is NarrationTense {
  return NARRATION_TENSES.includes(value as NarrationTense);
}

export const NARRATION_TENSE_LABELS: Record<NarrationTense, string> = {
  past: 'Passé',
  present: 'Présent',
};

export const TARGET_AUDIENCES = ['adult', 'young_adult', 'children'] as const;

export type TargetAudience = (typeof TARGET_AUDIENCES)[number];

export function isValidTargetAudience(value: string): value is TargetAudience {
  return TARGET_AUDIENCES.includes(value as TargetAudience);
}

export const TARGET_AUDIENCE_LABELS: Record<TargetAudience, string> = {
  adult: 'Adulte',
  young_adult: 'Young Adult',
  children: 'Jeunesse',
};
