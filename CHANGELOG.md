# Changelog

All notable changes to the Revise project are documented in this file.

For current features and roadmap, see [README.md](README.md).

> **Note sur le format** : les entrées ci-dessous datent les changements par mois calendaire plutôt
> que par numéro de "Phase". L'ancienne numérotation (visible plus bas dans ce fichier) s'est révélée
> peu fiable pour reconstituer l'historique réel — elle est conservée telle quelle pour les entrées
> historiques, mais n'est plus utilisée pour les nouvelles entrées.

---

## Tarifs IA — validation des variations depuis l'email (octobre 2026)

L'email quotidien de synchronisation des tarifs comporte désormais un bouton **Valider les
variations** quand des écarts supérieurs à 50 % ont été mis en quarantaine par la synchronisation.

- Le bouton mène à `/admin/pricing`, où un panneau « variations à valider » liste chaque écart
  (ancien → nouveau prix, % de variation) avec **Appliquer** par modèle et **Tout appliquer**
- Les variations sont recalculées à l'ouverture de la page depuis les prix OpenRouter actuels
  (`ReviewPricingVariationsUseCase`) ; rien de plus n'est persisté
- `PricingSyncReport.pendingVariations` expose la quarantaine sous forme structurée ; la règle de
  seuil est partagée entre la synchronisation et la validation (`pricing-variation.ts`)
- `/admin/pricing` redirige désormais vers la connexion avec `callbackUrl`, pour revenir sur la page
  après authentification depuis le lien de l'email

---

## Historique de versions — snapshots de projet (25–29 juillet 2026)

Filet de sécurité pour revenir sur une version antérieure d'un projet, avec verrouillage optimiste
et une politique de rétention automatique.

### Domain Layer
- **`Snapshot` entity** - capture immuable : numéro séquentiel jamais réutilisé, copie complète des
  chapitres, métadonnées éditoriales capturées (titre, genre, synopsis, POV, temps, ISBN,
  contributeurs, œuvres liées), type (`manual`/`automatic`/`restore`/`safety`) ; modèle "tombstone"
  (`tombstone()` efface le contenu restaurable mais garde une entrée d'audit)
- **`SnapshotType`, `AutomaticSnapshotInterval`** value objects - 4 types de snapshot ; intervalles
  automatiques autorisés : 5/15/30/60 minutes
- **`AutomaticSnapshotRetention`** - le seul *domain service* du code : politique de purge pure
  (20 derniers snapshots automatiques, puis 1/jour sur 30 jours, 1/semaine sur 6 mois, awareness
  fuseau horaire)
- **`SnapshotRepository`** - numérotation séquentielle, historique paginé, mises à jour de métadonnées
  de présentation, tombstoning, journal d'activité (`SnapshotActivity`) couvrant création/restauration/
  renommage/commentaire/reconfiguration d'automatisation/suppression/purge automatique
- **`AutomaticSnapshotRepository`** - horloge de planification côté serveur : `configure` (intervalle),
  `recordSavedChange`, `heartbeat` (sessions d'édition ouvertes), `claimDueSnapshot`/`completeSnapshot`/
  `releaseFailedSnapshot` (verrouillage distribué par capture)

### Application Layer
- **`CreateSnapshotUseCase`** - création manuelle (numéro séquentiel, capture chapitres + métadonnées
  éditoriales), journalise une activité best-effort
- **`ProcessAutomaticSnapshotUseCase`** - heartbeat de session, capture au plus un snapshot dû par
  intervalle, vérifie qu'une session est encore ouverte avant de committer, purge via
  `AutomaticSnapshotRetention`
- **`ListSnapshotsUseCase`** - historique paginé + indicateur de changements non capturés
- **`LoadSnapshotComparisonUseCase`** - charge un snapshot passé et un état courant cohérent (relecture
  triple pour détecter une course de lecture, pas de transaction multi-documents Mongo)
- **`RestoreSnapshotUseCase`** - verrouillage optimiste (`expectedProjectUpdatedAt`), snapshot de
  sécurité automatique de l'état non sauvegardé avant restauration, compare-and-swap atomique du
  projet, compensation best-effort en cas d'échec post-écriture
- **`GovernSnapshotHistoryUseCase`** - édition de métadonnées (renommer/commenter) gated par rôle
  (`owner`/`editor`/`reader` — base posée pour une future collaboration multi-auteur), suppression en
  tombstone auditée et irréversible

### Infrastructure Layer
- **`MongoDBSnapshotRepository`, `MongoDBAutomaticSnapshotRepository`** - persistance MongoDB

### Interface Layer
- **`SnapshotHistoryDialog`** - créer/consulter/éditer/supprimer/restaurer, déclenché depuis l'éditeur
- **`SnapshotComparisonDialog`** - diff structure puis texte/bloc entre un snapshot et l'état courant
- **`snapshot-actions.ts`** - server actions (création, liste/métadonnées, suppression, restauration)

> Distinct de `CorrectionHistory` (historique des propositions de réécriture IA par chapitre), qui
> existe séparément depuis Phase 3.7.

---

## Notes de bas de page — endnotes (24–29 juillet 2026)

### Interface / Éditeur
- **`EndnoteRef`** (extension TipTap) - nœud d'appel de note + modale d'insertion (`EndnoteModal`,
  mini-éditeur TipTap gras/italique/lien)
- **Bulle de lecture** - affichage au survol dans l'aperçu de chapitre ; la note épinglée l'emporte sur
  le survol
- **`EndnotesPanel`** - panneau "Liste des notes" en lecture seule puis éditable : liste par chapitre,
  numérotée comme à l'export, édition/suppression, action possible sur un chapitre non ouvert
  (`useEndnoteLocator`)
- **Verrouillage de la parité JSON/PMNode** + index de notes par chapitre

### Application / Infrastructure
- **`endnoteCompilation.ts`** (`extractChapterEndnotes`, `buildEndnoteCompilation`,
  `endnoteCallId`/`endnoteNoteId`) - source unique de numérotation, partagée par l'aperçu paginé et les
  deux formats d'export
- **Export PDF** - compilation des notes en section de fin d'ouvrage (back-matter)
- **Export DOCX** - rendu en vraies notes de bas de page Word natives
- **`ProjectSettings.endnotesTitle`** - titre des notes personnalisable (« Notes » par défaut)

---

## Refonte éditoriale — modèle sémantique, profils de publication & pagination (24 mai – 19 juillet 2026)

Le chantier le plus volumineux de la période : le contenu passe d'un modèle figé à un modèle
sémantique découplé de sa présentation, avec un moteur de pagination livre unifié. Décision documentée
dans [ADR 0005](docs/adr/0005-editeur-apercu-fidele-moteur-pagine-unique.md).

### Domain Layer
- **`SemanticRole`** - rôles de bloc de contenu (`corps`, `titre-de-chapitre`, `sous-titre`,
  `citation`, `epigraphe`, `separateur-de-scene`) découplés du style visuel
- **`PublicationProfile`** - préréglages d'impression immuables : `kdp-6x9`, `a5`, `passerelle`
  (non paginé) ; `fromId()` retombe sur `kdp-6x9` pour un id inconnu/retiré
- **`LevelStyleSet`** - typographie par rôle sémantique et par profil (taille/graisse/italique/
  alignement/interligne), avec bornage et validation
- **`TocPreferences`** - profondeur (chapitres seuls / chapitres + sous-titres) et style
  (classique/épuré/littéraire) de la table des matières
- **`PresentationOverride`** - couche de surcharges (police/taille/alignement) réservée au profil
  `passerelle`, distincte du contenu sémantique
- **`BookPreviewCacheEntry`** - cache des métriques d'un aperçu PDF livre entier (offsets de page par
  chapitre/sous-titre), invalidé par empreinte de contenu
- **`CustomAnnex`** - annexe personnalisée avant/arrière-texte (titre + contenu TipTap), avec ordre
  d'affichage

### Application Layer
- **`ContentMigrator` / `ContentDemigrator`** - migration (réversible) du contenu legacy vers le modèle
  sémantique ; signale les cas ambigus (ex. texte centré) pour relecture manuelle
- **`RemovedPublicationProfileMigration`** - redirige automatiquement les 3 anciens profils KDP retirés
  (`kdp-5x8`, `kdp-5_25x8`, `kdp-5_5x8_5`) vers `kdp-6x9`
- **`ChapterTitleHeadingMigration`** - garantit un H1 `titre-de-chapitre` sur chaque chapitre existant
- **`WholeBookHtmlAssembler`** - assemble le HTML du livre entier, applique le dépouillement des
  surcharges de présentation, construit la compilation des notes
- **`BookPreviewCacheComputer`** - pilote un navigateur headless (Paged.js) pour paginer le HTML
  assemblé, extrait les métriques de page (timeout 120s)
- **`BookOffsetCalculator`** - calcule la première page arabe de chaque chapitre (respecte les sauts de
  page impaire)
- **`PresentationOverrideService`** - `applyOverrides`/`stripToSemantic`/`extractOverrides`, invariant
  testé du cycle apply → strip → re-apply

### Infrastructure Layer
- **`PagedPdfExporter`** (headless Chromium + Paged.js, via `PlaywrightBrowserLauncher` +
  `PagedJsRenderer`) **remplace `PdfExporter`** (pdf-lib) comme moteur d'export PDF de production.
  `PdfExporter` reste dans le code mais n'est plus câblé nulle part (code mort, uniquement référencé
  par son propre test).
