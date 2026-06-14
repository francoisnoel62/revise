# Plan 2 — Contrat de prompt + policy providers basse latence (chantiers 2 & 3)

> Série : [00_index.md](00_index.md). Prérequis conseillé : plan 1 (instrumentation) déployé pour
> mesurer l'effet (latence 1er token, taux d'acceptation) avant/après. Méthode : TDD.

## Overview

Deux leviers de **qualité** de la suggestion, complémentaires : (2) un **contrat de prompt** strict
qui demande la suite minimale nécessaire et interdit les dérives ; (3) une **policy providers**
harmonisée, basse latence et à sortie stricte, corrigeant l'héritage *reasoning* d'OpenAI.

## Current State Analysis

- Prompt actuel généraliste : `docs/prompt/autocompletion.md` — « 1 à 3 phrases », cite encore
  `[MÉTADONNÉES]` (`:16`), pas d'interdits explicites (exposer/résumer/résoudre/POV).
- Providers incohérents pour la complétion :
  - Anthropic : `thinkingBudget: 0`, `max_tokens: 256` (cohérent) — `AnthropicProvider.generateCompletionStream`.
  - Google : `thinkingLevel: MINIMAL`, `maxOutputTokens: 256`, `temperature: 0.7` (cohérent) — `GoogleProvider.generateCompletionStream`.
  - OpenAI : `getTokenLimitParam()` gonfle le budget à `max(256*3, 16000)` pour les modèles de
    raisonnement (`OpenAIProvider.getTokenLimitParam`, ~`:233-241`) → latence/coût élevés sur la complétion.
- Température complétion ≈ 0.7 partout (trop haute pour coller au geste).

## Desired End State

Un prompt opérationnel strict (sans `[MÉTADONNÉES]`), et une **policy centrale** `completion` qui
impose : pas de raisonnement, sortie ≤ budget strict, température basse, latence prioritaire — pilotée
au même endroit pour les 3 providers. Vérifiable par tests contractuels de prompt + tests de policy +
amélioration mesurée de la latence 1er token (plan 1).

### Key Discoveries
- Les providers consomment déjà un `projectContext` prêt à injecter (Phase 8.0) → on peut piloter les
  paramètres sans toucher la projection.
- `AIOperationType` distingue `completion` — utilisable comme clé de policy.

## What We're NOT Doing
- Pas d'acceptation partielle (plan 3), pas de variantes (plan 5), pas de contexte dédié (plan 4).
- Pas de refonte de l'abstraction provider au-delà des paramètres de complétion.

## Phase 2.1 — Réécrire le contrat de prompt

**File** : `docs/prompt/autocompletion.md` (réécriture)
- Demander **la suite minimale nécessaire** (pas une suite « créative ») ; adapter la forme au
  contexte (mot, fin de phrase, réplique, paragraphe court).
- **Interdits** : exposer, résumer, résoudre la scène, introduire du canon, changer de point de vue,
  forcer une belle phrase.
- **Toujours proposer** une suite (pas de retour vide — cf. décision produit).
- Retirer toute mention `[MÉTADONNÉES]`.
- Conserver : même voix, même langue (FR→FR/EN→EN), texte brut sans guillemets.

**Tests contractuels** : `docs/prompt/__tests__/autocompletion-prompt.test.ts` (nouveau) chargeant le
prompt via `FilePromptRepository` et asserttant la présence/absence de clauses clés (pas de
`[MÉTADONNÉES]`, présence des interdits, « suite minimale »).

## Phase 2.2 — Policy de complétion centrale

**File** : `src/domain/value-objects/AIOperationPolicy.ts` (nouveau)
```typescript
export interface AIOperationPolicy {
  operation: 'autocomplete';
  reasoning: 'off';
  outputBudgetTokens: number;   // ex. 256
  temperature: number;          // ex. 0.3 (basse, continuité)
  latencyClass: 'realtime';
}
export const AUTOCOMPLETE_POLICY: AIOperationPolicy = {
  operation: 'autocomplete', reasoning: 'off', outputBudgetTokens: 256,
  temperature: 0.3, latencyClass: 'realtime',
};
```

**Application dans les 3 providers** (`generateCompletion` + `generateCompletionStream`) :
- **OpenAI** : pour la complétion, **ne pas** passer par `getTokenLimitParam` reasoning ; forcer
  `max_tokens = policy.outputBudgetTokens`, `temperature = policy.temperature`, et désactiver le
  raisonnement (modèle de complétion standard ; si modèle reasoning sélectionné, plafonner
  explicitement). Fichier `OpenAIProvider.ts`.
- **Anthropic** : conserver `thinkingBudget: 0` ; aligner `max_tokens`/`temperature` sur la policy.
- **Google** : conserver `thinkingLevel: MINIMAL` ; aligner `maxOutputTokens`/`temperature`.

## Success Criteria

### Automated
- [ ] Tests contractuels de prompt passent (clauses présentes/absentes).
- [ ] Tests providers : la complétion utilise `temperature` policy + budget strict ; OpenAI
  n'applique plus le multiplicateur reasoning sur la complétion (test sur les params passés au client mocké).
- [ ] `npm run verify` vert.

### Manual
- [ ] Suggestions plus « collées au geste » (moins génériques) sur un manuscrit réel.
- [ ] Latence 1er token (plan 1) en baisse sur OpenAI reasoning ; p50/p95 comparés avant/après.

## References
- `docs/prompt/autocompletion.md:16` ; `src/infrastructure/ai/OpenAIProvider.ts` (`getTokenLimitParam` ~233-241, `generateCompletion`/`generateCompletionStream`)
- `src/infrastructure/ai/AnthropicProvider.ts` (`generateCompletionStream`, thinkingBudget 0)
- `src/infrastructure/ai/GoogleProvider.ts` (`generateCompletionStream`, ThinkingLevel.MINIMAL)
- `src/domain/value-objects/AIOperationType.ts` (clé `completion`)
