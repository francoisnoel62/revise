# Domain Layer

Pure business logic with zero framework dependencies.

**Status**: ✅ Phase 3 Complete (50+ tests passing, 97%+ coverage)

## Rules:
- No imports from Next.js, React, or any external frameworks
- No infrastructure concerns (no OpenAI, no file I/O, no database)
- Only business entities, value objects, and domain interfaces
- All code must be framework-agnostic and testable in isolation

## Contents:

### Entities (✅ Phase 3 Enhanced)

#### `User` ⭐ NEW (Phase 3)
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

#### `RewriteProposal`
**Purpose**: Immutable AI-generated text alternative

**Responsibilities**:
- Validates proposal content (non-empty)
- Supports optional style labels
- Ensures proposal quality

**Tests**: 6 tests for validation rules

---

### Interfaces (✅ Phase 3 Enhanced)

#### `LLMProvider`
**Contract**: AI text generation service

**Methods**:
- `generateRewrites(selectedText, contextBefore, contextAfter)`
  - Returns exactly 5 `RewriteProposal` objects
  - Implementations: `OpenAIProvider`

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

#### `AuthProvider` ⭐ NEW (Phase 3)
**Contract**: Authentication service abstraction

**Methods**:
- `signIn(email, password)` → `Promise<User>`
- `signOut()` → `Promise<void>`
- `getCurrentUser()` → `Promise<User | null>`
- `createSession(user)` → `Promise<void>`

**Implementation**: `AuthJsProvider` (Auth.js/NextAuth v5)

**Features**: Email/password authentication, JWT sessions, route protection

---

## Testing

**Coverage**: 97%+ (excellent)
**Tests**: 50+ tests passing

All domain logic has near-perfect test coverage with isolated unit tests:
- User: 5+ tests (validation, creation) ⭐ NEW
- Chapter: 15 tests (content management, metadata, validation)
- Project: 25+ tests (collection management, business rules, owner tracking) ⭐ ENHANCED
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
