# Revise - Architecture Documentation

## Overview

Revise follows Clean Architecture principles with clear layer separation.

## Layer Structure

### Domain Layer (`src/domain/`)

Pure business logic with no framework dependencies.

**Entities**:
- `Chapter` - Single chapter with rich text content (TipTap JSON)
- `Project` - Aggregate managing chapter collection with owner tracking
- `User` - User entity with email and hashed password
- `TextDocument` - Legacy single document (Phase 1)

**Value Objects**:
- `TextSelection` - Selection range
- `RewriteProposal` - AI-generated proposal

**Interfaces**:
- `DocumentParser` - Parse documents to entities
- `DocumentExporter` - Export entities to documents
- `LLMProvider` - AI rewriting service
- `ProjectRepository` - Persistence abstraction with multi-tenant support
- `UserRepository` - User management and authentication
- `AuthProvider` - Authentication service abstraction

### Application Layer (`src/application/`)

Use cases orchestrating domain logic.

**Use Cases**:
- `ImportProjectUseCase`
- `ExportProjectUseCase`
- `SwitchChapterUseCase`
- `AddChapterUseCase`
- `RemoveChapterUseCase`
- `ReorderChaptersUseCase`
- `UpdateChapterContentUseCase`
- `UpdateChapterTitleUseCase`
- `RewriteTextUseCase`

### Infrastructure Layer (`src/infrastructure/`)

External service implementations.

**Document**:
- `DocxParser` - Mammoth-based parser with chapter splitting
- `DocxExporter` - docx library exporter with full typography support
- TipTap conversion utilities (HTML ↔ JSON)

**AI**:
- `OpenAIProvider` - GPT-4o-mini integration with language preservation

**Authentication** (Phase 3):
- `AuthJsProvider` - Auth.js implementation
- `auth-config` - NextAuth v5 configuration
- Middleware for route protection

**Persistence** (Phase 3):
- `MongoDBProjectRepository` - MongoDB Atlas persistence with multi-tenant isolation
- `MongoDBUserRepository` - User management with bcrypt password hashing
- `InMemoryProjectRepository` - Ephemeral storage (testing/legacy)
- Project serialization utilities for MongoDB storage

**Configuration**:
- Environment configuration
- Database connection management
- Provider factory pattern

### Interface Layer (`src/app/`, `src/components/`)

React components and UI.

**Pages**:
- `page.tsx` - Editor page (main interface)
- `dashboard/page.tsx` - Project management dashboard
- `auth/signin/page.tsx` - Sign-in page
- `auth/signup/page.tsx` - Sign-up page

**Components**:
- **Auth**: `UserMenu` - User profile dropdown with sign-out
- **Editor**: `TextEditor` - TipTap editor with A4 styling, `FormattingToolbar` - Rich text and typography controls
- **Navigation**: `ChaptersSheet` - Chapter navigation with drag & drop
- **Proposals**: `ProposalsSheet` - AI proposals display
- **Document**: `DocumentControls` - Import/export, `ProjectCard` - Dashboard card, `EmptyState` - Empty dashboard, `SaveStatus` - Auto-save indicator
- **UI**: shadcn/ui components (Sheet, Button, Card, Dialog, Input, Label, etc.)

**State**:
- `projectStore` - Zustand store (server-backed)

**Server Actions**:
- `project-actions` - Create, load, update, delete, rename projects
- `chapter-actions` - Add, remove, update, reorder chapters
- `auth-actions` - Sign in, sign up, sign out
- Import/export actions

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

- **Unit Tests**: Domain and application layers (150+ tests)
- **Integration Tests**: Infrastructure and store (30+ tests)
- **E2E Tests**: Complete workflows (10+ tests planned)
- **Coverage Target**: 85%+ for critical paths

## Phase 3 Complete ✅

**Implemented**:
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
