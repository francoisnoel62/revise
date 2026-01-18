# Revise - Architecture Documentation

## Overview

Revise follows Clean Architecture principles with clear layer separation.

## Layer Structure

### Domain Layer (`src/domain/`)

Pure business logic with no framework dependencies.

**Entities**:
- `Chapter` - Single chapter with rich text content (TipTap JSON)
- `Project` - Aggregate managing chapter collection with owner tracking
- `ProjectMetadata` - Metadata document with TipTap JSON content and content hash (Phase 3.6)
- `Provider` - AI provider configuration with encrypted credentials (Phase 3.5)
- `User` - User entity with email, hashed password, approval status, and consent timestamps (Phase 3.8, 3.11)
- `CorrectionHistory` - AI rewrite history entry with proposals (Phase 3.7)
- `BlogArticle` - Blog article with slug, content, and metadata (Phase 4.0)
- `ContactMessage` - Contact form submission (Phase 3.11)
- `TextDocument` - Legacy single document (Phase 1)

**Value Objects**:
- `TextSelection` - Selection range
- `RewriteProposal` - AI-generated proposal
- `MetadataType` - Enum for 7 analysis types (including chapter-summaries) (Phase 3.6, 3.7)
- `NarrativeAnalysis`, `Characters`, `Plot`, `StylisticDNA`, `Worldbuilding`, `ChapterSummaries`, `Synthesis` (Phase 3.6, 3.7)

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
- `AuthProvider` - Authentication service abstraction
- `EmailService` - Email notification service (Phase 3.8)
- `ApprovalTokenGenerator` - HMAC token generation for approval links (Phase 3.8)
- `ContentConverter` - TipTap content conversion abstraction (Phase 4.1)
- `IdGenerator` - UUID generation abstraction (Phase 3.5)
- `LLMProviderFactory` - Factory for creating LLM providers (Phase 3.5)

### Application Layer (`src/application/`)

Use cases orchestrating domain logic.

**Project CRUD Use Cases** ⭐ NEW:
- `CreateProjectUseCase` - Create new project
- `LoadProjectUseCase` - Load project from repository
- `ListProjectsUseCase` - List user's projects
- `DeleteProjectUseCase` - Delete project
- `UpdateProjectTitleUseCase` - Rename project
- `UpdateProjectProviderUseCase` - Update project's AI provider

**Chapter Use Cases**:
- `ImportProjectUseCase` - Multi-chapter import
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

**Blog Use Cases** (Phase 4.0):
- `CreateBlogArticleUseCase`, `UpdateBlogArticleUseCase`, `DeleteBlogArticleUseCase`, `ListBlogArticlesUseCase`

**Contact Use Cases** (Phase 3.11):
- `SubmitContactFormUseCase` - Save contact form submissions

**Legacy Use Cases**:
- `RewriteTextUseCase` - AI rewriting

### Infrastructure Layer (`src/infrastructure/`)

External service implementations.

**Document**:
- `DocxParser` - Mammoth-based parser with chapter splitting
- `DocxExporter` - docx library exporter with full typography support
- `PdfExporter` - PDF export with full typography (Phase 3.7)
- `TipTapContentService` - TipTap content manipulation (Phase 4.1)
- TipTap conversion utilities (HTML ↔ JSON)

**AI**:
- `OpenAIProvider` - GPT-4o-mini/GPT-5 + 7 analysis types + generation + completion (Phase 3.6, 4.1)
- `AnthropicProvider` - Claude + 7 analysis types + generation (Phase 3.6, 4.1)
- `LLMProviderFactoryImpl` - Factory for creating LLM providers (Phase 3.5)

**Utils**:
- `UUIDGenerator` - IdGenerator implementation using crypto.randomUUID() (Phase 3.5)
- `text-hash` - SHA-256 content hashing for cache invalidation (Phase 3.6)
- `MetadataCache` - TTL-based caching for metadata (Phase 4.1)

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

