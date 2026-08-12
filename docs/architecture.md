# Revise - Architecture Documentation

## Overview

Revise follows Clean Architecture principles with clear layer separation.

## Layer Structure

### Domain Layer (`src/domain/`)

Pure business logic with no framework dependencies.

**Entities**:
- `Chapter` - Single chapter with rich text content (TipTap JSON)
- `Project` - Aggregate managing chapter collection with owner tracking, publishing support (shareToken, isPublished, publishedAt), cover image (coverImageUrl)
- `ProjectMetadata` - Metadata document with TipTap JSON content and content hash (Phase 3.6); carries `structuredData` (JSON AI output) and generation provenance (`generatedAt`, `isGenerated`) for the "author edit wins" rule (Phase 8.0)
- `Provider` - AI provider configuration with encrypted credentials (Phase 3.5)
- `User` - User entity with email, hashed password, approval status, and consent timestamps (Phase 3.8, 3.11)
- `CorrectionHistory` - AI rewrite history entry with proposals (Phase 3.7)
- `BlogArticle` - Blog article with slug, content, and metadata (Phase 4.0)
- `ContactMessage` - Contact form submission (Phase 3.11)
- `ArticleView` - Blog article view tracking with IP and timestamp (Phase 5.2)
- `Character` - Fictional character with name, aliases, description, traits, goals, relationships (Phase 6)
- `ProjectSettings` - Project settings with genre, themes, narration settings, contributors, related works (Phase 6)
- `ProjectTask` - Task with title, description, priority, status, due date, contributors (Phase 6)
- `ResearchDocument` - Research document with title, body, tags, and chapter locality (`linkedChapterIds`); read by the AI as the author's intentional context (Phase 6, 8.0)
- `WritingGoal` - Writing goal with target word count, deadline, progress (Phase 6)
- `AIUsageRecord` - AI usage tracking with operation type, tokens, cost (Phase 6)
- `AIExchange` - Captured content of one AI exchange (system prompt, input, raw output) for the transparency ledger; stored separately from `AIUsageRecord`, encrypted at rest, opt-in, with retention/TTL purge
- `WordCountSnapshot` - Daily word-count checkpoint per project for activity tracking and milestone metrics
- `WritingQuota` - Recurring writing quota with daily/weekly period, target word rate, and progress tracking against `WordCountSnapshot`
- `AutocompleteEvent` - Full lifecycle of one autocomplete suggestion (triggered → displayed → accepted/rejected/expired); carries provider, model, latency, outcome, and session identifiers for telemetry (Phase 10.0)
- `CanonFact` - Established fact about an entity/character with **temporal validity**: `validFromChapter`/`validToChapter` chapter range (not a boolean); `withValidToChapter()` closes a fact superseded by a later one. Classified into 5 numbered narrative categories — objectif, état de connaissance, croyance, croyance sur autrui, dynamique relationnelle (see [ADR 0003](../docs/adr/0003-cinq-categories-faits-canon.md)) — rather than a `character`/`location`/`relation`/`event` typology. Tracks source (`derived` | `author`) (Phase 10.0; model corrected 2026-07-29)
- `ChapterAnalysis` - Complete chapter analysis result with issues, repetitions, statistics (Phase 7); covers repetition/style only — spelling was removed from this AI-based path 2026-06-25 (see `SpellChecker` below), grammar and punctuation on 2026-08-05 (see `GrammarChecker` below). The AI is asked what only it can judge; the mechanical checks belong to the local engines.
- `CharacterConversation` - Persisted conversation between the author and a character persona; owns an ordered list of `ChatMessage` value objects (Phase 9.0)
- `TextDocument` - Legacy single document (Phase 1)
- `PasswordResetToken` - Single-use, expiring (1h) password-reset token (2026-01-31)
- `Snapshot` - Immutable captured project version: sequential number (never reused), full chapter copies, captured editorial metadata, type (`manual`/`automatic`/`restore`/`safety`); tombstone model (`tombstone()` erases restorable content but keeps an audit entry) (2026-07-25 – 07-29)
- `CustomAnnex` - Author-inserted front/back-matter annex (title + TipTap content), placement (`front`|`back`) + order (2026-07-11)
- `BookPreviewCacheEntry` - Cache of a whole-book PDF preview's page metrics (chapter/subtitle offsets), keyed by project+profile+owner, invalidated by content-hash fingerprint (2026-06 – 07)

**Value Objects**:
- `TextSelection` - Selection range
- `RewriteProposal` - AI-generated proposal
- `MetadataType` - Enum for 7 analysis types (including chapter-summaries) (Phase 3.6, 3.7)
- `NarrativeAnalysis`, `Characters`, `Plot`, `StylisticDNA`, `Worldbuilding`, `ChapterSummaries`, `Synthesis` (Phase 3.6, 3.7)
- `TaskPriority` - Task priority enum (low, medium, high, urgent) (Phase 6)
- `TaskStatus` - Task status enum (todo, in_progress, done, blocked) (Phase 6)
- `Contributor` - Contributor with name and role (Phase 6)
- `RelatedWork` - Related work with title, author, type (Phase 6)
- `NarrationSettings` - Narration settings with POV, tense, person (Phase 6)
- `AIOperationType` - AI operation type enum (rewrite, generate, complete, analyze) (Phase 6)
- `AnalysisCategory` - Analysis category enum (spelling, grammar, punctuation, style, repetition) (Phase 7)
- `AnalysisSeverity` - Issue severity enum (error, warning, suggestion) (Phase 7)
- `AnalysisIssue` - Individual analysis issue with position, suggestion, status (Phase 7)
- `RepetitionCluster` - Cluster of repeated words/phrases with positions (Phase 7)
- `StyleRigor` - Analysis strictness level (strict, balanced, light) (Phase 7)
- `ChatMessage` - Single message in a character conversation with role (`author` | `character`), content, and timestamp (Phase 9.0)
- `ModelPricing` - Maintained pricing table (€/million tokens) for all supported models; computes euro cost per call discounting cached tokens; cost is snapshot at usage time (Phase 9.0)
- `AutocompletePreferences` - 6 per-project autocomplete settings: `enabled`, `suggestionLength` (short/medium/long), `audace` (prudent/balanced/bold), `smartPrefetch`, `partialAcceptance`, `learnFromRejections`; stored on `ProjectSettings` (Phase 10.0)
- `CanonExtractionPreferences` - Per-project settings for canon extraction trigger (auto at session-end vs manual)
- `WordAlternative` - Synonym / word alternative with relevance score, produced by the `Thesaurus`
- `AutocompleteIntent` - Detected intention of the writing context (`natural`, `shorter`, `tenser`, `more_concrete`, `dialogue`); drives variant generation (Phase 10.0; corrected 2026-07-29, the original 5-value set — `dialogue`/`description`/`action`/`introspection`/`other` — was redesigned during implementation)
- `AutocompleteOutcome` - Result of a suggestion (`accepted_full`, `accepted_partial`, `rejected_escape`, `superseded_typing`, `empty`, `prefetch_discarded`); the last tracks LLM calls wasted by smart prefetch (Phase 10.0; corrected 2026-07-29)
- `CanonFacts` - Typed collection of `CanonFact` items (Phase 10.0)
- `CanonFactSource` - Enum for fact provenance: `derived` (LLM-extracted) | `author` (manually added) (Phase 10.0; corrected 2026-07-29, was documented as `authored`)
- `AIOperationPolicy` - Maps `AIOperationType` to provider selection policy (fast vs standard models); autocomplete always uses fast models (Phase 10.0)
- `PublicationProfile` - Immutable print presets: `kdp-6x9`, `a5`, `passerelle` (non-paginated bridge profile); `fromId()` falls back to `kdp-6x9` for a removed/unknown id, so old projects still open (2026-06-28 – 06-29; 3 earlier KDP trim-size profiles removed and auto-migrated)
- `SemanticRole` - Content-block role (`corps`, `titre-de-chapitre`, `sous-titre`, `citation`, `epigraphe`, `separateur-de-scene`), decoupled from visual style (2026-06-28)
- `LevelStyleSet` - Per-profile typography (size/weight/italic/alignment/line-height) for each semantic role, with clamping and closed-value validation (2026-06-28 – 07-05)
- `TocPreferences` - Table-of-contents depth (chapters vs chapters+subtitles) and style (classique/épuré/littéraire) (2026-07-06)
- `PresentationOverride` - Per-node presentation overrides (font/size/alignment), scoped to the `passerelle` profile only, kept as a layer separate from semantic content (2026-06-28)
- `SnapshotType` - `manual` | `automatic` | `restore` | `safety` (2026-07-25)
- `AutomaticSnapshotInterval` - Allowed automatic-snapshot intervals: 5/15/30/60 minutes (2026-07-29)

