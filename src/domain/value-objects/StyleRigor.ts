// ABOUTME: Value object defining style analysis rigor levels
// ABOUTME: Provides configurable rules that activate based on selected strictness

export const STYLE_RIGOR_LEVELS = ['permissive', 'moderate', 'strict'] as const;

export type StyleRigor = (typeof STYLE_RIGOR_LEVELS)[number];

export function isValidStyleRigor(value: string): value is StyleRigor {
  return STYLE_RIGOR_LEVELS.includes(value as StyleRigor);
}

export const STYLE_RIGOR_LABELS: Record<StyleRigor, string> = {
  permissive: 'Permissif',
  moderate: 'Modéré',
  strict: 'Strict',
};

export const STYLE_RIGOR_DESCRIPTIONS: Record<StyleRigor, string> = {
  permissive: 'Détecte uniquement les problèmes majeurs (voix passive excessive, phrases très longues)',
  moderate: 'Ajoute la détection des adverbes fréquents et des structures répétitives',
  strict: 'Détecte également les verbes faibles, clichés et pléonasmes',
};

export interface StyleRule {
  id: string;
  description: string;
  minRigor: StyleRigor;
}

const RIGOR_ORDER: Record<StyleRigor, number> = {
  permissive: 0,
  moderate: 1,
  strict: 2,
};

export const STYLE_RIGOR_RULES: StyleRule[] = [
  // Permissive level rules (always active)
  {
    id: 'excessive-passive-voice',
    description: 'Voix passive excessive (>30% du texte)',
    minRigor: 'permissive',
  },
  {
    id: 'very-long-sentences',
    description: 'Phrases très longues (>50 mots)',
    minRigor: 'permissive',
  },

  // Moderate level rules
  {
    id: 'frequent-adverbs',
    description: 'Adverbes en "-ment" trop fréquents',
    minRigor: 'moderate',
  },
  {
    id: 'repeated-structures',
    description: 'Structures de phrases répétitives',
    minRigor: 'moderate',
  },

  // Strict level rules
  {
    id: 'weak-verbs',
    description: 'Verbes faibles (être, avoir, faire)',
    minRigor: 'strict',
  },
  {
    id: 'cliches',
    description: 'Expressions clichées',
    minRigor: 'strict',
  },
  {
    id: 'pleonasms',
    description: 'Pléonasmes',
    minRigor: 'strict',
  },
];

export function getActiveRulesForRigor(rigor: StyleRigor): StyleRule[] {
  const rigorLevel = RIGOR_ORDER[rigor];

  return STYLE_RIGOR_RULES.filter((rule) => {
    const ruleLevel = RIGOR_ORDER[rule.minRigor];
    return ruleLevel <= rigorLevel;
  });
}
