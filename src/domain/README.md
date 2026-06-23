# Domain Layer

Pure business logic with zero framework dependencies.

**Status**: ✅ Phase 10.0 Complete (see [README.md](../../README.md) for test statistics)

## Rules:
- No imports from Next.js, React, or any external frameworks
- No infrastructure concerns (no OpenAI, no file I/O, no database)
- Only business entities, value objects, and domain interfaces
- All code must be framework-agnostic and testable in isolation

## Contents:

### Entities (✅ Phase 10.0 Enhanced)

#### `CorrectionHistory` ⭐ NEW (Phase 3.7)
**Purpose**: Represents an AI rewrite history entry with proposals

**Responsibilities**:
- Tracks selected text that was rewritten
- Stores all 3 AI-generated proposals
- Links to project and chapter
- Timestamps for when correction was made
- Immutable once created

**Key Methods**:
- `getId()`, `getProjectId()`, `getChapterId()`, `getSelectedText()`
- `getProposals()` - Returns array of 3 RewriteProposal objects
- `getCreatedAt()` - Timestamp of correction
- `static create(id, projectId, chapterId, selectedText, proposals)` - Factory method

**Tests**: 15+ tests covering entity creation and validation

---

#### `ProjectMetadata` (Phase 3.6)
**Purpose**: Represents metadata document with analysis content

**Responsibilities**:
- Manages metadata content as TipTap JSON
- Tracks metadata type (narrative_analysis, characters, plot, stylistic_dna, worldbuilding, synthesis)
- Stores content hash for cache invalidation
- Validates metadata type
- Provides cache validation via `needsRegeneration(newHash)`
- **Carries `structuredData`** (JSON-serialized AI output) alongside the TipTap content ⭐ Phase 8.0
- **Tracks generation provenance** (`generatedAt`, `isGenerated`, `lastEdited`) so context can decide
  whether `structuredData` is still trustworthy ("author edit wins") ⭐ Phase 8.0
- Immutable content/title updates with new instances

**Key Methods**:
- `getId()`, `getProjectId()`, `getType()`, `getTypeKey()`, `getTitle()`, `getContent()`, `getContentHash()`
- `needsRegeneration(contentHash)` - Check if content changed
- `getStructuredData()`, `getContentText()` - Structured AI output / plain-text fallback ⭐ Phase 8.0
- `isGenerated()`, `wasEditedSinceGeneration()` - True once the author edits a generated fiche ⭐ Phase 8.0
- `markAsGenerated()` - Single timestamp at generation (`lastEdited === generatedAt`) ⭐ Phase 8.0
- `updateContent(content, contentHash)` / `updateTitle(title)` - Returns new instance
- `static create(...)` / `static createGenerated(...)` - Factory methods (manual vs AI-generated) ⭐ Phase 8.0

**Tests**: 10+ tests covering validation, caching logic, updates, and author-edit-wins provenance

---

#### `User` (Phase 3, 3.8, 3.11)
**Purpose**: Represents a user account with authentication, approval, and consent

**Responsibilities**:
- Manages user identity (unique ID, email)
- Stores hashed password (bcrypt)
- **Tracks approval status** (`isApproved`, `approvedAt`) ⭐ Phase 3.8
- **Tracks RGPD consent** (`termsAcceptedAt`, `privacyAcceptedAt`) ⭐ Phase 3.11
- Validates email format
- Creation timestamp

**Key Methods**:
- `getId()`, `getEmail()`, `getHashedPassword()`, `getCreatedAt()`
- `isApproved()`, `getApprovedAt()` ⭐ Phase 3.8
- `getTermsAcceptedAt()`, `getPrivacyAcceptedAt()` ⭐ Phase 3.11
- `approve()` - Returns new approved User instance ⭐ Phase 3.8
- `static create(id, email, hashedPassword, consents)` - Factory method
- Email validation at construction

**Tests**: 10+ tests covering validation, approval, and consent

---

#### `BlogArticle` ⭐ NEW (Phase 4.0)
**Purpose**: Represents a blog article with slug, content, and metadata

**Responsibilities**:
- Manages article identity (unique ID, slug)
- Stores title, content, excerpt
- Tracks author and publication status
- SEO metadata (description, keywords)
- Timestamps (createdAt, updatedAt, publishedAt)

**Key Methods**:
- `getId()`, `getSlug()`, `getTitle()`, `getContent()`
- `getExcerpt()`, `isPublished()`, `getPublishedAt()`
- `publish()`, `unpublish()` - Returns new instance
- `updateContent(content)` - Returns new instance
- `static create(id, slug, title, content, ...)` - Factory method

**Tests**: 8+ tests covering CRUD and publishing

---

#### `ContactMessage` ⭐ NEW (Phase 3.11)
**Purpose**: Represents a contact form submission

**Responsibilities**:
- Manages contact identity (unique ID)
- Stores sender info (name, email)
- Message content and subject
- Timestamps (createdAt)
- Read/unread status

**Key Methods**:
- `getId()`, `getName()`, `getEmail()`, `getSubject()`, `getMessage()`
- `isRead()`, `markAsRead()` - Returns new instance
- `static create(id, name, email, subject, message)` - Factory method

**Tests**: 5+ tests covering creation and validation

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

#### `Project` ⭐ ENHANCED (Phase 3, 5.0, 6.1)
**Purpose**: Aggregate managing a collection of chapters with owner tracking and publishing

