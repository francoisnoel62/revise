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
- `AIExchange` - Captured content of one AI exchange (system prompt, input, raw output) for the transparency ledger; stored separately from `AIUsageRecord`, encrypted at rest, opt-in, with retention/TTL purge. See [transparency-ledger.md](transparency-ledger.md)
- `AutocompleteEvent` - Full lifecycle of one autocomplete suggestion (triggered → displayed → accepted/rejected/expired); carries provider, model, latency, outcome, and session identifiers for telemetry (Phase 10.0)
- `CanonFact` - Established fact extracted from the manuscript (character, location, relation, event); tracks source (`derived` | `authored`), validity, and the chapter it was extracted from; author can validate or invalidate (Phase 10.0)
- `ChapterAnalysis` - Complete chapter analysis result with issues, repetitions, statistics (Phase 7)
- `CharacterConversation` - Persisted conversation between the author and a character persona; owns an ordered list of `ChatMessage` value objects (Phase 9.0)
- `TextDocument` - Legacy single document (Phase 1)

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
- `AutocompleteIntent` - Detected intention of the writing context (`dialogue`, `description`, `action`, `introspection`, `other`); drives variant generation (Phase 10.0)
- `AutocompleteOutcome` - Result of a suggestion (`accepted_full`, `accepted_partial`, `rejected`, `expired`, `ignored`) (Phase 10.0)
- `CanonFacts` - Typed collection of `CanonFact` items (Phase 10.0)
- `CanonFactSource` - Enum for fact provenance: `derived` (LLM-extracted) | `authored` (manually added) (Phase 10.0)
- `AIOperationPolicy` - Maps `AIOperationType` to provider selection policy (fast vs standard models); autocomplete always uses fast models (Phase 10.0)

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
- `RateLimitRepository` - Generic persistent sliding-window rate limiting (replaces in-memory for canon generation and telemetry ingestion) (Phase 10.0)
- `CaptchaVerifier` - CAPTCHA verification abstraction (Phase 6.1)
- `AuthProvider` - Authentication service abstraction
- `EmailService` - Email notification service (Phase 3.8)
- `ApprovalTokenGenerator` - HMAC token generation for approval links (Phase 3.8)
- `ContentConverter` - TipTap content conversion abstraction (Phase 4.1)
- `FolderParser` - Folder parsing abstraction for multi-file imports (Phase 5.1)
- `PaginatedResult` - Pagination result interface for blog articles (Phase 4.1+)
- `IdGenerator` - UUID generation abstraction (Phase 3.5)
- `LLMProviderFactory` - Factory for creating LLM providers (Phase 3.5)

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
- `DeleteUserAccountUseCase` - Account deletion with cascade delete (Phase 3.11)

**Metadata Use Cases** (Phase 3.6, 3.7):
- **CRUD**: `CreateMetadata`, `LoadMetadata`, `ListMetadata`, `UpdateMetadataContent`, `UpdateMetadataTitle`, `DeleteMetadata`
- **Generation**: `GenerateNarrativeAnalysis`, `GenerateCharacters`, `GeneratePlot`, `GenerateStylisticDNA`, `GenerateWorldbuilding`, `GenerateChapterSummaries`, `GenerateSynthesis` (all with intelligent caching)

**AI Generation Use Cases** (Phase 4.1, 10.0):
- `GenerateChapterUseCase` - Generate chapter content from metadata context
- `GenerateCompletionUseCase` - Generate autocompletion suggestions
- `GenerateCanonFactsUseCase` - Extract canon facts from manuscript via LLM, atomically replace derived facts, enforces per-project cooldown (Phase 10.0)

**Character Chat Use Cases** (Phase 9.0):
- `ChatWithCharacterUseCase` - Streaming use case; builds the character persona via `AIContextBuilder.buildCharacterPersona`, hydrates/creates the conversation, streams reply via `LLMProvider.chatStream`, persists the accumulated reply. Returns an `AsyncIterableIterator` of text chunks. History capped at 20 messages.
- `GenerateCharacterSheetUseCase` - Loads character + manuscript + metadata; calls `LLMProvider.generateCharacterSheet`; returns 8 filled-in character fields without persisting (author decides what to keep)

