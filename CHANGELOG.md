# Changelog

All notable changes to the Revise project are documented in this file.

For current features and roadmap, see [README.md](README.md).

---

## Phase 7.0 - Chapter Verification (February 2026)

### Domain Layer
- **ChapterAnalysis entity** - Complete chapter analysis result with issues, repetitions, and statistics
- **AnalysisHistory entity** - Tracks analysis runs and corrections over time
- **AnalysisCategory value object** - Enum for analysis types (spelling, grammar, punctuation, style, repetition)
- **AnalysisSeverity value object** - Enum for issue severity (error, warning, suggestion)
- **AnalysisIssue value object** - Individual analysis issue with position, suggestion, and status
- **RepetitionCluster value object** - Cluster of repeated words/phrases with positions
- **RepetitionExclusions value object** - User-defined words to exclude from repetition analysis
- **StyleRigor value object** - Analysis strictness level (strict, balanced, light)
- **AnalysisRepository interface** - Repository for analysis results, history, and exclusions

### Application Layer
- **Analysis Strategies** - Strategy pattern implementation for each analysis type:
  - `SpellingAnalysisStrategy` - Spelling error detection via AI
  - `GrammarAnalysisStrategy` - Grammar issue detection via AI
  - `PunctuationAnalysisStrategy` - Punctuation error detection via AI
  - `StyleAnalysisStrategy` - Style improvement suggestions via AI
  - `RepetitionAnalysisStrategy` - Repeated word/phrase detection
- **AnalyzeChapterUseCase** - Orchestrates analysis with caching and exclusions
- **ApplyCorrectionUseCase** - Apply a single correction to chapter content
- **ApplyBatchCorrectionsUseCase** - Apply multiple corrections in batch
- **IgnoreAnalysisIssueUseCase** - Mark an issue as ignored
- **GetAnalysisDiffUseCase** - Generate diff between original and corrected content
- **ExportAnalysisReportUseCase** - Export analysis results as markdown report
- **ManageRepetitionExclusionsUseCase** - Add/remove words from exclusion list
- **SaveChapterAnalysisHistoryUseCase** - Save analysis history entry
- **ListChapterAnalysisHistoryUseCase** - List analysis history for a chapter

### Infrastructure Layer
- **AnalysisLLMClient** - AI client for spelling, grammar, punctuation, and style analysis
- **MongoDBAnalysisRepository** - MongoDB persistence for analysis results and history
- **chapter-analysis-serializer** - Serialization for ChapterAnalysis entities
- **analysis-history-serializer** - Serialization for AnalysisHistory entities
- **ContentHashService** - SHA-256 hashing for cache invalidation

### Interface Layer
- **ChapterAnalysisPanel** - Main panel for chapter verification UI
- **AnalysisCategoryTabs** - Tab navigation for analysis categories
- **AnalysisConfigDialog** - Configuration dialog for analysis options
- **AnalysisIssueCard** - Card component for individual issues
- **AnalysisSummaryCard** - Summary statistics for analysis results
- **analysis-actions.ts** - Server actions for analysis operations

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
