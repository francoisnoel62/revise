# Revise - Architecture Documentation

## Overview

Revise follows Clean Architecture principles with clear layer separation.

## Layer Structure

### Domain Layer (`src/domain/`)

Pure business logic with no framework dependencies.

**Entities**:
- `Chapter` - Single chapter with rich text content (TipTap JSON)
- `Project` - Aggregate managing chapter collection with owner tracking
- `ProjectMetadata` - Metadata document with TipTap JSON content and content hash ⭐ NEW (Phase 3.6)
- `Provider` - AI provider configuration with encrypted credentials (Phase 3.5)
- `User` - User entity with email and hashed password
- `TextDocument` - Legacy single document (Phase 1)

**Value Objects**:
- `TextSelection` - Selection range
- `RewriteProposal` - AI-generated proposal
- `MetadataType` - Enum for 6 analysis types ⭐ NEW (Phase 3.6)
- `NarrativeAnalysis`, `Characters`, `Plot`, `StylisticDNA`, `Worldbuilding`, `Synthesis` ⭐ NEW (Phase 3.6)

**Interfaces**:
- `DocumentParser` - Parse documents to entities
- `DocumentExporter` - Export entities to documents
- `LLMProvider` - AI rewriting + 6 metadata analysis methods ⭐ ENHANCED (Phase 3.6)
- `ProjectRepository` - Persistence abstraction with multi-tenant support
- `ProviderRepository` - Provider storage with encryption (Phase 3.5)
- `MetadataRepository` - Metadata storage with multi-tenant isolation ⭐ NEW (Phase 3.6)
- `PromptRepository` - Load AI prompts from markdown files ⭐ NEW (Phase 3.6)
- `UserRepository` - User management and authentication
- `AuthProvider` - Authentication service abstraction
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
- `RegisterUserUseCase` - User registration

**Metadata Use Cases** ⭐ NEW (Phase 3.6):
- **CRUD**: `CreateMetadata`, `LoadMetadata`, `ListMetadata`, `UpdateMetadataContent`, `UpdateMetadataTitle`, `DeleteMetadata`
- **Generation**: `GenerateNarrativeAnalysis`, `GenerateCharacters`, `GeneratePlot`, `GenerateStylisticDNA`, `GenerateWorldbuilding`, `GenerateSynthesis` (all with intelligent caching)

**Legacy Use Cases**:
- `RewriteTextUseCase` - AI rewriting

### Infrastructure Layer (`src/infrastructure/`)

External service implementations.

**Document**:
- `DocxParser` - Mammoth-based parser with chapter splitting
- `DocxExporter` - docx library exporter with full typography support
- TipTap conversion utilities (HTML ↔ JSON)

**AI**:
- `OpenAIProvider` - GPT-4o-mini + 6 metadata analysis types ⭐ ENHANCED (Phase 3.6)
- `AnthropicProvider` - Claude + 6 metadata analysis types ⭐ NEW (Phase 3.6)
- `LLMProviderFactoryImpl` - Factory for creating LLM providers (Phase 3.5)

**Utils**:
- `UUIDGenerator` - IdGenerator implementation using crypto.randomUUID() (Phase 3.5)
- `text-hash` - SHA-256 content hashing for cache invalidation ⭐ NEW (Phase 3.6)

**Encryption** ⭐ NEW (Phase 3.5):
- AES-256-GCM utilities - API key encryption/decryption
- Key masking utilities - Client-safe API key display

**Authentication** (Phase 3):
- `AuthJsProvider` - Auth.js implementation
- `auth-config` - NextAuth v5 configuration
- Middleware for route protection

**Persistence** (Phase 3, 3.5 & 3.6):
- `MongoDBProjectRepository` - MongoDB Atlas persistence with multi-tenant isolation
- `MongoDBProviderRepository` - Provider storage with encrypted credentials (Phase 3.5)
- `MongoDBMetadataRepository` - Metadata storage with multi-tenant isolation ⭐ NEW (Phase 3.6)
- `MongoDBUserRepository` - User management with bcrypt password hashing
- `InMemoryProjectRepository` - Ephemeral storage (testing/legacy)
- Project serialization utilities for MongoDB storage
- Provider serialization utilities for MongoDB storage (Phase 3.5)
- Metadata serialization utilities for MongoDB storage ⭐ NEW (Phase 3.6)

**Prompts** ⭐ NEW (Phase 3.6):
- `FilePromptRepository` - Load AI prompts from markdown files in `/docs/prompt/metadata/`

**Configuration**:
- Environment configuration (including ENCRYPTION_KEY ⭐ NEW)
- Database connection management
- Provider factory pattern
- Centralized AI models configuration ⭐ NEW (Phase 3.5)

### Interface Layer (`src/app/`, `src/components/`)

React components and UI.

**Pages**:
- `page.tsx` - Editor page (improved header with project title, DocumentControls, UserMenu) ⭐ ENHANCED
- `dashboard/page.tsx` - Project management dashboard (with CreateProjectDialog) ⭐ ENHANCED
- `project/[projectId]/metadata/page.tsx` - Metadata list page ⭐ NEW (Phase 3.6)
- `project/[projectId]/metadata/[metadataId]/page.tsx` - Metadata editor ⭐ NEW (Phase 3.6)
- `auth/signin/page.tsx` - Sign-in page
- `auth/signup/page.tsx` - Sign-up page