**Domain Services**:
- `AutomaticSnapshotRetention` - The one pure domain service in the codebase: `automaticSnapshotsToPrune()` computes which automatic snapshots to purge (20 latest kept, then 1/day for 30 days, 1/week for 6 months, timezone-aware) (2026-07-29)

**Interfaces**:
- `DocumentParser` - Parse documents to entities
- `DocumentExporter` - Export entities to documents
- `LLMProvider` - AI rewriting + 7 metadata analysis methods + chapter generation + completion + `chatStream` (character persona streaming) + `generateCharacterSheet` (Phase 3.6, 4.1, 9.0); generation/rewrite/completion methods receive ready-to-inject context strings (`projectContext` / `authorProfile`) rather than typed metadata (Phase 8.0); optional `getLastTokenUsage()` exposes input/output/cached token counts after any call (Phase 9.0); `generateCompletionStream` now accepts `intent`, `suggestionLength`, `audace` for preference-driven prompting (Phase 10.0)
- `ProjectRepository` - Persistence abstraction with multi-tenant support
- `ProviderRepository` - Provider storage with encryption (Phase 3.5)
- `MetadataRepository` - Metadata storage with multi-tenant isolation (Phase 3.6)
- `CorrectionHistoryRepository` - Correction history storage (Phase 3.7)
- `BlogArticleRepository` - Blog article persistence (Phase 4.0)
- `ContactMessageRepository` - Contact form persistence (Phase 3.11)
- `PromptRepository` - Load AI prompts from markdown files (Phase 3.6)
- `UserRepository` - User management, authentication, and approval (Phase 3, 3.8)
- `ArticleViewRepository` - Blog article view tracking (Phase 5.2)
- `CharacterRepository` - Character persistence (Phase 6)
- `ProjectSettingsRepository` - Project settings persistence (Phase 6)
- `ProjectTaskRepository` - Task persistence (Phase 6)
- `ResearchDocumentRepository` - Research document persistence (Phase 6)
- `WritingGoalRepository` - Writing goal persistence (Phase 6)
- `AIUsageRepository` - AI usage tracking persistence (Phase 6)
- `CharacterConversationRepository` - Conversation persistence scoped by `ownerId` (Phase 9.0)
- `BlobStorage` - Blob storage abstraction for images (Phase 6)
- `RateLimiter` - Rate limiting abstraction for registration protection (Phase 6.1)
- `AutocompleteEventRepository` - Persist and query autocomplete telemetry events; aggregates by period/provider/outcome (Phase 10.0)
- `CanonFactRepository` - CRUD for canon facts with `replaceDerived()` for atomic bulk update (Phase 10.0)
- `CanonExtractionStateRepository` - Tracks per-project extraction state (last run, chapter cursor, cooldown); extracted from `CanonFactRepository` (Phase 10.0)
- `RateLimitRepository` - Generic persistent sliding-window rate limiting (replaces in-memory for canon generation and telemetry ingestion) (Phase 10.0)
- `ModelPricingRepository` - Stores USD/M token rates fetched from OpenRouter, used to compute EUR costs at call time
- `AIExchangeRepository` - CRUD for captured AI exchanges (transparency ledger), scoped by `userId`, with TTL purge
- `WordCountSnapshotRepository` - Daily word-count checkpoints for activity tracking
- `WritingQuotaRepository` - Recurring writing quotas (daily/weekly) scoped by `ownerId`
- `Thesaurus` - Word alternative lookup (synonyms) abstraction
- `Morphology` - Lemmatisation / conjugation abstraction
- `PricingClient` - Fetches model pricing entries from an external source; abstracts `OpenRouterPricingClient` so use cases remain infrastructure-free
- `CaptchaVerifier` - CAPTCHA verification abstraction (Phase 6.1)
- `AuthProvider` - Authentication service abstraction
- `EmailService` - Email notification service (Phase 3.8)
- `ApprovalTokenGenerator` - HMAC token generation for approval links (Phase 3.8)
- `ContentConverter` - TipTap content conversion abstraction (Phase 4.1)
- `FolderParser` - Folder parsing abstraction for multi-file imports (Phase 5.1)
- `PaginatedResult` - Pagination result interface for blog articles (Phase 4.1+)
- `IdGenerator` - UUID generation abstraction (Phase 3.5)
- `LLMProviderFactory` - Factory for creating LLM providers (Phase 3.5)
- `SpellChecker` - Offline dictionary-based spell-check contract (`correct`/`suggest`); **replaces** the AI-based `SpellingAnalysisStrategy` for spelling specifically (2026-06-23 – 06-25), consuming zero AI tokens
- `GrammarChecker` - Synchronous paragraph-level grammar contract (`checkParagraph(paragraph, { ruleProfile, personalDictionary })`); offline, zero AI tokens. **Replaces** the AI-based grammar and punctuation strategies (2026-08-05). Only style and repetitions remain AI-based (`AnalysisLLMClient`)
- `GrammarDictionaryCompiler` - Turns a project's declared vocabulary into an engine dictionary; returns `null` when nothing is declared (2026-08-05)
- `IgnoredGrammarIssue` (value object) - A remark the author declined, keyed by rule family + flagged text rather than position, so the judgement survives the text moving. Filtered in `CheckChapterGrammarUseCase` (2026-08-05)
- `PUNCTUATION_RULE_FAMILIES` / `isPunctuationChecked` / `withPunctuationChecked` - The four families (`esp`, `nbsp`, `virg`, `poncfin`) an author means by "punctuation", switched as one from the toolbar and persisted in the project's rule profile (2026-08-05)
- `PasswordResetTokenRepository` - Create (invalidates prior tokens), find valid token, mark used, invalidate all for user, delete expired (2026-01-31)
- `SnapshotRepository` - Sequential numbering, paginated history, presentation-only metadata edits, tombstoning, activity log (2026-07-25 – 07-29)
- `AutomaticSnapshotRepository` - Server-side scheduling clock: `configure`, `recordSavedChange`, `heartbeat`, `claimDueSnapshot`/`completeSnapshot`/`releaseFailedSnapshot` (distributed-lock-style claim pattern) (2026-07-29)
- `BookPreviewCacheRepository` - Save/load whole-book preview metrics + cached PDF bytes (GridFS-backed) (2026-07-05)
- `CustomAnnexRepository` - CRUD + `countByProjectAndPlacement`, cascade deletes (2026-07-11)
- `PresentationOverrideRepository` - Save/load/delete per-chapter presentation overrides (2026-06-28)