**Responsibilities**:
- Manages chapter collection (add, remove, reorder)
- Enforces business rules (minimum 1 chapter)
- Tracks active chapter for navigation
- **Tracks owner ID for multi-tenant isolation** (Phase 3)
- Calculates project-level metadata
- Maintains chapter ordering
- **Timestamps for created/updated dates** (Phase 3)
- **Publishing support** (`shareToken`, `isPublished`, `publishedAt`) ⭐ Phase 5.0
- **Publish/unpublish methods** for public sharing ⭐ Phase 5.0
- **Cover image support** (`coverImageUrl`) ⭐ Phase 6.1

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

#### `Character` ⭐ NEW (Phase 6)
**Purpose**: Represents a fictional character in the project

**Responsibilities**:
- Manages character identity (unique ID, project association)
- Stores character details (name, aliases, description)
- Tracks personality traits and goals
- Manages character relationships
- Tracks source chapter for characters extracted from analysis
- Timestamps for created/updated dates

**Key Methods**:
- `getId()`, `getProjectId()`, `getName()`, `getAliases()`
- `getDescription()`, `getTraits()`, `getGoals()`, `getRelationships()`
- `getSourceChapterId()`, `getCreatedAt()`, `getUpdatedAt()`
- `update(updates)` - Returns new instance with updates
- `static create(id, projectId, name, ...)` - Factory method

**Tests**: 20+ tests covering entity creation, validation, and updates

---

#### `ProjectSettings` ⭐ ENHANCED (Phase 6, 10.0)
**Purpose**: Represents project-level settings and metadata; now also owns per-project autocomplete preferences

**Responsibilities**:
- Manages project configuration (genre, themes)
- Stores narration settings (POV, tense, person)
- Tracks contributors with roles
- Manages related works references
- Stores cover image URL
- Timestamps for created/updated dates

**Key Methods**:
- `getId()`, `getProjectId()`, `getGenre()`, `getThemes()`
- `getNarrationSettings()`, `getContributors()`, `getRelatedWorks()`
- `getCoverImageUrl()`, `getCreatedAt()`, `getUpdatedAt()`
- `getAutocompletePreferences()` - Returns `AutocompletePreferences` with defaults applied ⭐ Phase 10.0
- `update(updates)` - Returns new instance with updates
- `static create(id, projectId, ...)` - Factory method

**Tests**: 20+ tests covering entity creation, updates, and autocomplete preference access

---

#### `ProjectTask` ⭐ NEW (Phase 6)
**Purpose**: Represents a task associated with a project

**Responsibilities**:
- Manages task identity (unique ID, project association)
- Stores task details (title, description)
- Tracks priority and status
- Manages due dates and completion
- Tracks assigned contributors
- Links to related chapters
- Timestamps for created/updated/completed dates

**Key Methods**:
- `getId()`, `getProjectId()`, `getTitle()`, `getDescription()`
- `getPriority()`, `getStatus()`, `getDueDate()`, `getCompletedAt()`
- `getContributors()`, `getRelatedChapterIds()`
- `update(updates)` - Returns new instance with updates
- `complete()` - Marks task as done with timestamp
- `static create(id, projectId, title, ...)` - Factory method

**Tests**: 25+ tests covering entity creation, status transitions, and validation

---

#### `ResearchDocument` ⭐ NEW (Phase 6)
**Purpose**: Represents a research document for the project

**Responsibilities**:
- Manages document identity (unique ID, project association)
- Stores document type (note/link/quote/reference/image), title, body, and source metadata
- Tracks tags for categorization and chapter locality (`linkedChapterIds`)
- **Read by the AI as the author's intentional context** ⭐ Phase 8.0
- Timestamps for created/updated dates

**Key Methods**:
- `getId()`, `getProjectId()`, `getType()`, `getTitle()`, `getContent()`, `getTags()`
- `getContentText()` - Plain text of the body (handles `{ text }` and TipTap shapes) ⭐ Phase 8.0
- `getLinkedChapterIds()`, `isLinkedToChapter(chapterId)` - Locality for context selection ⭐ Phase 8.0
- `getUrl()`, `getSourceTitle()`, `getSourceAuthor()`
- `getCreatedAt()`, `getUpdatedAt()`
- `update(updates)` - Returns new instance with updates
- `static create(id, projectId, title, ...)` - Factory method

**Tests**: 15+ tests covering entity creation, updates, and context-text extraction

---

#### `WritingGoal` ⭐ NEW (Phase 6)
**Purpose**: Represents a writing goal for the project

**Responsibilities**:
- Manages goal identity (unique ID, project association)
- Stores goal details (title, target word count)
- Tracks deadline and active status
- Calculates progress from current word count
- Timestamps for created/updated dates

**Key Methods**:
- `getId()`, `getProjectId()`, `getTitle()`, `getTargetWordCount()`
- `getDeadline()`, `isActive()`, `getCreatedAt()`, `getUpdatedAt()`
- `calculateProgress(currentWordCount)` - Returns percentage
- `update(updates)` - Returns new instance with updates
- `static create(id, projectId, title, ...)` - Factory method

**Tests**: 15+ tests covering entity creation and progress calculation

---

#### `AIUsageRecord` ⭐ ENHANCED (Phase 6, 9.0)
**Purpose**: Represents an AI usage record for tracking and billing

