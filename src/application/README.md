# Application Layer

Orchestrates domain logic through use cases.

**Status**: ✅ Phase 9.0 Complete (see [README.md](../../README.md) for test statistics)

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

### Character Chat Use Cases ⭐ NEW (Phase 9.0)

---

#### `ChatWithCharacterUseCase`
**Purpose**: Streaming character chat — the AI responds in the character's voice

**Dependencies**: `CharacterRepository`, `CharacterConversationRepository`, `LLMProvider`, `AIContextBuilder`, `IdGenerator` interfaces
**Input**: `{ userId, projectId, characterId, conversationId | null, message }`
**Output**: `AsyncIterableIterator<string>` — text chunks for SSE delivery

**Workflow**:
1. Load character (throws if not found)
2. Hydrate existing conversation or create a new one
3. Append the author message
4. Build system prompt via `AIContextBuilder.buildCharacterPersona`
5. Stream reply via `LLMProvider.chatStream` (last 20 messages as history)
6. Accumulate chunks and persist the complete character reply on stream end

**Tests**: 20+ tests covering streaming, new vs existing conversations, history capping

---

#### `GenerateCharacterSheetUseCase`
**Purpose**: AI-assisted auto-fill of a character sheet (8 fields) — without persisting

**Dependencies**: `CharacterRepository`, `ProjectRepository`, `MetadataRepository`, `LLMProvider` interfaces
**Input**: `{ ownerId, projectId, characterId }`
**Output**: 8-field `GenerateCharacterSheetResult` (all fields except `name`)

**Workflow**:
1. Load character and project
2. Extract manuscript text (capped at 12 000 chars)
3. Call `LLMProvider.generateCharacterSheet`
4. Return result — the author decides what to keep; nothing is persisted

**Tests**: 15+ tests covering generation and context loading

---

### AI Context Strategy ⭐ NEW (Phase 8.0)

The AI builds its context from the author's own material — generated metadata **and** research
documents — while never silently overriding what the author has edited. See
[docs/strategie-ia-contexte.md](../../docs/strategie-ia-contexte.md) for the vision and roadmap.

---

#### `AIContextBuilder` (service)
**Purpose**: Centralized metadata → prompt projection; produces ready-to-inject context blocks per AI feature

**Dependencies**: `MetadataRepository`, `ResearchDocumentRepository` (optional) interfaces
**Methods**:
- `buildCompletionContext(ownerId, projectId, chapterId?)` → context string (lean budget)
- `buildChapterContext(ownerId, projectId)` → context string (generous budget)
- `buildRewriteContext(ownerId, projectId)` → author-profile string (style + narration)
- `buildCharacterPersona(character, projectId, ownerId)` → system prompt string for character chat ⭐ Phase 9.0

**Key behaviors**:
- **Author edit wins**: trusts `structuredData` only if `!wasEditedSinceGeneration()`; otherwise
  injects the edited `content` text instead of stale AI output
- **Research-doc locality**: global docs (no `linkedChapterIds`) always injected; chapter-linked
  docs injected only when writing in that chapter; chapter generation sees all docs
- **Budgets / truncation**: per-field caps, distinct completion vs chapter budgets, type-ordered
- **Graceful degradation**: AI features still work if a repository is absent or rejects

**Tests**: 20+ tests covering projection, author-edit-wins, locality, and truncation

---

#### `CheckMetadataFreshnessUseCase`
**Purpose**: Read-only staleness check — is a generated analysis based on an older manuscript?

**Dependencies**: `MetadataRepository`, `ProjectRepository` interfaces
**Input**: `{ ownerId, projectId }`
**Output**: `MetadataFreshness[]` (`{ id, typeKey, isStale }`)

**Workflow**:
1. Load project, compute current full-text hash via `extractProjectFullText` + `hashText`
2. For each metadata, mark `isStale` only if it is AI-generated, author-untouched, and its stored
   hash differs (`needsRegeneration`)
3. Never regenerates — the author is informed and decides

**Tests**: 10+ tests covering staleness, manual-edit exclusion, and no-text/missing-project cases

---

#### `extractProjectFullText` (`services/project-text.ts`)
**Purpose**: Canonical project full-text extraction (each chapter as `# title\n\n<text>`, joined by
`---`), the single source of truth shared by the Generate* use cases and the freshness check

**Tests**: covered in `project-text.test.ts`

---

