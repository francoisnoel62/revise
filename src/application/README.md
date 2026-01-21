# Application Layer

Orchestrates domain logic through use cases.

**Status**: ✅ Phase 5.1 Complete (160+ tests passing, 100% coverage)

## Rules:
- Depends only on Domain layer
- No framework-specific code
- No direct infrastructure implementations (use interfaces)
- Use cases are thin orchestrators, not business logic containers
- All business logic belongs in Domain entities

## Contents:

### Project CRUD Use Cases ⭐ NEW (Phase 3.5)

---

#### `CreateProjectUseCase`
**Purpose**: Create new project with validation

**Dependencies**: `ProjectRepository`, `IdGenerator` interfaces
**Input**: User ID, project title (optional)
**Output**: Created `Project` entity

**Workflow**:
1. Generate unique project ID using IdGenerator
2. Create Project entity with owner ID
3. Persist to ProjectRepository
4. Return created Project

**Tests**: 5+ tests covering creation scenarios

---

#### `LoadProjectUseCase`
**Purpose**: Load project from repository

**Dependencies**: `ProjectRepository` interface
**Input**: User ID, project ID
**Output**: `Project` entity or null

**Workflow**:
1. Validate user owns the project (multi-tenant)
2. Load from ProjectRepository
3. Return Project or null if not found

**Tests**: 4+ tests covering load scenarios

---

#### `ListProjectsUseCase`
**Purpose**: List all projects for a user

**Dependencies**: `ProjectRepository` interface
**Input**: User ID
**Output**: Array of `Project` entities

**Workflow**:
1. Query ProjectRepository with user ID
2. Return projects sorted by updated date

**Tests**: 3+ tests covering list scenarios

---

#### `DeleteProjectUseCase`
**Purpose**: Delete project

**Dependencies**: `ProjectRepository` interface
**Input**: User ID, project ID
**Output**: void

**Workflow**:
1. Validate user owns the project
2. Delete from ProjectRepository

**Tests**: 3+ tests covering deletion

---

#### `UpdateProjectTitleUseCase`
**Purpose**: Rename project

**Dependencies**: `ProjectRepository` interface
**Input**: User ID, project ID, new title
**Output**: Updated `Project` entity

**Workflow**:
1. Load project (validate ownership)
2. Update title
3. Persist changes
4. Return updated Project

**Tests**: 4+ tests covering rename scenarios

---

#### `UpdateProjectProviderUseCase`
**Purpose**: Update project's AI provider selection

**Dependencies**: `ProjectRepository` interface
**Input**: User ID, project ID, provider ID
**Output**: Updated `Project` entity

**Workflow**:
1. Load project (validate ownership)
2. Update provider ID reference
3. Persist changes
4. Return updated Project

**Tests**: 4+ tests covering provider update

---

### Publishing Use Cases ⭐ NEW (Phase 5.0)

---

#### `PublishProjectUseCase`
**Purpose**: Publish project with unique share token

**Dependencies**: `ProjectRepository`, `IdGenerator` interfaces
**Input**: User ID, project ID
**Output**: Published `Project` with shareToken

**Workflow**:
1. Load project (validate ownership)
2. Generate unique share token
3. Set isPublished=true, publishedAt=now
4. Persist changes
5. Return updated Project

**Tests**: 5+ tests covering publishing

---

#### `UnpublishProjectUseCase`
**Purpose**: Remove project from public access

**Dependencies**: `ProjectRepository` interface
**Input**: User ID, project ID
**Output**: Updated `Project`

**Workflow**:
1. Load project (validate ownership)
2. Set isPublished=false, clear shareToken
3. Persist changes

**Tests**: 4+ tests covering unpublishing

---

#### `LoadPublishedProjectUseCase`
**Purpose**: Load published project by share token (no auth required)

**Dependencies**: `ProjectRepository` interface
**Input**: Project ID, share token
**Output**: `Project` entity or null

**Workflow**:
1. Find project by ID and token
2. Validate token matches
3. Return project for public reading

**Tests**: 5+ tests covering public access

---

### ImportFolderUseCase ⭐ NEW (Phase 5.1)

---

#### `ImportFolderUseCase`
**Purpose**: Import Markdown folder as chapters

**Dependencies**: `FolderParser` interface
**Input**: Folder files (File[])
**Output**: Array of `Chapter` entities