### Application Layer (`src/application/`)

Use cases orchestrating domain logic.

**Project CRUD Use Cases**:
- `CreateProjectUseCase` - Create new project
- `LoadProjectUseCase` - Load project from repository
- `ListProjectsUseCase` - List user's projects
- `DeleteProjectUseCase` - Delete project
- `UpdateProjectTitleUseCase` - Rename project
- `UpdateProjectProviderUseCase` - Update project's AI provider

**Publishing Use Cases** (Phase 5.0):
- `PublishProjectUseCase` - Publish project with unique share token
- `UnpublishProjectUseCase` - Remove project from public access
- `LoadPublishedProjectUseCase` - Load published project by share token

**Chapter Use Cases**:
- `ImportProjectUseCase` - Multi-chapter DOCX import
- `ImportFolderUseCase` - Multi-file Markdown folder import (Phase 5.1)
- `ExportProjectUseCase` - Multi-chapter export
- `SwitchChapterUseCase` - Chapter navigation
- `AddChapterUseCase` - Create new chapter
- `RemoveChapterUseCase` - Delete chapter
- `ReorderChaptersUseCase` - Drag & drop reorder
- `UpdateChapterContentUseCase` - Content updates
- `UpdateChapterTitleUseCase` - Title updates

**Provider Use Cases** ⭐ NEW:
- `CreateProviderUseCase` - Provider creation
- `UpdateProviderUseCase` - Provider updates
- `DeleteProviderUseCase` - Provider deletion
- `ListProvidersUseCase` - List providers
- `TestProviderConnectionUseCase` - Test credentials
- `ValidateProviderUseCase` - Validate provider

**User Use Cases**:
- `RegisterUserUseCase` - User registration with consent validation
- `ApproveUserUseCase` - Admin approval with HMAC token validation (Phase 3.8)
- `RequestPasswordResetUseCase` - Anti-enumeration (identical response for unknown/unapproved accounts), 1h token, emails reset link (2026-01-31)
- `ResetPasswordUseCase` - Validates token, updates password, invalidates remaining tokens (2026-01-31)
- `ChangePasswordUseCase` - Authenticated password change; invalidates all existing reset tokens (2026-01-31)
- `DeleteUserAccountUseCase` - RGPD Article 17 "right to erasure"; cascades across ~15 repositories (Project, Provider, Metadata, CorrectionHistory, ProjectSettings, WordCountSnapshot, WritingQuota, WritingGoal, Character, ProjectTask, AIUsage, AIExchange, AutocompleteEvent, CanonFact, Snapshot), most as optional constructor params for backward compatibility (Phase 3.11; dependency list corrected 2026-07-29 — previously documented as 5 repositories)

**Metadata Use Cases** (Phase 3.6, 3.7):
- **CRUD**: `CreateMetadata`, `LoadMetadata`, `ListMetadata`, `UpdateMetadataContent`, `UpdateMetadataTitle`, `DeleteMetadata`
- **Generation**: `GenerateNarrativeAnalysis`, `GenerateCharacters`, `GeneratePlot`, `GenerateStylisticDNA`, `GenerateWorldbuilding`, `GenerateChapterSummaries`, `GenerateSynthesis` (all with intelligent caching)

**AI Generation Use Cases** (Phase 4.1, 10.0):
- `GenerateChapterUseCase` - Generate chapter content from metadata context
- `GenerateCompletionUseCase` - Generate autocompletion suggestions
- `GenerateCanonFactsUseCase` - Extract canon facts from manuscript via LLM, atomically replace derived facts, enforces per-project cooldown (Phase 10.0)
- `SuggestAlternativesUseCase` - Looks up word alternatives via the `Thesaurus` interface (conjugation-aware)

**Writing Goal & Quota Use Cases**:
- `CreateWritingQuotaUseCase`, `UpdateWritingQuotaUseCase`, `DeleteWritingQuotaUseCase`, `ListWritingQuotasUseCase` - Quota CRUD
- `RecordWordCountSnapshotUseCase` - Records a daily word-count snapshot for activity tracking
- `GetWritingActivityUseCase` - Returns time-series activity data for the cockpit chart
- `GetWorkflowMetricsUseCase` - Computes milestone metrics (total written, daily rate, quota adherence)

**Pricing Use Cases**:
- `SyncModelPricingUseCase` - Fetches model pricing from `PricingClient`, validates diff (quarantines collisions and large swings), upserts to repository, sends email report
- `PruneObsoletePricingUseCase` - Deletes stored pricing entries absent from the latest `PricingClient` fetch; never deletes when the fetch fails

**Snapshot Use Cases** (2026-07-25 – 07-29):
- `CreateSnapshotUseCase` - Manual snapshot creation (sequential number, captures chapters + editorial metadata)
- `ProcessAutomaticSnapshotUseCase` - Heartbeats a session, claims at most one due automatic snapshot per interval, verifies a session is still open before committing, prunes via `AutomaticSnapshotRetention`
- `ListSnapshotsUseCase` - Paginated history + `hasUnsnapshottedChanges` flag
- `LoadSnapshotComparisonUseCase` - Loads a past snapshot alongside a coherent point-in-time "current" state (triple-read race detection, no cross-collection Mongo transaction)
- `RestoreSnapshotUseCase` - Optimistic-concurrency guarded (`expectedProjectUpdatedAt`); takes a safety snapshot of unsaved current work first; atomic compare-and-swap; best-effort compensation if a post-swap step fails
- `GovernSnapshotHistoryUseCase` - Role-gated (`owner`/`editor`/`reader`) metadata edits and tombstone-style deletion — groundwork for future multi-collaborator support; this is the one snapshot use case still exported from `application/index.ts`'s barrel

