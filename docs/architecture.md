# Revise - Architecture Documentation

## Overview

Revise follows Clean Architecture principles with clear layer separation.

## Layer Structure

### Domain Layer (`src/domain/`)

Pure business logic with no framework dependencies.

**Entities**:
- `Chapter` - Single chapter with rich text content (TipTap JSON)
- `Project` - Aggregate managing chapter collection with owner tracking, publishing support (shareToken, isPublished, publishedAt), cover image (coverImageUrl)
- `ProjectMetadata` - Metadata document with TipTap JSON content and content hash (Phase 3.6)
- `Provider` - AI provider configuration with encrypted credentials (Phase 3.5)
- `User` - User entity with email, hashed password, approval status, and consent timestamps (Phase 3.8, 3.11)
- `CorrectionHistory` - AI rewrite history entry with proposals (Phase 3.7)
- `BlogArticle` - Blog article with slug, content, and metadata (Phase 4.0)
- `ContactMessage` - Contact form submission (Phase 3.11)
- `ArticleView` - Blog article view tracking with IP and timestamp (Phase 5.2)
- `Character` - Fictional character with name, aliases, description, traits, goals, relationships (Phase 6)
- `ProjectSettings` - Project settings with genre, themes, narration settings, contributors, related works (Phase 6)
- `ProjectTask` - Task with title, description, priority, status, due date, contributors (Phase 6)
- `ResearchDocument` - Research document with title, content, tags (Phase 6)
- `WritingGoal` - Writing goal with target word count, deadline, progress (Phase 6)
- `AIUsageRecord` - AI usage tracking with operation type, tokens, cost (Phase 6)
- `ChapterAnalysis` - Complete chapter analysis result with issues, repetitions, statistics (Phase 7)
- `AnalysisHistory` - Tracks analysis runs and corrections over time (Phase 7)
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
- `RepetitionExclusions` - User-defined words to exclude from repetition analysis (Phase 7)
- `StyleRigor` - Analysis strictness level (strict, balanced, light) (Phase 7)

**Interfaces**:
- `DocumentParser` - Parse documents to entities
- `DocumentExporter` - Export entities to documents
- `LLMProvider` - AI rewriting + 7 metadata analysis methods + chapter generation + completion (Phase 3.6, 4.1)
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
- `BlobStorage` - Blob storage abstraction for images (Phase 6)
- `RateLimiter` - Rate limiting abstraction for registration protection (Phase 6.1)
- `CaptchaVerifier` - CAPTCHA verification abstraction (Phase 6.1)
- `AuthProvider` - Authentication service abstraction
- `EmailService` - Email notification service (Phase 3.8)
- `ApprovalTokenGenerator` - HMAC token generation for approval links (Phase 3.8)
- `ContentConverter` - TipTap content conversion abstraction (Phase 4.1)
- `FolderParser` - Folder parsing abstraction for multi-file imports (Phase 5.1)
- `PaginatedResult` - Pagination result interface for blog articles (Phase 4.1+)
- `IdGenerator` - UUID generation abstraction (Phase 3.5)
- `LLMProviderFactory` - Factory for creating LLM providers (Phase 3.5)
- `AnalysisRepository` - Analysis results, history, and exclusions persistence (Phase 7)

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

**AI Generation Use Cases** (Phase 4.1):
- `GenerateChapterUseCase` - Generate chapter content from metadata context
- `GenerateCompletionUseCase` - Generate autocompletion suggestions

**Chapter Verification Use Cases** (Phase 7):
- `AnalyzeChapterUseCase` - Orchestrates analysis with caching and exclusions
- `ApplyCorrectionUseCase` - Apply a single correction to chapter content
- `ApplyBatchCorrectionsUseCase` - Apply multiple corrections in batch
- `IgnoreAnalysisIssueUseCase` - Mark an issue as ignored
- `GetAnalysisDiffUseCase` - Generate diff between original and corrected content
- `ExportAnalysisReportUseCase` - Export analysis results as markdown report
- `ManageRepetitionExclusionsUseCase` - Add/remove words from exclusion list
- `SaveChapterAnalysisHistoryUseCase` - Save analysis history entry
- `ListChapterAnalysisHistoryUseCase` - List analysis history for a chapter

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
- `OpenAIProvider` - GPT-4o-mini/GPT-5 + 7 analysis types + generation + completion (Phase 3.6, 4.1)
- `AnthropicProvider` - Claude + 7 analysis types + generation (Phase 3.6, 4.1)
- `LLMProviderFactoryImpl` - Factory for creating LLM providers (Phase 3.5)
- `TrackedLLMProvider` - LLM provider wrapper that tracks AI usage (Phase 6)
- `AnalysisLLMClient` - AI client for spelling, grammar, punctuation, and style analysis (Phase 7)