**Responsibilities**:
- Manages usage identity (unique ID, project/user association)
- Stores operation details (type, model, provider)
- Tracks token counts (input, output, cached input) — captured from provider API responses (Phase 9.0)
- Stores euro cost snapshot computed at usage time via `ModelPricing` (Phase 9.0)
- Timestamps for when the operation occurred

**Key Methods**:
- `getId()`, `getProjectId()`, `getUserId()`, `getOperationType()`
- `getModel()`, `getProvider()`, `getInputTokens()`, `getOutputTokens()`, `getCachedInputTokens()`
- `getTotalTokens()`, `getCostEur()`, `getCreatedAt()`
- `static create(id, projectId, userId, ...)` - Factory method

**Tests**: 15+ tests covering entity creation and cost calculation

---

#### `CharacterConversation` ⭐ NEW (Phase 9.0)
**Purpose**: Represents a persisted conversation between the author and a character persona

**Responsibilities**:
- Owns an ordered list of `ChatMessage` value objects
- Scoped to a project and a specific character (`ownerId`, `projectId`, `characterId`)
- Immutable append via `addMessage()` — returns a new instance

**Key Methods**:
- `getId()`, `getOwnerId()`, `getProjectId()`, `getCharacterId()`
- `getMessages()` - Returns `ChatMessage[]` array
- `addMessage(message)` - Returns new instance with appended message
- `getCreatedAt()`, `getUpdatedAt()`
- `static create(id, ownerId, projectId, characterId)` - Factory method
- `static reconstruct(props)` - Reconstitution from serialized data

**Tests**: 10+ tests covering creation, validation, and message appending

---

#### `ChapterAnalysis` ⭐ NEW (Phase 7)
**Purpose**: Represents a complete chapter analysis result

**Responsibilities**:
- Manages analysis issues, repetitions, and statistics
- Tracks content hash for cache invalidation
- Supports filtering by category and severity
- Immutable updates with new instances

**Key Methods**:
- `getId()`, `getChapterId()`, `getProjectId()`, `getOwnerId()`
- `getIssues()`, `getRepetitions()`, `getCategories()`, `getStyleRigor()`
- `getStatsByCategory()`, `getStatsBySeverity()`, `getPendingCount()`
- `applyIssue(issueId)`, `ignoreIssue(issueId)` - Returns new instance
- `hasChanges(currentHash)` - Check if content changed

**Tests**: 30+ tests covering entity creation, filtering, and statistics

---

#### `AnalysisHistory` ⭐ NEW (Phase 7)
**Purpose**: Represents an analysis history entry

**Responsibilities**:
- Tracks when analysis was performed
- Records applied/ignored corrections
- Stores original and final content hashes

**Key Methods**:
- `getId()`, `getChapterId()`, `getProjectId()`, `getOwnerId()`
- `getAnalyzedAt()`, `getOriginalHash()`, `getFinalHash()`
- `getAppliedCorrections()`, `getIgnoredCorrections()`

**Tests**: 20+ tests covering entity creation and validation

---

#### `AutocompleteEvent` ⭐ NEW (Phase 10.0)
**Purpose**: Records the full lifecycle of one autocomplete suggestion for telemetry

**Responsibilities**:
- Tracks suggestion state transitions (triggered → displayed → accepted/rejected/expired)
- Stores provider, model, latency (ms to first token), session and project identifiers
- Carries `AutocompleteOutcome` for aggregation

**Key Methods**:
- `getId()`, `getProjectId()`, `getSessionId()`, `getProvider()`, `getModel()`
- `getLatencyMs()`, `getOutcome()`, `getCreatedAt()`
- `static create(id, projectId, ...)` - Factory method

**Tests**: 20+ tests covering state transitions and validation

---

#### `CanonFact` ⭐ NEW (Phase 10.0)
**Purpose**: An established fact extracted from the manuscript, used to ground autocomplete suggestions

**Responsibilities**:
- Stores fact type (character, location, relation, event), content, and source chapter
- Tracks provenance (`derived` = LLM-extracted | `authored` = manually added)
- Tracks validity status (valid / invalid) — author can invalidate incorrect facts
- Immutable updates with new instances

**Key Methods**:
- `getId()`, `getProjectId()`, `getType()`, `getContent()`, `getSource()`
- `isValid()`, `invalidate()` / `validate()` - Returns new instance
- `getChapterId()`, `getCreatedAt()`, `getUpdatedAt()`
- `static create(id, projectId, ...)` - Factory method

**Tests**: 20+ tests covering creation, validation, and source tracking

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

### Value Objects (✅ Phase 10.0 Enhanced)

#### `TextSelection`
**Purpose**: Immutable representation of selected text range

**Responsibilities**:
- Validates selection boundaries
- Extracts selected content from text
- Ensures start ≤ end positions

**Tests**: 9 tests covering edge cases (empty selection, bounds, etc.)

---

#### `MetadataType` (Phase 3.6, 3.7, 6)
**Purpose**: Enum value object for 8 metadata analysis types

**Responsibilities**:
- Type-safe metadata type enumeration
- Validation of metadata types
- Supports: narrative_analysis, characters, plot, stylistic_dna, worldbuilding, chapter_summaries, synthesis, **editorial** ⭐ NEW (Phase 6)

**Tests**: 5+ tests for validation rules

---

#### `AnalysisCategory` ⭐ NEW (Phase 7)
**Purpose**: Enum value object for chapter verification categories