**Components**:
- **Auth**: `UserMenu` - User profile dropdown with sign-out and provider access
- **Dashboard**: `CreateProjectDialog` (Phase 3.5), `ProjectCard`, `EmptyState`, `NoProvidersAlert`
- **Editor**: `TextEditor` - TipTap editor with A4 styling, `FormattingToolbar` - Rich text and typography controls
- **Navigation**: `ChaptersSheet` - Chapter navigation with drag & drop
- **Proposals**: `ProposalsSheet` - AI proposals display
- **Providers**: `ProvidersDialog`, `ProviderForm`, `ProviderCard` (Phase 3.5)
- **Metadata**: `GenerateCard`, `MetadataCard` ⭐ NEW (Phase 3.6)
- **Document**: `DocumentControls` - Import/export, `SaveStatus` - Auto-save indicator
- **UI**: shadcn/ui components (Sheet, Button, Card, Dialog, Input, Label, PasswordInput, etc.)

**State**:
- `projectStore` - Zustand store (server-backed)

**Server Actions** (all delegate to Use Cases):
- `project-actions` - Create, load, update, delete, rename (→ Project Use Cases)
- `chapter-actions` - Add, remove, update, reorder (→ Chapter Use Cases)
- `auth-actions` - Sign in, sign up, sign out (→ RegisterUserUseCase)
- `provider-actions` - CRUD + test connections (→ Provider Use Cases)
- `metadata-actions` - CRUD + generate analyses (→ Metadata Use Cases) ⭐ NEW (Phase 3.6)

**Dependency Injection** (`utils.ts`):
- `getRepository()` - Project repository
- `getProviderRepo()` - Provider repository
- `getUserRepo()` - User repository
- `getMetadataRepo()` - Metadata repository ⭐ NEW (Phase 3.6)
- `getPromptRepo()` - Prompt repository ⭐ NEW (Phase 3.6)
- `getLLMProviderFactory()` - LLM provider factory
- `getIdGenerator()` - UUID generator

**Hooks**:
- `useAutosave` - Auto-save hook with 1-second debounce

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
  → Navigate to /?project={id}
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

- **Unit Tests**: Domain and application layers (~350+ tests)
- **Integration Tests**: Infrastructure and store (~130+ tests including 12 provider-specific)
- **E2E Tests**: Complete workflows (10+ tests planned)
- **Coverage Achieved**: 40.8% global, 92%+ domain entities, 100% use cases
- **Total Tests**: 481 passed + 32 skipped (513 total, 94% pass rate, 77 test files)

## Phase 3.6 Complete ✅

**Metadata Analysis System**:
- ✅ **6 AI-Powered Analysis Types** - Narrative Analysis, Characters, Plot, Stylistic DNA, Worldbuilding, Synthesis
- ✅ **Intelligent Caching** - SHA-256 content hashing with automatic regeneration detection
- ✅ **Dual Provider Support** - OpenAI (GPT-4o-mini) and Anthropic (Claude) for all analyses
- ✅ **12 New Use Cases** - 6 CRUD + 6 Generation use cases with caching logic
- ✅ **ProjectMetadata Entity** - TipTap JSON storage with content hash tracking
- ✅ **MongoDBMetadataRepository** - Multi-tenant metadata storage with serialization
- ✅ **FilePromptRepository** - Load AI prompts from markdown files
- ✅ **Text Hashing Utility** - SHA-256 hashing for cache invalidation
- ✅ **Metadata UI Pages** - List view and rich text editor
- ✅ **Metadata Components** - GenerateCard, MetadataCard with loading states
- ✅ **Enhanced AI Providers** - OpenAI & Anthropic support all 6 analysis types
- ✅ **7 Value Objects** - MetadataType + 6 analysis-specific value objects
- ✅ **Rate Limiting** - 5-second cooldown for metadata generation
- ✅ **Comprehensive Testing** - 481 tests (513 total with 32 skipped) including integration tests for both providers
- ✅ **Clean Architecture Maintained** - All new code follows established patterns

## Phase 3.5 Complete ✅

**Clean Architecture Finalized**:
- ✅ **AI Provider Management** - Multiple providers with encrypted credentials
- ✅ **All Use Cases Created** - Complete separation of concerns (Project, Provider, User)
- ✅ **Dependency Injection** - Centralized via utils.ts (getRepository, getProviderRepo, etc.)
- ✅ **Domain Abstractions** - IdGenerator, LLMProviderFactory interfaces
- ✅ **Infrastructure Implementations** - UUIDGenerator, LLMProviderFactoryImpl
- ✅ **Provider Components** - ProvidersDialog, ProviderForm, ProviderCard
- ✅ **CreateProjectDialog** - New project creation with title input
- ✅ **Improved Header Layout** - Better project visibility and navigation
- ✅ **Encryption System** - AES-256-GCM for API keys
- ✅ **Rate Limiting** - Connection testing (1 per 5 seconds)
- ✅ **MongoDBProviderRepository** - Encrypted provider storage

## Phase 3 Complete ✅

**Persistence & Authentication**:
- ✅ MongoDB Atlas persistence
- ✅ User authentication (Auth.js)
- ✅ Multi-tenant data isolation
- ✅ Auto-save to database
- ✅ Dashboard project management
- ✅ Session management

## Future Enhancements (Phase 4+)

**Phase 4 Candidates**:
- Search across chapters (full-text)
- Per-chapter undo/redo (independent history)
- Chapter templates
- Writing goals/statistics
- Export individual chapters
- Project sharing between users
- Version history

**Phase 5+**:
- Real-time collaboration
- Comments and annotations
- Team workspaces
- Voice memory (AI style learning)
- Custom AI prompt configuration
