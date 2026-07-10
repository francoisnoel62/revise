// ABOUTME: Applies French typographic non-breaking spaces around high punctuation.
// ABOUTME: Presentation-only; keeps « ; : ! ? » from orphaning at the start of a line.

const NBSP = String.fromCharCode(0xa0);

/**
 * Turns an existing regular space adjacent to French high punctuation into a
 * non-breaking space, so the sign cannot fall alone at the start of a wrapped
 * line. Never adds a space the author did not type — presentation only, the
 * stored manuscript is untouched.
 */
export function applyFrenchSpacing(text: string): string {
  return text
    .replace(/ ([;:!?»])/g, `${NBSP}$1`)
    .replace(/(«) /g, `$1${NBSP}`);
}