**Responsibilities**:
- Type-safe category enumeration
- Validation of category values
- Supports: spelling, grammar, punctuation, style, repetition

**Tests**: 5+ tests for validation rules

---

#### `AnalysisSeverity` ⭐ NEW (Phase 7)
**Purpose**: Enum value object for issue severity levels

**Responsibilities**:
- Type-safe severity enumeration
- Validation of severity values
- Supports: error, warning, suggestion

**Tests**: 5+ tests for validation rules

---

#### `AnalysisIssue` ⭐ NEW (Phase 7)
**Purpose**: Value object for individual analysis issues

**Responsibilities**:
- Stores issue details (position, text, suggestion)
- Tracks issue status (pending, applied, ignored)
- Immutable by design

**Properties**:
- `id`, `category`, `severity`, `originalText`, `suggestion`
- `startPosition`, `endPosition`, `context`
- `status` - pending, applied, or ignored

**Tests**: 15+ tests for validation and status changes

---

#### `RepetitionCluster` ⭐ NEW (Phase 7)
**Purpose**: Value object for repeated word/phrase clusters

**Responsibilities**:
- Stores repeated word and all occurrences
- Tracks distance between occurrences
- Marks intentional repetitions (stylistic choice)

**Properties**:
- `word`, `occurrences` (array of positions), `isIntentional`

**Tests**: 10+ tests for validation rules

---

#### `RepetitionExclusions` ⭐ NEW (Phase 7)
**Purpose**: Value object for words excluded from repetition analysis

**Responsibilities**:
- Manages list of excluded words (character names, etc.)
- Stores reason for exclusion
- Immutable by design

**Tests**: 10+ tests for validation rules

---

#### `StyleRigor` ⭐ NEW (Phase 7)
**Purpose**: Enum value object for analysis strictness levels

**Responsibilities**:
- Type-safe rigor level enumeration
- Validation of rigor values
- Supports: strict, balanced, light

**Tests**: 10+ tests for validation rules

---

#### `NarrativeAnalysis`, `Characters`, `Plot`, `StylisticDNA`, `Worldbuilding`, `ChapterSummaries`, `Synthesis` (Phase 3.6, 3.7)
**Purpose**: Structured value objects for each analysis type

**Responsibilities**:
- Type-safe analysis data structures
- Validation of analysis content
- Immutable by design

**Tests**: Covered in use case tests

---

#### `TaskPriority` ⭐ NEW (Phase 6)
**Purpose**: Enum value object for task priority levels

**Responsibilities**:
- Type-safe priority enumeration
- Validation of priority values
- Supports: low, medium, high, urgent

**Tests**: 5+ tests for validation rules

---

#### `TaskStatus` ⭐ NEW (Phase 6)
**Purpose**: Enum value object for task status

**Responsibilities**:
- Type-safe status enumeration
- Validation of status values
- Supports: todo, in_progress, done, blocked

**Tests**: 5+ tests for validation rules

---

#### `Contributor` ⭐ NEW (Phase 6)
**Purpose**: Value object for project contributors

**Responsibilities**:
- Stores contributor name and role
- Immutable by design
- Validation of required fields

**Tests**: 5+ tests for validation rules

---

#### `RelatedWork` ⭐ NEW (Phase 6)
**Purpose**: Value object for related works references

**Responsibilities**:
- Stores work title, author, and type
- Immutable by design
- Validation of required fields

**Tests**: 5+ tests for validation rules

---

#### `NarrationSettings` ⭐ NEW (Phase 6)
**Purpose**: Value object for narration settings

**Responsibilities**:
- Stores POV (first, third limited, third omniscient)
- Stores tense (past, present)
- Stores person (first, second, third)
- Immutable by design

**Tests**: 5+ tests for validation rules

---

#### `AIOperationType` ⭐ ENHANCED (Phase 6, 10.0)
**Purpose**: Enum value object for AI operation types

**Responsibilities**:
- Type-safe operation type enumeration
- Validation of operation types
- Supports: rewrite, generate, complete, analyze, **canon_generation** ⭐ Phase 10.0

**Tests**: 5+ tests for validation rules

---

#### `AutocompletePreferences` ⭐ NEW (Phase 10.0)
**Purpose**: Per-project autocomplete configuration with 6 settings and defaults

**Properties**:
- `enabled` (boolean, default: true)
- `suggestionLength` ('short' | 'medium' | 'long', default: 'medium')
- `audace` ('prudent' | 'balanced' | 'bold', default: 'balanced')
- `smartPrefetch` (boolean, default: true)
- `partialAcceptance` (boolean, default: true)
- `learnFromRejections` (boolean, default: false)

---

#### `AutocompleteIntent` ⭐ NEW (Phase 10.0)
**Purpose**: Detected writing intention of the current context, used to select suggestion variant

**Supports**: `dialogue`, `description`, `action`, `introspection`, `other`

**Tests**: 10+ tests covering classification logic

---

#### `AutocompleteOutcome` ⭐ NEW (Phase 10.0)
**Purpose**: Result of a suggestion interaction for telemetry aggregation

**Supports**: `accepted_full`, `accepted_partial`, `rejected`, `expired`, `ignored`

**Tests**: 5+ tests for validation rules

---

#### `CanonFacts` / `CanonFactSource` ⭐ NEW (Phase 10.0)
**Purpose**: Typed collection of canon facts + provenance enum (`derived` | `authored`)

