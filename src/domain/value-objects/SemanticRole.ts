// ABOUTME: Semantic role value object for TipTap content nodes.
// ABOUTME: Marks the role of a block (Corps, Titre de chapitre, etc.) not its visual appearance.

export const SEMANTIC_ROLES = [
  'corps',
  'titre-de-chapitre',
  'sous-titre',
  'citation',
  'epigraphe',
  'separateur-de-scene',
] as const;

export type SemanticRole = (typeof SEMANTIC_ROLES)[number];

export function isSemanticRole(value: unknown): value is SemanticRole {
  return typeof value === 'string' && (SEMANTIC_ROLES as readonly string[]).includes(value);
}