**Persistence** (Phase 3, 3.5, 3.6, 3.7, 4.0):
- `MongoDBProjectRepository` - MongoDB Atlas persistence with multi-tenant isolation
- `MongoDBProviderRepository` - Provider storage with encrypted credentials (Phase 3.5)
- `MongoDBMetadataRepository` - Metadata storage with multi-tenant isolation (Phase 3.6)
- `MongoDBCorrectionHistoryRepository` - Correction history storage (Phase 3.7)
- `MongoDBBlogArticleRepository` - Blog article storage (Phase 4.0)
- `MongoDBContactMessageRepository` - Contact form storage (Phase 3.11)
- `MongoDBUserRepository` - User management with bcrypt, approval, consent
- `InMemoryProjectRepository` - Ephemeral storage (testing/legacy)
- All repositories support `deleteAllByOwner()` for RGPD compliance (Phase 3.11)
- Serialization utilities for all entity types

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
- `api/approve/route.ts` - User approval endpoint (Phase 3.8)
- `api/completion/stream/route.ts` - Autocompletion SSE endpoint (Phase 4.1)

**Components**:
- **Auth**: `UserMenu` - User profile dropdown with sign-out and provider access
- **Dashboard**: `CreateProjectDialog`, `ProjectCard`, `EmptyState`, `NoProvidersAlert`
- **Editor**: `TextEditor` (TipTap + CharacterCount + Autocomplete), `FormattingToolbar` (with undo/redo buttons)
- **Navigation**: `ChaptersSheet` - Chapter navigation with drag & drop
- **Proposals**: `ProposalsSheet`, `LoadingOverlay` (author quotes, Phase 3.7)
- **Providers**: `ProvidersDialog`, `ProviderForm`, `ProviderCard`
- **Metadata**: `GenerateCard`, `MetadataCard` (Phase 3.6)
- **History**: `CorrectionHistoryDialog`, `CorrectionHistoryTable` (Phase 3.7)
- **Blog**: `BlogCard`, `BlogArticle` (Phase 4.0)
- **Legal**: `CookieConsent` (3 variants), `ContactForm` (Phase 3.11)
- **Generation**: `FloatingGenerationMenu` (Phase 4.1)
- **Document**: `DocumentControls` (DOCX/PDF export), `SaveStatus`
- **UI**: shadcn/ui components (Sheet, Button, Card, Dialog, Input, Label, etc.)

**State**:
- `projectStore` - Zustand store (server-backed)

**Server Actions** (all delegate to Use Cases):
- `project-actions` - Create, load, update, delete, rename (→ Project Use Cases)
- `chapter-actions` - Add, remove, update, reorder (→ Chapter Use Cases)
- `auth-actions` - Sign in, sign up, sign out (→ RegisterUserUseCase)
- `provider-actions` - CRUD + test connections (→ Provider Use Cases)
- `metadata-actions` - CRUD + generate analyses (→ Metadata Use Cases, Phase 3.6)
- `correction-history-actions` - Save, list, delete (→ CorrectionHistory Use Cases, Phase 3.7)
- `blog-actions` - Blog article CRUD (→ Blog Use Cases, Phase 4.0)
- `contact-actions` - Contact form submission (→ SubmitContactFormUseCase, Phase 3.11)
- `user-actions` - Account deletion, data export (→ DeleteUserAccountUseCase, Phase 3.11)

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

**Hooks**:
- `useAutosave` - Auto-save hook with 1-second debounce
- `useHasAIProviders` - Check provider availability (Phase 3.10)

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

- **Unit Tests**: Domain and application layers (~400+ tests)
- **Integration Tests**: Infrastructure and store (~180+ tests including 24+ provider-specific)
- **E2E Tests**: Complete workflows (10+ tests planned)
- **Coverage Achieved**: 42% global, 92%+ domain entities, 100% use cases
- **Total Tests**: 580+ passed (600+ total, 95%+ pass rate, 85+ test files)