**Tests**: Covered in CanonFact entity tests

---

#### `AIOperationPolicy` ⭐ NEW (Phase 10.0)
**Purpose**: Maps each `AIOperationType` to a model selection policy (fast vs standard)

**Responsibilities**:
- Autocomplete always uses fast models (Flash, Haiku)
- Analysis / generation use standard models
- Immutable lookup table

**Tests**: 5+ tests for policy resolution

---

#### `ChatMessage` ⭐ NEW (Phase 9.0)
**Purpose**: Single message in a character conversation

**Responsibilities**:
- Stores `role` (`'author'` | `'character'`), `content`, and `createdAt`
- Validates that content is non-empty
- Immutable by design

**Key Methods**:
- `getRole()`, `getContent()`, `getCreatedAt()`
- `static create(role, content)` - Factory method
- `static reconstruct(props)` - Reconstitution from serialized data
- `toProperties()` - Serialization helper

**Tests**: 10+ tests covering creation, validation, and role constraints

---

#### `ModelPricing` ⭐ NEW (Phase 9.0)
**Purpose**: Maintained pricing table (€/million tokens) for all supported models; computes euro cost per LLM call

**Responsibilities**:
- Maps model prefixes to per-token costs (input, output, cached input)
- Handles provider-specific cached-token accounting (Anthropic reports separately; OpenAI/Google include in prompt count)
- Returns `null` cost for unknown/unpriced models
- Cost is snapshot at usage time — later price changes never rewrite historical records

**Key Functions**:
- `computeCost({ provider, model, inputTokens, outputTokens, cachedInputTokens })` → `number | null`

**Tests**: 20+ tests covering pricing computation, cached-token discounting, and unknown models

---

#### `RewriteProposal`
**Purpose**: Immutable AI-generated text alternative

**Responsibilities**:
- Validates proposal content (non-empty)
- Supports optional style labels
- Ensures proposal quality

**Tests**: 6 tests for validation rules

---

### Interfaces (✅ Phase 10.0 Enhanced)

#### `LLMProvider` ⭐ ENHANCED (Phase 3.6, 9.0)
**Contract**: AI text generation and analysis service

**Methods**:
- `generateRewrites(selectedText, contextBefore, contextAfter, authorProfile?)` - Returns 3 `RewriteProposal` objects
- `generateChapter(..., projectContext?)`, `generateCompletion(..., projectContext?)`, `generateCompletionStream(..., projectContext?)` - Receive ready-to-inject context strings (Phase 8.0)
- `generateNarrativeAnalysis(chapters)` → `NarrativeAnalysis`
- `generateCharacters(chapters)` → `Characters`
- `generatePlot(chapters)` → `Plot`
- `generateStylisticDNA(chapters)` → `StylisticDNA`
- `generateWorldbuilding(chapters, analyses)` → `Worldbuilding`
- `generateSynthesis(chapters, analyses)` → `Synthesis`
- `chatStream(messages, systemPrompt)` → `AsyncIterableIterator<string>` ⭐ Phase 9.0
- `generateCharacterSheet(input)` → `GenerateCharacterSheetResult` ⭐ Phase 9.0
- `getLastTokenUsage?()` → `TokenUsage | null` — optional; exposes input/output/cached counts after any call ⭐ Phase 9.0

**Implementations**: `OpenAIProvider`, `AnthropicProvider`, `GoogleProvider`

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
- `findPublishedByToken(projectId, token)` → `Promise<Project | null>` ⭐ NEW (Phase 5.0)

**Phase 2 Implementation**: `InMemoryProjectRepository` (ephemeral, testing)
**Phase 3 Implementation**: `MongoDBProjectRepository` ✅ (MongoDB Atlas)

**Multi-Tenant Isolation**: All methods require `userId` to ensure data isolation between users
**Public Access**: `findPublishedByToken` allows unauthenticated access to published projects

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

#### `MetadataRepository` (Phase 3.6)
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

#### `CorrectionHistoryRepository` ⭐ NEW (Phase 3.7)
**Contract**: Correction history persistence abstraction with multi-tenant support

**Methods**:
- `save(userId, history)` → `Promise<CorrectionHistory>`
- `listByChapter(userId, projectId, chapterId)` → `Promise<CorrectionHistory[]>`
- `listByProject(userId, projectId)` → `Promise<CorrectionHistory[]>`
- `delete(userId, historyId)` → `Promise<void>`

**Implementation**: `MongoDBCorrectionHistoryRepository` (MongoDB Atlas)

**Multi-Tenant Isolation**: All methods require `userId` to ensure data isolation

---

#### `PromptRepository` (Phase 3.6)
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

#### `EmailService` ⭐ NEW (Phase 3.8)
**Contract**: Email notification service abstraction

**Methods**:
- `sendApprovalRequest(user, approveUrl, rejectUrl)` → `Promise<void>`
- `sendApprovalConfirmation(user)` → `Promise<void>`
- `sendRejectionNotification(user)` → `Promise<void>`

**Implementation**: `ResendEmailService` (Resend API)

---

#### `BlogArticleRepository` ⭐ NEW (Phase 4.0)
**Contract**: Blog article persistence abstraction

