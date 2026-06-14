# Plan d'implémentation — Phase 1 : Instrumentation de l'autocomplétion

> Découle de [docs/roadmap-autocompletion.md](../../roadmap-autocompletion.md) (chantier 1) et de
> [docs/strategie-autocompletion.md](../../strategie-autocompletion.md). Preuves codebase :
> [docs/research/autocompletion/2026-06-14_21-29-56_ia-manuscrit-premier-autocompletion.md](../../research/autocompletion/2026-06-14_21-29-56_ia-manuscrit-premier-autocompletion.md).
> Méthode : TDD (skill `tdd-cycle`). PR active : #102, branche `claude/confident-babbage-6kyh1z`.

## Overview

Mesurer le cycle de vie réel de chaque suggestion d'autocomplétion — latence perçue (1er token),
durée, longueur, et **issue** (acceptée / rejetée / supplantée par la frappe / vide), plus la
**suppression après insertion** — afin de disposer d'une base factuelle avant toute refonte
(prompt, policy providers, acceptation partielle, contexte dédié). **Aucun changement d'UX
d'écriture** : la télémétrie est *fire-and-forget* et ne doit jamais bloquer ni ralentir la frappe.

## Current State Analysis

- L'autocomplétion existe (extension TipTap `Tab`, streaming SSE) mais n'émet **aucune** télémétrie
  de valeur. Confirmé : `Autocomplete.ts` n'a aucun appel de tracking ; la route SSE ne fait que des
  `console.log` ; `TrackedLLMProvider`/`AIUsageRecord` ne mesurent que tokens/coût/durée **totale**
  (aucune latence 1er token, aucun signal d'acceptation).
- Points d'accroche client présents dans `src/components/editor/extensions/Autocomplete.ts` :
  déclenchement `triggerCompletion` (`:62`), 1er chunk SSE (`:187-189`), fin de stream (`:201`),
  acceptation 2ᵉ Tab (`:270-278`), Escape (`:290-306`). Le « supplanté par la frappe » n'a pas de
  hook (la frappe ne vide pas la suggestion aujourd'hui, `:323-372`).
- Câblage de l'extension : `src/components/editor/TextEditor.tsx:109-114` (`Autocomplete.configure`).
- Patterns réutilisables (entité → serializer → repo → composition-root → DI), à copier tels quels :
  `src/domain/entities/AIUsageRecord.ts`, `src/infrastructure/persistence/ai-usage-serializer.ts`,
  `src/infrastructure/persistence/MongoDBUsageRepository.ts:14,36-42`,
  `src/infrastructure/config/providers.ts:232-240`, `src/app/actions/utils.ts:201`.
- Multi-tenant : **tous** les repos filtrent par `ownerId` ; RGPD via `deleteAllByOwner`.

## Desired End State

Quand l'auteur utilise l'autocomplétion, un document est écrit dans une nouvelle collection
MongoDB `autocompleteEvents` (un par suggestion), avec une éventuelle mise à jour différée si le
texte inséré est retiré sous 30 s. Vérifiable : provoquer des suggestions (accepter / rejeter /
ignorer) fait apparaître les lignes correspondantes ; la latence 1er token y est plausible ; aucune
latence perceptible n'est ajoutée à la frappe ; `npm run verify` passe.

### Key Discoveries

- `AIUsageRecord` : constructeur privé + validations + `static create`/`reconstruct` + getters
  (`src/domain/entities/AIUsageRecord.ts:35-106`) — modèle de l'entité.
- Serializer `_id: ObjectId` + dates (`ai-usage-serializer.ts:23-59`).
- Repo Mongo : `db.collection('aiUsage')`, `save`=`insertOne`, filtre `userId`
  (`MongoDBUsageRepository.ts:14,36-42`).
- Getter singleton (`providers.ts:234-240`) + DI (`utils.ts:201`).
- L'extension expose déjà `projectId` et `chapterId` en storage (`Autocomplete.ts:34-40,238-239`).

## What We're NOT Doing

- Pas de **dashboard UI** ni d'**expérimentation A/B** (chantier 12).
- Pas de changement de **prompt**, de **policy providers**, d'**acceptation partielle**, de
  **contexte dédié**, ni de **déclassement** de la génération (chantiers 2-8).
- Pas de **latence 1er token côté serveur** (décision : client seul en Phase 1).
- Pas de modification du comportement visible de l'autocomplétion (ghost text, Tab, Escape).

## Implementation Approach

Construire du domaine vers l'UI : entité + repo d'abord (testables en isolation), puis transport,
puis émission client via un **tracker pur** (machine à états sans dépendance TipTap, donc unitaire),
relié à l'extension par une option callback. L'UI (`TextEditor.tsx`) ne contient aucune logique :
elle injecte une fonction d'envoi importée d'une lib client.

**Modèle de données — 1 enregistrement par suggestion.** Le cycle est court et entièrement
client-side ; on persiste **une fois** au moment terminal (accepted_full / rejected_escape /
superseded_typing / empty), en embarquant `firstTokenMs`, `totalMs`, longueurs et `outcome`. Seule
la **suppression-après-insertion** (suggestions acceptées) envoie un second message différé qui
patche le même `suggestionId`.

---

## Phase A — Domaine

### A.1 Value object `AutocompleteOutcome`

**File** : `src/domain/value-objects/AutocompleteOutcome.ts` (nouveau ; modèle `AIOperationType.ts`)

```typescript
// ABOUTME: Issue terminale d'une suggestion d'autocomplétion (pour l'instrumentation).
// ABOUTME: accepted_full | rejected_escape | superseded_typing | empty.
export const AUTOCOMPLETE_OUTCOMES = [
  'accepted_full',
  'rejected_escape',
  'superseded_typing',
  'empty',
] as const;
export type AutocompleteOutcome = (typeof AUTOCOMPLETE_OUTCOMES)[number];
export function isValidAutocompleteOutcome(v: string): v is AutocompleteOutcome {
  return (AUTOCOMPLETE_OUTCOMES as readonly string[]).includes(v);
}
```

### A.2 Entité `AutocompleteEvent`

**File** : `src/domain/entities/AutocompleteEvent.ts` (nouveau ; modèle `AIUsageRecord.ts`)

Propriétés : `id, ownerId, projectId, chapterId: string | null, suggestionId, providerType: string | null,
model: string | null, triggeredAt: Date, firstTokenMs: number | null, totalMs: number,
suggestionLengthChars: number, suggestionLengthWords: number, outcome: AutocompleteOutcome,
deletedAfterMs: number | null, createdAt: Date`.

- Constructeur privé + `validate*` (non-négatifs : `firstTokenMs`, `totalMs`, longueurs, `deletedAfterMs` ;
  `suggestionId` non vide ; `outcome` valide). `firstTokenMs` doit être `null` si `outcome === 'empty'`.
- `static create(...)` (génère `createdAt = new Date()`), `static reconstruct(props)`, getters.

### A.3 Interface repository

**File** : `src/domain/interfaces/AutocompleteEventRepository.ts` (nouveau)

```typescript
export interface AutocompleteStats {
  total: number;
  byOutcome: Record<AutocompleteOutcome, number>;
  acceptanceRate: number;        // accepted_full / total
  postInsertionDeletionRate: number; // accepted puis supprimés / accepted
  firstTokenMsP50: number | null;
  firstTokenMsP95: number | null;
  totalMsP50: number | null;
}
export interface AutocompleteEventRepository {
  save(event: AutocompleteEvent): Promise<AutocompleteEvent>;
  markDeletedAfterInsert(ownerId: string, suggestionId: string, deletedAfterMs: number): Promise<void>;
  getStatsByProject(ownerId: string, projectId: string, options?: { startDate?: Date; endDate?: Date }): Promise<AutocompleteStats>;
  deleteAllByOwner(ownerId: string): Promise<void>;
}
```

Exporter le tout via `src/domain/index.ts` (suivre le bloc existant, ex. `:100`).

### Success Criteria — Phase A

#### Automated
- [ ] `npm run typecheck` passe.
- [ ] Tests unitaires entité + value object passent (`AutocompleteEvent.test.ts`, `AutocompleteOutcome.test.ts`).
- [ ] `npm run lint` sans erreur (en-têtes ABOUTME présents — hook `check-edit`).

#### Manual
- [ ] Revue : champs/validations cohérents avec la stratégie (longueurs ≥ 0, `empty` ⇒ `firstTokenMs` null).

---

## Phase B — Infrastructure (persistance)

### B.1 Serializer

**File** : `src/infrastructure/persistence/autocomplete-event-serializer.ts` (modèle `ai-usage-serializer.ts`)
`_id: ObjectId(record.getId())`, champ `suggestionId` indexable, dates `Date`, `serialize`/`deserialize`.

### B.2 Repository Mongo

**File** : `src/infrastructure/persistence/MongoDBAutocompleteEventRepository.ts`
(modèle `MongoDBUsageRepository.ts`)

- `const COLLECTION_NAME = 'autocompleteEvents';`
- `save` → `insertOne(serialize(event))`.
- `markDeletedAfterInsert(ownerId, suggestionId, deletedAfterMs)` →
  `updateOne({ ownerId, suggestionId }, { $set: { deletedAfterMs } })`.
- `getStatsByProject` → agrégation `$match {ownerId, projectId, (createdAt range)}` puis `$group`
  comptant par `outcome` et calculant percentiles via l'accumulateur `$percentile`
  (MongoDB 7 — driver `mongodb ^7.0.0`, cf. `package.json:81`) ; assembler `AutocompleteStats`.
- `deleteAllByOwner(ownerId)` → `deleteMany({ ownerId })`.
- `ensureIndexes()` : `{ ownerId, projectId, createdAt }` et `{ ownerId, suggestionId }` (unique).

### B.3 Composition root + DI

- `src/infrastructure/config/providers.ts` : ajouter `getAutocompleteEventRepository()` (singleton +
  `ensureIndexes()`), sur le modèle `getAIUsageRepository` (`:232-240`).
- `src/app/actions/utils.ts` : ajouter `getAutocompleteEventRepo()` (modèle `:201`).

### Success Criteria — Phase B

#### Automated
- [ ] `npm run typecheck` + `npm run lint` passent.
- [ ] Test d'intégration repo (`MongoDBAutocompleteEventRepository.integration.test.ts`, modèle
  `MongoDBExchangeRepository.integration.test.ts`) passe via `npm run test:integration:db` :
  `save` + relecture, `markDeletedAfterInsert`, `getStatsByProject` (taux + percentiles),
  **isolation `ownerId`** (un owner ne voit pas les events d'un autre), `deleteAllByOwner`.

#### Manual
- [ ] Inspecter la collection `autocompleteEvents` après un test : un doc par suggestion, index créés.

---

## Phase C — Transport (endpoint télémétrie)

### C.1 Route

**File** : `src/app/api/completion/telemetry/route.ts` (auth identique à `completion/stream/route.ts:24-31`)

- `runtime = 'nodejs'`, `POST`. Auth via `auth()` → 401 si pas de session ; `ownerId = session.user.id`.
- Body discriminé :
  - `{ type: 'lifecycle', suggestionId, projectId, chapterId?, triggeredAtIso, firstTokenMs|null,
    totalMs, lengthChars, lengthWords, outcome }` → valider (`isValidAutocompleteOutcome`),
    résoudre best-effort `providerType`/`model` du projet (comme `stream/route.ts:52-65`, nullable
    si absent), `AutocompleteEvent.create(...)`, `repo.save(...)`.
  - `{ type: 'deletion', suggestionId, deletedAfterMs }` → `repo.markDeletedAfterInsert(ownerId, ...)`.
- Répondre `204 No Content`. Toute erreur de persistance est **avalée** (log serveur, jamais propagée
  au client) — la télémétrie ne doit jamais perturber l'éditeur.

### Success Criteria — Phase C

#### Automated
- [ ] Test de route (`telemetry/route.test.ts`) : lifecycle → 204 + `repo.save` appelé avec les bons
  champs ; deletion → 204 + `markDeletedAfterInsert` ; non authentifié → 401 ; outcome invalide → 400.
- [ ] `npm run typecheck` + `npm run lint`.

#### Manual
- [ ] `curl` authentifié (cookie session) sur la route : 204 et doc écrit.

---

## Phase D — Client (tracker pur + émission, zéro changement d'UX)

### D.1 Tracker pur (testable, sans TipTap)

**File** : `src/components/editor/extensions/autocompleteTelemetry.ts`

`class AutocompleteLifecycleTracker` avec horloge injectable (`now: () => number`, défaut `Date.now`) :
- `start(): string` — génère `suggestionId` (`crypto.randomUUID()`), `triggeredAt`, `t0`.
- `markFirstToken()` — fixe `firstTokenMs = now - t0` (idempotent).
- `finishEmpty(): LifecyclePayload` — `outcome='empty'`, `firstTokenMs=null`, longueurs 0, terminal.
- `markShown(text)` — mémorise longueurs (chars + mots) ; non terminal.
- `accept(): LifecyclePayload` — `outcome='accepted_full'`, `totalMs`, terminal ; le suggestionId
  reste disponible pour la surveillance de suppression.
- `reject(): LifecyclePayload | null` / `supersede(): LifecyclePayload | null` — terminal si une
  suggestion est active, sinon `null`.
- Type `LifecyclePayload` = corps `type:'lifecycle'` attendu par la route C.

Aucun effet de bord réseau ici → tests unitaires purs (horloge factice).

### D.2 Émission réseau (non bloquante)

**File** : `src/lib/autocompleteTelemetryClient.ts`
`sendAutocompleteEvent(payload)` : `navigator.sendBeacon(url, Blob(JSON))` ; fallback
`fetch(url, { method:'POST', body, keepalive:true })`. Jamais `await` sur le chemin de frappe ;
toute erreur silencieuse.

### D.3 Câblage dans l'extension

**File** : `src/components/editor/extensions/Autocomplete.ts`
- Options : ajouter `telemetryEnabled?: boolean` et `onEvent?: (p: LifecyclePayload | DeletionPayload) => void`.
- Storage : ajouter `tracker: AutocompleteLifecycleTracker | null` et de quoi surveiller la suppression
  (texte inséré + position).
- `triggerCompletion` (`:62`) → `tracker.start()`.
- `streamCompletion` 1er chunk (`:187-189`) → `markFirstToken()` ; fin (`:201`) → si `accumulated`
  vide ⇒ `finishEmpty()` + `onEvent` ; sinon `markShown(accumulated)`.
- Tab accept (`:270-278`) → `onEvent(accept())` ; **planifier** la surveillance de suppression
  (timer 30 s ; au déclenchement, comparer le texte inséré à la position : s'il a disparu, envoyer
  `{type:'deletion', suggestionId, deletedAfterMs}`). Heuristique best-effort, documentée.
- Escape (`:290-306`) → `onEvent(reject())`.
- Supplantation : dans `addProseMirrorPlugins` `apply` (`:323`), si `tr.docChanged` **et** suggestion
  active **et** ce n'est pas l'insertion d'acceptation (drapeau posé avant `insertContent`) ⇒
  `onEvent(supersede())`. **Ne pas modifier** la logique de décoration (pas de changement visuel).

**File** : `src/components/editor/TextEditor.tsx` (`:109-114`) — passer
`telemetryEnabled` et `onEvent: sendAutocompleteEvent` (import depuis D.2). Le composant reste sans
logique métier.

### Success Criteria — Phase D

#### Automated
- [ ] Tests unitaires du tracker (`autocompleteTelemetry.test.ts`) : transitions
  trigger→firstToken→shown→accept/reject/supersede/empty produisent les bons `firstTokenMs`/`totalMs`/
  `outcome`/longueurs (horloge factice).
- [ ] Test : `triggerCompletion` fonctionne quand `onEvent` est `undefined` (non-régression).
- [ ] `npm run typecheck` + `npm run lint`.

#### Manual
- [ ] Dans l'éditeur : taper, `Tab`, accepter → 1 ligne `accepted_full` (firstTokenMs plausible).
- [ ] `Tab` puis `Escape` → `rejected_escape` ; `Tab` puis continuer à taper → `superseded_typing`.
- [ ] Accepter puis supprimer le texte sous 30 s → la ligne reçoit `deletedAfterMs`.
- [ ] Aucune latence/à-coups perceptible à la frappe (sendBeacon non bloquant).

---

## Phase E — RGPD + vérification globale

- **RGPD** : injecter `getAutocompleteEventRepo()` dans `DeleteUserAccountUseCase` (dépendance
  optionnelle, modèle `aiUsageRepository?` `DeleteUserAccountUseCase.ts:58,95`) et appeler
  `deleteAllByOwner(userId)` dans la cascade. Câbler l'action `user-actions.ts`.
- **Tests** : étendre `DeleteUserAccountUseCase.test.ts` pour vérifier l'appel `deleteAllByOwner`.

### Success Criteria — Phase E

#### Automated
- [ ] `npm run verify` (lint → tests → build) passe.
- [ ] Test cascade RGPD : suppression de compte appelle `deleteAllByOwner` du nouveau repo.

#### Manual
- [ ] Supprimer un compte de test → aucun event résiduel pour cet `ownerId`.

---

## Testing Strategy

### Unit
- Entité `AutocompleteEvent` (validations, `empty` ⇒ `firstTokenMs` null), VO `AutocompleteOutcome`.
- Tracker pur : toutes les transitions + timings via horloge factice.

### Integration (DB requise — `npm run test:integration:db`)
- `MongoDBAutocompleteEventRepository` : save/relecture, `markDeletedAfterInsert`, `getStatsByProject`
  (taux + percentiles), **isolation `ownerId`**, `deleteAllByOwner`. Pas de mocks (vraie DB).
- Route télémétrie : lifecycle/deletion/401/400.

### Manual
1. Provoquer accept / reject / supersede / empty → vérifier les `outcome` en base.
2. Accepter puis supprimer < 30 s → `deletedAfterMs` renseigné.
3. Vérifier l'absence de latence perçue (frappe fluide, sendBeacon).

## Performance Considerations

- Chemin de frappe : aucune opération synchrone réseau ; `sendBeacon` (ou `fetch keepalive`) hors
  chemin critique. Un seul envoi par suggestion (+ au plus un envoi de suppression différé).
- Index `{ownerId, projectId, createdAt}` pour les agrégations ; `{ownerId, suggestionId}` unique pour
  le patch de suppression.

## Migration Notes

Aucune migration : nouvelle collection `autocompleteEvents`, créée à la volée + `ensureIndexes()`.
Aucune donnée existante touchée ; `AIUsageRecord`/`aiUsage` inchangés.

## References

- Entité modèle : `src/domain/entities/AIUsageRecord.ts:35-162`
- Serializer modèle : `src/infrastructure/persistence/ai-usage-serializer.ts:23-59`
- Repo Mongo modèle : `src/infrastructure/persistence/MongoDBUsageRepository.ts:14,36-42`
- Composition root : `src/infrastructure/config/providers.ts:232-240`
- DI : `src/app/actions/utils.ts:201`
- Extension à instrumenter : `src/components/editor/extensions/Autocomplete.ts:62,187-189,201,270-278,290-306,323`
- Câblage extension : `src/components/editor/TextEditor.tsx:109-114`
- Route SSE modèle (auth/provider) : `src/app/api/completion/stream/route.ts:24-31,52-65`
- RGPD cascade : `src/application/use-cases/DeleteUserAccountUseCase.ts:58,95`
- Recherche fondatrice : `docs/research/autocompletion/2026-06-14_21-29-56_ia-manuscrit-premier-autocompletion.md`
