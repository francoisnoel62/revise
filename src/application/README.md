# Application Layer

Orchestrates domain logic through use cases.

**Status**: ✅ Phase 3.6 Complete (70+ tests passing, 100% coverage)

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

### User Use Cases ⭐ NEW (Phase 3.5)

---

#### `RegisterUserUseCase`
**Purpose**: User registration with validation

**Dependencies**: `UserRepository` interface
**Input**: Email, password
**Output**: Created `User` entity

**Workflow**:
1. Validate email format
2. Check if email already exists
3. Hash password with bcrypt
4. Create User entity
5. Persist to UserRepository

**Tests**: 6+ tests covering registration and validation

---

### Metadata Use Cases ⭐ NEW (Phase 3.6)

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

#### `RewriteTextUseCase` (✅ Enhanced for Rich Text)
**Purpose**: Core AI rewriting functionality with formatting support

**Dependencies**: `LLMProvider` interface
**Input**: `TextDocument` (or Chapter content), `TextSelection`
**Output**: Array of 5 `RewriteProposal` objects

**Features**:
- Extracts context around selection (200 chars before/after)
- Validates selection boundaries
- Returns exactly 5 distinct proposals
- Performance tracking in development mode
- Works with both plain text and TipTap JSON

**Tests**: 5 tests covering context extraction, validation, and proposals

**Note**: Works with both Phase 1 (TextDocument) and Phase 2 (Chapter) entities.

---

## Testing

**Coverage**: 100% (perfect)
**Tests**: 90+ tests passing ⭐ ENHANCED (Phase 3.6)

All use cases tested with mocked dependencies following Clean Architecture principles:
- **Metadata Use Cases**: 60+ tests ⭐ NEW (Phase 3.6)
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

## Phase 3.6 Achievements

✅ **12 Metadata Use Cases** - 6 CRUD + 6 Generation use cases
✅ **Intelligent Caching** - SHA-256 content hashing for all generation use cases
✅ **Dual Provider Support** - Works with both OpenAI and Anthropic
✅ **Context-Aware Generation** - Synthesis and Worldbuilding use previous analyses
✅ **90+ tests passing** with 100% coverage (up from 60+)
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