**Publication / Pagination / Book-Preview Services** (2026-06-28 – 07-19):
- `WholeBookHtmlAssembler` - Assembles the whole-book body HTML from ordered chapters, strips presentation overrides to semantic-only, builds the endnote compilation, tags nested TOC sub-entries
- `BookPreviewCacheComputer` - Drives a headless browser (Paged.js) to paginate the assembled HTML, extracts page-count/chapter-offset/subtitle-offset metrics (120s timeout)
- `BookOffsetCalculator` - Pure function computing each chapter's first Arabic page number, honoring odd-page chapter starts
- `bookPreviewContentHash` - Fingerprints everything visible in the whole-book preview for cache invalidation
- `endnoteIndex` / `endnoteCompilation` - Build the per-chapter endnote index and the single numbering source shared by PDF/DOCX export
- `PresentationOverrideService` (`rendering/`) - `applyOverrides`/`stripToSemantic`/`extractOverrides` round-trip for the `passerelle` profile
- `PublicationProfileSwitch` (`rendering/`) - Switches rendered content between publication profiles

**Content Migrations** (`migration/`, 2026-06-28 – 07-04):
- `ContentMigrator` / `ContentDemigrator` - Reversible migration of legacy TipTap content into the semantic-content model; flags ambiguous cases (e.g. centered text) for manual review
- `RemovedPublicationProfileMigration` - Maps the 3 removed KDP trim-size profiles to `kdp-6x9`
- `ChapterTitleHeadingMigration` - One-shot insertion of a missing `titre-de-chapitre` H1 into a chapter

**Character Chat Use Cases** (Phase 9.0):
- `ChatWithCharacterUseCase` - Streaming use case; builds the character persona via `AIContextBuilder.buildCharacterPersona`, hydrates/creates the conversation, streams reply via `LLMProvider.chatStream`, persists the accumulated reply. Returns an `AsyncIterableIterator` of text chunks. History capped at 20 messages.
- `GenerateCharacterSheetUseCase` - Loads character + manuscript + metadata; calls `LLMProvider.generateCharacterSheet`; returns 8 filled-in character fields without persisting (author decides what to keep)

**AI Context Strategy** (Phase 8.0, 10.0):
- `AIContextBuilder` (service) - Centralized metadata → prompt projection; produces ready-to-inject
  context blocks (completion / chapter / rewrite / character persona), applies "author edit wins", projects research docs by locality
- `AutocompleteContextBuilder` (service) - Builds cursor-anchored local window for completions; injects relevant canon facts when `CANON_CONTEXT_ENABLED`; replaces chapter-tail context (Phase 10.0)
- `ManuscriptContextBuilder` (service) - Injects previous chapters as a `[CHAPITRES PRÉCÉDENTS]` block; capped at 8 000 chars from the chapter start (Phase 10.0)
- `autocompleteIntents` (service) - Translates detected `AutocompleteIntent` into a prompt directive string (Phase 10.0)
- `canonEntities` (service) - Selects and formats canon facts relevant to the current context (Phase 10.0)
- `CheckMetadataFreshnessUseCase` - Read-only staleness check (manuscript hash vs stored metadata hash); never regenerates
- `extractProjectFullText` (`services/project-text.ts`) - Canonical project text extraction shared by generation and freshness check
- `text-hash` (`utils/text-hash.ts`) - SHA-256 content hashing (moved from Infrastructure to respect layer boundaries)

**Chapter Verification Use Cases** (Phase 7):
- `AnalyzeChapterUseCase` - Orchestrates analysis strategies (in-memory results, no persistence)
- `ApplyCorrectionUseCase` - Apply a single correction to chapter content
- `ApplyBatchCorrectionsUseCase` - Apply multiple corrections in batch
- `CheckChapterGrammarUseCase` - Runs the offline grammar engine block by block and maps each error to an absolute ProseMirror range; installs the project's compiled vocabulary, never compiles it (2026-08-05)
- `UpdatePersonalDictionaryUseCase` - The only write path for a project's vocabulary: compiles the engine dictionary here so the list and the automaton are saved together (2026-08-05)

**Analysis Strategies** (Phase 7):
- ~~`SpellingAnalysisStrategy`~~ - **Removed 2026-06-25**; spelling detection now goes through the offline `SpellChecker` (nspell) instead of an AI strategy — see Infrastructure/Lexical below
- ~~`GrammarAnalysisStrategy`~~, ~~`PunctuationAnalysisStrategy`~~ - **Removed 2026-08-05**; both go through the offline Grammalecte `GrammarChecker` — see Infrastructure/Lexical below
- `StyleAnalysisStrategy` - Style improvement suggestions via AI
- `RepetitionAnalysisStrategy` - Repeated word/phrase detection
- `createAnalysisStrategies` - Binds each `AnalysisCategory` to its strategy; throws on a category with none, so the author is never offered an analysis that cannot run

**Blog Use Cases** (Phase 4.0, 4.1+):
- `CreateBlogArticleUseCase`, `UpdateBlogArticleUseCase`, `DeleteBlogArticleUseCase`, `ListBlogArticlesUseCase`
- `LoadPublishedBlogArticlesPaginatedUseCase` - Paginated blog listing (Phase 4.1+)
- `RecordArticleViewUseCase` - Record article view with IP deduplication (Phase 5.2)

**Contact Use Cases** (Phase 3.11):
- `SubmitContactFormUseCase` - Save contact form submissions

**Legacy Use Cases**:
- `RewriteTextUseCase` - AI rewriting

### Infrastructure Layer (`src/infrastructure/`)

External service implementations.

**Document**:
- `DocxParser` - Mammoth-based parser with chapter splitting
- `MarkdownParser` - Single .md file parser to TipTap JSON (Phase 5.1)
- `MarkdownFolderParser` - Folder of .md files parser to chapters (Phase 5.1)
- `DocxExporter` - docx library exporter with full typography support, cover image, custom annexes, and endnotes rendered as native Word footnotes (Phase 3.7, 6.1; endnotes 2026-07-24)
- `PagedPdfExporter` - **Production PDF exporter** since 2026-06-28: headless Chromium + Paged.js (via `PlaywrightBrowserLauncher` + `PagedJsRenderer`), rendering the whole book through the publication-profile/semantic-content pipeline (see "Publication Profiles & Pagination" below). Wired in `infrastructure/config/providers.ts#getDocumentExporter()`.
  - `PdfExporter` (pdf-lib-based) - **superseded, now dead code**: no longer imported by `providers.ts` or any non-test file; kept only for its own test. Do not extend.
- `document/paged/` - Rendering subsystem backing `PagedPdfExporter` and the whole-book preview: `TipTapToBookHtml`, `BookCssBuilder`, `TocHtmlBuilder`, `FrontMatterHtmlBuilder`, `BackMatterHtmlBuilder`, `EndnotesHtmlBuilder`, French-spacing utilities (2026-06-28 – 07-19)
- `TipTapContentService` - TipTap content manipulation (Phase 4.1)
- TipTap conversion utilities (HTML ↔ JSON)