**Workflow**:
1. Parse folder using FolderParser
2. Convert each .md file to TipTap JSON
3. Create Chapter entities
4. Return chapters sorted by filename

**Tests**: 6+ tests covering folder import

---

### Provider Use Cases ⭐ NEW (Phase 3.5)

---

#### `CreateProviderUseCase`
**Purpose**: Create new AI provider with optional connection testing

**Dependencies**: `ProviderRepository`, `IdGenerator`, `LLMProviderFactory` interfaces
**Input**: User ID, provider data (name, type, apiKey, model)
**Output**: Created `Provider` entity

**Workflow**:
1. Generate unique ID using IdGenerator
2. Encrypt API key
3. Create Provider entity
4. Optionally test connection using LLMProviderFactory
5. Persist to ProviderRepository

**Tests**: 6+ tests covering creation with/without testing

---

#### `UpdateProviderUseCase`
**Purpose**: Update provider configuration

**Dependencies**: `ProviderRepository` interface
**Input**: User ID, provider ID, updates (name, model, apiKey)
**Output**: Updated `Provider` entity

**Workflow**:
1. Load provider (validate ownership)
2. Apply updates
3. Re-encrypt API key if changed
4. Persist changes

**Tests**: 5+ tests covering update scenarios

---

#### `DeleteProviderUseCase`
**Purpose**: Delete provider with project usage check

**Dependencies**: `ProviderRepository`, `ProjectRepository` interfaces
**Input**: User ID, provider ID
**Output**: void or error if in use

**Workflow**:
1. Check if provider is used by any projects
2. If in use, return error with project count
3. Delete from ProviderRepository

**Tests**: 4+ tests covering deletion and usage check

---

#### `ListProvidersUseCase`
**Purpose**: List all providers for a user

**Dependencies**: `ProviderRepository` interface
**Input**: User ID
**Output**: Array of `Provider` entities

**Workflow**:
1. Query ProviderRepository with user ID
2. Return providers (API keys masked)

**Tests**: 3+ tests covering list scenarios

---

#### `TestProviderConnectionUseCase`
**Purpose**: Test provider credentials before saving

**Dependencies**: `LLMProviderFactory` interface
**Input**: Provider type, API key, model
**Output**: Test result (valid: boolean, message: string)

**Workflow**:
1. Create temporary LLM provider instance
2. Make minimal API call to verify credentials
3. Return success or error message

**Tests**: 5+ tests covering test scenarios

---

#### `ValidateProviderUseCase`
**Purpose**: Validate existing provider's credentials

**Dependencies**: `ProviderRepository`, `LLMProviderFactory` interfaces
**Input**: User ID, provider ID
**Output**: Validation result

**Workflow**:
1. Load provider (validate ownership)
2. Decrypt API key
3. Test connection using LLMProviderFactory
4. Return result

**Tests**: 4+ tests covering validation

---

### User Use Cases (Phase 3.5, 3.8, 3.11)

---

#### `RegisterUserUseCase` (Enhanced Phase 3.8, 3.11)
**Purpose**: User registration with validation, consent tracking, and approval notification

**Dependencies**: `UserRepository`, `EmailService` interfaces
**Input**: Email, password, consent (termsAccepted, privacyAccepted)
**Output**: Created `User` entity (pending approval)

**Workflow**:
1. Validate email format
2. Validate consent (both must be accepted) ⭐ Phase 3.11
3. Check if email already exists
4. Hash password with bcrypt
5. Create User entity with consent timestamps
6. Persist to UserRepository
7. Send approval request email to admin ⭐ Phase 3.8

**Tests**: 10+ tests covering registration, consent, and email

---

#### `ApproveUserUseCase` ⭐ NEW (Phase 3.8)
**Purpose**: Admin approval of user registration with HMAC token validation

**Dependencies**: `UserRepository` interface
**Input**: User ID, action (approve/reject), HMAC token
**Output**: Updated `User` entity

**Workflow**:
1. Validate HMAC token (prevents tampering)
2. Load user by ID
3. If approve: Set isApproved=true, approvedAt=now
4. If reject: Delete user account
5. Persist changes

**Tests**: 8+ tests covering approval, rejection, and token validation

---