#### `hashText` (`utils/text-hash.ts`)
**Purpose**: SHA-256 content hashing for cache invalidation — **moved here from Infrastructure**
(Phase 8.0) so the Application layer no longer depends on Infrastructure. Consumed by all 7
Generate* use cases, `CheckMetadataFreshnessUseCase`, and `blog-actions`.

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

### Chapter Verification Use Cases ⭐ NEW (Phase 7)

---

#### `AnalyzeChapterUseCase`
**Purpose**: Analyze a chapter for spelling, grammar, punctuation, style, and repetition issues

**Dependencies**: `ProjectRepository`, `AnalysisRepository`, `CharacterRepository`, `IdGenerator`, `HashService`, `AnalysisStrategy` map
**Input**: Owner ID, project ID, chapter ID, categories array, style rigor
**Output**: `{ analysis: ChapterAnalysis, fromCache: boolean }`

**Workflow**:
1. Validate input and ownership
2. Load project and find chapter
3. Check cache for existing analysis (by content hash)
4. If cache miss, collect exclusions (character names, user-defined words)
5. Execute selected analysis strategies (spelling, grammar, etc.)
6. Create ChapterAnalysis entity with all issues and repetitions
7. Save to repository and return

**Tests**: 25+ tests covering caching, strategies, and exclusions

---

#### `ApplyCorrectionUseCase`
**Purpose**: Apply a single correction to chapter content

**Dependencies**: `ProjectRepository`, `AnalysisRepository`
**Input**: Owner ID, project ID, chapter ID, issue ID
**Output**: Updated chapter content

**Workflow**:
1. Load analysis and find issue
2. Apply correction to chapter content
3. Update issue status to 'applied'
4. Save updated chapter and analysis

**Tests**: 10+ tests covering correction application

---

#### `ApplyBatchCorrectionsUseCase`
**Purpose**: Apply multiple corrections in batch

**Dependencies**: `ProjectRepository`, `AnalysisRepository`
**Input**: Owner ID, project ID, chapter ID, issue IDs array
**Output**: Updated chapter content, count of applied corrections

**Workflow**:
1. Sort issues by position (descending to avoid offset issues)
2. Apply each correction in order
3. Update all issue statuses
4. Save updated chapter and analysis

**Tests**: 10+ tests covering batch operations

---

