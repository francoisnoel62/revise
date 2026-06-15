# Plan 5 — Variantes discrètes (chantier 6)

> ✅ **Implémenté le 2026-06-15.** VO `AutocompleteIntent` (natural/shorter/tenser/more_concrete/
> dialogue) + directive serveur (`intentDirective`, injectée dans le contexte, providers inchangés).
> Raccourci discret `Mod-.` cycle l'intention et régénère en place ; un `Tab` neuf revient à
> `natural`. L'intention est transmise au stream et **persistée** sur `AutocompleteEvent` (mesure
> « quelle intention est acceptée »). Gates verts : lint, typecheck, 2228 tests, build.

> Série : [00_index.md](00_index.md). Garder l'interface simple en surface. Méthode : TDD.

## Overview

Permettre, quand une suggestion existe, de demander une **autre intention** sans gros menu : plus
bref, plus tendu, plus concret/sensoriel, ou par le dialogue. Une seule action secondaire.

## Current State Analysis

- Une seule proposition à la fois, pas de régénération orientée (`Autocomplete.ts`).
- Le prompt est unique (`docs/prompt/autocompletion.md`).
- La requête actuelle ne porte aucune notion d'intention (`completion/stream/route.ts:17-22,41`).

## Desired End State

Quand une suggestion est affichée, un raccourci secondaire régénère avec une intention. Surface
minimale : l'auteur ne voit pas un menu — au plus une action discrète (ex. `Mod-.` cycle d'intention,
ou une mini-action contextuelle). `Tab` reste l'unique geste central.

```
type AutocompleteIntent = 'natural' | 'shorter' | 'tenser' | 'more_concrete' | 'dialogue';
```

### Key Discoveries
- En passant l'intention **par le prompt côté serveur**, on évite de modifier la signature
  `generateCompletionStream` des 3 providers (décision : directive d'intention injectée dans le prompt).

## What We're NOT Doing
- Pas de palette de variantes visible ; pas de multi-propositions simultanées.
- Pas de changement du contexte (plan 4) ni de l'acceptation (plan 3).

## Phase 5.1 — Intention dans la requête et le prompt

- **Domaine** : `src/domain/value-objects/AutocompleteIntent.ts` (enum + validateur).
- **Route** : `completion/stream/route.ts` accepte `intent?: AutocompleteIntent` (défaut `natural`) ;
  sélectionne une **directive d'intention** ajoutée au prompt (ex. mapping intention → courte
  consigne), sans toucher la projection de contexte (plan 4) ni l'abstraction provider.
- **Prompt** : un fragment par intention (fichier `docs/prompt/autocompletion-intents.md` ou map
  inline) ; tests contractuels.

## Phase 5.2 — Déclenchement discret côté éditeur

**File** : `src/components/editor/extensions/Autocomplete.ts`
- Raccourci secondaire (quand `storage.suggestion` existe) : re-déclenche `streamCompletion` avec
  l'intention suivante ; remplace la suggestion en place (ghost text). Aucune carte/panneau.
- Stocker l'intention courante dans le storage ; revenir à `natural` au prochain déclenchement neuf.

## Phase 5.3 — Instrumentation (synergie plan 1)

- Ajouter `intent` au payload du tracker → mesurer quelles intentions sont acceptées (signal de valeur).

## Success Criteria

### Automated
- [ ] Tests VO `AutocompleteIntent` ; tests route (intention → directive correcte, défaut `natural`).
- [ ] Tests contractuels des fragments d'intention.
- [ ] Test extension : le raccourci régénère et remplace en place ; `intent` transmis.
- [ ] `npm run verify` vert.

### Manual
- [ ] Régénérer « plus bref » / « plus tendu » donne des suites nettement différentes, sans menu.
- [ ] L'expérience reste « invisible » (pas de surcharge cognitive).

## References
- `src/app/api/completion/stream/route.ts:17-22,41,95-99` ; `docs/prompt/autocompletion.md`
- `src/components/editor/extensions/Autocomplete.ts:124-218,260-308`
- Plan 1 : `autocompleteTelemetry.ts`
