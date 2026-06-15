// ABOUTME: Maps a completion intent to a short prompt directive injected server-side
// ABOUTME: Keeps the provider interface untouched — the directive rides in the context block

import { AutocompleteIntent } from '../../domain/value-objects/AutocompleteIntent';

const DIRECTIVES: Record<AutocompleteIntent, string> = {
  natural: '',
  shorter: 'Propose une suite plus brève que d’ordinaire (quelques mots, une demi-phrase).',
  tenser: 'Relance légèrement la tension, sans précipiter ni résoudre la scène.',
  more_concrete: 'Privilégie le concret et le sensoriel (gestes, perceptions), sans surcharger.',
  dialogue: 'Poursuis par une réplique de dialogue, dans la voix du personnage.',
};

/**
 * Returns the context fragment for an intent, or '' for the natural (default) intent.
 * The fragment is prepended to the completion context so providers stay unchanged.
 */
export function intentDirective(intent: AutocompleteIntent): string {
  const directive = DIRECTIVES[intent];
  return directive ? `\n\n[INTENTION DEMANDÉE]\n${directive}\n` : '';
}