**AI**:
- `OpenAIProvider` - GPT-4o-mini/GPT-5 + 7 analysis types + generation + completion + `chatStream` + `generateCharacterSheet`; captures token usage (input/output/cached) including streaming via `stream_options.include_usage` (Phase 3.6, 4.1, 8.0, 9.0)
- `AnthropicProvider` - Claude + 7 analysis types + generation + `chatStream` + `generateCharacterSheet`; captures token usage via `message_start`/`message_delta` events for streaming; `generateCompletionStream` now accepts `intent`/`suggestionLength`/`audace` (Phase 3.6, 4.1, 8.0, 9.0, 10.0)
- `GoogleProvider` - Gemini + analysis + generation + `chatStream` + `generateCharacterSheet`; captures token usage via `usageMetadata` chunks; rewrites inject the author profile; updated for preference-driven completion (Phase 8.0, 9.0, 10.0)
- `LLMProviderFactoryImpl` - Factory for creating LLM providers (Phase 3.5)
- `TrackedLLMProvider` - LLM provider wrapper that tracks AI usage; pulls `getLastTokenUsage()` and `ModelPricing` cost onto the saved `AIUsageRecord` (Phase 6, 8.0, 9.0)
- `AnalysisLLMClient` - AI client for spelling, grammar, punctuation, and style analysis (Phase 7)

**Utils**:
- `UUIDGenerator` - IdGenerator implementation using crypto.randomUUID() (Phase 3.5)
- `MetadataCache` - TTL-based caching for metadata; also stores the built completion context string, keyed by project/chapter (Phase 4.1, 8.0)

> Note: `text-hash` (SHA-256 content hashing) moved to the **Application** layer (`src/application/utils/text-hash.ts`) in Phase 8.0 — the Application layer must not depend on Infrastructure.
- `formatReadingTime` - Calculate and format estimated reading time (Phase 4.1+)
- `ObjectIdGenerator` - MongoDB ObjectId generation for frontend (Phase 6)

**Encryption** (Phase 3.5):
- AES-256-GCM utilities - API key encryption/decryption
- Key masking utilities - Client-safe API key display
- HMAC token generation for approval links (Phase 3.8)
- `FieldEncryption` - AES-256-GCM encryption for transparency-ledger content fields; derives its key from `ENCRYPTION_KEY` via PBKDF2 with a distinct salt (domain-separated from API-key encryption)

**Email** (Phase 3.8):
- `ResendEmailService` - Email notifications via Resend API. Real methods: `sendRegistrationNotification`, `sendWelcomeEmail`, `sendPasswordResetEmail`, `sendPasswordChangedEmail`, `sendPricingSyncReport` (corrected 2026-07-29 — previously documented method names `sendApprovalRequest`/`sendApprovalConfirmation`/`sendRejectionNotification` do not exist in the current class)

**Authentication** (Phase 3, 3.8):
- `AuthJsProvider` - Auth.js implementation
- `auth-config` - NextAuth v5 configuration
- Middleware for route protection
- User approval workflow integration (Phase 3.8)

**Persistence** (Phase 3, 3.5, 3.6, 3.7, 4.0, 5.0, 6, 7, 10.0):
- `MongoDBProjectRepository` - MongoDB Atlas persistence with multi-tenant isolation, `findPublishedByToken()` (Phase 5.0)
- `MongoDBProviderRepository` - Provider storage with encrypted credentials (Phase 3.5)
- `MongoDBMetadataRepository` - Metadata storage with multi-tenant isolation (Phase 3.6)
- `MongoDBCorrectionHistoryRepository` - Correction history storage (Phase 3.7)
- `MongoDBBlogArticleRepository` - Blog article storage with `findAllPublishedPaginated()` (Phase 4.0, 4.1+)
- `MongoDBContactMessageRepository` - Contact form storage (Phase 3.11)
- `MongoDBUserRepository` - User management with bcrypt, approval, consent
- `MongoDBArticleViewRepository` - Article view tracking with IP-based deduplication (Phase 5.2)
- `MongoDBCharacterRepository` - Character storage with multi-tenant isolation (Phase 6)
- `MongoDBProjectSettingsRepository` - Project settings storage (Phase 6)
- `MongoDBProjectTaskRepository` - Task storage with filtering and sorting (Phase 6)
- `MongoDBResearchDocumentRepository` - Research document storage (Phase 6)
- `MongoDBWritingGoalRepository` - Writing goal storage (Phase 6)
- `MongoDBUsageRepository` - AI usage statistics with aggregation; stores `costEur` and `cachedInputTokens` (Phase 6, 9.0)
- `MongoDBCharacterConversationRepository` - Conversation storage with multi-tenant isolation (Phase 9.0)
- `MongoDBAutocompleteEventRepository` - Telemetry event persistence with aggregation by period/provider/outcome; TTL index for automatic purge (Phase 10.0)
- `MongoDBCanonFactRepository` - Canon fact persistence with `replaceDerived()` atomic bulk replace (Phase 10.0)
- `MongoDBRateLimitRepository` - Persistent sliding-window rate limiting for canon generation cooldown and telemetry ingestion (Phase 10.0)
- `MongoDBExchangeRepository` - AI exchange transparency ledger persistence with TTL index for automatic purge; content fields encrypted via `FieldEncryption`
- `MongoDBModelPricingRepository` - Model pricing entries persistence; queried by `TrackedLLMProvider` for cost snapshots
- `MongoDBWordCountSnapshotRepository` - Daily word-count snapshot persistence with TTL
- `MongoDBWritingQuotaRepository` - Writing quota persistence scoped by `ownerId`
- `MongoDBPasswordResetTokenRepository` - Password-reset token persistence (2026-01-31)
- `MongoDBSnapshotRepository` / `MongoDBAutomaticSnapshotRepository` - Project snapshot + automatic-snapshot scheduling persistence (2026-07-25 – 07-29)
- `MongoDBBookPreviewCacheRepository` - GridFS-backed whole-book PDF preview cache (2026-07-05)
- `MongoDBCustomAnnexRepository` - Custom front/back-matter annex persistence (2026-07-11)
- `MongoDBPresentationOverrideRepository` - Per-chapter presentation-override persistence (2026-06-28)
- `InMemoryProjectRepository` - Ephemeral storage (testing/legacy)
- All repositories support `deleteAllByOwner()` for RGPD compliance (Phase 3.11)
- Serialization utilities for all entity types

**Storage** (Phase 6):
- `VercelBlobStorage` - Cover image storage using Vercel Blob

**Lexical**:
- `ConjugationAwareThesaurus` - Implements `Thesaurus`; wraps `JeuxDeMotsThesaurus` with conjugation-aware lookup via `FrenchMorphology`
- `JeuxDeMotsThesaurus` - Fetches synonyms from the JeuxDeMots French thesaurus API
- `FrenchMorphology` - Implements `Morphology`; French lemmatisation via the lexique index
- `NspellSpellChecker` - Implements `SpellChecker`; offline dictionary-based spell-check via **nspell + fr-FR dictionary**, zero AI tokens (2026-06-23 – 06-25)
- `GrammalecteGrammarChecker` - Implements `GrammarChecker` over the pinned private `@francoisnoel62/grammalecte` build. The engine is a process-wide singleton whose spell checker caches every word's morphology, so the adapter swaps dictionary and clears that cache in one synchronous block — an `await` there would let another project's request slip its own vocabulary in (2026-08-05)
- `GrammalecteDictionaryCompiler` - Implements `GrammarDictionaryCompiler` via Graphspell's DAWG builder. That builder ships as a browser-worker script with no module exports, so its source is evaluated with `require`/`helpers`/`console` bound (2026-08-05)

