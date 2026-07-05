// ABOUTME: Immutable typography settings for the five text semantic roles of a PDF profile.
// ABOUTME: Owns safe numeric bounds, closed-list validation, and profile-derived defaults.

import type { PublicationProfile } from './PublicationProfile';
import type { SemanticRole } from './SemanticRole';

export const LEVEL_STYLE_ROLES = [
  'titre-de-chapitre',
  'sous-titre',
  'corps',
  'citation',
  'epigraphe',
] as const satisfies readonly SemanticRole[];

export type LevelStyleRole = (typeof LEVEL_STYLE_ROLES)[number];
export type LevelStyleWeight = 'normal' | 'bold';
export type LevelStyleAlignment = 'left' | 'center' | 'right' | 'justify';
export type LevelStyleFontFamily = 'EB Garamond' | 'Arial';

export interface LevelStyle {
  readonly fontSizePoints: number;
  readonly fontWeight: LevelStyleWeight;
  readonly italic: boolean;
  readonly alignment: LevelStyleAlignment;
  readonly lineHeight: number;
  readonly spaceBeforePoints: number;
  readonly spaceAfterPoints: number;
  readonly fontFamily: LevelStyleFontFamily;
}

export type LevelStyleSetProperties = Record<LevelStyleRole, LevelStyle>;

const WEIGHTS = ['normal', 'bold'] as const;
const ALIGNMENTS = ['left', 'center', 'right', 'justify'] as const;
const FONT_FAMILIES = ['EB Garamond', 'Arial'] as const;

function clamp(value: number, minimum: number, maximum: number): number {
  if (!Number.isFinite(value)) return minimum;
  return Math.min(maximum, Math.max(minimum, value));
}

function closedValue<T extends string>(
  value: unknown,
  allowed: readonly T[],
  attribute: string,
): T {
  if (typeof value !== 'string' || !allowed.includes(value as T)) {
    throw new Error(`Invalid level style ${attribute}: ${String(value)}`);
  }
  return value as T;
}

function booleanValue(value: unknown, attribute: string): boolean {
  if (typeof value !== 'boolean') {
    throw new Error(`Invalid level style ${attribute}: ${String(value)}`);
  }
  return value;
}

function normalize(style: LevelStyle): LevelStyle {
  return {
    fontSizePoints: clamp(style.fontSizePoints, 6, 48),
    fontWeight: closedValue(style.fontWeight, WEIGHTS, 'fontWeight'),
    italic: booleanValue(style.italic, 'italic'),
    alignment: closedValue(style.alignment, ALIGNMENTS, 'alignment'),
    lineHeight: clamp(style.lineHeight, 1, 3),
    spaceBeforePoints: clamp(style.spaceBeforePoints, 0, 200),
    spaceAfterPoints: clamp(style.spaceAfterPoints, 0, 200),
    fontFamily: closedValue(style.fontFamily, FONT_FAMILIES, 'fontFamily'),
  };
}

export class LevelStyleSet {
  private constructor(private readonly properties: LevelStyleSetProperties) {}

  static create(properties: LevelStyleSetProperties): LevelStyleSet {
    return new LevelStyleSet(
      Object.fromEntries(
        LEVEL_STYLE_ROLES.map((role) => [role, normalize(properties[role])]),
      ) as unknown as LevelStyleSetProperties,
    );
  }

  static defaultsFor(profile: PublicationProfile): LevelStyleSet {
    const body = profile.values;
    const inherited: LevelStyle = {
      fontSizePoints: body.bodyFontSizePoints,
      fontWeight: 'normal',
      italic: false,
      alignment: 'justify',
      lineHeight: body.lineHeight,
      spaceBeforePoints: 0,
      spaceAfterPoints: 0,
      fontFamily: body.bodyFontFamily === 'Arial' ? 'Arial' : 'EB Garamond',
    };

    return LevelStyleSet.create({
      'titre-de-chapitre': {
        ...inherited,
        fontSizePoints: 14,
        fontWeight: 'bold',
        alignment: 'center',
        spaceBeforePoints: 48,
        spaceAfterPoints: 24,
      },
      'sous-titre': {
        ...inherited,
        fontSizePoints: 12,
        fontWeight: 'bold',
        alignment: 'center',
        spaceBeforePoints: 24,
        spaceAfterPoints: 12,
      },
      corps: inherited,
      citation: inherited,
      epigraphe: inherited,
    });
  }

  get values(): LevelStyleSetProperties {
    return Object.fromEntries(
      LEVEL_STYLE_ROLES.map((role) => [role, { ...this.properties[role] }]),
    ) as unknown as LevelStyleSetProperties;
  }
}