#### `IgnoreAnalysisIssueUseCase`
**Purpose**: Mark an issue as ignored (won't appear in future analyses)

**Dependencies**: `AnalysisRepository`
**Input**: Owner ID, chapter ID, issue ID
**Output**: void

**Workflow**:
1. Load analysis and find issue
2. Update issue status to 'ignored'
3. Save ignored issue record for future exclusion

**Tests**: 8+ tests covering ignore functionality

---

#### `GetAnalysisDiffUseCase`
**Purpose**: Generate diff between original and corrected content

**Dependencies**: `AnalysisRepository`
**Input**: Owner ID, analysis ID
**Output**: Diff with added/removed lines

**Tests**: 5+ tests covering diff generation

---

#### `ExportAnalysisReportUseCase`
**Purpose**: Export analysis results as markdown report

**Dependencies**: `AnalysisRepository`
**Input**: Owner ID, analysis ID
**Output**: Markdown string with formatted report

**Tests**: 5+ tests covering report generation

---

#### `ManageRepetitionExclusionsUseCase`
**Purpose**: Add or remove words from repetition exclusion list

**Dependencies**: `AnalysisRepository`, `IdGenerator`
**Input**: Owner ID, project ID, word, action (add/remove), optional reason
**Output**: Updated exclusions list

**Tests**: 8+ tests covering add/remove operations

---

#### `SaveChapterAnalysisHistoryUseCase`
**Purpose**: Save analysis history entry after corrections applied

**Dependencies**: `AnalysisRepository`, `IdGenerator`
**Input**: Owner ID, chapter ID, analysis data, corrections applied/ignored
**Output**: Created AnalysisHistory entity

**Tests**: 5+ tests covering history saving

---

#### `ListChapterAnalysisHistoryUseCase`
**Purpose**: List analysis history for a chapter

**Dependencies**: `AnalysisRepository`
**Input**: Owner ID, chapter ID
**Output**: Array of AnalysisHistory entities (sorted by date descending)

**Tests**: 5+ tests covering history listing

---

### Analysis Strategies ⭐ NEW (Phase 7)

Analysis strategies implement the Strategy pattern for different analysis types:

---

#### `SpellingAnalysisStrategy`
**Purpose**: Detect spelling errors via AI

**Features**:
- Uses AnalysisLLMClient for AI-powered detection
- Respects style rigor settings
- Excludes character names and user-defined words
- Returns AnalysisIssue array with suggestions

**Tests**: 15+ tests covering detection scenarios

---

#### `GrammarAnalysisStrategy`
**Purpose**: Detect grammar issues via AI

**Features**:
- Identifies subject-verb agreement errors
- Detects tense inconsistencies
- Suggests corrections with context

**Tests**: 15+ tests covering grammar detection

---

#### `PunctuationAnalysisStrategy`
**Purpose**: Detect punctuation errors via AI

**Features**:
- Missing/extra punctuation detection
- Typography issues (curly quotes, em dashes)
- French-specific rules (non-breaking spaces)

**Tests**: 15+ tests covering punctuation detection

---

#### `StyleAnalysisStrategy`
**Purpose**: Suggest style improvements via AI

**Features**:
- Weak word detection
- Passive voice identification
- Sentence length analysis
- Respects style rigor (strict shows more suggestions)

**Tests**: 15+ tests covering style suggestions

---

#### `RepetitionAnalysisStrategy`
**Purpose**: Detect repeated words and phrases

**Features**:
- Configurable proximity threshold
- Excludes common words (articles, prepositions)
- Respects character names and user exclusions
- Marks intentional repetitions (anaphora, etc.)

**Tests**: 20+ tests covering repetition detection

---

### Character Use Cases ⭐ NEW (Phase 6)

---

#### `CreateCharacterUseCase`
**Purpose**: Create new character for a project

**Dependencies**: `CharacterRepository`, `IdGenerator` interfaces
**Input**: User ID, project ID, character data (name, aliases, description, traits, goals, relationships)
**Output**: Created `Character` entity

**Tests**: 5+ tests covering creation scenarios

---

#### `LoadCharacterUseCase`
**Purpose**: Load character from repository

**Dependencies**: `CharacterRepository` interface
**Input**: User ID, character ID
**Output**: `Character` entity or null

**Tests**: 4+ tests covering load scenarios

---

#### `ListProjectCharactersUseCase`
**Purpose**: List all characters for a project

**Dependencies**: `CharacterRepository` interface
**Input**: User ID, project ID
**Output**: Array of `Character` entities

**Tests**: 5+ tests covering list scenarios

---

#### `UpdateCharacterUseCase`
**Purpose**: Update character details

**Dependencies**: `CharacterRepository` interface
**Input**: User ID, character ID, updates
**Output**: Updated `Character` entity

**Tests**: 5+ tests covering update scenarios

---

#### `DeleteCharacterUseCase`
**Purpose**: Delete character

**Dependencies**: `CharacterRepository` interface
**Input**: User ID, character ID
**Output**: void

**Tests**: 4+ tests covering deletion

---

#### `SyncCharactersFromAnalysisUseCase`
**Purpose**: Sync characters from AI analysis to character list

**Dependencies**: `CharacterRepository`, `MetadataRepository` interfaces
**Input**: User ID, project ID
**Output**: Array of synced `Character` entities

**Workflow**:
1. Load characters analysis metadata
2. Extract character data from analysis
3. Create or update characters based on analysis
4. Return synced characters

**Tests**: 10+ tests covering sync scenarios

---

### ProjectSettings Use Cases ⭐ NEW (Phase 6)

---

#### `CreateProjectSettingsUseCase`
**Purpose**: Create project settings

**Dependencies**: `ProjectSettingsRepository`, `IdGenerator` interfaces
**Input**: User ID, project ID, settings data
**Output**: Created `ProjectSettings` entity

**Tests**: 5+ tests covering creation

---

#### `LoadProjectSettingsUseCase`
**Purpose**: Load project settings

**Dependencies**: `ProjectSettingsRepository` interface
**Input**: User ID, project ID
**Output**: `ProjectSettings` entity or null

**Tests**: 4+ tests covering load scenarios

---

#### `UpdateProjectSettingsUseCase`
**Purpose**: Update project settings

**Dependencies**: `ProjectSettingsRepository` interface
**Input**: User ID, project ID, updates
**Output**: Updated `ProjectSettings` entity

**Tests**: 5+ tests covering update scenarios

---

### ProjectTask Use Cases ⭐ NEW (Phase 6)

---

#### `CreateProjectTaskUseCase`
**Purpose**: Create new task for a project

**Dependencies**: `ProjectTaskRepository`, `IdGenerator` interfaces
**Input**: User ID, project ID, task data (title, description, priority, status, due date, contributors)
**Output**: Created `ProjectTask` entity

**Tests**: 5+ tests covering creation

---

#### `ListProjectTasksUseCase`
**Purpose**: List tasks for a project with optional filtering

**Dependencies**: `ProjectTaskRepository` interface
**Input**: User ID, project ID, optional filters (status, priority)
**Output**: Array of `ProjectTask` entities

**Tests**: 5+ tests covering list and filter scenarios

---

#### `UpdateProjectTaskUseCase`
**Purpose**: Update task details

**Dependencies**: `ProjectTaskRepository` interface
**Input**: User ID, task ID, updates
**Output**: Updated `ProjectTask` entity

**Tests**: 5+ tests covering update scenarios

---

#### `DeleteProjectTaskUseCase`
**Purpose**: Delete task

**Dependencies**: `ProjectTaskRepository` interface
**Input**: User ID, task ID
**Output**: void

**Tests**: 4+ tests covering deletion

---

#### `GetTaskSummaryUseCase`
**Purpose**: Get task summary statistics for a project

**Dependencies**: `ProjectTaskRepository` interface
**Input**: User ID, project ID
**Output**: Task summary (total, by status, by priority)

**Tests**: 5+ tests covering summary calculation

---

### ResearchDocument Use Cases ⭐ NEW (Phase 6)

---

#### `CreateResearchDocumentUseCase`
**Purpose**: Create new research document

**Dependencies**: `ResearchDocumentRepository`, `IdGenerator` interfaces
**Input**: User ID, project ID, document data (title, content, tags)
**Output**: Created `ResearchDocument` entity

**Tests**: 5+ tests covering creation

---

#### `ListResearchDocumentsUseCase`
**Purpose**: List research documents for a project

**Dependencies**: `ResearchDocumentRepository` interface
**Input**: User ID, project ID
**Output**: Array of `ResearchDocument` entities

**Tests**: 4+ tests covering list scenarios

---

#### `UpdateResearchDocumentUseCase`
**Purpose**: Update research document

**Dependencies**: `ResearchDocumentRepository` interface
**Input**: User ID, document ID, updates
**Output**: Updated `ResearchDocument` entity

**Tests**: 5+ tests covering update scenarios

---

#### `DeleteResearchDocumentUseCase`
**Purpose**: Delete research document

**Dependencies**: `ResearchDocumentRepository` interface
**Input**: User ID, document ID
**Output**: void

**Tests**: 4+ tests covering deletion

---

### WritingGoal Use Cases ⭐ NEW (Phase 6)

---

#### `CreateWritingGoalUseCase`
**Purpose**: Create new writing goal

**Dependencies**: `WritingGoalRepository`, `IdGenerator` interfaces
**Input**: User ID, project ID, goal data (title, target word count, deadline)
**Output**: Created `WritingGoal` entity

**Tests**: 5+ tests covering creation

---

#### `ListWritingGoalsUseCase`
**Purpose**: List writing goals for a project

**Dependencies**: `WritingGoalRepository` interface
**Input**: User ID, project ID
**Output**: Array of `WritingGoal` entities

**Tests**: 4+ tests covering list scenarios

---

#### `UpdateWritingGoalUseCase`
**Purpose**: Update writing goal

**Dependencies**: `WritingGoalRepository` interface
**Input**: User ID, goal ID, updates
**Output**: Updated `WritingGoal` entity

**Tests**: 5+ tests covering update scenarios

---

#### `DeleteWritingGoalUseCase`
**Purpose**: Delete writing goal

**Dependencies**: `WritingGoalRepository` interface
**Input**: User ID, goal ID
**Output**: void

**Tests**: 4+ tests covering deletion

---

#### `GetActiveWritingGoalUseCase`
**Purpose**: Get the active writing goal for a project

**Dependencies**: `WritingGoalRepository` interface
**Input**: User ID, project ID
**Output**: Active `WritingGoal` entity or null

**Tests**: 4+ tests covering active goal retrieval

---

### CoverImage Use Cases ⭐ NEW (Phase 6)

---

#### `UploadCoverImageUseCase`
**Purpose**: Upload cover image for project

**Dependencies**: `BlobStorage`, `ProjectSettingsRepository` interfaces
**Input**: User ID, project ID, image file
**Output**: Updated `ProjectSettings` with cover image URL

**Workflow**:
1. Upload image to blob storage
2. Update project settings with new URL
3. Return updated settings

**Tests**: 5+ tests covering upload scenarios

---

#### `DeleteCoverImageUseCase`
**Purpose**: Delete cover image from project

**Dependencies**: `BlobStorage`, `ProjectSettingsRepository` interfaces
**Input**: User ID, project ID
**Output**: Updated `ProjectSettings` without cover image

**Workflow**:
1. Delete image from blob storage
2. Clear cover image URL from settings
3. Return updated settings

**Tests**: 4+ tests covering deletion

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
- **Accepts an author-profile context string** (from `AIContextBuilder.buildRewriteContext`) to
  calibrate the amplified voice proposal ⭐ NEW (Phase 8.0)
- Performance tracking in development mode
- Works with both plain text and TipTap JSON

**Tests**: 8+ tests covering context extraction, validation, proposals, and history

**Note**: Works with both Phase 1 (TextDocument) and Phase 2 (Chapter) entities.

---

## Testing

**Coverage**: See [README.md](../../README.md) for current statistics.

All use cases tested with mocked dependencies following Clean Architecture principles:
- **Character Chat Use Cases**: 35+ tests ⭐ NEW (Phase 9.0)
  - ChatWithCharacterUseCase: 20+ tests (streaming, history, new/existing conversations)
  - GenerateCharacterSheetUseCase: 15+ tests (generation, context)
- **Chapter Verification Use Cases**: 100+ tests ⭐ NEW (Phase 7)
  - AnalyzeChapterUseCase: 25 tests (including integration tests)
  - ApplyCorrectionUseCase: 10 tests
  - ApplyBatchCorrectionsUseCase: 10 tests
  - IgnoreAnalysisIssueUseCase: 8 tests
  - GetAnalysisDiffUseCase: 5 tests
  - ExportAnalysisReportUseCase: 5 tests
  - ManageRepetitionExclusionsUseCase: 8 tests
  - SaveChapterAnalysisHistoryUseCase: 5 tests
  - ListChapterAnalysisHistoryUseCase: 5 tests
  - Analysis Strategies: 80+ tests (SpellingAnalysisStrategy, GrammarAnalysisStrategy, PunctuationAnalysisStrategy, StyleAnalysisStrategy, RepetitionAnalysisStrategy)
- **Character Use Cases**: 33+ tests ⭐ NEW (Phase 6)
  - CreateCharacterUseCase: 5 tests
  - LoadCharacterUseCase: 4 tests
  - ListProjectCharactersUseCase: 5 tests
  - UpdateCharacterUseCase: 5 tests
  - DeleteCharacterUseCase: 4 tests
  - SyncCharactersFromAnalysisUseCase: 10 tests
- **ProjectSettings Use Cases**: 14+ tests ⭐ NEW (Phase 6)
  - CreateProjectSettingsUseCase: 5 tests
  - LoadProjectSettingsUseCase: 4 tests
  - UpdateProjectSettingsUseCase: 5 tests
- **ProjectTask Use Cases**: 24+ tests ⭐ NEW (Phase 6)
  - CreateProjectTaskUseCase: 5 tests
  - ListProjectTasksUseCase: 5 tests
  - UpdateProjectTaskUseCase: 5 tests
  - DeleteProjectTaskUseCase: 4 tests
  - GetTaskSummaryUseCase: 5 tests
- **ResearchDocument Use Cases**: 18+ tests ⭐ NEW (Phase 6)
  - CreateResearchDocumentUseCase: 5 tests
  - ListResearchDocumentsUseCase: 4 tests
  - UpdateResearchDocumentUseCase: 5 tests
  - DeleteResearchDocumentUseCase: 4 tests
- **WritingGoal Use Cases**: 22+ tests ⭐ NEW (Phase 6)
  - CreateWritingGoalUseCase: 5 tests
  - ListWritingGoalsUseCase: 4 tests
  - UpdateWritingGoalUseCase: 5 tests
  - DeleteWritingGoalUseCase: 4 tests
  - GetActiveWritingGoalUseCase: 4 tests
- **CoverImage Use Cases**: 9+ tests ⭐ NEW (Phase 6)
  - UploadCoverImageUseCase: 5 tests
  - DeleteCoverImageUseCase: 4 tests
- **Correction History Use Cases**: 14+ tests (Phase 3.7)
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

---

## Changelog

For phase-by-phase implementation history, see [CHANGELOG.md](../../CHANGELOG.md).