#### `DeleteUserAccountUseCase` ⭐ NEW (Phase 3.11)
**Purpose**: RGPD-compliant account deletion with cascade delete

**Dependencies**: `UserRepository`, `ProjectRepository`, `MetadataRepository`, `CorrectionHistoryRepository`, `ProviderRepository` interfaces
**Input**: User ID, password confirmation
**Output**: void

**Workflow**:
1. Validate password
2. Delete all user's projects (ProjectRepository.deleteAllByOwner)
3. Delete all user's metadata (MetadataRepository.deleteAllByOwner)
4. Delete all user's correction history (CorrectionHistoryRepository.deleteAllByOwner)
5. Delete all user's providers (ProviderRepository.deleteAllByOwner)
6. Delete user account (UserRepository.delete)

**Tests**: 10+ tests covering cascade deletion and validation

---

### AI Generation Use Cases ⭐ NEW (Phase 4.1)

---

#### `GenerateChapterUseCase`
**Purpose**: Generate chapter content using project metadata context

**Dependencies**: `ProjectRepository`, `MetadataRepository`, `LLMProvider`, `ContentConverter` interfaces
**Input**: User ID, project ID, chapter ID
**Output**: Generated content (TipTap JSON)

**Workflow**:
1. Load project and chapter
2. Load all project metadata (narrative, characters, plot, style, worldbuilding)
3. Build context prompt with metadata
4. Generate content via LLM
5. Convert to TipTap JSON format

**Tests**: 6+ tests covering generation and context loading

---

#### `GenerateCompletionUseCase`
**Purpose**: Generate autocompletion suggestions

**Dependencies**: `MetadataRepository`, `LLMProvider`, `ContentConverter` interfaces
**Input**: User ID, project ID, current text, cursor position
**Output**: Completion suggestion string

**Workflow**:
1. Load cached metadata for project (MetadataCache)
2. Extract context around cursor
3. Generate completion via LLM (streaming)
4. Return completion text

**Tests**: 6+ tests covering completion and caching

---

### Blog Use Cases ⭐ NEW (Phase 4.0)

---

#### `CreateBlogArticleUseCase`
**Purpose**: Create new blog article

**Dependencies**: `BlogArticleRepository`, `IdGenerator` interfaces
**Input**: Slug, title, content, excerpt, metadata
**Output**: Created `BlogArticle` entity

**Tests**: 5+ tests covering creation

---

#### `UpdateBlogArticleUseCase`
**Purpose**: Update existing blog article

**Dependencies**: `BlogArticleRepository` interface
**Input**: Article ID, updates (title, content, excerpt, etc.)
**Output**: Updated `BlogArticle` entity

**Tests**: 5+ tests covering updates

---

#### `DeleteBlogArticleUseCase`
**Purpose**: Delete blog article

**Dependencies**: `BlogArticleRepository` interface
**Input**: Article ID
**Output**: void

**Tests**: 3+ tests covering deletion

---

#### `ListBlogArticlesUseCase`
**Purpose**: List blog articles (published or all)

**Dependencies**: `BlogArticleRepository` interface
**Input**: Filter (published only, all)
**Output**: Array of `BlogArticle` entities

**Tests**: 4+ tests covering listing

---

#### `LoadPublishedBlogArticlesPaginatedUseCase` ⭐ NEW (Phase 4.1+)
**Purpose**: Load published blog articles with pagination

**Dependencies**: `BlogArticleRepository` interface
**Input**: Page number, page size (default 5)
**Output**: `PaginatedResult<BlogArticle>`

**Workflow**:
1. Calculate offset from page number
2. Load published articles with limit
3. Count total articles
4. Return paginated result

**Tests**: 5+ tests covering pagination

---

### Contact Use Cases ⭐ NEW (Phase 3.11)

---

#### `SubmitContactFormUseCase`
**Purpose**: Save contact form submission

**Dependencies**: `ContactMessageRepository`, `IdGenerator` interfaces
**Input**: Name, email, subject, message
**Output**: Created `ContactMessage` entity

**Workflow**:
1. Validate input (email format, required fields)
2. Generate unique ID
3. Create ContactMessage entity
4. Persist to repository

**Tests**: 5+ tests covering submission and validation

---

### Metadata Use Cases (Phase 3.6, 3.7)

---

#### `CreateMetadataUseCase`
**Purpose**: Create new metadata document

