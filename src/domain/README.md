# Domain Layer

Pure business logic with zero framework dependencies.

**Status**: ✅ Phase 3.6 Complete (60+ tests passing, 97%+ coverage)

## Rules:
- No imports from Next.js, React, or any external frameworks
- No infrastructure concerns (no OpenAI, no file I/O, no database)
- Only business entities, value objects, and domain interfaces
- All code must be framework-agnostic and testable in isolation

## Contents:

### Entities (✅ Phase 3 Enhanced)

#### `ProjectMetadata` ⭐ NEW (Phase 3.6)
**Purpose**: Represents metadata document with analysis content

**Responsibilities**:
- Manages metadata content as TipTap JSON
- Tracks metadata type (narrative_analysis, characters, plot, stylistic_dna, worldbuilding, synthesis)
- Stores content hash for cache invalidation
- Validates metadata type
- Provides cache validation via `needsRegeneration(newHash)`
- Immutable updates with new instances

**Key Methods**:
- `getId()`, `getProjectId()`, `getType()`, `getTitle()`, `getContent()`, `getContentHash()`
- `needsRegeneration(contentHash)` - Check if content changed
- `updateContent(content, contentHash)` - Returns new instance
- `updateTitle(title)` - Returns new instance
- `static create(id, projectId, type, title, content, contentHash)` - Factory method

**Tests**: 10+ tests covering validation, caching logic, updates

---

#### `User` (Phase 3)
**Purpose**: Represents a user account with authentication credentials

**Responsibilities**:
- Manages user identity (unique ID, email)
- Stores hashed password (bcrypt)
- Validates email format
- Creation timestamp

**Key Methods**:
- `getId()`, `getEmail()`, `getHashedPassword()`, `getCreatedAt()`
- `static create(id, email, hashedPassword)` - Factory method
- Email validation at construction

**Tests**: 5+ tests covering validation and creation

---

#### `Chapter`
**Purpose**: Represents a single chapter with rich text content (TipTap JSON)

**Responsibilities**:
- Manages chapter content as TipTap JSON (formatted text)
- Tracks chapter title and display order
- Calculates metadata (word count, character count)
- Validates TipTap JSON structure
- Immutable updates with new instances

**Key Methods**:
- `getId()`, `getTitle()`, `getContent()`, `getOrder()`
- `getMetadata()` - Returns `{ wordCount, characterCount }`
- `updateContent(tiptapJson)` - Returns new Chapter instance
- `updateTitle(title)` - Returns new Chapter instance
- `calculateWordCount()`, `calculateCharacterCount()` - Metadata calculation

**Tests**: 15 tests covering all business rules and edge cases

---

#### `Project` ⭐ ENHANCED (Phase 3)
**Purpose**: Aggregate managing a collection of chapters with owner tracking

**Responsibilities**:
- Manages chapter collection (add, remove, reorder)
- Enforces business rules (minimum 1 chapter)
- Tracks active chapter for navigation
- **Tracks owner ID for multi-tenant isolation** (Phase 3)
- Calculates project-level metadata
- Maintains chapter ordering
- **Timestamps for created/updated dates** (Phase 3)

**Key Methods**:
- `getChapters()`, `getActiveChapter()`, `getActiveChapterId()`
- `addChapter()` - Adds chapter with automatic ordering
- `removeChapter(id)` - Removes chapter (enforces minimum 1)
- `reorderChapters(fromIndex, toIndex)` - Drag & drop support
- `setActiveChapter(id)` - Navigation
- `updateChapter(id, content)` - Content updates
- `getProjectMetadata()` - Aggregate stats across all chapters

**Tests**: 23 tests covering collection management and business rules

---

#### `TextDocument` (Phase 1 - Legacy)
**Purpose**: Represents a single document with content and metadata

**Status**: Maintained for backward compatibility
**Note**: New code should use `Chapter` and `Project` entities

**Responsibilities**:
- Handles content validation and updates
- Manages document state (created date, last modified)

**Tests**: 15 tests covering all business rules

---

### Value Objects (✅ Implemented)

#### `TextSelection`
**Purpose**: Immutable representation of selected text range

**Responsibilities**:
- Validates selection boundaries
- Extracts selected content from text
- Ensures start ≤ end positions

**Tests**: 9 tests covering edge cases (empty selection, bounds, etc.)

---

#### `MetadataType` ⭐ NEW (Phase 3.6)
**Purpose**: Enum value object for 6 metadata analysis types