**Methods**:
- `create(article)` → `Promise<BlogArticle>`
- `findBySlug(slug)` → `Promise<BlogArticle | null>`
- `findById(id)` → `Promise<BlogArticle | null>`
- `listPublished()` → `Promise<BlogArticle[]>`
- `listAll()` → `Promise<BlogArticle[]>`
- `update(article)` → `Promise<BlogArticle>`
- `delete(id)` → `Promise<void>`

**Implementation**: `MongoDBBlogArticleRepository`

---

#### `ContactMessageRepository` ⭐ NEW (Phase 3.11)
**Contract**: Contact message persistence abstraction

**Methods**:
- `create(message)` → `Promise<ContactMessage>`
- `findById(id)` → `Promise<ContactMessage | null>`
- `listAll()` → `Promise<ContactMessage[]>`
- `delete(id)` → `Promise<void>`

**Implementation**: `MongoDBContactMessageRepository`

---

#### `ContentConverter` ⭐ NEW (Phase 4.1)
**Contract**: Content conversion service abstraction

**Methods**:
- `toPlainText(tiptapJson)` → `string`
- `toHtml(tiptapJson)` → `string`
- `fromHtml(html)` → TipTap JSON

**Implementation**: `TipTapContentService`

---

#### `IdGenerator` (Phase 3.5)
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

#### `FolderParser` ⭐ NEW (Phase 5.1)
**Contract**: Folder parsing for multi-file imports

**Methods**:
- `parseFolder(files)` → `Promise<Chapter[]>` - Parse folder of files to chapters

**Implementation**: `MarkdownFolderParser`

**Purpose**: Enables importing folders of Markdown files as chapters

---

#### `CharacterRepository` ⭐ NEW (Phase 6)
**Contract**: Character persistence abstraction with multi-tenant support

**Methods**:
- `create(userId, character)` → `Promise<Character>`
- `findById(userId, characterId)` → `Promise<Character | null>`
- `findByProjectId(userId, projectId)` → `Promise<Character[]>`
- `update(userId, character)` → `Promise<Character>`
- `delete(userId, characterId)` → `Promise<void>`
- `deleteAllByOwner(userId)` → `Promise<void>`

**Implementation**: `MongoDBCharacterRepository`

---

#### `ProjectSettingsRepository` ⭐ NEW (Phase 6)
**Contract**: Project settings persistence abstraction

**Methods**:
- `create(userId, settings)` → `Promise<ProjectSettings>`
- `findByProjectId(userId, projectId)` → `Promise<ProjectSettings | null>`
- `update(userId, settings)` → `Promise<ProjectSettings>`
- `delete(userId, settingsId)` → `Promise<void>`
- `deleteAllByOwner(userId)` → `Promise<void>`

**Implementation**: `MongoDBProjectSettingsRepository`

---

#### `ProjectTaskRepository` ⭐ NEW (Phase 6)
**Contract**: Task persistence abstraction with filtering

**Methods**:
- `create(userId, task)` → `Promise<ProjectTask>`
- `findById(userId, taskId)` → `Promise<ProjectTask | null>`
- `findByProjectId(userId, projectId, filters?)` → `Promise<ProjectTask[]>`
- `update(userId, task)` → `Promise<ProjectTask>`
- `delete(userId, taskId)` → `Promise<void>`
- `getTaskSummary(userId, projectId)` → `Promise<TaskSummary>`
- `deleteAllByOwner(userId)` → `Promise<void>`

**Implementation**: `MongoDBProjectTaskRepository`

---

#### `ResearchDocumentRepository` ⭐ NEW (Phase 6)
**Contract**: Research document persistence abstraction

**Methods**:
- `create(userId, document)` → `Promise<ResearchDocument>`
- `findById(userId, documentId)` → `Promise<ResearchDocument | null>`
- `findByProjectId(userId, projectId)` → `Promise<ResearchDocument[]>`
- `update(userId, document)` → `Promise<ResearchDocument>`
- `delete(userId, documentId)` → `Promise<void>`
- `deleteAllByOwner(userId)` → `Promise<void>`

**Implementation**: `MongoDBResearchDocumentRepository`

---

#### `WritingGoalRepository` ⭐ NEW (Phase 6)
**Contract**: Writing goal persistence abstraction

**Methods**:
- `create(userId, goal)` → `Promise<WritingGoal>`
- `findById(userId, goalId)` → `Promise<WritingGoal | null>`
- `findByProjectId(userId, projectId)` → `Promise<WritingGoal[]>`
- `findActiveByProjectId(userId, projectId)` → `Promise<WritingGoal | null>`
- `update(userId, goal)` → `Promise<WritingGoal>`
- `delete(userId, goalId)` → `Promise<void>`
- `deleteAllByOwner(userId)` → `Promise<void>`

**Implementation**: `MongoDBWritingGoalRepository`

---

#### `CharacterConversationRepository` ⭐ NEW (Phase 9.0)
**Contract**: Character conversation persistence abstraction with multi-tenant support

**Methods**:
- `create(ownerId, conversation)` → `Promise<CharacterConversation>`
- `findById(ownerId, conversationId)` → `Promise<CharacterConversation | null>`
- `findByCharacterId(ownerId, characterId)` → `Promise<CharacterConversation[]>`
- `save(ownerId, conversation)` → `Promise<CharacterConversation>` (upsert)
- `delete(ownerId, conversationId)` → `Promise<void>`

**Implementation**: `MongoDBCharacterConversationRepository`

---

#### `AIUsageRepository` ⭐ NEW (Phase 6)
**Contract**: AI usage tracking persistence abstraction