**Dependencies**: `MetadataRepository`, `IdGenerator` interfaces
**Input**: User ID, project ID, metadata type, title
**Output**: Created `ProjectMetadata` entity

**Workflow**:
1. Generate unique metadata ID
2. Create ProjectMetadata entity
3. Persist to MetadataRepository
4. Return created metadata

**Tests**: 5+ tests covering creation scenarios

---

#### `LoadMetadataUseCase`
**Purpose**: Load metadata from repository

**Dependencies**: `MetadataRepository` interface
**Input**: User ID, metadata ID
**Output**: `ProjectMetadata` entity or null

**Workflow**:
1. Load from MetadataRepository
2. Validate ownership (multi-tenant)
3. Return metadata or null

**Tests**: 4+ tests covering load scenarios

---

#### `ListMetadataUseCase`
**Purpose**: List all metadata for a project

**Dependencies**: `MetadataRepository` interface
**Input**: User ID, project ID
**Output**: Array of `ProjectMetadata` entities

**Workflow**:
1. Load all metadata for project
2. Filter by user ownership
3. Return sorted list

**Tests**: 5+ tests covering listing

---

#### `UpdateMetadataContentUseCase`
**Purpose**: Update metadata content

**Dependencies**: `MetadataRepository` interface
**Input**: User ID, metadata ID, new content (TipTap JSON)
**Output**: Updated `ProjectMetadata`

**Workflow**:
1. Load metadata (validate ownership)
2. Update content via entity method
3. Persist changes
4. Return updated metadata

**Tests**: 5+ tests covering updates

---

#### `UpdateMetadataTitleUseCase`
**Purpose**: Update metadata title

**Dependencies**: `MetadataRepository` interface
**Input**: User ID, metadata ID, new title
**Output**: Updated `ProjectMetadata`

**Tests**: 5+ tests covering title updates

---

#### `DeleteMetadataUseCase`
**Purpose**: Delete metadata document

**Dependencies**: `MetadataRepository` interface
**Input**: User ID, metadata ID
**Output**: void

**Workflow**:
1. Validate ownership
2. Delete from repository

**Tests**: 4+ tests covering deletion

---

#### `GenerateNarrativeAnalysisUseCase`
**Purpose**: Generate narrative analysis with intelligent caching

**Dependencies**: `MetadataRepository`, `ProjectRepository`, `PromptRepository`, `LLMProvider` interfaces
**Input**: User ID, project ID, force regeneration flag
**Output**: `ProjectMetadata` with narrative analysis

**Workflow**:
1. Load project chapters
2. Calculate content hash (SHA-256)
3. Check existing metadata for cache hit
4. If cache miss or force: generate new analysis via LLM
5. Save with content hash
6. Return metadata

**Caching Logic**: Only regenerates if project content changed (hash mismatch)

**Tests**: 10+ tests covering caching, generation, and edge cases

---

#### `GenerateCharactersUseCase`, `GeneratePlotUseCase`, `GenerateStylisticDNAUseCase`, `GenerateWorldbuildingUseCase`, `GenerateSynthesisUseCase`

**Purpose**: Generate specialized analyses with caching (same as narrative analysis)

**Workflow**: Identical to `GenerateNarrativeAnalysisUseCase` but with different prompts and analysis types

**Tests**: 10+ tests each covering all scenarios

**Total Metadata Generation Use Cases**: 6 (one per analysis type)

---

### Correction History Use Cases ⭐ NEW (Phase 3.7)

---

#### `SaveCorrectionHistoryUseCase`
**Purpose**: Save AI rewrite history entry after proposals are generated

**Dependencies**: `CorrectionHistoryRepository`, `IdGenerator` interfaces
**Input**: User ID, project ID, chapter ID, selected text, proposals array
**Output**: Created `CorrectionHistory` entity

**Workflow**:
1. Generate unique history ID
2. Create CorrectionHistory entity
3. Persist to repository
4. Return created history

**Tests**: 5+ tests covering save scenarios

---

#### `ListCorrectionHistoryUseCase`
**Purpose**: List correction history for a project or chapter

**Dependencies**: `CorrectionHistoryRepository` interface
**Input**: User ID, project ID, optional chapter ID
**Output**: Array of `CorrectionHistory` entities

