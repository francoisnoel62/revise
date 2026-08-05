# Application Layer

Orchestrates domain logic through use cases.

**Status**: see [README.md](../../README.md) for current test statistics.

## Rules:
- Depends only on Domain layer
- No framework-specific code
- No direct infrastructure implementations (use interfaces)
- Use cases are thin orchestrators, not business logic containers
- All business logic belongs in Domain entities

## Module boundaries

`src/application/index.ts` is a barrel, and it is **not** exhaustive. It only re-exports the
earliest use cases — Document (legacy), Project/Chapter CRUD, Provider CRUD, User registration,
the `AIContextBuilder` service, and Metadata CRUD (through `LoadMetadataUseCase`) — matching what
its own section comments still label "Phase 3" / "Phase 3.6". One deliberate exception:
`GovernSnapshotHistoryUseCase` (and its `SnapshotCollaborationRole` type) is also re-exported,
even though every other snapshot use case is not.

Everything from later phases — characters, character chat, tasks, research documents, canon
facts, autocomplete-context services, the rest of the snapshot use cases, writing goals/quotas,
workflow metrics, blog admin, dynamic pricing, password reset, the thesaurus, and
publication/pagination/endnote rendering — is imported directly by its callers
(`@/application/use-cases/...`, `@/application/services/...`, `@/application/migration/...`,
`@/application/rendering/...`) and bypasses the barrel entirely. When adding a new use case,
match whichever pattern its neighbors already use rather than assuming the barrel is exhaustive.

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
**Purpose**: RGPD-compliant account deletion — implements the right to erasure (Article 17)

**Dependencies**: 16 repository interfaces total. Six are required constructor parameters —
`UserRepository`, `ProjectRepository`, `ProviderRepository`, `MetadataRepository`,
`CorrectionHistoryRepository`, `ProjectSettingsRepository` — and ten more are **optional**
constructor parameters kept for backward compatibility with older test doubles and callers:
`WordCountSnapshotRepository`, `WritingQuotaRepository`, `WritingGoalRepository`,
`CharacterRepository`, `ProjectTaskRepository`, `AIUsageRepository`, `AIExchangeRepository`,
`AutocompleteEventRepository`, `CanonFactRepository`, `SnapshotRepository`. Each optional
dependency is invoked with `?.` so its cascade step is silently skipped when the caller doesn't
supply it, rather than throwing.