**Methods**:
- `create(record)` → `Promise<AIUsageRecord>`
- `findByUserId(userId, filters?)` → `Promise<AIUsageRecord[]>`
- `findByProjectId(userId, projectId, filters?)` → `Promise<AIUsageRecord[]>`
- `getUsageStats(userId, projectId?, dateRange?)` → `Promise<UsageStats>`
- `getDailyUsage(userId, projectId?, days?)` → `Promise<DailyUsage[]>`
- `getUsageByOperation(userId, projectId?, dateRange?)` → `Promise<OperationUsage[]>`

**Implementation**: `MongoDBUsageRepository`

---

#### `AutocompleteEventRepository` ⭐ NEW (Phase 10.0)
**Contract**: Autocomplete telemetry event persistence and aggregation

**Methods**:
- `save(event)` → `Promise<void>`
- `findByProject(projectId, filters?)` → `Promise<AutocompleteEvent[]>`
- `getAggregatedStats(projectId, dateRange?)` → `Promise<AutocompleteStats>`

**Implementation**: `MongoDBAutocompleteEventRepository`

---

#### `CanonFactRepository` ⭐ NEW (Phase 10.0)
**Contract**: Canon fact persistence with atomic bulk replace

**Methods**:
- `create(ownerId, fact)` → `Promise<CanonFact>`
- `findByProjectId(ownerId, projectId)` → `Promise<CanonFact[]>`
- `update(ownerId, fact)` → `Promise<CanonFact>`
- `delete(ownerId, factId)` → `Promise<void>`
- `replaceDerived(ownerId, projectId, facts)` → `Promise<void>` — atomically replaces all `derived` facts

**Implementation**: `MongoDBCanonFactRepository`

---

#### `CanonExtractionStateRepository` ⭐ NEW (Phase 10.0)
**Contract**: Tracks per-project incremental extraction state

**Methods**:
- `findByProjectId(ownerId, projectId)` → `Promise<CanonExtractionState | null>`
- `save(ownerId, state)` → `Promise<void>`

**Implementation**: `MongoDBCanonFactRepository` (same collection, separate interface)

---

#### `RateLimitRepository` ⭐ NEW (Phase 10.0)
**Contract**: Generic persistent sliding-window rate limiting

**Methods**:
- `isAllowed(key, windowMs, maxRequests)` → `Promise<boolean>`
- `record(key)` → `Promise<void>`

**Implementation**: `MongoDBRateLimitRepository`

---

#### `ModelPricingRepository` ⭐ NEW
**Contract**: Model pricing persistence and retrieval

**Methods**:
- `upsertMany(entries)` → `Promise<void>`
- `findByProvider(provider)` → `Promise<ModelPricingEntry[]>`
- `findAll()` → `Promise<ModelPricingEntry[]>`
- `update(id, data)` → `Promise<ModelPricingEntry | null>`
- `delete(id)` → `Promise<void>`

**Implementation**: `MongoDBModelPricingRepository`

---

#### `AIExchangeRepository` ⭐ NEW
**Contract**: AI exchange transparency ledger persistence

**Methods**:
- `create(exchange)` → `Promise<AIExchange>`
- `findByUserId(userId, filters?)` → `Promise<AIExchange[]>`
- `deleteExpired()` → `Promise<void>` (also handled by MongoDB TTL index)

**Implementation**: `MongoDBExchangeRepository`

---

#### `WordCountSnapshotRepository` ⭐ NEW
**Contract**: Daily word-count checkpoint persistence

**Methods**:
- `save(snapshot)` → `Promise<void>`
- `findByProjectId(projectId, days?)` → `Promise<WordCountSnapshot[]>`

**Implementation**: `MongoDBWordCountSnapshotRepository`

---

#### `WritingQuotaRepository` ⭐ NEW
**Contract**: Recurring writing quota persistence scoped by `ownerId`

**Methods**:
- `create(ownerId, quota)` → `Promise<WritingQuota>`
- `findByProjectId(ownerId, projectId)` → `Promise<WritingQuota[]>`
- `update(ownerId, quota)` → `Promise<WritingQuota>`
- `delete(ownerId, quotaId)` → `Promise<void>`

**Implementation**: `MongoDBWritingQuotaRepository`

---

#### `PricingClient` ⭐ NEW
**Contract**: Fetches model pricing entries from an external source

**Methods**:
- `fetchPricingEntries()` → `Promise<Omit<ModelPricingEntry, 'id'>[]>`

**Purpose**: Abstracts `OpenRouterPricingClient` so use cases in the Application layer never import infrastructure directly

**Implementation**: `OpenRouterPricingClient`

---

#### `Thesaurus` ⭐ NEW
**Contract**: Word alternative lookup

**Methods**:
- `getSynonyms(word)` → `Promise<WordAlternative[]>`

**Implementation**: `ConjugationAwareThesaurus` (wraps `JeuxDeMotsThesaurus` + `FrenchMorphology`)

---

#### `Morphology` ⭐ NEW
**Contract**: Lemmatisation / conjugation

**Methods**:
- `lemmatise(word)` → `Promise<string>`
- `conjugate(lemma, form)` → `Promise<string>`

**Implementation**: `FrenchMorphology`

---

#### `BlobStorage` ⭐ NEW (Phase 6)
**Contract**: Blob storage abstraction for images