**Pricing**:
- `OpenRouterPricingClient` - Implements `PricingClient`; fetches model pricing from the OpenRouter public API; normalises provider/prefix keys

**Encryption** (Phase 10.0+):
- `FieldEncryption` - AES-256-GCM encryption for transparency-ledger content fields (PBKDF2, domain-separated from API-key encryption)
- `exchange-truncation` - Trims oversized system prompts, inputs, and outputs before persistence in `MongoDBExchangeRepository`

**Security** (Phase 6.1):
- `HCaptchaVerifier` - hCaptcha verification for bot protection
- `InMemoryRateLimiter` - Rate limiting with sliding window (5 requests/IP/hour)
- `canon-facts-parsing` - Parses raw LLM output into `CanonFact[]`; tolerant to partial/malformed responses (Phase 10.0)
- `infrastructure/config/providers.ts` - Centralised model-per-operation configuration; fast models (Flash, Haiku) for autocomplete, standard for analysis (Phase 10.0)

**Prompts** (Phase 3.6, 4.1):
- `FilePromptRepository` - Load AI prompts from markdown files in `/docs/prompt/`

**Configuration**:
- Environment configuration (ENCRYPTION_KEY, RESEND_API_KEY, ADMIN_EMAIL)
- Database connection management
- Provider factory pattern
- Centralized AI models configuration (Phase 3.5)

### Interface Layer (`src/app/`, `src/components/`)

React components and UI.

**Pages**:
- `page.tsx` - Editor page with header (project title, DocumentControls, UserMenu)
- `dashboard/page.tsx` - Project management dashboard (CreateProjectDialog)
- `project/[projectId]/metadata/page.tsx` - Metadata list page (Phase 3.6)
- `project/[projectId]/metadata/[metadataId]/page.tsx` - Metadata editor (Phase 3.6)
- `auth/signin/page.tsx` - Sign-in page (French, Phase 3.9)
- `auth/signup/page.tsx` - Sign-up page (French, consent checkbox, Phase 3.9, 3.11)
- `blog/page.tsx` - Blog list page (Phase 4.0)
- `blog/[slug]/page.tsx` - Blog article page (Phase 4.0)
- `admin/blog/page.tsx` - Admin blog management (Phase 4.0)
- `settings/page.tsx` - User settings (account deletion, data export, Phase 3.11)
- `mentions-legales/page.tsx` - Legal mentions (Phase 3.11)
- `politique-confidentialite/page.tsx` - Privacy policy (Phase 3.11)
- `politique-cookies/page.tsx` - Cookie policy (Phase 3.11)
- `cgu/page.tsx` - Terms of use (Phase 3.11)
- `cgv/page.tsx` - Terms of sale (Phase 3.11)
- `read/[projectId]/[token]/page.tsx` - Public reader for published projects (Phase 5.0)
- `project/[projectId]/cockpit/*` - Cockpit pages (overview, characters, metadata, objectives, research, settings, tasks, usage, canon) (Phase 6, 10.0)
- `project/[projectId]/cockpit/canon/page.tsx` - Canon ledger: list extracted facts, validate/invalidate, trigger regeneration (Phase 10.0)
- `historique-ia/page.tsx` - User-facing AI transparency ledger: browsing and searching captured exchanges
- `guide/*/page.tsx` - Full user guide (editor, cockpit, characters, manuscript, analyses, providers, assistant, privacy)
- `admin/pricing/page.tsx` - Admin panel for model pricing: sync, prune, and manual override
- `api/approve/route.ts` - User approval endpoint (Phase 3.8)
- `api/completion/stream/route.ts` - Autocompletion SSE endpoint; accepts `intent`/`suggestionLength`/`audace`; injects preference directives + canon context (Phase 4.1, 10.0)
- `api/completion/telemetry/route.ts` - Receives autocomplete lifecycle events from the client; sliding-window rate-limited (Phase 10.0)
- `api/completion/telemetry/stats/route.ts` - Returns aggregated autocomplete metrics per project (acceptance rate, latency by provider) (Phase 10.0)
- `api/character-chat/stream/route.ts` - Character chat SSE endpoint; emits a `meta` event (conversationId) then streams character reply chunks (Phase 9.0)
- `auth/forgot-password/page.tsx`, `auth/reset-password/page.tsx` - Password-reset request/reset flow (2026-01-31)
- `book-preview/page.tsx` - Whole-book preview: cached, server-generated (Chromium/Paged.js) export PDF in an iframe viewer, profile switcher, `#page=N` navigation, "passerelle" fallback mode (2026-06-30 – 07-05)
- `api/book-preview/pdf/route.ts` - Streams the cached whole-book PDF from GridFS for the authenticated owner (2026-07-05)
- `api/cron/sync-pricing/route.ts` - Daily cron (06:00 UTC) triggering `SyncModelPricingUseCase`, emails a report
- `editor/paged-spike/page.tsx` + `api/paged-spike/export/route.ts` - Experimental route that validated the paginated-preview pipeline before production; 404s in production, kept as a reference implementation