**Responsibilities**:
- Type-safe metadata type enumeration
- Validation of metadata types
- Supports: narrative_analysis, characters, plot, stylistic_dna, worldbuilding, synthesis

**Tests**: 3+ tests for validation rules

---

#### `NarrativeAnalysis`, `Characters`, `Plot`, `StylisticDNA`, `Worldbuilding`, `Synthesis` ⭐ NEW (Phase 3.6)
**Purpose**: Structured value objects for each analysis type

**Responsibilities**:
- Type-safe analysis data structures
- Validation of analysis content
- Immutable by design

**Tests**: Covered in use case tests

---

#### `RewriteProposal`
**Purpose**: Immutable AI-generated text alternative

**Responsibilities**:
- Validates proposal content (non-empty)
- Supports optional style labels
- Ensures proposal quality

**Tests**: 6 tests for validation rules

---

### Interfaces (✅ Phase 3 Enhanced)

#### `LLMProvider` ⭐ ENHANCED (Phase 3.6)
**Contract**: AI text generation and analysis service

**Methods**:
- `generateRewrites(selectedText, contextBefore, contextAfter)` - Returns 5 `RewriteProposal` objects
- `generateNarrativeAnalysis(chapters)` → `NarrativeAnalysis` ⭐ NEW
- `generateCharacters(chapters)` → `Characters` ⭐ NEW
- `generatePlot(chapters)` → `Plot` ⭐ NEW
- `generateStylisticDNA(chapters)` → `StylisticDNA` ⭐ NEW
- `generateWorldbuilding(chapters, analyses)` → `Worldbuilding` ⭐ NEW
- `generateSynthesis(chapters, analyses)` → `Synthesis` ⭐ NEW

**Implementations**: `OpenAIProvider`, `AnthropicProvider` ⭐ NEW

---

#### `DocumentParser`
**Contract**: Document import service

**Methods**:
- `parse(buffer, filename)` → `Promise<TextDocument>` (Phase 1)
- `parseToChapters(buffer, filename)` → `Promise<Chapter[]>` ⭐ NEW (Phase 2)
  - Splits document by H1 headings
  - Preserves formatting as TipTap JSON
  - Falls back to single chapter if no H1 found

**Implementations**: `DocxParser`

---

#### `DocumentExporter`
**Contract**: Document export service

**Methods**:
- `export(document, filename)` → `Promise<Buffer>` (Phase 1)
- `exportProject(project, filename)` → `Promise<Buffer>` ⭐ NEW (Phase 2)
  - Exports all chapters with page breaks
  - Preserves formatting from TipTap JSON
  - Adds chapter titles as H1 headings

**Implementations**: `DocxExporter`

---

#### `ProjectRepository` ⭐ ENHANCED (Phase 3)
**Contract**: Project persistence abstraction with multi-tenant support

**Methods**:
- `createProject(userId, project)` → `Promise<Project>`
- `loadProject(userId, projectId)` → `Promise<Project | null>`
- `listProjects(userId)` → `Promise<Project[]>`
- `updateProject(userId, project)` → `Promise<Project>`
- `deleteProject(userId, projectId)` → `Promise<void>`
- `updateChapter(userId, projectId, chapter)` → `Promise<void>` (Phase 3 optimization)

**Phase 2 Implementation**: `InMemoryProjectRepository` (ephemeral, testing)
**Phase 3 Implementation**: `MongoDBProjectRepository` ✅ (MongoDB Atlas)

**Multi-Tenant Isolation**: All methods require `userId` to ensure data isolation between users

---

#### `UserRepository` ⭐ NEW (Phase 3)
**Contract**: User management and authentication

**Methods**:
- `createUser(user)` → `Promise<User>`
- `findByEmail(email)` → `Promise<User | null>`
- `findById(userId)` → `Promise<User | null>`
- `emailExists(email)` → `Promise<boolean>`

**Implementation**: `MongoDBUserRepository` (MongoDB Atlas with bcrypt)

**Security**: Passwords are hashed with bcrypt before storage

---

#### `MetadataRepository` ⭐ NEW (Phase 3.6)
**Contract**: Metadata persistence abstraction with multi-tenant support

**Methods**:
- `createMetadata(userId, metadata)` → `Promise<ProjectMetadata>`
- `loadMetadata(userId, metadataId)` → `Promise<ProjectMetadata | null>`
- `listMetadata(userId, projectId)` → `Promise<ProjectMetadata[]>`
- `updateMetadata(userId, metadata)` → `Promise<ProjectMetadata>`
- `deleteMetadata(userId, metadataId)` → `Promise<void>`