**Workflow**:
1. Query repository by project/chapter
2. Filter by user ownership
3. Return sorted list (newest first)

**Tests**: 5+ tests covering list scenarios

---

#### `DeleteCorrectionHistoryUseCase`
**Purpose**: Delete a correction history entry

**Dependencies**: `CorrectionHistoryRepository` interface
**Input**: User ID, history ID
**Output**: void

**Workflow**:
1. Validate ownership
2. Delete from repository

**Tests**: 4+ tests covering deletion

---

### Phase 2 Use Cases (✅ Implemented)

---

#### `ImportProjectUseCase` ⭐ NEW
**Purpose**: Import multi-chapter document from .docx file

**Dependencies**: `DocumentParser` interface
**Input**: File buffer, filename
**Output**: Array of `Chapter` entities

**Workflow**:
1. Delegate parsing to DocumentParser
2. Parser splits document by H1 headings
3. Parser converts to TipTap JSON format
4. Returns Chapter array (minimum 1)

**Tests**: 6 tests covering success, error cases, and edge cases

---

#### `ExportProjectUseCase` ⭐ NEW
**Purpose**: Export multi-chapter project to .docx file

**Dependencies**: `DocumentExporter` interface
**Input**: `Project` entity, filename
**Output**: File buffer ready for download

**Workflow**:
1. Extract chapters from Project aggregate
2. Delegate to DocumentExporter
3. Exporter converts TipTap JSON to formatted DOCX
4. Adds page breaks between chapters
5. Returns buffer

**Tests**: 6 tests covering export scenarios

---

#### `SwitchChapterUseCase` ⭐ ENHANCED (Phase 3)
**Purpose**: Navigate between chapters with auto-save to database

**Dependencies**: `ProjectRepository` interface
**Input**: Project ID, target Chapter ID, user ID
**Output**: Updated `Project` entity

**Workflow**:
1. Validate chapter exists in project
2. Set active chapter in Project aggregate
3. **Auto-save current chapter to MongoDB** ✅ (Phase 3)
4. Return updated Project

**Tests**: 5 tests covering navigation and validation

---

#### `AddChapterUseCase` ⭐ NEW
**Purpose**: Create new chapter in project

**Dependencies**: `ProjectRepository` interface
**Input**: Project entity, chapter title (optional), user ID
**Output**: Updated `Project` with new chapter

**Workflow**:
1. Create empty Chapter with TipTap JSON
2. Add to Project aggregate (automatic ordering)
3. Project returns new instance
4. **Persist to MongoDB** ✅ (Phase 3)

**Tests**: 5 tests covering chapter creation

---

#### `RemoveChapterUseCase` ⭐ NEW
**Purpose**: Delete chapter from project

**Dependencies**: `ProjectRepository` interface
**Input**: Project entity, Chapter ID, user ID
**Output**: Updated `Project` without removed chapter

**Workflow**:
1. Validate chapter exists
2. Enforce business rule: minimum 1 chapter
3. Remove chapter from Project aggregate
4. If removed chapter was active, activate another
5. **Persist to MongoDB** ✅ (Phase 3)
6. Return updated Project

**Tests**: 4 tests covering deletion and business rules

---

#### `ReorderChaptersUseCase` ⭐ NEW
**Purpose**: Reorder chapters via drag & drop

**Dependencies**: `ProjectRepository` interface
**Input**: Project entity, fromIndex, toIndex, user ID
**Output**: Updated `Project` with reordered chapters

**Workflow**:
1. Validate indices
2. Reorder chapters in Project aggregate
3. Update chapter order values
4. **Persist to MongoDB** ✅ (Phase 3)
5. Return updated Project

**Tests**: 3 tests covering reordering scenarios

---

#### `UpdateChapterContentUseCase` ⭐ ENHANCED (Phase 3)
**Purpose**: Update chapter content (rich text editing) with auto-save

**Dependencies**: `ProjectRepository` interface
**Input**: Project entity, Chapter ID, TipTap JSON content, user ID
**Output**: Updated `Project` with modified chapter

**Workflow**:
1. Validate TipTap JSON structure
2. Find chapter in Project aggregate
3. Update chapter content (returns new Chapter)
4. Project updates chapter in collection
5. **Auto-save to MongoDB** ✅ (Phase 3)
6. Return updated Project

**Tests**: 3 tests covering content updates

