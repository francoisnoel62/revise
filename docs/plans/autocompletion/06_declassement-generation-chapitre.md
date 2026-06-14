# Plan 6 — Déclassement de la génération de chapitre (chantier 7)

> Série : [00_index.md](00_index.md). **Déclasser, pas supprimer.** Mesurer l'usage réel avant toute
> suppression. Méthode : TDD.

## Overview

Sortir la génération longue (début / chapitre complet / plan) du **flux principal** d'écriture et la
ranger derrière « expérimental », tout en conservant routes et use cases. Préalable obligatoire :
**découpler le rate-limit** de la génération de chapitre de celui des métadonnées.

## Current State Analysis

- **Couplage rate-limit** : la génération emprunte le limiter des métadonnées via une clé
  `chapter-${type}` — `chapter-generation-actions.ts:57-68` → `canGenerateMetadata` /
  `recordMetadataGeneration` (même `Map`, cooldown 30 s, `rate-limiter.ts:67-127`).
- **Télémétrie déjà distincte** : opération `chapter_generation` dans `AIOperationType` +
  `AIUsageRecord`/`MongoDBUsageRepository` → c'est elle (pas le compteur en mémoire) qui mesure l'usage réel.
- **Proéminence UI** : carte `FloatingGenerationMenu.tsx:63-95` (3 boutons) ; menu
  `AIMenuDropdown.tsx:89-105,171-195` ; palette `CommandPalette.tsx:135-164`.

## Desired End State

La génération longue n'apparaît plus dans le flux principal (éditeur) ; elle reste accessible derrière
un drapeau « expérimental » (réglage/section dédiée). Le rate-limit du chapitre est indépendant. La
décision de supprimer/garder se prend plus tard sur la télémétrie `chapter_generation`.

## What We're NOT Doing
- Pas de suppression des routes/use cases (`GenerateChapterUseCase`, `chapter-generation-actions.ts`).
- Pas de changement des prompts de génération (conservés, simplement déclassés).

## Phase 6.1 — Préalable : découpler le rate-limit

**File** : `src/app/actions/rate-limiter.ts`
- Ajouter `canGenerateChapter(userId, type)` / `recordChapterGeneration(userId, type)` (propre `Map`
  + cooldown dédié), **ou** un limiter générique paramétré par namespace + cooldown.
- **File** : `chapter-generation-actions.ts:57-68` → utiliser le nouveau limiter au lieu de
  `canGenerateMetadata`/`recordMetadataGeneration`.
- Test TDD : « générer un chapitre n'affecte pas le cooldown d'une analyse de métadonnée » (et vice
  versa) — invariant explicite.

## Phase 6.2 — Retirer du flux principal, garder « expérimental »

- `FloatingGenerationMenu.tsx` : ne plus l'afficher par défaut sur chapitre vide ; conditionner à un
  drapeau « fonctionnalités expérimentales » (réglage projet/utilisateur).
- `AIMenuDropdown.tsx` / `CommandPalette.tsx` : déplacer les 3 entrées de génération sous une section
  « Expérimental » (ou les masquer derrière le même drapeau).
- Transformer l'entrée « début de chapitre » en **« continuer depuis le curseur »** qui déclenche
  l'autocomplétion (réutilise `Tab`/plan 3), plutôt qu'une génération de bloc.
- Conserver l'accès aux 3 types pour les utilisateurs ayant activé l'expérimental.

## Phase 6.3 — Mesure d'usage

- S'appuyer sur la télémétrie existante `chapter_generation` (`MongoDBUsageRepository`) pour suivre
  l'usage réel après déclassement ; aucune nouvelle métrique requise.

## Success Criteria

### Automated
- [ ] Test rate-limit : indépendance chapitre ↔ métadonnées.
- [ ] Tests UI : sans drapeau expérimental, aucune entrée de génération longue dans
  `FloatingGenerationMenu`/`AIMenuDropdown`/`CommandPalette` ; avec drapeau, elles réapparaissent.
- [ ] `npm run verify` vert (non-régression des routes/use cases conservés).

### Manual
- [ ] Flux d'écriture par défaut : aucune génération de bloc proposée ; « continuer depuis le curseur »
  déclenche l'autocomplétion.
- [ ] Mode expérimental activé : génération toujours fonctionnelle.

## References
- `src/app/actions/chapter-generation-actions.ts:57-68` ; `src/app/actions/rate-limiter.ts:67-127`
- `src/components/editor/FloatingGenerationMenu.tsx:63-95` ; `src/components/editor/AIMenuDropdown.tsx:89-105,171-195` ; `src/components/editor/CommandPalette.tsx:135-164`
- Télémétrie : `src/domain/value-objects/AIOperationType.ts` (`chapter_generation`), `MongoDBUsageRepository`