- **`document/paged/`** - sous-système de rendu (`TipTapToBookHtml`, `BookCssBuilder`,
  `TocHtmlBuilder`, `FrontMatterHtmlBuilder`, `BackMatterHtmlBuilder`, `EndnotesHtmlBuilder`,
  espacement français, etc.)
- **`MongoDBBookPreviewCacheRepository`** - cache GridFS du PDF livre entier
- **`MongoDBCustomAnnexRepository`, `MongoDBPresentationOverrideRepository`** - persistance MongoDB
- **DOCX** - presets de style + support "front matter" pour le format KDP (24 mai – 1 juin 2026)

### Interface Layer
- **`/book-preview`** - aperçu lecture seule du livre entier (PDF généré et mis en cache côté serveur,
  affiché dans une iframe), sélecteur de profil, navigation par ancre `#page=N`
- **`PublicationPreview`, `PublicationProfileSelector`, `LevelStylesPanel`** - aperçu et réglages de
  profil directement dans l'éditeur
- **Pages liminaires, TOC, annexes** - génération dans le rendu paginé, folios romains, 3 designs de
  TOC pour les sous-titres, copyright (avant, auto) séparé des mentions légales (arrière)
- **`/editor/paged-spike`** + `/api/paged-spike/export` - route expérimentale ayant validé la pipeline
  avant sa mise en production ; 404 en production, conservée comme code de validation

---

## Correcteur orthographique hors-ligne (23–25 juin 2026)

- **Remplacement** de la stratégie d'analyse orthographique par IA (`SpellingAnalysisStrategy`, Phase
  7.0) par un correcteur **entièrement hors-ligne** : nouvelle interface domaine `SpellChecker`,
  implémentation via **nspell + dictionnaire fr-FR** — zéro token IA consommé.
- Gestion des noms propres, mots ignorés persistants (par projet), dictionnaire personnalisé
  (`SpellCheckSettingsCard`).
- **`SpellCheckPalette`, `SpellCheckExtension`** - soulignement rouge dans l'éditeur, palette de
  correction au clic.
- Les 4 autres catégories d'analyse (grammaire, ponctuation, style, répétitions) restent inchangées et
  basées sur l'IA.

---

## Phase 9.0 - Character Chat & Character Sheet Auto-Fill (June 2026)

### Domain Layer
- **CharacterConversation entity** - Persisted conversation between the author and a character
  persona; owns an ordered list of `ChatMessage` value objects with `author` / `character` roles
- **ChatMessage value object** - Single message in a character conversation (role, content, createdAt)
- **ModelPricing value object** - Maintained pricing table (€/million tokens) for all supported
  models; computes the euro cost of an LLM call (discounting cached tokens); cost is snapshot at
  usage time so later price changes never rewrite historical records
- **LLMProvider interface extended** - `chatStream(messages, systemPrompt)` for character-persona
  streaming; `generateCharacterSheet(input)` for AI-assisted character sheet generation;
  optional `getLastTokenUsage()` to expose input/output/cached token counts
- **CharacterConversationRepository interface** - CRUD for conversations, scoped by `ownerId`

### Application Layer
- **ChatWithCharacterUseCase** - Streaming use case; builds the character persona context via
  `AIContextBuilder.buildCharacterPersona`, hydrates / creates the conversation, calls
  `LLMProvider.chatStream`, and persists the accumulated reply. Returns an `AsyncIterableIterator`
  of text chunks for SSE delivery. History is capped at the last 20 messages.
- **GenerateCharacterSheetUseCase** - Loads the character, project manuscript, and metadata;
  calls `LLMProvider.generateCharacterSheet`; returns 8 filled-in character fields without
  persisting (the author decides what to keep).
- **AIContextBuilder extended** - `buildCharacterPersona(character, projectId, userId)` produces
  a rich system prompt from the character profile + project metadata