**AI Context Strategy** (Phase 8.0, 10.0):
- `AIContextBuilder` (service) - Centralized metadata → prompt projection; produces ready-to-inject
  context blocks (completion / chapter / rewrite / character persona), applies "author edit wins", projects research docs by locality
- `AutocompleteContextBuilder` (service) - Builds cursor-anchored local window for completions; injects relevant canon facts when `CANON_CONTEXT_ENABLED`; replaces chapter-tail context (Phase 10.0)
- `autocompleteIntents` (service) - Translates detected `AutocompleteIntent` into a prompt directive string (Phase 10.0)
- `canonEntities` (service) - Selects and formats canon facts relevant to the current context (Phase 10.0)
- `CheckMetadataFreshnessUseCase` - Read-only staleness check (manuscript hash vs stored metadata hash); never regenerates
- `extractProjectFullText` (`services/project-text.ts`) - Canonical project text extraction shared by generation and freshness check
- `text-hash` (`utils/text-hash.ts`) - SHA-256 content hashing (moved from Infrastructure to respect layer boundaries)

**Chapter Verification Use Cases** (Phase 7):
- `AnalyzeChapterUseCase` - Orchestrates analysis strategies (in-memory results, no persistence)
- `ApplyCorrectionUseCase` - Apply a single correction to chapter content
- `ApplyBatchCorrectionsUseCase` - Apply multiple corrections in batch

**Analysis Strategies** (Phase 7):
- `SpellingAnalysisStrategy` - Spelling error detection via AI
- `GrammarAnalysisStrategy` - Grammar issue detection via AI
- `PunctuationAnalysisStrategy` - Punctuation error detection via AI
- `StyleAnalysisStrategy` - Style improvement suggestions via AI
- `RepetitionAnalysisStrategy` - Repeated word/phrase detection

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
- `DocxExporter` - docx library exporter with full typography support and cover image
- `PdfExporter` - PDF export with full typography, cover image, and word-based text justification (Phase 3.7, 6.1)
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
- `ResendEmailService` - Email notifications via Resend API

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
- `InMemoryProjectRepository` - Ephemeral storage (testing/legacy)
- All repositories support `deleteAllByOwner()` for RGPD compliance (Phase 3.11)
- Serialization utilities for all entity types

**Storage** (Phase 6):
- `VercelBlobStorage` - Cover image storage using Vercel Blob

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
- `api/approve/route.ts` - User approval endpoint (Phase 3.8)
- `api/completion/stream/route.ts` - Autocompletion SSE endpoint; accepts `intent`/`suggestionLength`/`audace`; injects preference directives + canon context (Phase 4.1, 10.0)
- `api/completion/telemetry/route.ts` - Receives autocomplete lifecycle events from the client; sliding-window rate-limited (Phase 10.0)
- `api/completion/telemetry/stats/route.ts` - Returns aggregated autocomplete metrics per project (acceptance rate, latency by provider) (Phase 10.0)
- `api/character-chat/stream/route.ts` - Character chat SSE endpoint; emits a `meta` event (conversationId) then streams character reply chunks (Phase 9.0)

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
- **Cockpit**: `CockpitSidebar`, `StatCard`, `ProgressCard`, `QuickActionsCard`, `QuickActionButton` (Phase 6); `AutocompletePreferencesCard` (6 per-project autocomplete settings), `AutocompleteStatsCard` (telemetry metrics dashboard) (Phase 10.0)
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
- `analysis-actions` - Chapter analysis operations (→ Analysis Use Cases, Phase 7)

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
- `getRateLimitRepo()` - Persistent rate limit repository (Phase 10.0)

**Hooks**:
- `useAutosave` - Auto-save hook with 1-second debounce
- `useHasAIProviders` - Check provider availability (Phase 3.10)
- `useMobile` - Mobile device detection hook (Phase 6)
- `useCharacterChat` - SSE connection management, message state, and conversation persistence for character chat (Phase 9.0)

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
