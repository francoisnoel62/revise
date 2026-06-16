# Plan 7 — Expérimentation A/B des stratégies de contexte (chantier 12)

> Série : [00_index.md](00_index.md). **Dépend** du plan 1 (instrumentation) et du plan 4 (contexte
> dédié). C'est l'arbitre final des questions laissées ouvertes par la stratégie. Méthode : TDD.

## Overview

Comparer, sur données réelles, trois stratégies de contexte d'autocomplétion :
- **A** — comportement actuel (métadonnées dans le chemin chaud) ;
- **B** — manuscrit-premier sans métadonnées (plan 4 par défaut) ;
- **C** — B + documents de recherche locaux/intentionnels.

Décider, sur les signaux du plan 1 (acceptation, acceptation partielle, rejet, suppression-après-
insertion, latence perçue), quelle stratégie l'emporte.

## Current State Analysis

- Plan 1 fournit l'entité `AutocompleteEvent` (1/suggestion) avec `outcome`, `firstTokenMs`, etc.
- Plan 4 fournit `AutocompleteContextBuilder` avec un drapeau `includeMetadata` et une base
  manuscrit-premier ; `AIContextBuilder.buildCompletionContext` reste pour la variante A.
- Aucun mécanisme d'assignation de variante aujourd'hui.

## Desired End State

Chaque requête de complétion est rattachée à une **stratégie** (A/B/C) assignée de façon stable par
utilisateur (ou par projet), enregistrée sur chaque `AutocompleteEvent`, et un rapport agrégé compare
les variantes par les critères de qualité. La décision finale est documentée.

### Key Discoveries
- Ajouter un champ **optionnel** `contextStrategy` à `AutocompleteEvent` est sans migration (nouveau
  champ nullable) ; les anciens events restent valides.

## What We're NOT Doing
- Pas de framework d'expérimentation tiers ; assignation interne simple (hash stable du `userId`).
- Pas de décision « en dur » dans ce plan : il **produit la mesure**, la décision suit.

## Phase 7.1 — Sélecteur de stratégie de contexte

**File** : `src/application/services/CompletionContextStrategy.ts` (nouveau)
- `resolveStrategy(userId): 'A' | 'B' | 'C'` — assignation stable (ex. hash du `userId`), pilotable
  par config (proportions, forçage en dev).
- **Route** `completion/stream/route.ts` : selon la stratégie, construire le contexte via
  `AIContextBuilder.buildCompletionContext` (A), `AutocompleteContextBuilder` sans (B) ou avec
  research docs (C). Passer la stratégie au flux pour qu'elle soit enregistrée.

## Phase 7.2 — Enregistrer la stratégie sur les events

- Étendre `AutocompleteEvent` (+ serializer + interface) d'un champ optionnel
  `contextStrategy?: 'A' | 'B' | 'C' | null`.
- Le payload client `lifecycle` ne connaît pas la stratégie (décidée serveur) → l'enrichir
  **côté route télémétrie** en re-résolvant `resolveStrategy(userId)` (déterministe), ou relayer la
  stratégie au client lors du stream pour qu'il la renvoie. Choix retenu : **ré-résolution serveur**
  (déterministe, pas de cycle client supplémentaire).

## Phase 7.3 — Rapport comparatif

- `getStatsByProject` (ou un `getStatsByStrategy(ownerId, range)`) ventile par `contextStrategy` :
  taux d'acceptation / partielle / rejet / suppression-après-insertion, p50/p95 latence, longueur.
- Sortie : un rapport (script `scripts/` ou page cockpit usage) — **rapport**, pas décision automatique.

## Success Criteria

### Automated
- [ ] Tests `CompletionContextStrategy` : assignation stable, proportions configurables.
- [ ] Test route : la stratégie résolue choisit le bon builder (A/B/C) et le contexte attendu
  (A contient `[MÉTADONNÉES]`, B non, C contient l'intention auteur sans métadonnées).
- [ ] Tests entité/serializer/agrégation pour `contextStrategy` (rétrocompat : null accepté).
- [ ] `npm run verify` vert.

### Manual
- [ ] Sur plusieurs jours d'usage réel : le rapport distingue nettement A/B/C sur l'acceptation et la
  latence ; rédiger la **décision** (quelle stratégie devient le défaut) dans la stratégie produit.

## References
- Plan 1 : `AutocompleteEvent`, `autocomplete-event-serializer`, `MongoDBAutocompleteEventRepository`
- Plan 4 : `AutocompleteContextBuilder` ; `AIContextBuilder.buildCompletionContext` (variante A)
- `src/app/api/completion/stream/route.ts:78-99`