---

#### `UpdateChapterTitleUseCase` ⭐ NEW
**Purpose**: Rename chapter

**Dependencies**: `ProjectRepository` interface
**Input**: Project entity, Chapter ID, new title, user ID
**Output**: Updated `Project` with renamed chapter

**Workflow**:
1. Validate title (non-empty)
2. Find chapter in Project aggregate
3. Update chapter title (returns new Chapter)
4. Project updates chapter in collection
5. **Persist to MongoDB** ✅ (Phase 3)
6. Return updated Project

**Tests**: 4 tests covering title updates and validation

---

### Phase 1 Use Cases (✅ Maintained for Compatibility)

---

#### `ImportDocumentUseCase` (Legacy)
**Purpose**: Import single document from .docx file

**Dependencies**: `DocumentParser` interface
**Input**: File buffer, filename
**Output**: `TextDocument` entity
**Tests**: 5 tests covering success and error cases

**Note**: Phase 1 single-document workflow. New code should use `ImportProjectUseCase`.

---

#### `ExportDocumentUseCase` (Legacy)
**Purpose**: Export single document to .docx format

**Dependencies**: `DocumentExporter` interface
**Input**: `TextDocument`, filename
**Output**: File buffer ready for download
**Tests**: 5 tests covering export scenarios

**Note**: Phase 1 single-document workflow. New code should use `ExportProjectUseCase`.

---

#### `RewriteTextUseCase` (✅ Enhanced for Phase 3.7)
**Purpose**: Core AI rewriting functionality with formatting support and history tracking

**Dependencies**: `LLMProvider`, `CorrectionHistoryRepository` interfaces
**Input**: `TextDocument` (or Chapter content), `TextSelection`, user/project/chapter IDs
**Output**: Array of 3 `RewriteProposal` objects (history auto-saved)

**Features**:
- Extracts context around selection (200 chars before/after)
- Validates selection boundaries
- Returns exactly 3 distinct proposals (épuré, lyrique, amplifié)
- **Automatically saves correction history** ⭐ NEW (Phase 3.7)
- Performance tracking in development mode
- Works with both plain text and TipTap JSON

**Tests**: 8+ tests covering context extraction, validation, proposals, and history

**Note**: Works with both Phase 1 (TextDocument) and Phase 2 (Chapter) entities.

---

## Testing

**Coverage**: 100% (perfect)
**Tests**: 100+ tests passing ⭐ ENHANCED (Phase 3.7)

All use cases tested with mocked dependencies following Clean Architecture principles:
- **Correction History Use Cases**: 14+ tests ⭐ NEW (Phase 3.7)
  - SaveCorrectionHistoryUseCase: 5 tests
  - ListCorrectionHistoryUseCase: 5 tests
  - DeleteCorrectionHistoryUseCase: 4 tests
- **Metadata Use Cases**: 60+ tests (Phase 3.6)
  - Metadata CRUD: 25+ tests (Create, Load, List, UpdateContent, UpdateTitle, Delete)
  - Generation Use Cases: 35+ tests (6 analysis types with caching logic)
- **Project CRUD Use Cases**: 23+ tests (Phase 3.5)
  - CreateProjectUseCase: 5 tests
  - LoadProjectUseCase: 4 tests
  - ListProjectsUseCase: 3 tests
  - DeleteProjectUseCase: 3 tests
  - UpdateProjectTitleUseCase: 4 tests
  - UpdateProjectProviderUseCase: 4 tests
- **Provider Use Cases**: 27+ tests ⭐ NEW
  - CreateProviderUseCase: 6 tests
  - UpdateProviderUseCase: 5 tests
  - DeleteProviderUseCase: 4 tests
  - ListProvidersUseCase: 3 tests
  - TestProviderConnectionUseCase: 5 tests
  - ValidateProviderUseCase: 4 tests
- **User Use Cases**: 6+ tests ⭐ NEW
  - RegisterUserUseCase: 6 tests
- **Chapter Use Cases**: 31 tests
  - ImportProjectUseCase: 6 tests
  - ExportProjectUseCase: 6 tests
  - SwitchChapterUseCase: 5 tests
  - AddChapterUseCase: 5 tests
  - RemoveChapterUseCase: 4 tests
  - ReorderChaptersUseCase: 3 tests
  - UpdateChapterContentUseCase: 3 tests
  - UpdateChapterTitleUseCase: 4 tests