**Utils**:
- `UUIDGenerator` - IdGenerator implementation using crypto.randomUUID() (Phase 3.5)
- `text-hash` - SHA-256 content hashing for cache invalidation (Phase 3.6)
- `MetadataCache` - TTL-based caching for metadata (Phase 4.1)
- `formatReadingTime` - Calculate and format estimated reading time (Phase 4.1+)
- `ObjectIdGenerator` - MongoDB ObjectId generation for frontend (Phase 6)

**Encryption** (Phase 3.5):
- AES-256-GCM utilities - API key encryption/decryption
- Key masking utilities - Client-safe API key display
- HMAC token generation for approval links (Phase 3.8)

**Email** (Phase 3.8):
- `ResendEmailService` - Email notifications via Resend API

**Authentication** (Phase 3, 3.8):
- `AuthJsProvider` - Auth.js implementation
- `auth-config` - NextAuth v5 configuration
- Middleware for route protection
- User approval workflow integration (Phase 3.8)

**Persistence** (Phase 3, 3.5, 3.6, 3.7, 4.0, 5.0, 6, 7):
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
- `MongoDBUsageRepository` - AI usage statistics with aggregation (Phase 6)
- `MongoDBAnalysisRepository` - Chapter analysis results and history storage (Phase 7)
- `InMemoryProjectRepository` - Ephemeral storage (testing/legacy)
- All repositories support `deleteAllByOwner()` for RGPD compliance (Phase 3.11)
- Serialization utilities for all entity types

**Storage** (Phase 6):
- `VercelBlobStorage` - Cover image storage using Vercel Blob

**Security** (Phase 6.1):
- `HCaptchaVerifier` - hCaptcha verification for bot protection
- `InMemoryRateLimiter` - Rate limiting with sliding window (5 requests/IP/hour)

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
- `project/[projectId]/cockpit/*` - Cockpit pages (overview, characters, metadata, objectives, research, settings, tasks, usage) (Phase 6)
- `api/approve/route.ts` - User approval endpoint (Phase 3.8)
- `api/completion/stream/route.ts` - Autocompletion SSE endpoint (Phase 4.1)

**Components**:
- **Auth**: `UserMenu` - User profile dropdown with sign-out and provider access
- **Dashboard**: `CreateProjectDialog`, `ProjectCard`, `EmptyState`, `NoProvidersAlert`
- **Editor**: `TextEditor` (TipTap + CharacterCount + Autocomplete + IndentHeading), `FormattingToolbar` (with undo/redo buttons)
- **Navigation**: `ChaptersSheet` - Chapter navigation with drag & drop
- **Proposals**: `ProposalsSheet`, `LoadingOverlay` (author quotes, Phase 3.7)
- **Providers**: `ProvidersDialog`, `ProviderForm`, `ProviderCard`
- **Metadata**: `GenerateCard`, `MetadataCard` (Phase 3.6)
- **History**: `CorrectionHistoryDialog`, `CorrectionHistoryTable` (Phase 3.7)
- **Blog**: `BlogCard`, `BlogArticle`, `BlogPagination` (Phase 4.0, 4.1+)
- **Legal**: `CookieConsent` (3 variants), `ContactForm` (Phase 3.11)
- **Generation**: `FloatingGenerationMenu` (Phase 4.1)
- **AI Menu**: `AIMenuDropdown`, `CommandPalette` (Ctrl+Shift+I) (Phase 4.1+)
- **Publishing**: `PublishDialog` (with chapter selection), `PublicReader` (with cover image) (Phase 5.0, 6.1)
- **Cockpit**: `CockpitSidebar`, `StatCard`, `ProgressCard`, `QuickActionsCard`, `QuickActionButton` (Phase 6)
- **Characters**: `CharacterCard`, `CharacterForm` (Phase 6)
- **Tasks**: `TaskForm`, `TaskRow`, `TaskSummaryCard` (Phase 6)
- **Goals**: `GoalCard`, `GoalForm` (Phase 6)
- **Usage**: `UsageStatsCard`, `DailyUsageChart`, `UsageByOperationChart` (Phase 6)
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
- `research-document-actions` - Research document CRUD (→ ResearchDocument Use Cases, Phase 6)
- `project-settings-actions` - Project settings CRUD (→ ProjectSettings Use Cases, Phase 6)
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
- `getAnalysisRepository()` - Analysis repository (Phase 7)

**Hooks**:
- `useAutosave` - Auto-save hook with 1-second debounce
- `useHasAIProviders` - Check provider availability (Phase 3.10)
- `useMobile` - Mobile device detection hook (Phase 6)

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

- **Unit Tests**: Domain and application layers (~900+ tests)
- **Integration Tests**: Infrastructure and store (~500+ tests including 35+ provider-specific)
- **E2E Tests**: Complete workflows (10+ tests planned)
- **Coverage Achieved**: 92%+ domain entities, 100% use cases
- **Total Tests**: 1500+ passed (1550+ total, 98%+ pass rate, 180+ test files)

---

## Changelog

For phase-by-phase implementation history, see [CHANGELOG.md](CHANGELOG.md).