**Input**: User ID, confirmation email (must match the account's email)
**Output**: `{ projectsDeleted, providersDeleted, metadataDeleted, historyDeleted, settingsDeleted }`

**Workflow**:
1. Verify the user exists (`UserNotFoundError` otherwise)
2. Verify the confirmation email matches the account's email, case-insensitively
   (`EmailMismatchError` otherwise)
3. Delete dependent data first, in order: correction history → metadata → project settings →
   word count snapshots → writing quotas → writing goals → characters → project tasks →
   AI usage records → AI exchanges → autocomplete events → canon facts → snapshots
4. Delete all projects, then all providers
5. Delete the user account itself

**Tests**: 10+ tests covering cascade deletion and validation

---

#### `RequestPasswordResetUseCase`
**Purpose**: Start a password reset — generates a token and emails a reset link, without
revealing whether the address is a registered account (anti-enumeration)

**Dependencies**: `UserRepository` (`findByEmail`), `PasswordResetTokenRepository`
(`create`, `invalidateAllForUser`), `EmailService` (`sendPasswordResetEmail`), a `TokenGenerator`,
and the app's base URL
**Input**: Email address
**Output**: `{ success: true }` — always, whether or not the email matches a real account

**Workflow**:
1. Validate email format
2. Look up the user by email
3. If the user doesn't exist or isn't approved yet, return success silently — no token issued,
   no email sent, no signal to a caller probing for registered addresses
4. Otherwise, invalidate any existing tokens, generate a new one (1-hour expiry via
   `TOKEN_EXPIRATION_MS`), persist it, and email a reset link built from `appUrl`

**Tests**: 10+ tests covering enumeration protection, token generation, and email dispatch

---

#### `ResetPasswordUseCase`
**Purpose**: Complete a password reset from a valid token

**Dependencies**: `UserRepository` (`findById`, `updatePassword`, `hashPassword`),
`PasswordResetTokenRepository` (`findValidToken`, `markAsUsed`, `invalidateAllForUser`),
`EmailService` (`sendPasswordChangedEmail`)
**Input**: Token, new password, password confirmation
**Output**: `{ success: true }`

**Workflow**:
1. Validate the token exists and hasn't expired (`InvalidTokenError` / `ExpiredTokenError`)
2. Validate the new password (≥8 characters, matches confirmation)
3. Hash and persist the new password
4. Mark the used token as used, then invalidate every other outstanding token for the user
5. Send a best-effort confirmation email — a delivery failure does not roll back the reset

**Tests**: 12+ tests covering token validation, password rules, and confirmation email

---

#### `ChangePasswordUseCase`
**Purpose**: Authenticated in-app password change

**Dependencies**: `UserRepository` (`findById`, `verifyPassword`, `hashPassword`,
`updatePassword`), `PasswordResetTokenRepository` (`invalidateAllForUser`), `EmailService`
(`sendPasswordChangedEmail`)
**Input**: User ID, current password, new password, confirmation
**Output**: `{ success: true }`

**Workflow**:
1. Verify the current password (`InvalidCurrentPasswordError` otherwise)
2. Validate the new password (≥8 characters, matches confirmation, different from the current one)
3. Hash and persist the new password
4. Invalidate all outstanding password-reset tokens for the user (a stale reset link should not
   outlive a password the author just changed themselves)
5. Send a best-effort confirmation email

**Tests**: 13+ tests covering verification, validation rules, and confirmation email

---

### AI Generation Use Cases ⭐ NEW (Phase 4.1)

---

#### `GenerateChapterUseCase`
**Purpose**: Generate chapter content using project metadata context

**Dependencies**: `ProjectRepository`, `AIContextBuilder`, `LLMProvider`, `ContentConverter`
**Input**: Owner ID, project ID, generation type
**Output**: `{ generation: ChapterGeneration, editorContent: string }`

**Workflow**:
1. Load project and all its chapters
2. Extract full text from existing chapters via `ContentConverter`
3. Build project context via `AIContextBuilder.buildChapterContext` (generous budget)
4. Generate content via `LLMProvider.generateChapter`
5. Convert the generation to editor-ready content via `ContentConverter.toEditorContent`

**Tests**: 6+ tests covering generation and context loading

---

#### `GenerateCompletionUseCase`
**Purpose**: Generate autocompletion suggestions

**Dependencies**: `AIContextBuilder`, `LLMProvider`
**Input**: Owner ID, project ID, text before/after cursor, optional chapter ID
**Output**: Completion suggestion string

**Workflow**:
1. Build a lean project context block via `AIContextBuilder.buildCompletionContext`
   (best-effort — does not fail the request if unavailable)
2. Generate the completion via `LLMProvider.generateCompletion`
3. Return the completion text

See also **Autocomplete-specific application services** under "AI Context Strategy" below — the
richer canon/manuscript-aware autocomplete path (used by the editor's inline suggestion feature)
composes `AutocompleteContextBuilder`, `ManuscriptContextBuilder`, and the intent/preference
directive helpers on top of this base use case rather than folding into it.

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

The AI builds its context from the author's own material — generated metadata, research
documents, the manuscript itself, and the canon fact ledger — while never silently overriding
what the author has edited. See
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

#### Autocomplete-specific application services

The in-editor autocomplete feature (the writing "hot path") composes several small, focused
services on top of `GenerateCompletionUseCase` rather than growing that use case itself:

- **`AutocompleteContextBuilder`** (`services/AutocompleteContextBuilder.ts`) — builds the
  `[CHAPITRES PRÉCÉDENTS]` block (via `ManuscriptContextBuilder`, opt-in) and the `[CANON]` block
  (opt-in, requires a `CanonFactRepository`, local character entities, and the current chapter
  index). Canon facts are prioritized recency-then-category (categories 2–5 — knowledge/belief/
  relational — before category 1 — objective) and capped at `MAX_CANON_FACTS` = 40 so the
  realtime prompt never bloats. Fails gracefully to an empty canon block rather than blocking
  completion.
- **`ManuscriptContextBuilder`** (`services/ManuscriptContextBuilder.ts`) — decides how much of
  the manuscript to inject: the full text of preceding chapters when the project is ≤40,000
  words total (`WORD_THRESHOLD`), otherwise only the last 5 chapters (`MAX_RECENT_CHAPTERS`).
- **`autocompleteIntents.ts`** (`intentDirective(intent)`) — maps an `AutocompleteIntent`
  (`natural` / `shorter` / `tenser` / `more_concrete` / `dialogue`) to a short French prompt
  directive appended to the context block; `natural` yields no directive.
- **`autocompletePreferenceDirectives.ts`** (`lengthDirective`, `audaceDirective`) — maps the
  user's configured suggestion length (`short`/`medium`/`long`) and audace level
  (`prudent`/`balanced`/`bold`) to prompt directives the same way; the default value of each
  preference yields no directive.
- **`PropositionInserter`** (`services/PropositionInserter.ts`) — `buildSemanticInsertContent`
  converts a plain-text AI proposition into either a trimmed inline string (single paragraph — the
  host block keeps its existing `semanticRole`) or an array of semantic paragraph `ContentNode`s
  (multi-paragraph, blank-line-separated — each new paragraph carries the supplied
  `semanticRole`); `getSemanticRoleFromAttrs` reads a block's `semanticRole` attr, defaulting to
  `'corps'` when absent or invalid.
- **`project-text.ts`** (`extractProjectFullText`, `extractChapterText`) — the canonical TipTap
  JSON → plain-text extraction. `extractProjectFullText` renders each chapter as
  `# title\n\n<text>`, joined by `---`, skipping chapters with invalid JSON; it is the single
  source of truth shared by `GenerateMetadataUseCase`, `GenerateCanonFactsUseCase`, and
  `CheckMetadataFreshnessUseCase`.
- **`utils/text-hash.ts`** (`hashText`) — SHA-256 content hashing, **moved here from
  Infrastructure** (Phase 8.0) so the Application layer no longer depends on Infrastructure.
  Consumed wherever content-change detection is needed: `GenerateMetadataUseCase`,
  `GenerateCanonFactsUseCase`, `CheckMetadataFreshnessUseCase`, `bookPreviewContentHash`, and
  `blog-actions`.

**Note on AI usage/exchange logging**: no dedicated Application-layer use case records an
`AIExchange`, an `AIUsageRecord`, or an `AutocompleteEvent`. Their repositories
(`AIExchangeRepository`, `AIUsageRepository`, `AutocompleteEventRepository`) currently appear in
this layer only as optional cascade-cleanup dependencies of `DeleteUserAccountUseCase` (see
above). The write path for these transparency-ledger records lives outside the normal use-case
pattern — directly alongside where LLM providers are invoked, in Infrastructure/interface code —
not as an Application use case.

---

### Canon Facts Use Cases ⭐ NEW

Canon facts are a per-project, per-chapter ledger of things established as true in the
manuscript (objective facts, character knowledge, beliefs, relationships) used to keep AI
generation and autocompletion consistent with what has already been written.

---

#### `GenerateCanonFactsUseCase`
**Purpose**: Incrementally extract canon facts from a manuscript and reconcile them with the
existing ledger — only reprocessing chapters whose content actually changed

**Dependencies**: `CanonFactRepository`, `CanonExtractionStateRepository`, `ProjectRepository`,
`CharacterRepository`, `LLMProvider`, `IdGenerator`
**Input**: `{ ownerId, projectId }`
**Output**: `{ facts: CanonFact[], factCount: number, characterCount: number }` — `characterCount`
lets the caller distinguish "no facts because the project has no cast yet" from "no facts found
in an otherwise-populated cast"

**Workflow**:
1. Load the project's chapters and extract full text
2. Load known characters; if there are none, ask the LLM to discover the main cast from the
   manuscript itself (`LLMProvider.generateCharacters`) — if it still finds no names, clear
   derived facts and return early
3. Hash each chapter's text and compare against `CanonExtractionStateRepository`'s stored
   per-chapter hashes to find changed (new or edited) chapters; if none changed, return the
   existing derived facts with no LLM calls at all
4. For each changed chapter, call `LLMProvider.generateCanonFacts(chapterText, knownNames)`, then
   filter the returned facts to only those whose entity is a known character name
5. **Contradiction resolution**: when an extracted fact carries an `invalidates` field, find the
   still-open (`validToChapter === null`) prior fact it contradicts among *unchanged* chapters
   and close it — `validToChapter` is set to the later of its own start chapter or
   `newFact.validFromChapter - 1`
6. Replace derived facts belonging only to the changed chapters (`replaceDerived`, scoped by
   chapter id) — facts from unchanged chapters are left untouched
7. Persist the updated per-chapter hashes and return the full set of derived facts

**Tests**: 12+ tests covering incremental extraction, cast discovery, contradiction handling, and
no-op on unchanged content

---

#### `detectEntities` (`services/canonEntities.ts`)
**Purpose**: Pure, zero-dependency entity detection for canon selection — no NER, just a
whole-word, Unicode-aware, case-insensitive match of known character names against a text window

**Behavior**: returns the subset of `knownNames` that appear as whole words in the given text
(order follows `knownNames`, each name returned at most once). Uses a negative lookbehind/lookahead
against `\p{L}` so, for example, "Léa" does not spuriously match inside "Léane". Feeds the local
`entities` input to `AutocompleteContextBuilder`'s canon selection.

**Tests**: 7+ tests covering whole-word matching, Unicode names, and no false substring matches

---

### Snapshot Use Cases ⭐ NEW

Snapshots are immutable, numbered captures of a project's chapters and editorial metadata,
covering manual saves, an automatic clock-driven cadence, comparison, restoration, and
governance (rename/comment/delete) of snapshot history.

---

#### `CreateSnapshotUseCase`
**Purpose**: Create a manual snapshot of the current project state

**Dependencies**: `SnapshotRepository`, `ProjectRepository`, `ProjectSettingsRepository`, `IdGenerator`
**Input**: `{ ownerId, projectId, title, comment? }`
**Output**: `{ snapshot: Snapshot }`

**Workflow**:
1. Load the project and its settings
2. Allocate the next sequential snapshot number via `getNextSequenceNumber`
3. Build a `Snapshot` (`type: 'manual'`) capturing every chapter and, if settings exist, the
   editorial metadata projected via `snapshotEditorialMetadataFrom`
4. Save it, then fire a best-effort activity-log entry (`recordActivity`) — a failure to log
   activity must never turn a successful capture into a failed one, so the call is not awaited
   for errors

**Tests**: 13+ tests covering creation, numbering, and metadata capture

---

#### `ProcessAutomaticSnapshotUseCase`
**Purpose**: Drives the automatic-snapshot clock and retention policy on the server; the browser
may heartbeat from many open tabs/sessions, but this use case creates **at most one** due
snapshot per interval

**Dependencies**: `AutomaticSnapshotRepository`, `SnapshotRepository`, `ProjectRepository`,
`ProjectSettingsRepository`, `IdGenerator`
**Input**: `{ ownerId, projectId, sessionId, timeZone, now? }`
**Output**: `{ created: boolean, prunedCount: number, error? }`

**Workflow**:
1. Heartbeat the calling session
2. Try to claim a due automatic snapshot (`claimDueSnapshot`) — if none is due, return early
3. Verify a session is still genuinely open (`hasOpenSession`); if not, release the claim
   (`releaseFailedSnapshot`) and return without creating anything
4. Build and save the automatic snapshot (`type: 'automatic'`), then mark the schedule complete
5. Compute which older automatic snapshots are now prunable via the domain service
   `automaticSnapshotsToPrune`, delete them (`deleteByIds`, if the repository supports it), and
   record the pruning activity
6. On any failure mid-way, release the claim so the next heartbeat can retry, and rethrow

**Tests**: 5+ tests covering claiming, session verification, and pruning

---

#### `ListSnapshotsUseCase`
**Purpose**: List a project's snapshot history, paginated or complete, plus whether unsnapshotted
changes exist

**Dependencies**: `SnapshotRepository`, `ProjectRepository`, `ProjectSettingsRepository`
**Input**: `{ ownerId, projectId, page? }` — `page` is optional cursor pagination
(`SnapshotPageQuery`); omitting it preserves the original complete-list behavior
**Output**: `{ snapshots: Snapshot[], hasUnsnapshottedChanges: boolean, nextBeforeNumber: number | null }`

**Workflow**:
1. Load the project and settings
2. If a page is requested and the repository supports paginated reads, load the latest snapshot
   and the requested page in parallel; otherwise load the complete history
3. Compare the most recent change timestamp (project or settings, whichever is later) against the
   most recent snapshot's creation time to compute `hasUnsnapshottedChanges`

**Tests**: 10+ tests covering pagination, unsnapshotted-changes detection, and the non-paginated path

---

#### `LoadSnapshotComparisonUseCase`
**Purpose**: Read-only preparation for a past-vs-current comparison — loads a past snapshot beside
one coherent, server-persisted "current" state; never saves or restores anything

**Dependencies**: `SnapshotRepository`, `ProjectRepository`, `ProjectSettingsRepository`
**Input**: `{ ownerId, projectId, snapshotId }`
**Output**: `{ snapshot: Snapshot, current: PersistedCurrentSnapshotState, comparedAt: Date }`

**Workflow**:
1. Load the target snapshot; reject if missing, mismatched project, or tombstoned
   (`SnapshotNotFoundError`)
2. There is no cross-collection Mongo transaction in the deployed topology, so reading a coherent
   `{project, settings}` pair uses a **3-attempt read-project-twice-and-compare-`updatedAt`
   loop**: read the project, read settings, re-read the project; if the project's `updatedAt`
   didn't change between the two reads, the settings read is guaranteed to have happened while
   that project state was current. If all 3 attempts observe a mid-read write, the use case
   throws asking the caller to retry, rather than returning a mixed/torn state

**Tests**: covered by a unit test plus a dedicated `.integration.test.ts` exercising the race

---

#### `RestoreSnapshotUseCase`
**Purpose**: The most complex use case in the codebase — restores a project to a past snapshot
without losing history, safety-netting any unsaved current work first

**Dependencies**: `SnapshotRepository`, `ProjectRepository`, `ProjectSettingsRepository`, `IdGenerator`
**Input**: `{ ownerId, projectId, snapshotId, expectedProjectUpdatedAt }` — the caller's last
observed `updatedAt`, used as an optimistic-concurrency guard
**Output**: `{ project: Project, restoreSnapshot: Snapshot, safetySnapshot: Snapshot | null }`

**Workflow**:
1. Load the project and the source snapshot; reject missing/tombstoned snapshots
2. Compare `project.getUpdatedAt()` against `expectedProjectUpdatedAt` —
   `ConcurrentModificationError` on mismatch, **before** anything is written
3. Build the restored `Project` (chapters and title from the snapshot; provider, id, publication
   state kept from the live project)
4. **Atomically compare-and-swap** the project via `replaceProjectIfUnchanged`, gated on the same
   `expectedProjectUpdatedAt` — this must succeed before any snapshot number is allocated, so a
   lost race never consumes a number or produces a snapshot describing a restoration that never
   happened
5. After the swap succeeds: reapply the snapshot's editorial metadata to `ProjectSettings`; if
   there were unsnapshotted changes, save a `type: 'safety'` snapshot of the pre-restore state
   first; then save a `type: 'restore'` snapshot (carrying `sourceSnapshotNumber`) recording the
   restoration itself; finally fire a best-effort activity log entry
6. **Best-effort compensation**: if any step after the compare-and-swap throws (no multi-document
   transaction is available on standalone MongoDB), the use case attempts to put the project's
   live content back the way it was via a second `replaceProjectIfUnchanged` call, swallowing its
   own failure, then rethrows the original error. A snapshot number allocated earlier in the
   failed attempt may still be "burned" with no snapshot saved for it — the same
   "numbers are never reused" tradeoff `SnapshotRepository` documents elsewhere

**Tests**: 26+ unit tests plus a dedicated `.integration.test.ts` exercising the compare-and-swap
and compensation path

---

#### `GovernSnapshotHistoryUseCase` *(exported from the barrel — see "Module boundaries")*
**Purpose**: Governs mutable snapshot metadata (rename/comment) and irreversible-but-audited
tombstone deletion, with explicit role-based authorization groundwork for future multi-collaborator
support

**Dependencies**: `SnapshotRepository`
**Input** (`updateMetadata`): `{ ownerId, projectId, snapshotId, requesterId, requesterRole, title, comment? }`
**Input** (`delete`): `{ ownerId, projectId, snapshotId, requesterId, requesterRole, now? }`
**Output**: the updated or tombstoned `Snapshot`

**Key behaviors**:
- `SnapshotCollaborationRole` is `'owner' | 'editor' | 'reader'` — currently every author acts as
  their own `'owner'`, but the role is threaded through explicitly so a future collaboration
  adapter can resolve real per-user roles at its boundary without touching this use case
- `updateMetadata` requires the requester to be either the snapshot's original author or an
  `'owner'`; it records `'renamed'` or `'commented'` activity depending on whether the comment
  actually changed
- `delete` requires `'owner'`; deletion is a tombstone (`Snapshot.tombstone`), not a hard delete —
  the snapshot's data is retained but marked deleted, and the deletion itself is recorded as
  activity

**Tests**: 3+ tests covering authorization and both governance operations

---

#### `snapshotEditorialMetadataFrom` (`services/snapshot-editorial-metadata.ts`)
**Purpose**: Pure projection of a `ProjectSettings` entity into the immutable
`SnapshotEditorialMetadata` shape (title, subtitle, summary, cover image, genre, synopsis, POV,
tense, target audience, ISBN, contributors, related works). This is the single source of truth
shared by every snapshot-producing use case (`CreateSnapshotUseCase`,
`ProcessAutomaticSnapshotUseCase`, `RestoreSnapshotUseCase`'s safety snapshot) and the comparison
path (`LoadSnapshotComparisonUseCase`), so a new settings field only needs to be added here once.

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

#### `ListAllBlogArticlesUseCase`
**Purpose**: List every blog article (published and draft) for the admin dashboard

**Dependencies**: `BlogArticleRepository` interface
**Input**: none
**Output**: Array of `BlogArticle` entities

**Tests**: covered alongside the other blog admin use cases

---

#### `LoadBlogArticleBySlugUseCase`
**Purpose**: Load a single blog article by its slug

**Dependencies**: `BlogArticleRepository` interface
**Input**: Slug
**Output**: `BlogArticle` entity or null

---

#### `LoadPublishedBlogArticlesUseCase`
**Purpose**: List published blog articles (public blog index, no pagination)

**Dependencies**: `BlogArticleRepository` interface
**Input**: none
**Output**: Array of published `BlogArticle` entities

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

#### `RecordArticleViewUseCase`
**Purpose**: Increment a blog article's view counter

**Dependencies**: `BlogArticleRepository` interface
**Input**: Article ID
**Output**: void

**Tests**: covered in `RecordArticleViewUseCase.test.ts`

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

#### `text-matching.ts` (utility)
**Purpose**: Robust text-based matching used by `ApplyCorrectionUseCase` /
`ApplyBatchCorrectionsUseCase` to locate and replace an issue's original text in the chapter
content by content search rather than by a fragile stored character offset

**Exports**: `findTextInContent` (exact match if unique; disambiguates repeated occurrences using
optional surrounding context; falls back to the first occurrence), `applyTextReplacement`
(substring splice at a found index), `isIssueStillValid` (re-checks whether an issue's original
text still exists post-correction, used to invalidate stale issues)

**Tests**: 19+ tests covering unique/ambiguous/missing matches and replacement

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

#### ~~`GrammarAnalysisStrategy`~~, ~~`PunctuationAnalysisStrategy`~~
**Removed 2026-08-05**: both mechanical checks now run offline through the Grammalecte
`GrammarChecker` (« Corriger le chapitre »). The AI analysis keeps only what needs a
reader's judgement — repetitions and style.

---

#### `createAnalysisStrategies`
**Purpose**: Build the strategy for each category the author selected

**Features**:
- One place binding `AnalysisCategory` → strategy
- Throws naming the category when no strategy is wired, so the author is never offered an
  analysis the application cannot run

**Tests**: 3 tests covering full coverage, partial selection, and the unwired category

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

### Writing Quota Use Cases ⭐ NEW

Recurring (daily/weekly) word-count quotas, distinct from the one-off `WritingGoal` (a deadline
target). Together with the word-count-snapshot and workflow-metrics use cases below, these back
the project's writing-objectives dashboard.

---

#### `CreateWritingQuotaUseCase`
**Purpose**: Create a recurring writing quota

**Dependencies**: `WritingQuotaRepository`, `IdGenerator`
**Input**: User ID, project ID, period (`daily`/`weekly`), target word count
**Output**: Created `WritingQuota` entity

---

#### `ListWritingQuotasUseCase`
**Purpose**: List all quotas for a project

**Dependencies**: `WritingQuotaRepository`
**Input**: User ID, project ID
**Output**: Array of `WritingQuota` entities

---

#### `UpdateWritingQuotaUseCase`
**Purpose**: Update a quota's target word count and/or period

**Dependencies**: `WritingQuotaRepository`
**Input**: User ID, quota ID, optional target words, optional period
**Output**: Updated `WritingQuota` entity (throws if the quota doesn't exist)

---

#### `DeleteWritingQuotaUseCase`
**Purpose**: Delete a recurring writing quota

**Dependencies**: `WritingQuotaRepository`
**Input**: User ID, quota ID
**Output**: void

**Tests**: the four quota use cases above are covered together in `WritingQuotaUseCases.test.ts` (6+ tests)

---

### Workflow Metrics Use Cases ⭐ NEW

---

#### `RecordWordCountSnapshotUseCase`
**Purpose**: Record a project's total word count for an author-local day — idempotent per day
(repeated calls for the same day update that day's snapshot rather than duplicating it)

**Dependencies**: `WordCountSnapshotRepository`, `IdGenerator`
**Input**: User ID, project ID, local date, total words, optional `previousTotalWords`
**Output**: The upserted `WordCountSnapshot`

**Workflow**:
1. If `previousTotalWords` is supplied and the project has no snapshot before this date, seed a
   baseline snapshot dated to the day before the current week's Monday — so pre-existing word
   count is never mistaken for words written in the current day/week
2. Upsert today's snapshot

**Tests**: 5+ tests covering idempotency and baseline seeding

---

#### `GetWritingActivityUseCase`
**Purpose**: Build a project's daily writing-activity series from consecutive word-count snapshots

**Dependencies**: `WordCountSnapshotRepository`
**Input**: User ID, project ID, optional date range
**Output**: `WritingActivityPoint[]` (`{ localDate, total, written }`) — `written` is the delta
from the previous day's total, or `null` when no predecessor snapshot is known

**Tests**: 4+ tests covering delta computation and missing-predecessor handling

---

#### `GetWorkflowMetricsUseCase`
**Purpose**: Compute the writing-objectives dashboard's combined metrics — pace, projected
completion, streaks — from the activity journal, the active milestone (`WritingGoal`), and quotas

**Dependencies**: `WordCountSnapshotRepository`, `WritingGoalRepository`, `WritingQuotaRepository`
(internally composes `GetWritingActivityUseCase` over a 30-day window)
**Input**: `{ userId, projectId, currentWordCount, timeZone, now? }`
**Output**: `WorkflowMetrics` — `milestone` (progress/remaining/required daily pace/projected
completion/on-track flag, or null if no active goal), `averagePerDay`, `quotas[]` (per-quota
progress against the current day/week), `dailyStreak` + `dailyStreakTarget`, and the raw
`activity` series

**Tests**: 5+ tests covering milestone projection, quota progress, and streak calculation

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

#### `GenerateMetadataUseCase<T>` — the unified metadata-generation engine

**This replaces what used to be 6–7 separate `Generate*UseCase` classes** (one per analysis
type) with a single generic use case, parameterised by a `MetadataTypeConfig<T>`. Its own header
comment states the intent directly: *"Replaces 7 shallow use case classes with one deep module:
load → hash → cache → generate → persist."* There is no `GenerateNarrativeAnalysisUseCase`,
`GenerateCharactersUseCase`, `GeneratePlotUseCase`, `GenerateStylisticDNAUseCase`,
`GenerateWorldbuildingUseCase`, or `GenerateSynthesisUseCase` class in the codebase — each is now
one `MetadataTypeConfig` object passed into `GenerateMetadataUseCase`.

**Purpose**: Generate (or regenerate) one type of project-level analysis, with content-hash-based
caching, for whichever `MetadataTypeConfig` the caller supplies

**Dependencies**: `MetadataRepository`, `ProjectRepository`, `LLMProvider`, `IdGenerator`, plus a
`MetadataTypeConfig<T>` passed to the constructor (not injected as a repository — it's the piece
that varies per analysis type)

**Input**: `{ ownerId, projectId, forceRegenerate? }`
**Output**: `{ metadata: ProjectMetadata, wasUpdated: boolean, wasCached: boolean }`

**Workflow**:
1. Load the project and its chapters; fail if there are none or all are empty
2. Extract full text via `extractProjectFullText` and hash it via `hashText` (SHA-256)
3. Look up any existing metadata of `config.typeKey` for this project
4. **Cache hit**: if metadata exists, `forceRegenerate` isn't set, and the stored hash still
   matches (`!metadata.needsRegeneration(contentHash)`), return it immediately with
   `wasCached: true` — no LLM call
5. **Cache miss / forced**: call `config.generate(llmProvider, fullText)` to get the typed
   analysis, format it to TipTap JSON via `config.format(analysis)`, and either update the
   existing `ProjectMetadata` (new content + hash + `structuredData`, marked generated) or create
   a new one via `ProjectMetadata.createGenerated`

**Caching Logic**: Only regenerates if project content changed (hash mismatch) or the caller
explicitly forces it

**Tests**: 7+ direct tests on the generic use case, plus each of the 7 configs below is exercised
through its own legacy-named test file (e.g. `GenerateNarrativeAnalysisUseCase.test.ts`) that now
imports `GenerateMetadataUseCase` + that config directly — the file names predate the
consolidation but the tests exercise the current generic implementation

---

#### The 7 `MetadataTypeConfig` objects (`use-cases/metadata-type-configs.ts`)

Each config owns exactly: a `typeKey`, a display `title`, a `generate(provider, fullText)`
function delegating to one `LLMProvider` method, and a `format(analysis)` function building the
TipTap JSON document for that analysis type. None of them is a class or a use case — they are
plain objects consumed by `GenerateMetadataUseCase`.

| Config | `typeKey` | Title | `LLMProvider` method |
|---|---|---|---|
| `narrativeAnalysisConfig` | `narrative-analysis` | Analyse Narrative | `generateNarrativeAnalysis` |
| `stylisticDNAConfig` | `stylistic-dna` | ADN Stylistique | `generateStylisticDNA` |
| `charactersConfig` | `characters` | Personnages | `generateCharacters` |
| `plotConfig` | `plot` | Intrigue | `generatePlot` |
| `worldbuildingConfig` | `worldbuilding` | Univers | `generateWorldbuilding` |
| `synthesisConfig` | `synthesis` | Synthèse | `generateSynthesis` |
| `chapterSummariesConfig` | `chapter-summaries` | Résumés des Chapitres | `generateChapterSummaries` |

`chapterSummariesConfig` is the 7th type — it has no legacy sibling from the pre-consolidation
era and did not exist as a separately-counted use case even before this refactor.

**Total metadata-generation surface**: **1** use case class (`GenerateMetadataUseCase<T>`),
instantiated once per config — **7** configs, not "6 use cases".

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

### Thesaurus Use Case ⭐ NEW

---

#### `SuggestAlternativesUseCase`
**Purpose**: The contextual thesaurus — assembles a two-layer set of word alternatives for a
word in its sentence: an always-computed lexical layer and an opt-in, voice-anchored AI layer

**Dependencies**: `AIContextBuilder`, `LLMProvider`, `Thesaurus`
**Input**: `{ ownerId, projectId, word, sentence, includeAILayer? }`
**Output**: `{ layer1: string[], layer2?: WordAlternative[], voiceAnchored: boolean }`

**Workflow**:
1. **Layer 1** (always computed, zero tokens, instant): `Thesaurus.lookup(word)` — a pure
   dictionary lookup, no LLM call
2. If `includeAILayer` is not set, return layer 1 only
3. **Layer 2** (opt-in, AI): build the author's rewrite-context profile via
   `AIContextBuilder.buildRewriteContext` — if one exists, `voiceAnchored` is true and the
   profile is passed to `LLMProvider.suggestAlternatives` to calibrate suggestions to the
   author's own voice rather than a generic register

**Tests**: 13+ tests covering both layers, voice anchoring, and opt-out of the AI layer

---

### Dynamic Pricing Use Cases ⭐ NEW

Keeps the stored per-model AI pricing (used for cost estimates and usage transparency) in sync
with OpenRouter's published catalogue, without ever silently applying a suspicious price change.

---

#### `SyncModelPricingUseCase`
**Purpose**: Fetch current model pricing from OpenRouter and reconcile it with what's stored,
quarantining anything that looks wrong for manual review instead of applying it

**Dependencies**: `PricingClient`, `ModelPricingRepository`, `EmailService`
**Input**: none
**Output**: `PricingSyncReport` (`{ newModels, updatedModels, totalModels, syncedAt, errors }`)

**Workflow**:
1. Fetch the latest pricing entries and load all stored entries in parallel
2. Group fetched entries by `provider/prefix` key — if two distinct source models collapse onto
   the same key, applying either one would be order-dependent, so the **whole colliding group is
   quarantined** (reported as an error, neither applied) rather than picking a winner
3. For each non-colliding key: new key → queue for upsert and report as new; unchanged prices →
   re-upsert silently (refreshes `updatedAt` without cluttering the report); changed prices →
   check `exceedsThreshold` (any of input/output/cached-input price moving by more than
   `MAX_VARIATION_RATIO` = 50%, or from zero) — **if it exceeds the threshold, it is quarantined
   and reported, not applied**; otherwise queue for upsert and report as updated
4. Upsert everything queued in one batch call
5. Always email a `PricingSyncReport` (best-effort — a failed email doesn't fail the sync)

**Tests**: 7+ tests covering new/updated/unchanged/collision/threshold-quarantine scenarios

---

#### `PruneObsoletePricingUseCase`
**Purpose**: Delete stored pricing entries whose `provider/prefix` is no longer present in the
latest OpenRouter catalogue

**Dependencies**: `PricingClient`, `ModelPricingRepository`
**Input**: none
**Output**: `PrunePricingReport` (`{ deletedKeys, checked, errors }`)

**Workflow**: fetch the latest catalogue and the stored entries **in that order** — deliberately
fetch-before-delete, so that if the upstream fetch fails, the catch block records the error and
the function returns having deleted nothing. A transient network error can never wipe the table.

**Tests**: 3+ tests covering pruning and the fetch-failure safety property

---

### Publication / Pagination / Book-Preview Services ⭐ NEW

These services assemble a project's chapters into a complete, paginated, print-ready book (used
for the whole-book PDF preview and export), and provide the supporting primitives for endnote
numbering, table-of-contents sub-entries, editor/preview scroll-sync anchors, and the
"presentation override" round-trip used by the `passerelle` publication profile.

---

#### `WholeBookHtmlAssembler` (`services/WholeBookHtmlAssembler.ts`)
**Purpose**: Assembles the complete book body HTML from ordered chapter inputs

**Dependencies**: `TipTapToHtmlConverter`
**Workflow**:
1. For each chapter: strip inline presentation overrides down to semantic-only content via
   `stripToSemantic` (so the print profile's per-role typography drives layout instead of any
   leaked editor default like `textAlign: justify`)
2. Optionally (`tocDepth: 'chapters-and-subtitles'`) tag top-level sous-titre headings as nested
   TOC sub-entries via `tagSubtitleHeadings`
3. Convert to HTML via `TipTapToHtmlConverter.convert`, wrapping each chapter in
   `<section id="chapter-<id>" class="chapter">…</section>` — endnote calls are anchored with an
   `endnoteAnchorPrefix` matching that section id, so body superscripts and the compiled notes
   number identically
4. Build the endnote compilation via `buildEndnoteCompilation`; the TOC is only emitted when
   there are ≥2 titled chapters (matching the PDF exporter's own rule), and gains a trailing
   "Notes" entry when an endnote compilation exists

---

#### `BookPreviewCacheComputer` (`services/BookPreviewCacheComputer.ts`)
**Purpose**: Renders a project's whole-book PDF (front matter + TOC + body) server-side via a
headless browser, and extracts the pagination metrics needed to cache it

**Dependencies**: `BrowserLauncher`, `PagedRenderer`, `WholeBookHtmlAssembler`
**Workflow**:
1. Assemble body HTML and render the full paged-media HTML document
2. Launch a headless browser, set the content, and wait for Paged.js to signal completion via a
   `data-pagedReady` / `data-pagedError` DOM flag — with a **120-second timeout**
   (`PAGE_READY_TIMEOUT_MS`), deliberately far above the 30s single-chapter preview budget because
   paginating a 300–400 page book in Chromium is inherently slow (a cold-cache cost paid once;
   warm reads are served straight from GridFS)
3. Extract metrics in-page (`EXTRACT_METRICS_JS`, run via `page.evaluate`): total page count,
   front-matter page count, each chapter's first physical page (`chapterOffsets`), and each
   sous-titre heading's page (`subtitleOffsets`)
4. Render the PDF and return both the `BookPreviewCacheEntry` and the PDF buffer

**Tests**: 9+ tests covering metric extraction and error surfacing

---

#### `computeBookOffsets` (`services/BookOffsetCalculator.ts`)
**Purpose**: Pure function computing each chapter's first Arabic (1-indexed) page number from a
map of known per-chapter page counts

**Behavior**: chapter 1 always starts at page 1; each subsequent chapter starts on the next
right-hand (odd) page after the previous one ends (`break-before: right` — one blank even page is
inserted if the previous chapter ended on an odd page); computation stops at the first chapter
whose page count isn't yet known, leaving later chapters out of the result rather than guessing

**Tests**: 12+ tests covering the odd/even boundary logic and the "stop at first unknown" rule

---

#### `computeBookPreviewContentHash` (`services/bookPreviewContentHash.ts`)
**Purpose**: Fingerprints everything visible in the whole-book PDF preview, for cache invalidation

**Rule**: "if it shows in the PDF, it enters the hash" — chapters and their order, front/back
matter fields, level styles, TOC depth/style, and the endnotes section title. **The publication
profile itself is deliberately excluded** — it's part of the cache key
(`{projectId, profileId, ownerId}`), not of the content, so two profiles of the same manuscript
share one content hash under distinct cache keys. Delegates to `hashText` (SHA-256).

**Tests**: 14+ tests covering hash stability and profile exclusion

---

#### `buildEndnoteIndex` (`services/endnoteIndex.ts`)
**Purpose**: Builds the endnotes-manager panel's per-chapter, per-rank note index — addressed by
`(chapter, rank)`, never by a raw document position, so the panel survives editing elsewhere in
the chapter

**Behavior**: for each chapter (using the in-progress editor content for the active chapter, its
stored content otherwise), extracts endnotes via `extractChapterEndnotes`, skips chapters with no
notes, and returns each note with its 1-based rank, full text, a truncated preview
(`DEFAULT_PREVIEW_LENGTH` = 120 chars), and an `isEmpty` flag for blank notes

**Tests**: 12+ tests covering ranking, previews, and empty-note detection

---

#### `tagSubtitleHeadings` (`services/subtitleAnchors.ts`)
**Purpose**: Assigns stable, index-based anchor ids (`${chapterAnchorId}-soustitre-${index}`) to
a chapter's top-level sous-titre headings, and collects their titles as `TocSubEntry` items.
Shared by `WholeBookHtmlAssembler` (HTML tagging) and the book-preview navigation panel (titles).

**Tests**: 5+ tests covering anchor id stability and title extraction

---

#### `tagWordAnchors` / `computeAnchorBlockIndices` (`services/wordAnchors.ts`)
**Purpose**: Splits a chapter's top-level blocks into fixed-size word-count segments, used to
keep the editor and the live preview scrolled to the same position

**Behavior**: `computeAnchorBlockIndices` walks cumulative word counts across blocks and records
the block index each time a multiple of `everyNWords` is first reached (a single block spanning
several thresholds yields only one anchor); `tagWordAnchors` stamps the corresponding blocks with
`attrs.wordAnchor = <1-based index>`. Shared by the editor's scroll listener (position lookup)
and the preview HTML tagging step.

**Tests**: 9+ tests covering threshold crossing and anchor stability

---

#### `PresentationOverrideService` (`rendering/PresentationOverrideService.ts`)
**Purpose**: The three pure primitives for the presentation-override round-trip invariant used by
the `passerelle` publication profile — the only profile where the author's per-node font/size/
alignment choices are preserved rather than replaced by the profile's own typography

**Exports**:
- `applyOverrides(doc, overrides)` — merges a `PresentationOverrideLayer` back onto a semantic
  document by node index
- `stripToSemantic(doc)` — removes all presentation attrs (`fontFamily`, `fontSize`, `textAlign`,
  including from `textStyle` marks), leaving only semantic content
- `extractOverrides(doc)` — the inverse capture: reads presentation attrs/marks off a "presented"
  document into a `PresentationOverrideLayer`

**Invariant**: `stripToSemantic(applyOverrides(semantic, overrides)) === semantic`

**Tests**: 29+ tests covering the round-trip invariant and each primitive independently

---

#### `switchPublicationProfile` (`rendering/PublicationProfileSwitch.ts`)
**Purpose**: Switches rendered chapter content between publication profiles without losing the
author's presentation overrides

**Behavior**: extracts any overrides currently present in the content (falling back to previously
"dormant" overrides if none are currently applied); strips the content to semantic; re-applies the
overrides only when switching **to** `passerelle` — every other (print-ready) profile keeps the
overrides dormant rather than visibly applied, since those profiles drive typography from their
own per-role styles

**Tests**: covered in `PublicationProfileSwitch.test.ts`

---

#### `endnoteCompilation.ts` (`rendering/endnoteCompilation.ts`)
**Purpose**: The single source of truth for per-chapter endnote numbering, shared by the paged
HTML export and the DOCX export

**Exports**: `extractChapterEndnotes(doc)` — depth-first walk collecting every `endnoteRef` atom
node in reading order, numbered 1-based per chapter (the same order the TipTap→HTML converter
renders body superscripts in, so body and compiled notes always line up); `buildEndnoteCompilation
(chapters, title)` — returns the whole-book compilation, or `undefined` if no chapter has any
notes; `endnoteCallId` / `endnoteNoteId` — deterministic DOM ids for the body-call ↔ compiled-note
round-trip links.

**Tests**: 6+ tests covering numbering order and the no-notes case

---

#### Rendering interfaces (`interfaces/BrowserLauncher.ts`, `interfaces/PagedRenderer.ts`, `interfaces/TipTapToHtmlConverter.ts`)

Three Application-layer seams that decouple whole-book rendering from its concrete
implementations, following the same "depend on abstractions" rule as every other cross-layer
boundary in this codebase:

- **`BrowserLauncher`** — headless-browser lifecycle (`launch`, `newPage`, `setContent`,
  `waitForFunction`, `pdf`, `evaluate`) used by `BookPreviewCacheComputer`; decouples the export
  pipeline from the specific browser-automation library
- **`PagedRenderer`** — `render(request): string`, producing a complete paged-media HTML document
  from assembled body HTML, a `PublicationProfile`, front/back matter, TOC, endnotes, and level
  styles; keeps the live preview and the PDF export on the same rendered-document contract
- **`TipTapToHtmlConverter`** — `convert(content, options?): string`, the seam
  `WholeBookHtmlAssembler` depends on to turn TipTap JSON into semantic HTML, with an
  `endnoteAnchorPrefix` option for the round-trip anchors used in paged/export views

---

### Content Migrations ⭐ NEW (`src/application/migration/`)

One-shot and repeatable content-shape migrations for the manuscript's TipTap JSON, run across a
user's projects. Each migration is a pure function plus a thin orchestrating use case that loops
over projects/chapters and (optionally, via `dryRun`) persists the result.

---

#### `migrateContent` (`migration/ContentMigrator.ts`)
**Purpose**: Migrates legacy TipTap JSON presentation marks (e.g. `textAlign`) into the semantic-
content model's `semanticRole` attributes (`corps`, `titre-de-chapitre`, `sous-titre`, etc.)

**Behavior**: idempotent — `isAlreadyMigrated` detects a document where every paragraph/heading
already carries a `semanticRole` and no node carries `textStyle` marks, and returns it unchanged
(`wasAlreadyMigrated: true`). Otherwise: paragraphs default to `semanticRole: 'corps'`
(preserving any existing role), stripping `textAlign` only for the plain left/right/justify
values; **centered text (`textAlign: 'center'`) is flagged as an ambiguous case for manual
review** rather than silently reclassified, since it may actually be an epigraph. Headings are
unambiguous: level 1 → `titre-de-chapitre`, any deeper level → `sous-titre`. All `textStyle` marks
are stripped throughout.

**Tests**: 21+ tests covering idempotency, role assignment, and ambiguity flagging

---

#### `demigrateContent` (`migration/ContentDemigrator.ts`)
**Purpose**: The inverse of `migrateContent`, for rollback — strips `semanticRole` attributes
from every node

**Note**: this does **not** restore the presentation marks (`textAlign`, `textStyle`) that
`migrateContent` stripped; those are gone for good once migrated. Demigration only undoes the
semantic-role tagging.

**Tests**: 8+ tests covering recursive stripping and the revert count

---

#### `MigrateProjectContentUseCase` (`migration/MigrateProjectContentUseCase.ts`)
**Purpose**: Orchestrates `migrateContent` across every chapter of every project belonging to a
given user

**Dependencies**: `ProjectRepository`
**Input**: User ID, `{ dryRun? }`
**Output**: `MigrationReport` — per-project, per-chapter results plus totals scanned/migrated/
ambiguous

**Workflow**: for each project, for each chapter, parse the stored content (skip on invalid JSON),
run `migrateContent`; when not a dry run and the chapter wasn't already migrated, persist the
updated chapter via `ProjectRepository.updateChapter`

**Tests**: 7+ tests covering dry-run mode and aggregate reporting

---

#### `ensureChapterTitleHeading` (`migration/ChapterTitleHeadingMigration.ts`)
**Purpose**: One-shot insertion of a missing `titre-de-chapitre` H1 into a chapter body (issue
#143)

**Behavior**: idempotent — if the chapter already starts with a `titre-de-chapitre` heading, it's
left untouched (`wasAlreadyPresent: true`); otherwise a level-1 heading carrying the chapter's
title text is inserted at the start of the document.

**Tests**: 4+ tests covering the idempotent and insertion paths

---

#### `MigrateChapterTitleHeadingsUseCase` (`migration/MigrateChapterTitleHeadingsUseCase.ts`)
**Purpose**: Orchestrates `ensureChapterTitleHeading` across all chapters of all projects for a
given user, mirroring `MigrateProjectContentUseCase`'s dry-run-aware, per-project/per-chapter loop
and reporting shape

**Dependencies**: `ProjectRepository`
**Tests**: 6+ tests covering dry-run mode and aggregate reporting

---

#### `resolveMigratedProfileId` (`migration/RemovedPublicationProfileMigration.ts`)
**Purpose**: Pure function resolving the replacement publication-profile id for projects stored
on a KDP trim size removed from the catalogue

**Behavior**: maps the 3 removed profile ids — `kdp-5x8`, `kdp-5_25x8`, `kdp-5_5x8_5` — to their
single replacement, `kdp-6x9`; returns `null` for any other (already-valid or unrelated) id, so
the caller can distinguish "needs migrating" from "nothing to do". Used by both the one-shot DB
migration script and its own test suite.

**Tests**: 5+ tests covering all 3 removed ids and the no-op case

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
- **Snapshot Use Cases**: 60+ tests ⭐ NEW
  - CreateSnapshotUseCase: 13 tests
  - ProcessAutomaticSnapshotUseCase: 5 tests
  - ListSnapshotsUseCase: 10 tests
  - LoadSnapshotComparisonUseCase: unit + `.integration.test.ts` (race detection)
  - RestoreSnapshotUseCase: 26 unit tests + `.integration.test.ts` (compare-and-swap, compensation)
  - GovernSnapshotHistoryUseCase: 3 tests
- **Canon Facts Use Cases**: 19+ tests ⭐ NEW
  - GenerateCanonFactsUseCase: 12 tests
  - detectEntities (canonEntities.ts): 7 tests
- **Publication / Book-Preview Services**: 120+ tests ⭐ NEW
  - WholeBookHtmlAssembler: 26 tests
  - BookPreviewCacheComputer: 9 tests
  - BookOffsetCalculator: 12 tests
  - bookPreviewContentHash: 14 tests
  - endnoteIndex: 12 tests
  - subtitleAnchors: 5 tests
  - wordAnchors: 9 tests
  - PresentationOverrideService: 29 tests
  - PublicationProfileSwitch, endnoteCompilation: covered in their own suites
- **Content Migrations**: 51+ tests ⭐ NEW
  - ContentMigrator: 21 tests
  - ContentDemigrator: 8 tests
  - MigrateProjectContentUseCase: 7 tests
  - ChapterTitleHeadingMigration: 4 tests
  - MigrateChapterTitleHeadingsUseCase: 6 tests
  - RemovedPublicationProfileMigration: 5 tests
- **Dynamic Pricing Use Cases**: 10+ tests ⭐ NEW
  - SyncModelPricingUseCase: 7 tests
  - PruneObsoletePricingUseCase: 3 tests
- **Password Reset / Change Use Cases**: 35+ tests ⭐ NEW
  - RequestPasswordResetUseCase: 10 tests
  - ResetPasswordUseCase: 12 tests
  - ChangePasswordUseCase: 13 tests
- **Thesaurus Use Case**: 13+ tests ⭐ NEW
  - SuggestAlternativesUseCase: 13 tests
- **Writing Quota / Workflow Metrics Use Cases**: 20+ tests ⭐ NEW
  - Writing Quota (Create/List/Update/Delete): 6 tests
  - RecordWordCountSnapshotUseCase: 5 tests
  - GetWritingActivityUseCase: 4 tests
  - GetWorkflowMetricsUseCase: 5 tests
- **Autocomplete Application Services**: 25+ tests ⭐ NEW
  - AutocompleteContextBuilder: 12 tests
  - ManuscriptContextBuilder: 6 tests
  - autocompleteIntents, autocompletePreferenceDirectives: covered in their own suites
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
  - text-matching.ts: 19 tests
  - Analysis Strategies: 40+ tests (StyleAnalysisStrategy, RepetitionAnalysisStrategy, createAnalysisStrategies)
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
- **Metadata Use Cases**: 40+ tests (Phase 3.6)
  - Metadata CRUD: 25+ tests (Create, Load, List, UpdateContent, UpdateTitle, Delete)
  - GenerateMetadataUseCase + the 7 MetadataTypeConfig objects: 7+ direct tests, plus one
    legacy-named test file per config exercising the generic use case end-to-end
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
- **User Use Cases**: 25+ tests ⭐ NEW
  - RegisterUserUseCase: 6 tests
  - DeleteUserAccountUseCase: 7 tests
  - ApproveUserUseCase: 8 tests
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