- **Legacy Use Cases**: 15 tests
  - ImportDocumentUseCase: 5 tests
  - ExportDocumentUseCase: 5 tests
  - RewriteTextUseCase: 5 tests

## Design Patterns

**Use Case Pattern**:
- Single Responsibility: Each use case has one clear purpose
- Dependency Injection: Dependencies passed via constructor
- Interface Segregation: Depend on abstractions, not implementations
- Thin Orchestration: Delegates to Domain entities for business logic

**Error Handling**:
- Input validation delegated to Domain
- Infrastructure errors propagated with context
- Use cases throw domain exceptions

## Phase 5.1 Achievements

✅ **ImportFolderUseCase** - Markdown folder import
✅ **6+ new tests** for folder import use case
✅ **160+ tests passing** with 100% coverage

## Phase 5.0 Achievements

✅ **PublishProjectUseCase** - Publish with share token
✅ **UnpublishProjectUseCase** - Remove public access
✅ **LoadPublishedProjectUseCase** - Public project loading
✅ **14+ new tests** for publishing use cases

## Phase 4.1+ Achievements

✅ **LoadPublishedBlogArticlesPaginatedUseCase** - Blog pagination
✅ **5+ new tests** for pagination use case

## Phase 4.1 Achievements

✅ **GenerateChapterUseCase** - AI chapter generation with metadata context
✅ **GenerateCompletionUseCase** - Streaming autocompletion with caching
✅ **12+ new tests** for AI generation use cases
✅ **130+ tests passing** with 100% coverage

## Phase 4.0 Achievements

✅ **4 Blog Use Cases** - Create, Update, Delete, List blog articles
✅ **17+ new tests** for blog use cases

## Phase 3.11 Achievements

✅ **DeleteUserAccountUseCase** - RGPD cascade delete
✅ **SubmitContactFormUseCase** - Contact form handling
✅ **RegisterUserUseCase Enhanced** - Consent validation
✅ **15+ new tests** for RGPD use cases

## Phase 3.8 Achievements

✅ **ApproveUserUseCase** - Admin approval with HMAC tokens
✅ **RegisterUserUseCase Enhanced** - Email approval notifications
✅ **8+ new tests** for approval use cases

## Phase 3.7 Achievements

✅ **3 Correction History Use Cases** - Save, List, Delete with multi-tenant isolation
✅ **RewriteTextUseCase Enhanced** - Now auto-saves correction history
✅ **14+ new tests** for correction history use cases
✅ **Clean Architecture Maintained** - All new use cases follow established patterns

## Phase 3.6 Achievements

✅ **12 Metadata Use Cases** - 6 CRUD + 6 Generation use cases
✅ **Intelligent Caching** - SHA-256 content hashing for all generation use cases
✅ **Dual Provider Support** - Works with both OpenAI and Anthropic
✅ **Context-Aware Generation** - Synthesis and Worldbuilding use previous analyses
✅ **Clean Architecture Maintained** - All new use cases follow established patterns
✅ **Version-Controlled Prompts** - AI prompts loaded via PromptRepository interface

## Phase 3.5 Achievements

✅ **Project CRUD Use Cases** - 6 new use cases for project management
✅ **Provider Use Cases** - 6 new use cases for provider management
✅ **User Use Cases** - RegisterUserUseCase for user registration
✅ **Server Actions delegate to Use Cases** - Clean separation achieved
✅ **60+ tests passing** with 100% coverage
✅ **Dependency injection** via IdGenerator, LLMProviderFactory interfaces

## Phase 3 Achievements

✅ **All use cases now work with MongoDB persistence**
✅ **Multi-tenant support**: All use cases require userId parameter
✅ **Auto-save functionality**: Content updates automatically persist to database
✅ **Zero refactoring needed**: Clean Architecture enabled seamless Phase 3 migration
✅ **MongoDBProjectRepository integration** verified through all use cases

## Phase 2 Achievements

✅ 8 new use cases for multi-chapter management
✅ 100% test coverage achieved
✅ Database-agnostic design (ProjectRepository interface)
✅ Clean separation: Use cases orchestrate, Entities enforce business rules
✅ Backward compatible: Phase 1 use cases still available