**Methods**:
- `upload(file, path)` → `Promise<{ url: string }>`
- `delete(url)` → `Promise<void>`

**Implementation**: `VercelBlobStorage`

---

### Value Objects (⭐ Phase 6 Enhanced)

#### `PaginatedResult<T>` ⭐ NEW (Phase 4.1+)
**Purpose**: Generic pagination result for collections

**Properties**:
- `items: T[]` - Items for current page
- `total: number` - Total item count
- `page: number` - Current page number
- `pageSize: number` - Items per page
- `totalPages: number` - Total page count

**Usage**: Blog article pagination

---

#### `AnalysisRepository` ⭐ NEW (Phase 7)
**Contract**: Chapter analysis persistence with multi-tenant support

**ChapterAnalysis Methods**:
- `saveAnalysis(ownerId, analysis)` → `Promise<void>`
- `findAnalysisByChapterId(ownerId, chapterId)` → `Promise<ChapterAnalysis | null>`
- `findAnalysisByContentHash(ownerId, chapterId, hash)` → `Promise<ChapterAnalysis | null>`
- `updateAnalysis(ownerId, analysis)` → `Promise<void>`
- `deleteAnalysis(ownerId, analysisId)` → `Promise<void>`

**AnalysisHistory Methods**:
- `saveHistory(ownerId, history)` → `Promise<void>`
- `findHistoryByChapterId(ownerId, chapterId)` → `Promise<AnalysisHistory[]>`
- `findHistoryById(ownerId, historyId)` → `Promise<AnalysisHistory | null>`

**Ignored Issues Methods**:
- `saveIgnoredIssue(ownerId, issue)` → `Promise<void>`
- `findIgnoredIssues(ownerId, chapterId)` → `Promise<IgnoredIssue[]>`
- `deleteIgnoredIssue(ownerId, issueId)` → `Promise<void>`

**Repetition Exclusions Methods**:
- `saveRepetitionExclusion(ownerId, exclusion)` → `Promise<void>`
- `findRepetitionExclusions(ownerId, projectId)` → `Promise<RepetitionExclusionRecord[]>`
- `deleteRepetitionExclusion(ownerId, exclusionId)` → `Promise<void>`

**Implementation**: `MongoDBAnalysisRepository`

---

## Testing

**Coverage**: See [README.md](../../README.md) for current statistics.

All domain logic has near-perfect test coverage with isolated unit tests:
- CorrectionHistory: 15+ tests (entity creation, validation) (Phase 3.7)
- ProjectMetadata: 10+ tests (CRUD, caching logic, hash validation) (Phase 3.6)
- MetadataType: 3+ tests (validation) (Phase 3.6)
- User: 5+ tests (validation, creation) (Phase 3)
- Chapter: 15 tests (content management, metadata, validation)
- Project: 25+ tests (collection management, business rules, owner tracking)
- Character: 20+ tests (entity creation, updates, validation) ⭐ NEW (Phase 6)
- ProjectSettings: 20+ tests (entity creation, updates) ⭐ NEW (Phase 6)
- ProjectTask: 25+ tests (entity creation, status transitions, validation) ⭐ NEW (Phase 6)
- ResearchDocument: 15+ tests (entity creation, updates) ⭐ NEW (Phase 6)
- WritingGoal: 15+ tests (entity creation, progress calculation) ⭐ NEW (Phase 6)
- AIUsageRecord: 15+ tests (entity creation, cost calculation) ⭐ NEW (Phase 6)
- TaskPriority, TaskStatus: 10+ tests (validation) ⭐ NEW (Phase 6)
- Contributor, RelatedWork, NarrationSettings: 15+ tests (validation) ⭐ NEW (Phase 6)
- AIOperationType: 5+ tests (validation) ⭐ NEW (Phase 6)
- CharacterConversation: 10+ tests (creation, message appending, validation) ⭐ NEW (Phase 9.0)
- ChatMessage: 10+ tests (creation, role constraints) ⭐ NEW (Phase 9.0)
- ModelPricing: 20+ tests (cost computation, cached-token discounting) ⭐ NEW (Phase 9.0)
- AutocompleteEvent: 20+ tests (state transitions, validation) ⭐ NEW (Phase 10.0)
- CanonFact: 20+ tests (creation, validation/invalidation, source tracking) ⭐ NEW (Phase 10.0)
- AutocompletePreferences: covered by ProjectSettings tests ⭐ NEW (Phase 10.0)
- AutocompleteIntent, AutocompleteOutcome: 15+ tests (validation, classification) ⭐ NEW (Phase 10.0)
- CanonFacts, CanonFactSource, AIOperationPolicy: 10+ tests ⭐ NEW (Phase 10.0)
- ChapterAnalysis: 30+ tests (entity, filtering, statistics) ⭐ NEW (Phase 7)
- AnalysisHistory: 20+ tests (entity creation, validation) ⭐ NEW (Phase 7)
- AnalysisCategory, AnalysisSeverity: 10+ tests (validation) ⭐ NEW (Phase 7)
- AnalysisIssue: 15+ tests (status changes) ⭐ NEW (Phase 7)
- RepetitionCluster, RepetitionExclusions: 20+ tests ⭐ NEW (Phase 7)
- StyleRigor: 10+ tests (validation) ⭐ NEW (Phase 7)
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

---

## Changelog

For phase-by-phase implementation history, see [CHANGELOG.md](../../CHANGELOG.md).