**Components**:
- **Auth**: `UserMenu` - User profile dropdown with sign-out and provider access
- **Dashboard**: `CreateProjectDialog`, `ProjectCard`, `EmptyState`, `NoProvidersAlert`
- **Editor**: `TextEditor` (TipTap + CharacterCount + Autocomplete + IndentHeading), `FormattingToolbar` (with undo/redo buttons); `AutocompleteDot` (breathing dot indicator for prefetched suggestions); `autocompleteHint`, `autocompleteTelemetry`, `suggestionSegments` extension helpers (Phase 10.0)
- **Navigation**: `ChaptersSheet` - Chapter navigation with drag & drop
- **Proposals**: `ProposalsSheet`, `LoadingOverlay` (author quotes, Phase 3.7)
- **Providers**: `ProvidersDialog`, `ProviderForm`, `ProviderCard`
- **Metadata**: `GenerateCard`, `MetadataCard` (Phase 3.6)
- **History**: `CorrectionHistoryDialog`, `CorrectionHistoryTable` (Phase 3.7)
- **Blog**: `BlogCard`, `BlogArticle`, `BlogPagination` (Phase 4.0, 4.1+)
- **Legal**: `CookieConsent` (3 variants), `ContactForm` (Phase 3.11)
- **Generation**: `FloatingGenerationMenu` (Phase 4.1)
- **AI Menu**: `AIMenuDropdown`, `CommandPalette` (Ctrl+Shift+I) (Phase 4.1+)
- **Navigation**: `ProjectSettingsMenu` - Dropdown in the editor header for quick access to all cockpit sections (Phase 9.0)
- **Publishing**: `PublishDialog` (with chapter selection), `PublicReader` (with cover image) (Phase 5.0, 6.1)
- **Cockpit**: `CockpitSidebar`, `StatCard`, `ProgressCard`, `QuickActionsCard`, `QuickActionButton` (Phase 6); `AutocompletePreferencesCard` (6 per-project autocomplete settings), `AutocompleteStatsCard` (telemetry metrics dashboard), `CanonExtractionPreferencesCard` (auto vs manual trigger), `NotificationBell` (canon-stale alerts), `ActivityChart`, `MilestoneMetricsCard`, `TodayPaceCard`, `QuotaCard`, `QuotaForm` (Phase 10.0)
- **Transparency**: `AIExchangeLedger` (browsable list of captured exchanges), `AIExchangeLoggingCard` (opt-in toggle)
- **Admin**: `ModelPricingTable`, `ModelPricingForm`, `SyncButton`, `PruneButton`
- **Editor**: `ThesaurusPalette` - palette for browsing and inserting word alternatives via the conjugation-aware thesaurus
- **Editor**: `SpellCheckPalette`, `SpellCheckExtension` - red-underline offline spell-check UI (nspell); `SpellCheckSettingsCard` manages the custom dictionary/ignored words (2026-06-23 – 06-25)
- **Editor**: `EndnoteModal`, `EndnotesPanel`, `EndnoteRef` (TipTap extension) - endnote insertion, reading bubble, per-chapter management panel (2026-07-24 – 07-29)
- **Editor**: `PublicationPreview`, `PublicationProfileSelector`, `LevelStylesPanel`, `BackgroundPageCounter` - in-editor paginated preview, profile switching, per-profile typography controls (2026-06-28 – 07-05)
- **History**: `SnapshotHistoryDialog`, `SnapshotComparisonDialog` - create/consult/restore snapshots; structural then textual diff against the current state (2026-07-25 – 07-29), distinct from `CorrectionHistoryDialog` (AI-rewrite history)
- **Editorial**: `EditorialCard`, `EditorialEditor`, `CustomAnnexSection` - front/back-matter annexes, including author-defined custom annexes (2026-07-11)
- **Characters**: `CharacterCard` (with Chat button opening CharacterChatSheet), `CharacterForm` (with Auto-fill button), `CharacterChatSheet` (streaming chat sheet) (Phase 6, 9.0)
- **Tasks**: `TaskForm`, `TaskRow`, `TaskSummaryCard` (Phase 6)
- **Goals**: `GoalCard`, `GoalForm` (Phase 6)
- **Usage**: `UsageStatsCard` (now shows euro cost and cached-token count), `DailyUsageChart`, `UsageByOperationChart` (Phase 6, 9.0)
- **Settings**: `ProjectSettingsForm`, `CoverImageUpload`, `ContributorsField`, `RelatedWorksField` (Phase 6)
- **Research**: `ResearchDocumentCard`, `ResearchDocumentForm` (Phase 6)
- **Analysis**: `ChapterAnalysisPanel`, `AnalysisCategoryTabs`, `AnalysisConfigDialog`, `AnalysisIssueCard`, `AnalysisSummaryCard` (Phase 7)
- **Document**: `DocumentControls` (DOCX/PDF export with chapter selection), `SaveStatus`, `ExportDialog`
- **Publish**: `PublishDialog` (with chapter selection), `PublicReader` (with cover image)
- **UI**: shadcn/ui components (Sheet, Button, Card, Dialog, Input, Label, Sidebar, Tabs, Chart, Breadcrumb, etc.)

**State**:
- `projectStore` - Zustand store (server-backed)

**Server Actions** (all delegate to Use Cases):
- `project-actions` - Create, load, update, delete, rename (→ Project Use Cases)
- `publish-actions` - Publish, unpublish, load published, get status (→ Publishing Use Cases, Phase 5.0)
- `chapter-actions` - Add, remove, update, reorder, import folder (→ Chapter Use Cases)
- `auth-actions` - Sign in, sign up, sign out (→ RegisterUserUseCase)
- `provider-actions` - CRUD + test connections (→ Provider Use Cases)
- `metadata-actions` - CRUD + generate analyses (→ Metadata Use Cases, Phase 3.6)
- `correction-history-actions` - Save, list, delete (→ CorrectionHistory Use Cases, Phase 3.7)
- `blog-actions` - Blog article CRUD + paginated listing (→ Blog Use Cases, Phase 4.0, 4.1+)
- `contact-actions` - Contact form submission (→ SubmitContactFormUseCase, Phase 3.11)
- `user-actions` - Account deletion, data export (→ DeleteUserAccountUseCase, Phase 3.11)
- `cockpit-actions` - Cockpit overview data loading (→ Phase 6)
- `task-actions` - Task CRUD operations (→ ProjectTask Use Cases, Phase 6)
- `usage-actions` - AI usage statistics (→ AIUsage Use Cases, Phase 6)
- `writing-goal-actions` - Writing goal CRUD (→ WritingGoal Use Cases, Phase 6)
- `character-actions` - Character CRUD + sync (→ Character Use Cases, Phase 6)
- `character-conversation-actions` - Create, list, load, delete conversations (→ CharacterConversation, Phase 9.0)
- `research-document-actions` - Research document CRUD (→ ResearchDocument Use Cases, Phase 6)
- `project-settings-actions` - Project settings CRUD including autocomplete preferences (→ ProjectSettings Use Cases, Phase 6, 10.0)
- `canon-actions` - Generate, list, validate, invalidate, and delete canon facts (→ GenerateCanonFactsUseCase, Phase 10.0)
- `writing-quota-actions` - Writing quota CRUD (→ WritingQuota Use Cases)
- `word-count-tracking` - Record word-count snapshots (→ RecordWordCountSnapshotUseCase)
- `exchange-actions` - Load exchange history for the transparency ledger (→ AIExchangeRepository). **Architecture note**: no Application-layer use case *writes* an `AIExchange` — `AIExchangeRepository` is referenced only by `DeleteUserAccountUseCase` (cascade delete). The write path lives outside the Application layer's use-case pattern (directly where providers are invoked), which is an acknowledged deviation from the Clean Architecture flow used elsewhere and worth revisiting.
- `thesaurus-actions` - Suggest word alternatives (→ SuggestAlternativesUseCase)
- `pricing-admin-actions` - Trigger pricing sync and prune (→ SyncModelPricingUseCase, PruneObsoletePricingUseCase)
- `analysis-actions` - Chapter analysis operations (→ Analysis Use Cases, Phase 7)
- `spell-check-actions` - Offline spell-check via `SpellChecker`/nspell (2026-06-23)
- `personal-dictionary-actions` - Read and write a project's declared vocabulary (→ UpdatePersonalDictionaryUseCase, 2026-08-05)
- `password-actions` - Request/reset/change password (→ Password Reset Use Cases, 2026-01-31)
- `snapshot-actions` - Snapshot creation, listing/metadata, deletion, restore (→ Snapshot Use Cases, 2026-07-25 – 07-29)
- `book-preview-actions` - Lazily generates/caches the whole-book export PDF, returns navigation metrics (2026-06-30 – 07-05)
- `presentation-override-actions` - Save/load "passerelle"-only presentation overrides (2026-06-28)
- `custom-annex-actions` - CRUD + reordering for author-inserted custom annexes (2026-07-11)
- `editorial-actions` - List/save/delete editorial front/back-matter annexes (2026-07-11)

