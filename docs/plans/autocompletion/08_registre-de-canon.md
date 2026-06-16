# Plan 8 — Registre de canon (contexte factuel longue-portée pour l'autocomplétion)

> ✅ **Phases 1-6 implémentées** — Domaine, persistance, extraction LLM, injection contexte,
> instrumentation, prompt caching. Phase 7 (cockpit réfutabilité) en cours.
> Flag `CANON_CONTEXT_ENABLED = false` — mesurer avant d'activer.

## Context

L'autocomplétion actuelle (plan 4) est *manuscrit-premier* : elle voit le **chapitre en cours**
(queue ≤1500 c.) + l'intention auteur (research docs), mais reste **aveugle aux faits longue-portée**.
Exemple qui motive ce plan : un personnage **mort au ch. 10** peut être suggéré comme vivant au ch. 12,
parce que rien dans le contexte ne porte cet état. Sa limite est même écrite dans l'en-tête du plan 4.

On construit un **registre de canon** : des **faits atomiques** par personnage, avec **validité
temporelle** (« Léa — est morte — à partir du ch. 10 »), extraits du manuscrit, **éditables par
l'auteur** (réfutabilité), et **fraîcheur-trackés**. À la complétion, on injecte **seulement** les
faits des personnages présents dans la fenêtre du curseur et valides à la position courante — petit,
ciblé, cacheable.

**Décisions produit :** personnages seulement en v1 ; déploiement **derrière un flag + mesure**
(instrumentation plan 1) avant activation générale ; **prompt caching inclus**.

**Invariants binding (`philosophie.md`) :** l'IA suggère / l'auteur décide ; tout fait reste
**réfutable** ; un fait écrit par l'auteur l'emporte sur un fait dérivé ; ne jamais standardiser la voix.

## Architecture

**Collection dédiée `canonFacts` (un document par fait), PAS un blob de métadonnées.**
Champ `source: 'derived' | 'author'` : `replaceDerived` préserve les faits auteur lors de la
ré-extraction. Suit la chaîne `AutocompleteEvent` (plan 1).

## Phase 1 — Domaine ✅

- `src/domain/value-objects/CanonFactSource.ts` — `'derived' | 'author'` + guard
- `src/domain/value-objects/CanonFacts.ts` — sortie structurée LLM (`ExtractedCanonFact[]`)
- `src/domain/entities/CanonFact.ts` — entité avec ctor privé, `validate()`, `create()/reconstruct()`
  Champs : `id, ownerId, projectId, entity, statement, validFromChapter, validToChapter, source,
  sourceChapterId, contentHash, createdAt, updatedAt`
- `src/domain/interfaces/CanonFactRepository.ts` — `save/update/delete/listByProject/findForSelection/
  replaceDerived/deleteAllByOwner`
- Exports via `src/domain/index.ts`

## Phase 2 — Infrastructure (persistance) ✅

- `src/infrastructure/persistence/canon-fact-serializer.ts` — sérialisation ObjectId + dates
- `src/infrastructure/persistence/MongoDBCanonFactRepository.ts` — collection `canonFacts`,
  index `{ ownerId, projectId, entity }` et `{ ownerId, projectId, validFromChapter }`,
  `findForSelection` → filtre temporel `validFromChapter ≤ N ≤ validToChapter`
- `getCanonFactRepository()` dans `src/infrastructure/config/providers.ts`
- `getCanonFactRepo()` dans `src/app/actions/utils.ts`
- RGPD : `deleteAllByOwner` câblé dans `DeleteUserAccountUseCase` + `auth-actions.ts`

## Phase 3 — Extraction LLM ✅

- `docs/prompt/metadata/canon-facts.md` — prompt conservateur (faits établis uniquement)
- `LLMProvider.generateCanonFacts()` — implémenté sur Anthropic, OpenAI, Google + TrackedLLMProvider
- `AIOperationType` : `'canon_facts'` ajouté
- `src/application/use-cases/GenerateCanonFactsUseCase.ts` — cast list → fullText → hash →
  `generateCanonFacts` → `replaceDerived` (préserve `author`)
- Rate-limiter dédié `canGenerateCanonFacts` / `recordCanonFactsGeneration`

## Phase 4 — Sélection + injection contexte ✅

- `src/application/services/canonEntities.ts` — `detectEntities(text, knownNames)` regex Unicode
- `AutocompleteContextBuilder` — section `[CANON]` quand `includeCanon = true`,
  `getLastCanonFactsCount()` évite double-requête
- Route `stream` — résout l'index du chapitre, charge la cast, appelle `detectEntities`,
  passe `canonFactsCount` dans l'événement SSE `metadata`
- `src/lib/ai-feature-flags.ts` : `CANON_CONTEXT_ENABLED = false`

## Phase 5 — Instrumentation ✅

- `AutocompleteEvent.canonFactsCount: number | null` + sérialisation
- `autocompleteTelemetry.ts` / `Autocomplete.ts` — relaient `canonFactsCount` du SSE au payload
  lifecycle → route télémétrie → MongoDB
- Permet de comparer acceptation/suppression avec vs sans canon

## Phase 6 — Prompt caching ✅

- `AnthropicProvider.generateCompletionStream` — `system` en tableau de `TextBlockParam` :
  bloc stable `cache_control: { type: 'ephemeral' }` + bloc volatile sans cache
- OpenAI/Google : best-effort selon leur mécanisme

## Phase 7 — Cockpit (réfutabilité)

- `src/app/project/[projectId]/cockpit/canon/page.tsx` — liste faits groupés par personnage,
  ajouter / éditer / supprimer, bouton générer/régénérer + notice de fraîcheur
- `src/app/actions/canon-actions.ts` — `listCanonFactsAction`, `createCanonFactAction` (`source:'author'`),
  `updateCanonFactAction`, `deleteCanonFactAction`, `generateCanonFactsAction`, `checkCanonFreshnessAction`
- Les faits `source:'author'` survivent à la ré-extraction

## Success Criteria

### Automated
- [x] Unitaires : `CanonFactSource`, `CanonFacts`, entité `CanonFact`, `detectEntities`
- [x] Intégration repo : `findForSelection` (filtre temporel), `replaceDerived` préserve `author`,
  isolation `ownerId`, `deleteAllByOwner`
- [x] Providers : `generateCanonFacts` parse/valide la sortie
- [x] Route : `[CANON]` présent quand flag activé et entité locale matche ; absent sinon ;
  dégradation gracieuse si repo/cast manquant
- [x] RGPD : `deleteAllByOwner` dans la cascade
- [x] Prompt caching : bloc stable `cache_control` sur base prompt
- [ ] `npm run verify` (lint → tests → build) vert
- [ ] Cockpit : actions CRUD + génération

### Manual
- [ ] Écrire la mort d'un personnage au ch. 10 → générer le canon → au ch. 12, la suggestion
  respecte sa mort
- [ ] Éditer un fait dans le cockpit → régénérer → le fait auteur survit
- [ ] Modifier le manuscrit → cockpit signale les faits dérivés périmés
- [ ] Latence 1er token stable (`cachedInputTokens > 0` après le 1er appel)

## What we're NOT doing (v1)

- Pas de lieux/objets (personnages seulement) ; pas de résolution de coréférence
- `validToChapter` rempli principalement par l'auteur en v1
- Pas d'activation par défaut (flag off) ; pas d'embeddings/recherche sémantique
- Pas le harnais A/B complet du plan 7 (on prépare la mesure via `canonFactsCount`)