### Infrastructure Layer
- **AnthropicProvider / OpenAIProvider / GoogleProvider** - implement `chatStream` (SSE streaming
  over the provider API) and `generateCharacterSheet`; `getLastTokenUsage()` now also covers
  streaming operations (`message_start` / `message_delta` for Anthropic; `stream_options.include_usage`
  for OpenAI; `usageMetadata` chunks for Google)
- **MongoDBCharacterConversationRepository** - conversation persistence with multi-tenant isolation
- **character-conversation-serializer** - MongoDB document ↔ CharacterConversation serialization

### Interface Layer
- **CharacterChatSheet component** - Right-side Sheet component for chatting with a character;
  streams replies via `/api/character-chat/stream`, shows conversation history, and exposes a
  Copy button on each character reply
- **CharacterCard updated** - Chat button opens `CharacterChatSheet` for the selected character
- **CharacterForm updated** - "Auto-fill" button triggers `GenerateCharacterSheetUseCase` and
  pre-fills all 8 character fields; author can edit before saving
- **character-conversation-actions** - Server actions to create, list, load, and delete conversations
- **`/api/character-chat/stream` SSE route** - Streams the character response; emits a `meta`
  event first (carrying the `conversationId`) so the client can resume interrupted sessions
- **useCharacterChat hook** - Client-side hook managing SSE connection, message state, and
  conversation persistence
- **ProjectSettingsMenu** - Dropdown in the editor header for quick access to all cockpit sections
  (mirrors the `CockpitSidebar` structure; Pilotage / Contenu groups)

---

## Phase 10.0 — Autocomplétion littéraire (Unreleased)

Refonte stratégique : l'autocomplétion devient la fonctionnalité IA centrale de Revise.
Principe directeur : *Revise ne finit pas votre chapitre. Il vous tend la prochaine phrase possible.*

### Décisions produit
- **Manuscrit-premier** : le texte réel est la source de vérité ; les métadonnées dérivées sont déclassées des prompts d'écriture
- **Génération longue déclassée** : chapitre complet / début cachés derrière le flag `LONG_FORM_GENERATION_ENABLED`
- **Toujours proposer** : quand l'auteur fait `Tab`, Revise répond — jamais muet