## Phase 4.1 Complete ✅

**AI Text Generation & Autocompletion**:
- ✅ **AI Chapter Generation** - Generate chapter beginnings from metadata context
- ✅ **Streaming Autocompletion** - Tab to trigger, Tab to accept
- ✅ **FloatingGenerationMenu** - Context-aware generation for empty chapters
- ✅ **MetadataCache** - TTL-based caching (5 min)
- ✅ **GenerateChapterUseCase** - Load metadata context for generation
- ✅ **GenerateCompletionUseCase** - Autocompletion suggestions
- ✅ **ContentConverter interface** - Clean Architecture abstraction
- ✅ **Autocomplete TipTap extension** - Ghost text with streaming

## Phase 4.0 Complete ✅

**Blog Section**:
- ✅ **Blog pages** - List and article pages
- ✅ **6+ SEO articles** - Writing techniques content
- ✅ **Admin blog management** - CRUD interface
- ✅ **BlogArticle entity** - Domain entity
- ✅ **MongoDBBlogArticleRepository** - Persistence

## Phase 3.11 Complete ✅

**RGPD/LCEN Compliance**:
- ✅ **Legal pages** - CGU, CGV, mentions, privacy, cookies
- ✅ **Cookie consent banner** - 3 variants
- ✅ **Consent timestamps** - User consent tracking
- ✅ **Account deletion** - Cascade delete with deleteAllByOwner
- ✅ **Data export** - RGPD Article 20 portability
- ✅ **Settings page** - Account management UI
- ✅ **Contact form** - Landing page integration

## Phase 3.8 Complete ✅

**User Registration Approval**:
- ✅ **Admin approval workflow** - Users must be approved
- ✅ **Email notifications** - ResendEmailService
- ✅ **HMAC token validation** - Secure approval links
- ✅ **ApproveUserUseCase** - Token verification
- ✅ **isApproved/approvedAt fields** - User entity extension

## Phase 3.7 Complete ✅

**UX Enhancements**:
- ✅ **PDF Export** - Full typography support
- ✅ **Correction History** - Accordion UI per chapter
- ✅ **Character/Word Count** - Live statistics
- ✅ **Undo/Redo Toolbar Buttons** - Visual controls
- ✅ **Loading Overlay** - 100 author quotes
- ✅ **3 Proposals** - Reduced from 5 (épuré, lyrique, amplifié)
- ✅ **GPT-5 & o-series Support** - Reasoning model parameters

## Phase 3.6 Complete ✅

**Metadata Analysis System**:
- ✅ **7 AI-Powered Analysis Types** - Including chapter-summaries
- ✅ **Intelligent Caching** - SHA-256 content hashing
- ✅ **Dual Provider Support** - OpenAI & Anthropic
- ✅ **13 Use Cases** - 6 CRUD + 7 Generation
- ✅ **FilePromptRepository** - Version-controlled prompts

## Phase 3.5 Complete ✅

**Clean Architecture Finalized**:
- ✅ **AI Provider Management** - Encrypted credentials
- ✅ **All Use Cases Created** - Complete separation
- ✅ **Dependency Injection** - Centralized via utils.ts
- ✅ **MongoDBProviderRepository** - Encrypted storage

## Phase 3 Complete ✅

**Persistence & Authentication**:
- ✅ MongoDB Atlas persistence
- ✅ User authentication (Auth.js)
- ✅ Multi-tenant data isolation
- ✅ Auto-save to database
- ✅ Dashboard project management

## Future Enhancements (Phase 5+)

**Phase 5 Candidates**:
- Search across chapters (full-text)
- Per-chapter undo/redo (independent history)
- Chapter templates
- Writing goals/statistics
- Version history

**Phase 6+**:
- Real-time collaboration
- Comments and annotations
- Team workspaces
- Voice memory (AI style learning)
- Custom AI prompt configuration