**Implementation**: `MongoDBMetadataRepository` (MongoDB Atlas)

**Multi-Tenant Isolation**: All methods require `userId` to ensure data isolation

---

#### `PromptRepository` ⭐ NEW (Phase 3.6)
**Contract**: AI prompt loading from version-controlled files

**Methods**:
- `getPrompt(type, section)` → `Promise<string>`
- Loads prompts from `/docs/prompt/metadata/` markdown files

**Implementation**: `FilePromptRepository`

---

#### `AuthProvider` (Phase 3)
**Contract**: Authentication service abstraction

**Methods**:
- `signIn(email, password)` → `Promise<User>`
- `signOut()` → `Promise<void>`
- `getCurrentUser()` → `Promise<User | null>`
- `createSession(user)` → `Promise<void>`

**Implementation**: `AuthJsProvider` (Auth.js/NextAuth v5)

**Features**: Email/password authentication, JWT sessions, route protection

---

#### `IdGenerator` ⭐ NEW (Phase 3.5)
**Contract**: UUID generation abstraction

**Methods**:
- `generate()` → `string` - Returns a unique UUID

**Implementation**: `UUIDGenerator` (crypto.randomUUID())

**Purpose**: Allows Provider entity to accept ID as parameter, keeping crypto dependency in Infrastructure layer

---

#### `LLMProviderFactory` ⭐ NEW (Phase 3.5)
**Contract**: Factory for creating LLM provider instances

**Methods**:
- `create(provider: Provider)` → `LLMProvider` - Creates LLM provider from Provider entity

**Implementation**: `LLMProviderFactoryImpl`

**Purpose**: Centralizes LLM provider instantiation for testing provider connections

---

## Testing

**Coverage**: 97%+ (excellent)
**Tests**: 60+ tests passing

All domain logic has near-perfect test coverage with isolated unit tests:
- ProjectMetadata: 10+ tests (CRUD, caching logic, hash validation) ⭐ NEW (Phase 3.6)
- MetadataType: 3+ tests (validation) ⭐ NEW (Phase 3.6)
- User: 5+ tests (validation, creation) (Phase 3)
- Chapter: 15 tests (content management, metadata, validation)
- Project: 25+ tests (collection management, business rules, owner tracking)
- TextDocument: 15 tests (legacy entity)
- TextSelection: 9 tests (boundary cases)
- RewriteProposal: 6 tests (validation)

## Design Patterns

**Entities**:
- Immutability: All updates return new instances
- Encapsulation: Private constructors, factory methods
- Rich domain model: Behavior co-located with data

**Value Objects**:
- Immutable by design
- Equality by value, not reference
- Validation in constructor

**Aggregates**:
- `Project` is aggregate root managing `Chapter` collection
- Enforces invariants (minimum 1 chapter)
- Transactional boundaries for consistency

## Phase 3.6 Achievements

✅ **ProjectMetadata entity** with TipTap JSON storage and content hash tracking
✅ **MetadataType value object** for type-safe metadata types
✅ **6 analysis value objects** (NarrativeAnalysis, Characters, Plot, StylisticDNA, Worldbuilding, Synthesis)
✅ **LLMProvider interface enhanced** with 6 new analysis methods
✅ **MetadataRepository interface** for metadata persistence
✅ **PromptRepository interface** for version-controlled AI prompts
✅ **60+ tests** with comprehensive coverage
✅ Zero framework dependencies maintained

## Phase 3.5 Achievements

✅ **IdGenerator interface** for UUID generation abstraction
✅ **LLMProviderFactory interface** for LLM provider creation
✅ **Provider entity** now accepts ID as parameter (cleaner architecture)
✅ Zero crypto dependency in Domain layer (moved to Infrastructure)

## Phase 3 Achievements

✅ **User entity** for authentication (email, hashed password)
✅ **Project entity** enhanced with owner tracking and timestamps
✅ **UserRepository interface** for user management
✅ **AuthProvider interface** for authentication abstraction
✅ **ProjectRepository enhanced** with multi-tenant support (all methods require userId)
✅ **Multi-tenant data isolation** enforced at domain level
✅ 97%+ test coverage with 50+ passing tests
✅ Zero framework dependencies maintained
✅ Clean Architecture principles preserved through Phase 3

## Phase 2 Achievements

✅ Multi-chapter architecture with Chapter and Project entities
✅ TipTap JSON as storage format for rich text
✅ Database-agnostic repository pattern
✅ Metadata calculations (word/character counts)
✅ Business rules enforcement (minimum chapters, ordering)