### Domain Layer
- **`AutocompleteEvent` entity** — cycle de vie complet d'une suggestion (triggered, displayed, accepted, rejected, expired) avec durée et outcome ; base de la télémétrie
- **`CanonFact` entity** — fait établi du roman (personnage, lieu, relation, événement) extrait du manuscrit ; source traçable (`derived` | `authored`) ; validable/invalidable par l'auteur
- **`ProjectSettings` étendu** — `getAutocompletePreferences()` expose les 6 préférences par projet (`enabled`, `suggestionLength`, `audace`, `smartPrefetch`, `partialAcceptance`, `learnFromRejections`)
- **`AutocompletePreferences` value object** — 6 préférences avec valeurs par défaut
- **`AutocompleteIntent` value object** — intention détectée du contexte (`dialogue`, `description`, `action`, `introspection`, `other`)
- **`AutocompleteOutcome` value object** — résultat d'une suggestion (`accepted_full`, `accepted_partial`, `rejected`, `expired`, `ignored`)
- **`CanonFacts` / `CanonFactSource` value objects** — collection de faits + enum de source
- **`AIOperationPolicy` value object** — policy de latence par opération (préfère modèles rapides pour l'autocomplétion)
- **`AIOperationType` étendu** — ajout de `canon_generation`
- **`AutocompleteEventRepository` interface** — persist + query des événements de télémétrie par projet/session/période
- **`CanonFactRepository` interface** — CRUD des faits canon avec `replaceDerived()` pour mise à jour atomique
- **`RateLimitRepository` interface** — sliding-window rate limiting générique (remplace `InMemoryRateLimiter` pour les usages persistés)

### Application Layer
- **`GenerateCanonFactsUseCase`** — extrait les faits canon d'un manuscrit via LLM, remplace les faits `derived` existants, respecte un cooldown par projet
- **`AutocompleteContextBuilder` service** — construit le contexte d'autocomplétion (fenêtre locale curseur-ancrée + faits canon) ; remplace l'envoi du tail de chapitre
- **`autocompleteIntents` service** — traduit l'intention détectée en directive de prompt
- **`canonEntities` service** — sélectionne les faits canon pertinents pour le contexte
- **`extractProjectFullText` étendu** — expose la longueur du texte pour le cooldown
- **`UpdateProjectSettingsUseCase` étendu** — persiste les préférences d'autocomplétion
- **`DeleteUserAccountUseCase` étendu** — cascade sur `AutocompleteEventRepository` et `CanonFactRepository`

### Infrastructure Layer
- **`MongoDBAutocompleteEventRepository`** — persist des événements de télémétrie avec agrégation par période/provider/outcome ; index TTL pour purge automatique
- **`MongoDBCanonFactRepository`** — persist des faits canon avec `replaceDerived()` transactionnel
- **`MongoDBRateLimitRepository`** — sliding-window rate limiting persisté (remplace in-memory)
- **Providers étendus** (`AnthropicProvider`, `GoogleProvider`, `OpenAIProvider`) — `generateCompletionStream` accepte désormais `intent`, `suggestionLength`, `audace` ; modèles basse latence sélectionnés par `AIOperationPolicy`
- **`TrackedLLMProvider` étendu** — trace les appels d'autocomplétion avec le type d'opération
- **`canon-facts-parsing`** — parse la réponse LLM brute en `CanonFact[]` (tolérant aux formats partiels)
- **`FilePromptRepository` étendu** — charge `docs/prompt/metadata/canon-facts.md`
- **`infrastructure/config/providers.ts`** — configuration centralisée des modèles par opération (fast vs standard)
- **`ai-feature-flags.ts`** — `CANON_CONTEXT_ENABLED`, `LONG_FORM_GENERATION_ENABLED`

### Interface Layer

**Éditeur**
- **`Autocomplete.ts` (extension TipTap) refontée** — prefetch silencieux (timer 10s), gestion des variantes, acceptation partielle mot/fragment, hints raccourcis, mise à jour dynamique des préférences à chaud
- **`AutocompleteDot` component** — point animé indiquant qu'une suggestion est déjà prête en arrière-plan
- **`autocompleteHint.ts`** — rendu des hints raccourcis sous la suggestion (Tab / → / 1-2-3)
- **`autocompleteTelemetry.ts`** — client de télémétrie intégré à l'extension ; envoie les événements de cycle de vie
- **`suggestionSegments.ts`** — découpe la suggestion en segments pour l'acceptation mot à mot
- **`TextEditor.tsx` étendu** — charge et applique les `AutocompletePreferences` du projet ; mise à jour dynamique sans rechargement

**API**
- **`/api/completion/stream` étendu** — accepte `intent`, `suggestionLength`, `audace` ; injecte les directives correspondantes dans le prompt ; injecte les faits canon quand `CANON_CONTEXT_ENABLED`
- **`/api/completion/telemetry`** — reçoit les événements de cycle de vie du client ; sliding-window rate limit pour éviter les abus
- **`/api/completion/telemetry/stats`** — agrégats de télémétrie par projet (taux d'acceptation, latence p50/p95 par provider)

**Cockpit**
- **`/cockpit/canon/page.tsx`** — registre canon : liste des faits extraits, validation/invalidation par l'auteur, déclenchement manuel de la regénération
- **`/cockpit/settings/page.tsx` étendu** — `AutocompletePreferencesCard` : 6 réglages persistés par projet (longueur, audace, prefetch, acceptation partielle, apprentissage)
- **`AutocompleteStatsCard` component** — métriques d'autocomplétion (suggestions proposées/acceptées/rejetées, taux par provider) dans la page usage
- **`CockpitSidebar` étendu** — entrée Canon dans la navigation

**Server Actions**
- **`canon-actions`** — generate, list, validate, invalidate, delete canon facts
- **`usage-actions` étendu** — expose les stats de télémétrie d'autocomplétion
- **`project-settings-actions` étendu** — persist les préférences d'autocomplétion

**E2E**
- **`e2e/ai-strategy/autocomplete.spec.ts`** — suite complète : déclenchement, acceptation totale/partielle, rejet, variantes, prefetch
- **`e2e/ai-strategy/autocomplete-metrics.spec.ts`** — vérifie l'affichage des métriques dans le cockpit
- **`e2e/ai-strategy/long-form-generation-deprecated.spec.ts`** — vérifie que la génération longue est cachée derrière le flag

---

## Unreleased

### Added

- **PricingClient domain interface** — `src/domain/interfaces/PricingClient.ts` extracted so `SyncModelPricingUseCase` and `PruneObsoletePricingUseCase` depend on an abstraction instead of the concrete `OpenRouterPricingClient`; `OpenRouterPricingClient` now declares `implements PricingClient`

- **Canon pipeline complete** (#106–#115):
  - **Incremental per-chapter extraction** — canon facts are extracted chapter-by-chapter; existing derived facts for a chapter are replaced atomically; cross-chapter contradictions invalidate affected facts
  - **Session-end trigger** — `useSessionEndTrigger` hook detects idle time / tab-visibility loss and fires background canon extraction; `useCanonFreshnessCheck` polls staleness
  - **Notification bell** — `NotificationBell` component + `notificationStore` (Zustand); user is notified when canon is stale and can trigger regeneration from the bell
  - **`CanonExtractionStateRepository` interface** — tracks extraction state per project (last run, chapter cursor, cooldown); extracted from `CanonFactRepository`
  - **`CanonExtractionPreferencesCard`** — per-project settings card for automatic vs manual extraction trigger
  - **`ManuscriptContextBuilder` service** — injects previous chapters as a `[CHAPITRES PRÉCÉDENTS]` block in the autocomplete context
  - **Canon 5-category model** — categories: character, location, relation, event, belief; injection cap raised to 40; belief facts prioritised; recent facts sorted first
  - **Character discovery** — when no character sheets exist, `generateCharacters` is called on the manuscript text to seed canon extraction
  - **Canon link** added to the editor cockpit navigation menu (#106)

- **AI Transparency Ledger** (#96):
  - **`AIExchange` entity** — captures one AI exchange (system prompt, input, raw output, token metrics) for the transparency ledger; stored separately from `AIUsageRecord`, encrypted at rest, opt-in, with retention / TTL purge
  - **`AIExchangeRepository` interface** — CRUD for exchanges scoped by `userId`
  - **`MongoDBExchangeRepository`** — MongoDB persistence with TTL index for automatic purge
  - **`FieldEncryption`** — AES-256-GCM encryption for transparency-ledger content fields; derives its key via PBKDF2 with a distinct salt (domain-separated from API-key encryption)
  - **`exchange-truncation`** — trims oversized system prompts, inputs, and outputs before persistence
  - **`AIExchangeLedger` component** — renders the list of exchanges with provider, operation, cost, and truncated preview
  - **`AIExchangeLoggingCard`** — settings card to opt in / out of exchange logging
  - **`/historique-ia` page** — user-facing transparency ledger

- **Dynamic Model Pricing** (#95, #97, #104, #105):
  - **`ModelPricingRepository` interface** — stores USD/M token rates fetched from OpenRouter
  - **`OpenRouterPricingClient`** — fetches pricing from the OpenRouter public API; normalises provider/prefix keys
  - **`SyncModelPricingUseCase`** — fetches and upserts pricing entries; quarantines key collisions and large price swings (> 50%); sends an enriched email report
  - **`PruneObsoletePricingUseCase`** — deletes stored entries absent from the latest OpenRouter fetch; never deletes if the fetch fails
  - **`MongoDBModelPricingRepository`** — MongoDB persistence for pricing entries
  - **Admin UI**: `ModelPricingForm`, `ModelPricingTable`, `SyncButton`, `PruneButton` at `/admin/pricing`
  - **`/api/cron/sync-pricing`** route — cron endpoint for scheduled pricing sync

- **Cockpit Objectives** (#85):
  - **`WritingQuota` entity** — recurring writing quota (daily / weekly target word rate)
  - **`WritingQuotaRepository` interface** — CRUD for quotas scoped by `ownerId`
  - **`MongoDBWritingQuotaRepository`** — MongoDB persistence
  - **`WordCountSnapshot` entity** — daily word-count checkpoint for activity tracking
  - **`WordCountSnapshotRepository` interface** — CRUD for snapshots
  - **`MongoDBWordCountSnapshotRepository`** — MongoDB persistence with TTL
  - **Quota use cases**: `CreateWritingQuotaUseCase`, `UpdateWritingQuotaUseCase`, `DeleteWritingQuotaUseCase`, `ListWritingQuotasUseCase`
  - **`RecordWordCountSnapshotUseCase`** — records a daily word-count snapshot
  - **`GetWritingActivityUseCase`** — returns time-series activity data for charts
  - **`GetWorkflowMetricsUseCase`** — computes milestone metrics (total written, daily rate, quota adherence)
  - **Cockpit components**: `ActivityChart`, `MilestoneMetricsCard`, `TodayPaceCard`, `QuotaCard`, `QuotaForm`

- **Thesaurus / Lexical Layer**:
  - **`Thesaurus` domain interface** — word alternative lookup contract
  - **`Morphology` domain interface** — lemmatisation / conjugation contract
  - **`WordAlternative` value object** — synonym with relevance score
  - **`ConjugationAwareThesaurus`** — wraps `JeuxDeMotsThesaurus` with conjugation-aware lookup using `FrenchMorphology`
  - **`JeuxDeMotsThesaurus`** — fetches synonyms from the JeuxDeMots French thesaurus API
  - **`FrenchMorphology`** — French lemmatisation via the lexique index
  - **`SuggestAlternativesUseCase`** — uses thesaurus to suggest word alternatives
  - **`ThesaurusPalette` component** — editor palette for browsing and inserting alternatives

- **User Guide** (#99) — full guide at `/guide/` covering the editor, cockpit, characters, manuscript, analyses, AI providers, assistant, and privacy

- **Project settings dropdown** — `ProjectSettingsMenu` in the editor header gives quick access to all cockpit sections without leaving the editor

### Fixed
- **Architecture** — `PruneObsoletePricingUseCase` and `SyncModelPricingUseCase` now depend on the `PricingClient` domain interface; domain test for `AIExchange` no longer imports `mongodb`
- **AI token usage now recorded** - the cockpit "Utilisation IA" page showed `0` tokens because
  no provider read the token usage from its API responses, so every `AIUsageRecord` was saved with
  `null` tokens (operation count and duration worked since they don't depend on the provider).
  `LLMProvider` now exposes an optional `getLastTokenUsage()`; `AnthropicProvider`,
  `OpenAIProvider`, and `GoogleProvider` capture input/output tokens, and `TrackedLLMProvider`
  pulls that usage into the saved record on success. Historical records remain at `0`; only new
  operations are counted.

### Added
- **AI usage cost tracking** - building on the token fix, the cockpit "Utilisation IA" page now
  shows the euro cost and cached-token count of AI usage, the prerequisite for token-based billing.
  - Streaming operations (character chat, autocompletion stream) now also capture tokens
    (Anthropic `message_start`/`message_delta` events, OpenAI `stream_options.include_usage`,
    Google chunk `usageMetadata`).
  - Cached prompt tokens are captured per provider (`cache_read_input_tokens`,
    `prompt_tokens_details.cached_tokens`, `cachedContentTokenCount`) and threaded through the
    entity, serializer, and aggregation.
  - A maintained `ModelPricing` table (euros per million tokens) computes the cost of each call —
    discounting cached tokens — and `TrackedLLMProvider` snapshots it onto the record at usage
    time, so later price changes never rewrite historical cost. Unpriced models store a null cost.
  - `UsageStats` exposes `totalCostEur` / `totalCachedInputTokens` (and per-operation equivalents);
    `UsageStatsCard` renders the cost and cached-token figures.

## Phase 8.0 - AI Contextual Strategy (Actes 1-3) (June 2026)

The AI now writes *from the author's own material* — their generated metadata **and**
their research documents — instead of generic knowledge, while never silently
overriding what the author has edited. The corresponding implementation has since evolved; see
the current [architecture documentation](docs/architecture.md) for active context paths.

### Domain Layer
- **ProjectMetadata enhanced** - `structuredData` field (JSON-serialized AI output preserved
  alongside the TipTap `content`), generation provenance (`generatedAt`, `isGenerated`, `lastEdited`)
  - `markAsGenerated()` / `createGenerated()` - single timestamp at generation so
    `lastEdited === generatedAt` (removes the double-`new Date()` false positive)
  - `wasEditedSinceGeneration()` - true once the author edits a generated fiche; lets context
    decide whether `structuredData` can still be trusted ("author edit wins")
  - `getContentText()` - plain text of the TipTap content (fallback context source)
  - `getTypeKey()`, `isGenerated()`, `getStructuredData()`
- **ResearchDocument enhanced** - `getContentText()` (handles plain `{ text }` body and TipTap
  shapes), used to inject the author's intentional context; locality via `getLinkedChapterIds()`
  and `isLinkedToChapter(chapterId)`
- **LLMProvider interface changed** - `generateRewrites`, `generateChapter`, `generateCompletion`,
  and `generateCompletionStream` now receive ready-to-inject context strings (`projectContext` /
  `authorProfile`) instead of typed metadata objects; field-selection projection no longer lives
  in the provider contract

### Application Layer
- **AIContextBuilder** (`services/AIContextBuilder.ts`) - centralized metadata → prompt projection.
  Produces ready-to-inject context blocks per feature (`buildCompletionContext`,
  `buildChapterContext`, `buildRewriteContext`). Applies the "author edit wins" fallback (injects
  edited `content` text instead of stale `structuredData`) and projects research documents by
  locality (global docs always; chapter-linked docs only when writing in that chapter). Distinct
  latency budgets: lean for completion, generous for chapter generation. Fails gracefully when a
  repository is absent or rejects.
- **CheckMetadataFreshnessUseCase** (`use-cases/CheckMetadataFreshnessUseCase.ts`) - read-only
  staleness check. Compares the current manuscript full-text hash to each metadata's stored hash
  via `needsRegeneration`. Only AI-generated, author-untouched analyses can be stale. Never regenerates.
- **extractProjectFullText** (`services/project-text.ts`) - canonical project text extraction,
  shared by the generation use cases and the freshness check (single source of truth).
- **text-hash** (`utils/text-hash.ts`) - SHA-256 content hashing **moved from Infrastructure to
  Application** (Application must not depend on Infrastructure). Consumed by all 7 Generate* use
  cases, CheckMetadataFreshnessUseCase, and blog-actions.

### Infrastructure Layer
- **AnthropicProvider / OpenAIProvider / GoogleProvider** - consume context strings; per-provider
  field-selection projection (`enhanceCompletionPrompt`, `buildAuthorProfileSection`, etc.) removed.
  GoogleProvider rewrites now also inject the author profile. Completion injects worldbuilding
  (`worldRules` / `atmosphere`) when available.
- **TrackedLLMProvider** - passes the new context strings through as a decorator.
- **MetadataCache** - keyed by project (and chapter for completion); stores the built completion
  context string; invalidated by project prefix.
- **metadata-serializer** - persists/restores `structuredData` and generation provenance
  (backward compatible: legacy documents deserialize with `null`).

### Interface Layer
- **Research documents feed the AI** - completion sees global + current-chapter research docs;
  chapter generation sees all. The active `chapterId` is threaded from the editor (store →
  Autocomplete extension via `setAutocompleteChapterId`, and the non-stream action) down to
  `AIContextBuilder.buildCompletionContext`.
- **ResearchDocumentForm** - adds a "Corps" body (note/quote/reference/image) stored as
  `content: { text }`, giving the author a place to write the scenario/plan the AI reads as
  intentional context.
- **Stale-analysis notice** - `MetadataCard` shows a discreet "basé sur une version antérieure —
  régénérer" notice; the metadata list page calls `checkMetadataFreshnessAction` after loading.
  The author is informed and decides — no automatic regeneration.
- **research-document-actions / completion-actions / chapter-generation-actions / rewrite-text** -
  wired to load context via `AIContextBuilder`; research-doc create/update/delete invalidate the
  cached context so edits take effect.

### Changed (Audit)
- `hashText` relocated from `infrastructure/utils` to `application/utils` (Clean Architecture
  violation fix; old file removed, no residual imports).
- Consolidated `extractFullText`: removed 7 duplicate private method pairs from the Generate* use
  cases; each now imports `extractProjectFullText` (removes the "must stay in sync" divergence risk).
- `research-document-actions` create now uses `metadataCache.invalidate(userId, projectId)` instead
  of `invalidateUser` — avoids evicting other projects' caches.

### Fixed (Audit)
- **Synthesis "author edit wins"** - `GenerateSynthesisUseCase` no longer injects AI data the author
  already overrode (guards `parsePreviousAnalyses` with `wasEditedSinceGeneration()`).
- **Stale false positive** - freshness check excludes manually-edited fiches, so authors who updated
  a fiche after generation no longer see a misleading "basé sur une version antérieure" notice.
- **a11y** - `MetadataCard` rename dialog gains a `DialogDescription` for screen readers.

### Removed
- **MetadataContextBuilder** - dead class (never called in production; `GenerateSynthesisUseCase`
  had its own `parsePreviousAnalyses` all along). Its responsibilities now live in `AIContextBuilder`
  (context projection) and directly on the synthesis code path (author-edit-wins guard).

---

## Phase 7.0 - Chapter Verification (February 2026)

### Domain Layer
- **ChapterAnalysis entity** - Complete chapter analysis result with issues, repetitions, and statistics
- **AnalysisCategory value object** - Enum for analysis types (spelling, grammar, punctuation, style, repetition)
- **AnalysisSeverity value object** - Enum for issue severity (error, warning, suggestion)
- **AnalysisIssue value object** - Individual analysis issue with position, suggestion, and status
- **RepetitionCluster value object** - Cluster of repeated words/phrases with positions
- **StyleRigor value object** - Analysis strictness level (strict, balanced, light)

### Application Layer
- **Analysis Strategies** - Strategy pattern implementation for each analysis type:
  - `SpellingAnalysisStrategy` - Spelling error detection via AI
  - `GrammarAnalysisStrategy` - Grammar issue detection via AI
  - `PunctuationAnalysisStrategy` - Punctuation error detection via AI
  - `StyleAnalysisStrategy` - Style improvement suggestions via AI
  - `RepetitionAnalysisStrategy` - Repeated word/phrase detection
- **AnalyzeChapterUseCase** - Orchestrates analysis strategies (in-memory results, no persistence)
- **ApplyCorrectionUseCase** - Apply a single correction to chapter content
- **ApplyBatchCorrectionsUseCase** - Apply multiple corrections in batch

### Infrastructure Layer
- **AnalysisLLMClient** - AI client for spelling, grammar, punctuation, and style analysis

### Interface Layer
- **ChapterAnalysisPanel** - Main panel for chapter verification UI
- **AnalysisCategoryTabs** - Tab navigation for analysis categories
- **AnalysisConfigDialog** - Configuration dialog for analysis options
- **AnalysisIssueCard** - Card component for individual issues
- **AnalysisSummaryCard** - Summary statistics for analysis results
- **analysis-actions.ts** - Server actions for analysis operations

### Simplification (February 2026)
- Removed analysis persistence (no more MongoDB storage for analysis results)
- Analysis results are now in-memory only (React state)
- Removed history, diff, and export features
- Removed repetition exclusions feature
- User ignores issues locally (state update only)

---

## Réinitialisation de mot de passe (31 janvier 2026)

- **`PasswordResetToken` entity** - jeton à usage unique, expirant (1h)
- **`RequestPasswordResetUseCase`** - réponse identique pour un compte inconnu/non approuvé
  (anti-énumération), envoi du lien par e-mail
- **`ResetPasswordUseCase`** - valide le jeton, met à jour le mot de passe, invalide les jetons restants
- **`ChangePasswordUseCase`** (authentifié) - vérifie le mot de passe courant, invalide tous les jetons
  de réinitialisation existants
- **Interface** - `/auth/forgot-password`, `/auth/reset-password`

---

## Phase 6.1 - Cover Images, Writing Goals & Security (January 2026)

### Domain Layer
- **Project entity enhanced** - coverImageUrl field for project cover images
- **RateLimiter interface** - Rate limiting abstraction for registration protection
- **CaptchaVerifier interface** - CAPTCHA verification abstraction

### Infrastructure Layer
- **HCaptchaVerifier** - hCaptcha verification implementation for bot protection
- **InMemoryRateLimiter** - In-memory rate limiting with sliding window
- **PdfExporter enhanced** - Cover image as first page, improved text justification with word-based layout
- **DocxExporter enhanced** - Cover image support in exports
- **ResendEmailService enhanced** - Redesigned welcome email with modern layout

### Interface Layer
- **Cover image upload** - Upload cover images for projects via Vercel Blob
- **Cover image display** - Show cover image in dashboard cards, public reader, and OpenGraph metadata
- **Chapter selection** - Select specific chapters for publishing and exporting
- **Rate limiting** - 5 requests per IP per hour for registration
- **hCaptcha verification** - Bot protection on registration form
- **Font size extended** - 8pt to 100pt range in editor (was 8-24pt)
- **PDF improvements** - Better text justification with word-based layout algorithm
- **Cockpit header** - Fixed header with navigation in cockpit layout

---

## Phase 6 - Project Cockpit (January 2026)

### Domain Layer
- **Character entity** - Fictional character tracking with names, aliases, descriptions, traits, goals, and relationships
- **ProjectSettings entity** - Project-level settings including genre, themes, narration settings, contributors, and related works
- **ProjectTask entity** - Task management with title, description, priority, status, due dates, and contributors
- **ResearchDocument entity** - Research document management with title, content, and tags
- **WritingGoal entity** - Writing goals with target word count, deadline, and progress tracking
- **AIUsageRecord entity** - AI usage tracking with operation type, token counts, and cost estimation
- **Value objects**: AIOperationType, TaskPriority, TaskStatus, Contributor, RelatedWork, NarrationSettings

### Application Layer
- **Character Use Cases** - CreateCharacter, LoadCharacter, ListProjectCharacters, UpdateCharacter, DeleteCharacter, SyncCharactersFromAnalysis
- **ProjectSettings Use Cases** - CreateProjectSettings, LoadProjectSettings, UpdateProjectSettings
- **ProjectTask Use Cases** - CreateProjectTask, ListProjectTasks, UpdateProjectTask, DeleteProjectTask, GetTaskSummary
- **ResearchDocument Use Cases** - CreateResearchDocument, ListResearchDocuments, UpdateResearchDocument, DeleteResearchDocument
- **WritingGoal Use Cases** - CreateWritingGoal, ListWritingGoals, UpdateWritingGoal, DeleteWritingGoal, GetActiveWritingGoal
- **Cover Image Use Cases** - UploadCoverImage, DeleteCoverImage

### Infrastructure Layer
- **MongoDBCharacterRepository** - Character persistence with multi-tenant isolation
- **MongoDBProjectSettingsRepository** - Project settings persistence
- **MongoDBProjectTaskRepository** - Task persistence with filtering and sorting
- **MongoDBResearchDocumentRepository** - Research document persistence
- **MongoDBWritingGoalRepository** - Writing goal persistence
- **MongoDBUsageRepository** - AI usage statistics persistence with aggregation
- **VercelBlobStorage** - Cover image storage using Vercel Blob
- **TrackedLLMProvider** - LLM provider wrapper that tracks AI usage
- **ObjectIdGenerator** - MongoDB ObjectId generation for frontend

### Interface Layer
- **Cockpit pages** - `/project/[projectId]/cockpit/*` for overview, characters, metadata, objectives, research, settings, tasks, usage
- **CockpitSidebar** - Navigation sidebar for cockpit sections
- **Character components** - CharacterCard, CharacterForm for character management
- **Task components** - TaskForm, TaskRow, TaskSummaryCard for task management
- **Goal components** - GoalCard, GoalForm for writing goal tracking
- **Usage components** - UsageStatsCard, DailyUsageChart, UsageByOperationChart for AI usage visualization
- **Settings components** - ProjectSettingsForm, CoverImageUpload, ContributorsField, RelatedWorksField
- **Research components** - ResearchDocumentCard, ResearchDocumentForm for document management
- **Quick actions** - QuickActionsCard, QuickActionButton, ProgressCard, StatCard
- **Server actions** - cockpit-actions, task-actions, usage-actions, writing-goal-actions, character-actions, research-document-actions, project-settings-actions

### UI Components
- **New shadcn/ui components** - sidebar, tabs, chart (recharts), breadcrumb, separator, skeleton, textarea, tooltip
- **Mobile hook** - use-mobile for responsive design

---

## Phase 5.1 - Markdown Folder Import (January 2026)

### Domain Layer
- **FolderParser interface** - Domain abstraction for folder parsing

### Application Layer
- **ImportFolderUseCase** - Orchestrates folder import with validation

### Infrastructure Layer
- **MarkdownParser** - Parse individual .md files to TipTap JSON
- **MarkdownFolderParser** - Parse folder structure to chapters

### Interface Layer
- **IndentHeading TipTap extension** - Heading indentation support
- **Import dialog enhancement** - Folder selection in addition to single file

---

## Phase 5.0 - Public Project Sharing (January 2026)

### Domain Layer
- **Project entity enhanced** - shareToken, isPublished, publishedAt, publish(), unpublish()
- **PaginatedResult value object** - For blog pagination

### Application Layer
- **PublishProjectUseCase** - Publish with unique share token
- **UnpublishProjectUseCase** - Remove public access
- **LoadPublishedProjectUseCase** - Public project loading (no auth)

### Infrastructure Layer
- **findPublishedByToken()** - Repository method for loading published projects

### Interface Layer
- **PublishDialog component** - UI for publishing/unpublishing with link copying
- **PublicReader component** - Read-only view for published projects
- **Public route** - `/read/[projectId]/[token]` for public access
- **publish-actions.ts** - Server actions for publishing operations

---

## Phase 4.1+ - UX Enhancements (January 2026)

### Interface Layer
- **AIMenuDropdown** - Unified dropdown for all AI features (rewrite, generate, complete)
- **CommandPalette** - Cmd/Ctrl+Shift+I shortcut for quick AI action access
- **Responsive mobile design** - Editor and reader optimized for mobile devices
- **Reading time display** - Estimated reading time per chapter
- **Blog pagination** - 5 articles per page with navigation

---

## Phase 4.1 - AI Text Generation & Autocompletion (January 2026)

### Domain Layer
- **ContentConverter interface** - Clean Architecture abstraction for TipTap conversion
- **ChapterSummaries metadata type** - 7th analysis type

### Application Layer
- **GenerateChapterUseCase** - Loads all project metadata for contextual generation
- **GenerateCompletionUseCase** - Generates completions using project context
- **LoadPublishedBlogArticlesPaginatedUseCase** - Blog pagination

### Infrastructure Layer
- **TipTapContentService** - Content conversion implementation
- **MetadataCache** - TTL-based caching (5 min) for metadata
- **Chapter generation prompts** - `/docs/prompt/chapter-generation/`
- **Autocompletion streaming** - SSE-based completion delivery

### Interface Layer
- **FloatingGenerationMenu** - Context-aware generation for empty chapters
- **Autocomplete TipTap extension** - Ghost text display with streaming support

---

## Phase 4.0 - Blog Section (January 2026)

### Domain Layer
- **BlogArticle entity** - Domain entity with slug, title, content, metadata
- **BlogArticleRepository interface** - Article persistence abstraction

### Application Layer
- **Blog CRUD Use Cases** - Create, Update, Delete, List

### Infrastructure Layer
- **MongoDBBlogArticleRepository** - Persistence with indexes

### Interface Layer
- **Blog pages** - `/blog` list and `/blog/[slug]` article pages
- **Admin blog management** - `/admin/blog` for CRUD operations
- **6+ SEO articles** (2700-3600 words each) on writing techniques

---

## Phase 3.11 - RGPD/LCEN Compliance (January 2026)

### Domain Layer
- **ContactMessage entity** - Contact form submission
- **User entity enhanced** - termsAcceptedAt, privacyAcceptedAt consent timestamps

### Application Layer
- **DeleteUserAccountUseCase** - Cascade delete with all user data
- **SubmitContactFormUseCase** - Contact form handling

### Infrastructure Layer
- **MongoDBContactMessageRepository** - Contact message storage
- **deleteAllByOwner()** method on all repositories

### Interface Layer
- **Legal pages** - CGU, CGV, mentions legales, politique confidentialite, politique cookies
- **Cookie consent banner** - CookieConsent component with 3 variants
- **Settings page** - `/settings` with account deletion and data export UI
- **Terms checkbox** on signup form with validation
- **Contact form** on landing page

---

## Phase 3.8 - User Registration Approval (January 2026)

### Domain Layer
- **User entity enhanced** - isApproved, approvedAt fields
- **EmailService interface** - Email notification abstraction

### Application Layer
- **ApproveUserUseCase** - Handles approval with HMAC token verification

### Infrastructure Layer
- **ResendEmailService** - Email notifications via Resend API
- **HMAC token generation** - Secure approval/rejection links

### Interface Layer
- **API route** `/api/approve` for handling approval actions
- **Pending approval message** after registration

---

## Phase 3.9 - French Translation (January 2026)

### Interface Layer
- Sign-in/sign-up pages fully translated
- Dashboard (titles, counters, empty states)
- Error messages in French

---

## Phase 3.10 - Optional AI Provider (January 2026)

### Application Layer
- **CreateProjectUseCase** - No longer requires provider

### Interface Layer
- **NoProvidersAlert** - Non-blocking informational banner
- **AI features hidden gracefully** when no valid provider available
- **useHasAIProviders hook** - Centralized provider availability check

---

## Phase 3.7 - UX Enhancements (January 2026)

### Domain Layer
- **CorrectionHistory entity** - Tracks AI rewrite history per chapter
- **CorrectionHistoryRepository interface** - History persistence

### Application Layer
- **Correction History Use Cases** - Save, List, Delete

### Infrastructure Layer
- **PdfExporter** - PDF export with full typography and special character support
- **MongoDBCorrectionHistoryRepository** - History storage with indexing
- **GPT-5 nano support** - gpt-5-nano-2025-08-07 with 400K context
- **o-series reasoning models** - Proper API parameters (max_completion_tokens)

### Interface Layer
- **PDF Export** - Format selection dropdown with DOCX/PDF options
- **CorrectionHistoryDialog** - Accordion UI for viewing rewrite history
- **LoadingOverlay** - Progress bar with 100 famous author quotes
- **3 Proposals** - Reduced from 5 (epure, lyrique, amplifie)
- **Character/Word Count** - Live statistics in editor header

---

## Phase 3.6 - Metadata Analysis System (January 2026)

### Domain Layer
- **ProjectMetadata entity** - TipTap JSON storage with content hash
- **MetadataType value object** - 7 analysis types enum
- **7 analysis value objects** - NarrativeAnalysis, Characters, Plot, StylisticDNA, Worldbuilding, ChapterSummaries, Synthesis
- **LLMProvider interface enhanced** - 7 analysis methods
- **MetadataRepository interface** - Metadata persistence
- **PromptRepository interface** - Version-controlled AI prompts

### Application Layer
- **Metadata CRUD Use Cases** - Create, Load, List, UpdateContent, UpdateTitle, Delete
- **7 Generation Use Cases** - One per analysis type with intelligent caching

### Infrastructure Layer
- **AnthropicProvider** - Full Claude integration
- **OpenAIProvider enhanced** - 7 metadata analysis methods
- **MongoDBMetadataRepository** - Multi-tenant metadata storage
- **FilePromptRepository** - Load prompts from markdown files
- **Text hashing utility** - SHA-256 for cache invalidation

### Interface Layer
- **Metadata List Page** - `/project/[id]/metadata`
- **Metadata Editor Page** - Rich text editor with auto-save
- **GenerateCard & MetadataCard components** - UI for metadata management
- **metadata-actions.ts** - Server actions for 13 metadata use cases

---

## Phase 3.5 - AI Provider Management (January 2026)

### Domain Layer
- **Provider entity** - AI provider with encrypted credentials
- **IdGenerator interface** - UUID generation abstraction
- **LLMProviderFactory interface** - Provider instantiation

### Application Layer
- **Provider CRUD Use Cases** - Create, Update, Delete, List
- **TestProviderConnectionUseCase** - Credential validation
- **ValidateProviderUseCase** - Existing provider validation
- **Project CRUD Use Cases** - Create, Load, List, Delete, UpdateTitle, UpdateProvider

### Infrastructure Layer
- **LLMProviderFactoryImpl** - Factory implementation
- **UUIDGenerator** - IdGenerator implementation
- **MongoDBProviderRepository** - Encrypted credential storage

### Interface Layer
- **ProvidersDialog** - Provider management UI
- **Dashboard alerts** when no providers configured
- **User menu integration** with "My Providers" option

---

## Phase 3 - Persistence & Authentication (January 2026)

### Domain Layer
- **User entity** - Email, hashed password, timestamps
- **Project entity enhanced** - ownerId for multi-tenant isolation
- **UserRepository interface** - User management
- **AuthProvider interface** - Authentication abstraction

### Application Layer
- **RegisterUserUseCase** - User registration with bcrypt

### Infrastructure Layer
- **MongoDBProjectRepository** - Production persistence with multi-tenant isolation
- **MongoDBUserRepository** - User management with bcrypt password hashing
- **AuthJsProvider** - Auth.js integration
- **Database configuration** - MongoDB Atlas connection management
- **Route protection middleware** - Session validation and redirects

### Interface Layer
- **Dashboard page** - Project management (create, rename, delete)
- **Sign-in/Sign-up pages** - Form validation
- **UserMenu component** - Profile and sign-out
- **Auto-save** - 1-second debounce with useAutosave hook
- **Server Actions** for all database operations

---

## Phase 2.5 - A4 Page Styling & Advanced Typography

### Domain Layer
- **Chapter entity** - TipTap JSON content storage
- **Project entity** - Aggregate managing chapter collection

### Infrastructure Layer
- **DocxParser enhanced** - HTML import with chapter splitting by H1
- **DocxExporter enhanced** - Multi-chapter export with formatting
- **TipTap conversion utilities** - HTML <-> JSON conversion
- **InMemoryProjectRepository** - Ephemeral storage for testing

### Interface Layer
- **A4 page styling** - 794px fixed width, realistic shadows
- **Advanced typography** - Font family, size, alignment, indent controls
- **Rich text formatting** - Bold, italic, underline, highlight
- **ChaptersSheet** - Drag & drop navigation
- **ProposalsSheet** - AI proposal display
- **FormattingToolbar** - Typography controls
- **Keyboard shortcuts** - Ctrl+B/I/U, Ctrl+K (em dash), Ctrl+Z

---

## Phase 1-2 - Core Rewrite Flow

### Domain Layer
- **TextDocument entity** - Single document with content
- **TextSelection value object** - Immutable text range
- **RewriteProposal value object** - AI-generated alternative
- **LLMProvider interface** - AI abstraction
- **DocumentParser interface** - Import abstraction
- **DocumentExporter interface** - Export abstraction

### Application Layer
- **RewriteTextUseCase** - Core AI rewriting
- **ImportDocumentUseCase** - Document import
- **ExportDocumentUseCase** - Document export

### Infrastructure Layer
- **OpenAIProvider** - GPT-4o-mini integration
- **DocxParser** - mammoth-based import
- **DocxExporter** - docx library export

### Interface Layer
- **TextEditor** - TipTap editor with selection detection
- **DocumentControls** - Import/export buttons
- **Proposals display** - Selection -> replacement UI
