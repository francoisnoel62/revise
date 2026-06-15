# Plan 4 — Contexte manuscrit-premier (chantiers 5 & 8)

> ✅ **Implémenté le 2026-06-15.** Nouveau `AutocompleteContextBuilder` : texte du **chapitre en
> cours** d'abord + intention auteur (research docs) ; **métadonnées dérivées hors du chemin chaud**
> (opt-in `includeMetadata` uniquement). La route SSE l'utilise (contexte construit frais, plus de
> `MetadataCache` pour la complétion) ; fenêtre locale élargie (1000/200). `buildResearchContext`
> exposé sur `AIContextBuilder` ; `extractChapterText` ajouté. Gates verts : lint, typecheck,
> 2223 tests, build.
>
> Limite assumée : « passages pertinents du manuscrit » hors chapitre courant non implémentés
> (pas d'embeddings) — chapitre courant + intention auteur seulement, comme prévu.

> Série : [00_index.md](00_index.md). Cœur de la stratégie manuscrit-premier. Prérequis du plan 7
> (variantes B/C de l'A/B). Méthode : TDD.

## Overview

Créer un **constructeur de contexte dédié à l'autocomplétion**, manuscrit-premier, distinct du
`projectContext` générique, et **sortir les métadonnées dérivées du chemin chaud** par défaut (elles
restent pour cockpit/diagnostic/recherche). Le manuscrit devient la source de vérité opérationnelle.

## Current State Analysis

- Aujourd'hui la complétion injecte 5 métadonnées dérivées + research docs via
  `AIContextBuilder.buildCompletionContext` (`AIContextBuilder.ts:59-97`, caps `:21,28`), tandis que
  le manuscrit n'entre que par une fenêtre **500/100 caractères** (`Autocomplete.ts:77,80-85`).
- La route construit/caches ce bloc (`completion/stream/route.ts:78-86`) et le passe au provider (`:95-99`).
- Le cache `MetadataCache` est keyé par `chapterId`.

## Desired End State

La complétion s'appuie d'abord sur le **texte réel** selon une hiérarchie ordonnée et étiquetée, les
métadonnées dérivées n'étant **plus injectées par défaut**. `buildCompletionContext` reste disponible
pour d'autres usages mais n'est plus le contexte principal d'écriture.

**Hiérarchie (ordonnée, étiquetée) :**
1. texte immédiat (avant/après curseur — fenêtre élargie vs 500/100, à calibrer) ;
2. paragraphe / scène courante ;
3. chapitre courant ;
4. passages pertinents du manuscrit (heuristique simple, ex. début de chapitre + voisinage) ;
5. documents auteur liés au chapitre (intention — légitimes) ;
6. métadonnées dérivées **seulement si explicitement activées**.

### Key Discoveries
- La projection vit dans l'Application (Phase 8.0) → un nouveau builder cohabite proprement.
- `linkedChapterIds` (research docs) est le primitif de localité existant (`ResearchDocument`).
- Le manuscrit complet est déjà extrait ailleurs via `extractProjectFullText` (`services/project-text.ts`).

## What We're NOT Doing
- Pas de suppression des métadonnées ni de `buildCompletionContext` (déclassement, pas suppression).
- Pas d'embeddings/recherche sémantique (la « pertinence » reste heuristique en Phase 4).

## Phase 4.1 — `AutocompleteContextBuilder`

**File** : `src/application/services/AutocompleteContextBuilder.ts` (nouveau)
- `buildContext(input: { ownerId, projectId, chapterId?, textBefore, textAfter, includeMetadata?: boolean }): Promise<string>`.
- Compose la hiérarchie ci-dessus, chaque section **étiquetée** (`[TEXTE]`, `[CHAPITRE]`,
  `[INTENTION AUTEUR]`, …), avec budgets stricts par section.
- Réutilise `ResearchDocumentRepository` (locality `linkedChapterIds`) et, si `includeMetadata`,
  délègue à `AIContextBuilder` pour le bloc métadonnées (opt-in uniquement).
- Manuscrit chapitre/voisinage via le repository projet (réutiliser l'extraction existante).

## Phase 4.2 — Brancher la route sur le builder dédié

**File** : `src/app/api/completion/stream/route.ts`
- Remplacer l'appel `buildCompletionContext` (`:80-86`) par `AutocompleteContextBuilder.buildContext`
  (manuscrit-premier, `includeMetadata: false` par défaut).
- Le client envoie déjà `textBeforeCursor`/`textAfterCursor`/`chapterId` ; élargir la fenêtre locale
  côté `Autocomplete.ts` (`:77,80-85`) à un budget calibré (paramètre, défaut à valider par mesure).
- Adapter la clé de cache (inclure un hash du voisinage si nécessaire) ou réduire le TTL pour éviter
  un contexte périmé.

## Phase 4.3 — Métadonnées hors chemin chaud (chantier 8)

- Confirmer que `buildCompletionContext` n'est plus appelé par défaut dans le chemin de complétion.
- `includeMetadata` reste un drapeau (off par défaut) pour expérimentation (plan 7, variante C+méta).
- Documenter : métadonnées conservées pour cockpit/diagnostic/recherche/navigation.

## Success Criteria

### Automated
- [ ] Tests `AutocompleteContextBuilder` : hiérarchie/étiquettes/budgets ; research docs locaux
  inclus ; métadonnées **absentes** par défaut, présentes si `includeMetadata: true` ; dégradation
  gracieuse si un repo manque.
- [ ] Test route : par défaut, le contexte ne contient pas de bloc `[MÉTADONNÉES]`.
- [ ] `npm run verify` vert.

### Manual
- [ ] Suggestions plus cohérentes localement (rythme/voisinage) sur un manuscrit réel.
- [ ] Latence stable malgré la fenêtre élargie (mesurer via plan 1) ; calibrer le budget.

## References
- `src/application/services/AIContextBuilder.ts:59-97,21,28` ; `services/project-text.ts` (extraction)
- `src/app/api/completion/stream/route.ts:78-99` ; `src/components/editor/extensions/Autocomplete.ts:77,80-85`
- `src/domain/entities/ResearchDocument.ts` (`linkedChapterIds`)