**Dependency Injection** (`utils.ts`):
- `getRepository()` - Project repository
- `getProviderRepo()` - Provider repository
- `getUserRepo()` - User repository
- `getMetadataRepo()` - Metadata repository (Phase 3.6)
- `getCorrectionHistoryRepo()` - Correction history repository (Phase 3.7)
- `getBlogArticleRepo()` - Blog article repository (Phase 4.0)
- `getContactMessageRepo()` - Contact message repository (Phase 3.11)
- `getPromptRepo()` - Prompt repository (Phase 3.6)
- `getEmailService()` - Email service (Phase 3.8)
- `getLLMProviderFactory()` - LLM provider factory
- `getIdGenerator()` - UUID generator
- `getCharacterRepo()` - Character repository (Phase 6)
- `getProjectSettingsRepo()` - Project settings repository (Phase 6)
- `getProjectTaskRepo()` - Project task repository (Phase 6)
- `getResearchDocumentRepo()` - Research document repository (Phase 6)
- `getWritingGoalRepo()` - Writing goal repository (Phase 6)
- `getUsageRepo()` - AI usage repository (Phase 6)
- `getBlobStorage()` - Blob storage for images (Phase 6)
- `getCharacterConversationRepo()` - Character conversation repository (Phase 9.0)
- `getAutocompleteEventRepo()` - Autocomplete event telemetry repository (Phase 10.0)
- `getCanonFactRepo()` - Canon fact repository (Phase 10.0)
- `getCanonExtractionStateRepo()` - Canon extraction state repository (Phase 10.0)
- `getRateLimitRepo()` - Persistent rate limit repository (Phase 10.0)
- `getAIExchangeRepo()` - AI exchange transparency ledger repository
- `getModelPricingRepo()` - Model pricing repository
- `getWordCountSnapshotRepo()` - Word-count snapshot repository
- `getWritingQuotaRepo()` - Writing quota repository
- `getPricingClient()` - `OpenRouterPricingClient` instance (implements `PricingClient`)

**Hooks**:
- `useAutosave` - Auto-save hook with 1-second debounce
- `useHasAIProviders` - Check provider availability (Phase 3.10)
- `useMobile` - Mobile device detection hook (Phase 6)
- `useCharacterChat` - SSE connection management, message state, and conversation persistence for character chat (Phase 9.0)
- `useSessionEndTrigger` - Detects idle time / tab-visibility loss and fires background canon extraction (Phase 10.0)
- `useCanonFreshnessCheck` - Polls canon staleness and dispatches a notification when stale (Phase 10.0)

**State**:
- `notificationStore` - Zustand store for in-app notifications (e.g. canon-stale alert with actionable "regenerate" CTA)

## Data Flow

### Authentication Flow (Phase 3)

```
User visits sign-up page
  → Enters email/password
  → Server Action (signUpAction)
  → MongoDBUserRepository.createUser()
  → Password hashed with bcrypt
  → User stored in MongoDB
  → Session created
  → Redirect to dashboard

User visits sign-in page
  → Enters credentials
  → Auth.js validates
  → MongoDBUserRepository.findByEmail()
  → Password verified
  → Session created with JWT
  → Redirect to dashboard

Middleware on protected routes
  → Checks session
  → Redirects to sign-in if unauthenticated
```

### Dashboard Flow (Phase 3)

```
User lands on dashboard
  → Server Action loads projects
  → MongoDBProjectRepository.listProjects(userId)
  → Projects displayed as cards

User creates project
  → Click "Créer un projet"
  → Server Action (createProjectAction)
  → Project entity created with ownerId
  → MongoDBProjectRepository.createProject()
  → Redirect to editor with project ID

User opens project
  → Click project card
  → Navigate to /editor?project={id}
  → Editor loads project
```

### Import Flow

```
User selects file
  → Server Action (importDocument)
  → DocxParser.parseToChapters()
  → mammoth.convertToHtml()
  → htmlToTipTapJSON()
  → Chapter entities created
  → Project aggregate updated
  → MongoDBProjectRepository.updateProject()
  → Store updated
  → UI renders
```

### Edit Flow (Phase 3 - Auto-save)

```
User types in editor
  → TipTap onUpdate event
  → editor.getJSON()
  → Store.updateActiveContent()
  → useAutosave hook triggered
  → 1-second debounce
  → Server Action (updateChapterAction)
  → MongoDBProjectRepository.updateChapter()
  → SaveStatus shows "Saved"
```

### Export Flow

```
User clicks Export
  → Store.saveCurrentChapter()
  → Serialize project
  → Server Action (exportProject)
  → DocxExporter.exportProject()
  → TipTap JSON → DOCX
  → Buffer returned
  → Browser downloads file
```

## Key Design Decisions

### Single Editor Instance

We use one TipTap editor and call `setContent()` to switch chapters.

**Rationale**: Creating/destroying editors is expensive (8+ seconds for 30+ instances).

**Trade-off**: Undo/redo history is shared across chapters.

### TipTap JSON as Storage Format

We store content as stringified TipTap JSON.

**Benefits**:
- Structured, parseable
- Direct mapping to/from editor
- Ready for search, analysis
- Compatible with MongoDB

**Trade-offs**:
- Larger than plain text
- Requires conversion to/from DOCX

### Zustand for State Management

We use Zustand instead of Redux or Context.

**Rationale**:
- Lightweight (< 1KB)
- Simple API
- Good TypeScript support
- No boilerplate

### Database-Agnostic Repository (Phase 3 Implemented)

We use Repository pattern for swappable persistence.

**Phase 2**: InMemoryProjectRepository (ephemeral)
**Phase 3**: MongoDBProjectRepository (MongoDB Atlas) ✅

**Benefit**: Zero changes needed to use cases or store when swapping implementations. The Clean Architecture design allowed Phase 3 to add MongoDB persistence without refactoring any business logic.

**Multi-Tenant Isolation**: All MongoDB queries filter by `ownerId` to ensure complete data isolation between users. No user can access another user's projects.

## Performance Optimizations

1. **Editor**: `shouldRerenderOnTransaction: false`
2. **Store**: Shallow equality checks
3. **TipTap**: `immediatelyRender: false` for SSR
4. **Chapter Switching**: Use `setContent()`, don't destroy/recreate

## Testing Strategy

- **Unit Tests**: Domain and application layers (~1000+ tests)
- **Integration Tests**: Infrastructure and store (~600+ tests including 35+ provider-specific)
- **E2E Tests**: Complete workflows with auth seeding (Playwright)
- **AI Efficiency Tests**: Manual workflow tests A–D (`tests_ia_efficiency/`) validating contextual AI behaviour across providers
- **Coverage Achieved**: 92%+ domain entities, 100% use cases
- **Total Tests**: 1700+ passed (1750+ total, 200+ test files)

---

## Changelog

For phase-by-phase implementation history, see [CHANGELOG.md](CHANGELOG.md).
