# Plan 3 — Acceptation partielle (chantier 4)

> ✅ **Implémenté le 2026-06-15.** `Ctrl+→` accepte le mot suivant, `Alt+→` le fragment suivant
> (reste en ghost text), `Tab` tout, `Esc` rejette. Découpage pur testé (`suggestionSegments.ts`).
> Instrumentation : outcome `accepted_partial` + `acceptedChars/acceptedWords` persistés + taux
> d'acceptation partielle dans les stats. Gates verts : lint, typecheck, 2216 tests, build.

> Série : [00_index.md](00_index.md). Plus gros gain produit perçu. Méthode : TDD.
> Synergie plan 1 : ajouter un outcome `accepted_partial` à l'instrumentation.

## Overview

Permettre à l'auteur de garder **tout**, **un mot**, ou **un fragment** d'une suggestion, au lieu du
tout-ou-rien actuel — sans complexifier l'interface (toujours `Tab` en surface).

## Current State Analysis

- Acceptation tout-ou-rien : 2ᵉ `Tab` insère toute la suggestion en un `insertContent`
  (`Autocomplete.ts:270-278`, insertion `:275`). Escape rejette (`:290-306`).
- Le ghost text est rendu intégralement (`:357-369`) ; pas de notion de « segment accepté ».
- Storage : `suggestion: string | null` (`:34-40`).

## Desired End State

| Touche | Action |
|--------|--------|
| `Tab` | accepter **toute** la suggestion (inchangé) |
| `Ctrl+→` | accepter **le prochain mot** |
| `Alt+→` | accepter **le prochain fragment** (groupe : jusqu'à la prochaine ponctuation/borne) |
| `Esc` | rejeter |
| frappe normale | ignorer (comportement existant) |

Après acceptation partielle, le **reste** de la suggestion demeure en ghost text et reste
acceptable (Tab/Ctrl+→/Alt+→) ou ignorable.

### Key Discoveries
- Tout est local à l'extension ; aucune dépendance serveur.
- Le découpage mot/fragment est de la logique pure → extractible et testable hors TipTap.

## What We're NOT Doing
- Pas de variantes (plan 5), pas de changement de contexte/prompt (plans 2/4).

## Phase 3.1 — Découpage (logique pure, testable)

**File** : `src/components/editor/extensions/suggestionSegments.ts` (nouveau)
- `nextWord(s: string): { take: string; rest: string }` — capture le prochain mot **avec** son
  espace/ponctuation attachée (préserver la typographie FR : espace insécable, etc.).
- `nextFragment(s: string): { take: string; rest: string }` — jusqu'à la prochaine borne forte
  (`. , ; : ! ? — \n`), bornes incluses.

## Phase 3.2 — Raccourcis dans l'extension

**File** : `src/components/editor/extensions/Autocomplete.ts`
- `addKeyboardShortcuts` : ajouter `Mod-ArrowRight` (mot) et `Alt-ArrowRight` (fragment) ; chacun
  insère `take`, met `storage.suggestion = rest` (ou `null` si vide), force un `dispatch`.
- `Tab` inchangé (toute la suggestion) ; `Escape` inchangé.
- Le ghost text affiche `storage.suggestion` restant (déjà géré, `:357-369`).

## Phase 3.3 — Instrumentation (synergie plan 1)

- Étendre `AutocompleteOutcome` avec `accepted_partial` et ajouter `acceptedChars`/`acceptedWords`
  au payload du tracker (`autocompleteTelemetry.ts`). Émettre `accepted_partial` quand l'auteur
  garde une partie puis ignore le reste ; `accepted_full` si tout est pris.
- Mettre à jour `getStatsByProject` pour exposer le taux d'acceptation partielle.

## Success Criteria

### Automated
- [ ] Tests `suggestionSegments` : mot/fragment, ponctuation FR, fin de chaîne, chaînes vides.
- [ ] Tests extension : `Ctrl+→` insère un mot et conserve le reste ; `Alt+→` un fragment ; `Tab`
  tout ; `Esc` rejette.
- [ ] Test tracker : `accepted_partial` avec compteurs corrects.
- [ ] `npm run verify` vert.

### Manual
- [ ] Sur un manuscrit : accepter un mot, puis un fragment, puis ignorer — fluide, sans saut de curseur.
- [ ] Raccourcis naturels (à confirmer ; ajustables si conflits clavier FR/mac).

## References
- `src/components/editor/extensions/Autocomplete.ts:260-308` (raccourcis), `:357-369` (ghost text)
- Plan 1 : `src/components/editor/extensions/autocompleteTelemetry.ts`, `AutocompleteOutcome`
