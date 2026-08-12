# Domain Layer

Pure business logic with zero framework dependencies.

**Status**: Living document — updated as the domain evolves. See [CHANGELOG.md](../../CHANGELOG.md) for phase-by-phase history and [README.md](../../README.md) for test statistics.

## Rules:
- No imports from Next.js, React, or any external frameworks
- No infrastructure concerns (no OpenAI, no file I/O, no database)
- Only business entities, value objects, and domain interfaces
- All code must be framework-agnostic and testable in isolation

## Contents:

### Entities

#### `CorrectionHistory` (Phase 3.7)
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
- Tracks metadata type (narrative_analysis, characters, plot, stylistic_dna, worldbuilding, synthesis, chapter summaries, and the editorial annex types — see `MetadataType`)
- Stores content hash for cache invalidation
- Validates metadata type
- Provides cache validation via `needsRegeneration(newHash)`
- **Carries `structuredData`** (JSON-serialized AI output) alongside the TipTap content (Phase 8.0)
- **Tracks generation provenance** (`generatedAt`, `isGenerated`, `lastEdited`) so context can decide
  whether `structuredData` is still trustworthy ("author edit wins") (Phase 8.0)
- Immutable content/title updates with new instances

**Key Methods**:
- `getId()`, `getProjectId()`, `getType()`, `getTypeKey()`, `getTitle()`, `getContent()`, `getContentHash()`
- `needsRegeneration(contentHash)` - Check if content changed
- `getStructuredData()`, `getContentText()` - Structured AI output / plain-text fallback (Phase 8.0)
- `isGenerated()`, `wasEditedSinceGeneration()` - True once the author edits a generated fiche (Phase 8.0)
- `markAsGenerated()` - Single timestamp at generation (`lastEdited === generatedAt`) (Phase 8.0)
- `updateContent(content, contentHash)` / `updateTitle(title)` - Returns new instance
- `static create(...)` / `static createGenerated(...)` - Factory methods (manual vs AI-generated) (Phase 8.0)

**Tests**: 10+ tests covering validation, caching logic, updates, and author-edit-wins provenance

---

#### `User` (Phase 3, 3.8, 3.11)
**Purpose**: Represents a user account with authentication, approval, and consent

**Responsibilities**:
- Manages user identity (unique ID, email)
- Stores hashed password (bcrypt)
- **Tracks approval status** (`isApproved`, `approvedAt`) (Phase 3.8)
- **Tracks RGPD consent** (`termsAcceptedAt`, `privacyAcceptedAt`) (Phase 3.11)
- Validates email format
- Creation timestamp

**Key Methods**:
- `getId()`, `getEmail()`, `getHashedPassword()`, `getCreatedAt()`
- `isApproved()`, `getApprovedAt()` (Phase 3.8)
- `getTermsAcceptedAt()`, `getPrivacyAcceptedAt()` (Phase 3.11)
- `approve()` - Returns new approved User instance (Phase 3.8)
- `static create(id, email, hashedPassword, consents)` - Factory method
- Email validation at construction

**Tests**: 10+ tests covering validation, approval, and consent

---

#### `BlogArticle` (Phase 4.0)
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

#### `ContactMessage` (Phase 3.11)
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

#### `ArticleView`
**Purpose**: Represents a single recorded view of a blog article, deduplicated by visitor fingerprint

**Responsibilities**:
- Records which article was viewed and a hash of the visitor (IP + User-Agent), never the raw values
- Immutable once created
- Feeds a TTL-based cleanup so old view records are pruned (see `ArticleViewRepository.deleteOlderThan`)

**Key Methods**:
- `getId()`, `getArticleId()`, `getVisitorHash()`, `getViewedAt()`
- `static create({ id, articleId, visitorHash })` - Factory method

**Tests**: Covered by `BlogArticleRepository`/view-counting integration tests

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

#### `Project` (Phase 3, 5.0, 6.1)
**Purpose**: Aggregate managing a collection of chapters with owner tracking and publishing

**Responsibilities**:
- Manages chapter collection (add, remove, reorder)
- Enforces business rules (minimum 1 chapter)
- Tracks active chapter for navigation
- **Tracks owner ID for multi-tenant isolation** (Phase 3)
- Calculates project-level metadata
- Maintains chapter ordering
- **Timestamps for created/updated dates** (Phase 3)
- **Publishing support** (`shareToken`, `isPublished`, `publishedAt`) (Phase 5.0)
- **Publish/unpublish methods** for public sharing (Phase 5.0)
- **Cover image support** (`coverImageUrl`) (Phase 6.1)

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

#### `Character` (Phase 6)
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

#### `ProjectSettings` (Phase 6, 10.0)
**Purpose**: Represents project-level settings and metadata — genre, narration, contributors, and also owns per-project autocomplete preferences, canon-extraction preferences, custom spelling dictionary, book pagination/typography settings, and automatic-snapshot configuration

**Responsibilities**:
- Manages project configuration (genre, themes, subtitle, synopsis, ISBN)
- Stores narration settings (POV, tense, target audience)
- Tracks contributors with roles and related works references
- Stores cover image URL
- **Owns autocomplete preferences** (`getAutocompletePreferences()`, `updateAutocompletePreferences()`)
- **Owns canon-extraction preferences** — `manual` vs `session-end` trigger mode via `CanonExtractionPreferences`
- **Owns the grammar remarks the author declined** (`getIgnoredGrammarIssues()`, `addIgnoredGrammarIssue()`) — a rule family paired with the flagged text, so declining silences that remark wherever it recurs without silencing the rule
- **Owns the project's own vocabulary and the ignored-words list** (`getCustomDictionary()` → `PersonalDictionaryEntry[]`, `getCustomDictionaryWords()` → every written form, `addWordToCustomDictionary()`, `updateCustomDictionary(entries, compiledDictionary)`, `getGrammarDictionary()`, `getIgnoredWords()`, `addIgnoredWord()`/`removeIgnoredWord()`/`clearIgnoredWords()`) — backing both `SpellChecker` and `GrammarChecker`. An entry may declare a nature, a gender and a plural; `updateCustomDictionary` takes the list and the automaton compiled from it in one call, so the two cannot describe different words
- **Owns book pagination/typography**: `publicationProfileId` (which `PublicationProfile` preset the project renders with), per-profile `LevelStyleSet` overrides (`getLevelStyleSet()`, `updateLevelStyleSet()` — rejected for the `passerelle` profile, which has no level typography), `TocPreferences` (`getTocPreferences()`, `updateTocPreferences()`), and the endnotes section heading (`getEndnotesTitle()` defaults to *"Notes"*, `updateEndnotesTitle()`)
- **Owns automatic-snapshot scheduling preferences**: `getAutomaticSnapshotIntervalMinutes()` (`AutomaticSnapshotInterval | null`), `getSnapshotTimeZone()` / `updateSnapshotTimeZone()` (validated IANA zone), `updateAutomaticSnapshotIntervalMinutes()`
- Timestamps for created/updated dates

**Key Methods**:
- `getId()`, `getProjectId()`, `getGenre()`, `getThemes()`
- `getNarrationSettings()` fields, `getContributors()`, `getRelatedWorks()`
- `getCoverImageUrl()`, `getCreatedAt()`, `getUpdatedAt()`
- `getAutocompletePreferences()` - Returns `AutocompletePreferences` with defaults applied (Phase 10.0)
- `getCanonExtractionPreferences()` / `updateCanonExtractionPreferences()`
- `getPublicationProfileId()`, `updatePublicationProfile()`, `getLevelStyleSet()`, `updateLevelStyleSet()`
- `getTocPreferences()`, `updateTocPreferences()`
- `getEndnotesTitle()`, `updateEndnotesTitle()`
- `getAutomaticSnapshotIntervalMinutes()`, `updateAutomaticSnapshotIntervalMinutes()`, `getSnapshotTimeZone()`, `updateSnapshotTimeZone()`
- `update(updates)` - Returns new instance with updates
- `static create(id, projectId, ...)` - Factory method

**Tests**: 20+ tests covering entity creation, updates, and autocomplete preference access; see also `ProjectSettings.autocomplete.test.ts`

---

#### `ProjectTask` (Phase 6)
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

#### `ResearchDocument` (Phase 6)
**Purpose**: Represents a research document for the project

**Responsibilities**:
- Manages document identity (unique ID, project association)
- Stores document type (note/link/quote/reference/image), title, body, and source metadata
- Tracks tags for categorization and chapter locality (`linkedChapterIds`)
- **Read by the AI as the author's intentional context** (Phase 8.0)
- Timestamps for created/updated dates

**Key Methods**:
- `getId()`, `getProjectId()`, `getType()`, `getTitle()`, `getContent()`, `getTags()`
- `getContentText()` - Plain text of the body (handles `{ text }` and TipTap shapes) (Phase 8.0)
- `getLinkedChapterIds()`, `isLinkedToChapter(chapterId)` - Locality for context selection (Phase 8.0)
- `getUrl()`, `getSourceTitle()`, `getSourceAuthor()`
- `getCreatedAt()`, `getUpdatedAt()`
- `update(updates)` - Returns new instance with updates
- `static create(id, projectId, title, ...)` - Factory method

**Tests**: 15+ tests covering entity creation, updates, and context-text extraction

---

#### `WritingGoal` (Phase 6)
**Purpose**: Represents a one-off writing goal for the project (distinct from the recurring `WritingQuota`)

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

#### `AIUsageRecord` (Phase 6, 9.0)
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

#### `CharacterConversation` (Phase 9.0)
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

#### `ChapterAnalysis` (Phase 7)
**Purpose**: Represents a complete chapter analysis result — the sole persisted artifact of chapter verification (its former companion entities were removed, see below)

**Responsibilities**:
- Manages analysis issues, repetitions, and statistics
- Tracks content hash for cache invalidation
- Supports filtering by category and severity
- Immutable updates with new instances

**Key Methods**:
- `getId()`, `getChapterId()`, `getProjectId()`, `getOwnerId()`
- `getIssues()`, `getRepetitions()`, `getCategories()`, `getStyleRigor()`
- `getStatsByCategory()`, `getStatsBySeverity()`, `getPendingCount()`, `getAppliedCount()`, `getIgnoredCount()`
- `getIssuesByCategory()`, `getIssuesBySeverity()`, `getPendingIssues()`, `getNonIntentionalRepetitions()`
- `addIssue(issue)`, `applyIssue(issueId)`, `ignoreIssue(issueId)` - Returns new instance
- `adjustPositionsAfterCorrection(correctionEnd, delta)` - Shifts issue positions after a text edit
- `hasChanges(currentHash)` - Check if content changed

**Tests**: 30+ tests covering entity creation, filtering, and statistics

> **Note**: `ChapterAnalysis` is the sole persisted analysis artifact. Earlier revisions of this document described a companion history-tracking entity, a dedicated ignored-issues store, and a repetition-exclusions value object; none of those exist in the current code. Chapter analysis was simplified to an in-memory-only, single-current-analysis model during the Phase 7 simplification (Feb 2026), and `ChapterAnalysis` is not currently backed by a domain repository interface in this layer.

---

#### `AutocompleteEvent` (Phase 10.0)
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

#### `CanonFact` (Phase 10.0)
**Purpose**: An atomic manuscript fact about a character or entity, with **temporal validity**, used to ground autocomplete suggestions and keep AI-facing context consistent with the story so far

**Responsibilities**:
- Stores `entity`, `statement`, source chapter (`sourceChapterId`), and a `contentHash` for freshness
- Tracks provenance via `CanonFactSource` (`derived` = LLM-extracted | `author` = manually written/edited) for refutability: author facts survive re-extraction, derived facts may be replaced
- **Temporal validity, not a boolean flag**: `validFromChapter` (0-based chapter index where the fact becomes true) and `validToChapter` (null while still current). `withValidToChapter()` closes a fact that has been superseded by a later one — it does not "invalidate" it, the fact remains true for the chapter range it covers
- **5-category narrative classification** (`category`, defaults to `1`): 1 = objectif (a true fact in the story world), 2 = état de connaissance (what a character knows/doesn't know at a point in time), 3 = croyance (what a character holds true even if objectively false), 4 = croyance sur autrui (what a character believes others know or don't know), 5 = dynamique relationnelle (the nature of a relationship at a point in time). See [docs/adr/0003-cinq-categories-faits-canon.md](../../docs/adr/0003-cinq-categories-faits-canon.md) for the rationale and [docs/adr/0004-extraction-incrementale-faits-canon.md](../../docs/adr/0004-extraction-incrementale-faits-canon.md) for how extraction stays incremental
- Immutable — all changes return a new instance

**Key Methods**:
- `getId()`, `getOwnerId()`, `getProjectId()`, `getEntity()`, `getStatement()`
- `getValidFromChapter()`, `getValidToChapter()`, `getSource()`, `getSourceChapterId()`, `getContentHash()`, `getCategory()`
- `withValidToChapter(chapterIndex)` - Returns new instance closing the fact's validity range
- `static create(props)` / `static reconstruct(props)` - Factory methods

**Tests**: 20+ tests covering creation, temporal validity, category defaulting, and source tracking

---

#### `Provider`
**Purpose**: A user-configured AI provider credential set (bring-your-own-key), one of the concrete inputs behind the `LLMProvider` abstraction

**Responsibilities**:
- Stores provider `type` (`openai | anthropic | google`), a friendly `name`, the `model` identifier, and the API key
- **Holds the API key in plain text in memory only** — encrypted at rest by the infrastructure layer, and the client only ever receives masked versions
- Tracks validity/testing state: `isValid`, `lastTested` — reset (`isValid = false`, `lastTested = undefined`) whenever the key is updated, since a changed key needs re-validation
- Mutable in place (unlike most other entities): `updateName()`, `updateApiKey()`, `updateModel()`, `markAsValid()`, `markAsInvalid()` mutate and touch `updatedAt`

**Key Methods**:
- `getId()`, `getOwnerId()`, `getName()`, `getType()`, `getApiKey()`, `getModel()`
- `isValidProvider()`, `getLastTested()`, `getCreatedAt()`, `getUpdatedAt()`
- `updateName(name)`, `updateApiKey(apiKey)`, `updateModel(model)` - Mutate and touch `updatedAt`
- `markAsValid()`, `markAsInvalid()` - Records `lastTested = now`
- `static create(id, ownerId, name, type, apiKey, model)` - Factory method (starts unvalidated)

**Tests**: Covered by provider connection-testing and settings use case tests

---

#### `Snapshot`
**Purpose**: Immutable captured version of the whole manuscript (all chapters + editorial metadata) at a point in time — the backbone of the version-history feature

**Responsibilities**:
- Captures full chapter copies (`SnapshotChapter[]`, a plain copy of id/title/content/order — not the live `Chapter` entity) and editorial metadata (`SnapshotEditorialMetadata`) at the moment it was taken; automation settings and personal preferences are deliberately excluded
- Sequential `number` per project, allocated by the repository and **never reused**, even if a snapshot that consumed a number is never saved
- `type`: `manual` (author-triggered) | `automatic` (scheduler-triggered) | `restore` (created when restoring an earlier snapshot) | `safety` (captured automatically before a destructive action)
- `sourceSnapshotNumber` is **required** for `type: 'restore'` (provenance) and **forbidden** for every other type
- **Tombstone model, not hard delete**: `tombstone()` erases the restorable payload (`chapters`, `editorialMetadata`) but keeps the record as an audit entry (`deletedAt`, `deletedById`) — a deleted snapshot can never be un-deleted or restored from
- `withMetadata()` changes only presentation fields (`title`, `comment`) — the captured content itself never changes after creation

**Key Methods**:
- `getId()`, `getProjectId()`, `getOwnerId()`, `getAuthorId()`, `getNumber()`, `getType()`, `getTitle()`, `getComment()`
- `getProjectTitle()`, `getChapters()`, `getEditorialMetadata()`, `getSourceSnapshotNumber()`, `getCreatedAt()`
- `isDeleted()`, `getDeletedAt()`, `getDeletedById()`
- `withMetadata(title, comment?)` - Returns new instance with updated presentation metadata; throws if already deleted
- `tombstone(deletedById, deletedAt?)` - Returns new instance with payload erased and deletion audit set

**Tests**: See `Snapshot.test.ts`

---

#### `BookPreviewCacheEntry`
**Purpose**: Cache of whole-book PDF preview page metrics, so the reader can jump to a chapter or subtitle by physical PDF page without re-paginating the whole book on every navigation

**Responsibilities**:
- Keyed by `{ projectId, profileId, ownerId }` with a `contentHash` for invalidation when the manuscript or typography settings change
- Stores physical (1-indexed) page offsets: `chapterOffsets` (where each chapter starts), `subtitleOffsets` (where each sous-titre anchor starts, for TOC sub-entry navigation), `frontMatterPageCount` (liminal pages preceding the body), `totalPageCount`
- `pageForChapter()` / `pageForSubtitle()` resolve a physical page number for navigation, or `null` if unknown

**Key Methods**:
- `getProjectId()`, `getProfileId()`, `getOwnerId()`, `getContentHash()`, `getComputedAt()`
- `getFrontMatterPageCount()`, `getTotalPageCount()`, `getChapterOffsets()`, `getSubtitleOffsets()`
- `pageForChapter(chapterId)`, `pageForSubtitle(anchorId)` - Returns `number | null`
- `static create(props, computedAt)` / `static reconstruct(props)` - Factory methods

**Tests**: Covered by book-preview cache use case tests

---

#### `CustomAnnex`
**Purpose**: An author-inserted front- or back-matter annex (e.g. a custom dedication variant, an extra afterword) that isn't one of the built-in editorial `MetadataType` slots

**Responsibilities**:
- Holds `title` + TipTap `content` (validated as `{ type: 'doc', ... }` JSON)
- `placement`: `front` | `back` — which zone of the compiled book it appears in
- `order` — position within its placement zone, used to sequence multiple annexes

**Key Methods**:
- `getId()`, `getProjectId()`, `getTitle()`, `getContent()`, `getPlacement()`, `getOrder()`, `getCreatedAt()`, `getUpdatedAt()`
- `updateTitle(title)`, `updateContent(content)`, `updatePlacement(placement)`, `setOrder(order)` - Mutate in place
- `static createEmpty(id, projectId, title, placement, order)` - Factory method with an empty TipTap doc

**Tests**: Covered by book-export/annex use case tests

---

#### `AIExchange`
**Purpose**: Captures the real content of one AI exchange — system prompt, author-facing input, and raw model output — for the AI transparency ledger, so authors can see exactly what was sent to and received from a provider

**Responsibilities**:
- Stored **separately from `AIUsageRecord`** to isolate bulky content and drive independent retention/purge; denormalizes a display-only metrics snapshot (tokens, cost, duration) from the matching usage record so the list/detail views need no join — `AIUsageRecord` remains the source of truth for aggregated statistics
- **Opt-in and encrypted at rest**; has a hard `expiresAt` computed from a configurable retention window at creation time (`retentionDays`), enforced by both application-level purge and a MongoDB TTL index
- Immutable once created

**Key Methods**:
- `getId()`, `getUserId()`, `getProjectId()`, `getUsageRecordId()`, `getOperation()`, `getProvider()`, `getModel()`
- `getSystemPrompt()`, `getInput()`, `getOutput()`
- `getInputTokens()`, `getOutputTokens()`, `getCachedInputTokens()`, `getCostEur()`, `getDurationMs()`
- `getCreatedAt()`, `getExpiresAt()`
- `static create(input)` - Factory method; throws if `retentionDays <= 0`
- `static reconstruct(props)` - Reconstitution from serialized data

**Tests**: Covered by AI transparency ledger use case tests

---

#### `WordCountSnapshot`
**Purpose**: One calendar-day checkpoint of a project's total word count — the foundation for daily/weekly writing-activity charts and quota tracking

**Responsibilities**:
- One record per `(ownerId, projectId, localDate)` — `localDate` is the author's local calendar day (`YYYY-MM-DD`), validated as a real calendar date
- Immutable creation, mutation-via-new-instance updates (`updateTotalWords()`)

**Key Methods**:
- `getId()`, `getProjectId()`, `getOwnerId()`, `getLocalDate()`, `getTotalWords()`, `getCreatedAt()`, `getUpdatedAt()`
- `updateTotalWords(newTotalWords)` - Returns new instance
- `static create(id, projectId, ownerId, localDate, totalWords)` / `static reconstruct(props)` - Factory methods

**Tests**: Covered by writing-activity/quota use case tests

---

#### `WritingQuota`
**Purpose**: A recurring daily or weekly word-rate target for a project — distinct from the one-off `WritingGoal` (a fixed target with a deadline)

**Responsibilities**:
- `period`: `daily` | `weekly`; `targetWords` must be a positive integer
- `getProgress(wordsWrittenInPeriod)` returns a 0–100 percentage; **floors written words at 0** so a heavy revision/cutting period (negative net words) is never shown as negative progress
- `isMet(wordsWrittenInPeriod)` - Simple threshold check

**Key Methods**:
- `getId()`, `getProjectId()`, `getOwnerId()`, `getPeriod()`, `getTargetWords()`, `getCreatedAt()`, `getUpdatedAt()`
- `getProgress(wordsWrittenInPeriod)` - Returns percentage, floored at 0
- `isMet(wordsWrittenInPeriod)` - Returns boolean
- `updateTarget(newTargetWords)`, `updatePeriod(newPeriod)` - Returns new instance
- `static create(id, projectId, ownerId, period, targetWords)` / `static reconstruct(props)` - Factory methods

**Tests**: Covered by writing-activity/quota use case tests

---

#### `PasswordResetToken`
**Purpose**: A single-use, expiring token for the password-reset flow

**Responsibilities**:
- Ties a `token` to a `userId` with an `expiresAt`; optional `usedAt` marks single use
- Plain data shape (not a class with invariants) — validation and single-use enforcement live in `PasswordResetTokenRepository` (creating a new token invalidates prior ones for the same user)

**Shape**: `{ id, userId, token, expiresAt, usedAt?, createdAt }`

**Tests**: Covered by password-reset use case tests

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

## Domain Services

Domain services hold business rules that don't naturally belong to a single entity — pure functions/classes operating on entities and value objects, still with zero framework dependencies. There is currently **one** domain service in the codebase.

#### `AutomaticSnapshotRetention`
**File**: `src/domain/services/AutomaticSnapshotRetention.ts`

**Purpose**: Pure retention policy deciding which `automatic` snapshots to prune, so the automatic-snapshot feature doesn't grow the version history unboundedly

**Responsibilities**:
- Operates only on snapshots of `type: 'automatic'` — manual, restore, and safety snapshots are never touched by this policy
- Always keeps the 20 most recent automatic snapshots regardless of age
- Beyond that: keeps one snapshot per calendar day for the next 30 days, then one per calendar week for the next 6 months; anything older and not selected by either rule is pruned
- Timezone-aware: "day" and "week" boundaries are computed in the project's configured timezone (`ProjectSettings.getSnapshotTimeZone()`), not UTC, so the kept snapshots line up with the author's actual working days

**Key Function**:
- `automaticSnapshotsToPrune(snapshots, now, timeZone)` → `string[]` — returns the ids of automatic snapshots that should be deleted

**Tests**: Covered by retention policy unit tests exercising the 20-latest/daily/weekly boundaries and timezone handling

---

## Snapshots / Version History

The snapshot subsystem lets authors capture, browse, and restore whole-manuscript versions — manual checkpoints, scheduled automatic captures, restore records, and pre-destructive-action safety captures. See the `Snapshot` entity and `AutomaticSnapshotRetention` service above for the core model; the repositories below define its persistence and scheduling contracts.

---

## Publication Profiles, Pagination & Book Typography

A subsystem that decouples the manuscript's **semantic** structure (what a block of content *is* — a chapter title, a scene break, a citation) from its **presentation** (how it's typeset for a given print or export target), so the same manuscript can be paginated for different output formats (Kindle Direct Publishing 6×9, A5, or the "passerelle" web/PDF hybrid) without duplicating content.

#### `PublicationProfile`
**Purpose**: Immutable print/pagination preset defining page geometry and base typography for a rendering target

**Responsibilities**:
- Three built-in profiles: `kdp-6x9`, `a5`, `passerelle` — each with page width/height (inches), margins (cm, top/bottom/inside/outside), body font family/size, line height, and first-line paragraph indent
- `fromId()` restores a profile by id and **falls back to `kdp-6x9`** for unknown or removed ids, rather than throwing — so a project stored against a profile later removed from the catalogue still opens
- Immutable value object (private constructor, only static factories)

**Key Methods**:
- `static kdpSixByNine()`, `static a5()`, `static passerelle()` - Named factory presets
- `static fromId(id)` - Restore by id with safe fallback
- `.values` - Readonly `PublicationProfileProperties`

**Tests**: See `PublicationProfile.test.ts`

---

#### `SemanticRole`
**Purpose**: Marks the *role* of a TipTap content block, not its visual style

**Responsibilities**:
- Closed set: `corps` (body text), `titre-de-chapitre` (chapter title), `sous-titre` (subtitle), `citation` (quote), `epigraphe` (epigraph), `separateur-de-scene` (scene break)
- Keeps content authoring separate from presentation: a block tagged `titre-de-chapitre` renders differently per `PublicationProfile` via `LevelStyleSet`, without the content itself encoding any styling

**Tests**: Covered by content-node role classification tests

---

#### `LevelStyleSet`
**Purpose**: Immutable per-profile typography for the semantic roles that vary by level (`titre-de-chapitre`, `sous-titre`, `corps`, `citation`, `epigraphe` — a subset of `SemanticRole`, excluding `separateur-de-scene` which has no text styling)

**Responsibilities**:
- Each role's `LevelStyle` covers font size (pt), weight, italic, alignment, line height, space before/after (pt), and font family
- **Clamps numeric values** to safe bounds (e.g. font size 6–48pt, line height 1–3) and validates closed-list fields (weight, alignment, font family) — malformed values are corrected/rejected rather than silently rendering broken output
- `defaultsFor(profile)` derives sensible per-profile defaults (body-inherited styling for most roles, distinct emphasis for chapter titles and subtitles)

**Key Methods**:
- `static create(properties)` - Normalizes/validates and returns an instance
- `static defaultsFor(profile: PublicationProfile)` - Profile-derived defaults
- `.values` - Readonly `LevelStyleSetProperties`

**Tests**: See `LevelStyleSet.test.ts`

---

#### `TocPreferences`
**Purpose**: Project-wide table-of-contents settings (one TOC configuration per project, not per profile)

**Responsibilities**:
- `depth`: `chapters` (chapter entries only) | `chapters-and-subtitles` (sous-titre headings appear as nested entries)
- `style`: `classique` | `epure` | `litteraire` — a design preset for the compiled TOC

**Tests**: Covered by book-compilation use case tests

---

#### `PresentationOverride`
**Purpose**: A per-node presentation override layer, scoped **only** to the `passerelle` profile

**Responsibilities**:
- `NodeOverride`: a `nodeIndex` plus optional `fontFamily`/`fontSize`/`textAlign` overrides
- Kept as a **separate layer** from the semantic TipTap content — overrides never mutate the underlying `ContentNode`s, they're applied on top at render time, so the same manuscript content can carry different visual tweaks per profile without forking the document

**Tests**: Covered by presentation-override use case tests

---

#### `ChapterGeneration` / `ChapterGenerationType`
**Purpose**: Structured output shape and mode catalogue for AI-assisted chapter generation

**Responsibilities**:
- `ChapterGeneration`: `generationType`, generated `content` (plain text, converted to TipTap JSON by the caller), optional `narrativeContext` and `suggestions`
- `ChapterGenerationType` defines the 3 generation modes, each with a word cap: `chapter-beginning` (~10 sentences, 200 words), `chapter-full` (full chapter, 1000 words max), `chapter-outline` (5-9 point plan, 500 words max)

**Tests**: Covered by `LLMProvider.generateChapter()` use case tests

---

#### `ContentNode` / `ContentMark`
**Purpose**: Minimal structural type for TipTap-compatible document nodes, decoupling the Domain (and Application) layer from the `@tiptap/core` package

**Responsibilities**:
- `ContentNode`: optional `type`, `attrs`, nested `content: ContentNode[]`, `marks: ContentMark[]`, `text` — a loose structural shape, not a TipTap schema validator
- `ContentMark`: `type` + optional `attrs`

**Tests**: Covered wherever content is walked/transformed in the Application layer

---

### Value Objects

#### `TextSelection`
**Purpose**: Immutable representation of selected text range

**Responsibilities**:
- Validates selection boundaries
- Extracts selected content from text
- Ensures start ≤ end positions

**Tests**: 9 tests covering edge cases (empty selection, bounds, etc.)

---

#### `MetadataType` (Phase 3.6, 3.7, 6)
**Purpose**: Enum-like registry of metadata document types — both AI-generated analysis fiches and author-written editorial annexes

**Responsibilities**:
- Type-safe metadata type lookup (`isValidMetadataType`, `getMetadataType`)
- **7 analysis types**: `narrative-analysis`, `stylistic-dna`, `characters`, `plot`, `worldbuilding`, `synthesis`, `chapter-summaries`
- **9 editorial annex types** (front/back matter, author-written not AI-generated): `dedication`, `epigraph`, `foreword`, `preface`, `acknowledgments`, `afterword`, `about-author`, `copyright`, `legal-notice` — a further `EDITORIAL_TYPE_KEYS` subset (`dedication`, `epigraph`, `legal-notice`) has dedicated placeholder text and display order helpers (`isEditorialType`, `getEditorialPlaceholder`, `getEditorialOrder`)

**Tests**: 5+ tests for validation rules

---

#### `AnalysisCategory` (Phase 7)
**Purpose**: Enum value object for chapter verification categories

**Responsibilities**:
- Type-safe category enumeration
- Validation of category values
- Supports: spelling, grammar, punctuation, style, repetition

**Tests**: 5+ tests for validation rules

---

#### `AnalysisSeverity` (Phase 7)
**Purpose**: Enum value object for issue severity levels

**Responsibilities**:
- Type-safe severity enumeration
- Validation of severity values
- Supports: error, warning, suggestion

**Tests**: 5+ tests for validation rules

---

#### `AnalysisIssue` (Phase 7)
**Purpose**: Value object for individual analysis issues

**Responsibilities**:
- Stores issue details (position, original text, suggestion, explanation, context)
- Tracks issue status (`pending`, `applied`, `ignored`) with guarded transitions (`apply()`/`ignore()` throw if the issue is already resolved)
- `withAdjustedPosition(delta)` shifts the issue's position after an earlier correction changes text length
- Immutable by design

**Properties**:
- `id`, `category`, `severity`, `originalText`, `suggestion`, `explanation`
- `position` (`{ start, end }`), `context`
- `status` - pending, applied, or ignored

**Tests**: 15+ tests for validation and status changes

---

#### `RepetitionCluster` (Phase 7)
**Purpose**: Value object for repeated word/phrase clusters

**Responsibilities**:
- Stores repeated word and all occurrences
- Tracks distance between occurrences
- Marks intentional repetitions (stylistic choice)

**Properties**:
- `word`, `occurrences` (array of positions), `isIntentional`

**Tests**: 10+ tests for validation rules

---

#### `StyleRigor` (Phase 7)
**Purpose**: Enum value object for analysis strictness levels

**Responsibilities**:
- Type-safe rigor level enumeration
- Validation of rigor values
- Supports: strict, balanced, light

**Tests**: 10+ tests for validation rules

---

#### `NarrativeAnalysis`, `Characters`, `Plot`, `StylisticDNA`, `Worldbuilding`, `ChapterSummaries`, `Synthesis` (Phase 3.6, 3.7)
**Purpose**: Structured value objects for each analysis type, returned by the corresponding `LLMProvider.generate*()` methods

**Responsibilities**:
- Type-safe analysis data structures (e.g. `Characters` carries `characterProfiles: CharacterProfile[]` with 9 fields per character — identity, appearance, psychology, voice/language, backstory, relationships, narrative function, open questions — plus a relational map, narrative hierarchy, and summary)
- Validation of analysis content
- Immutable by design

**Tests**: Covered in use case tests

---

#### `TaskPriority` (Phase 6)
**Purpose**: Enum value object for task priority levels

**Responsibilities**:
- Type-safe priority enumeration
- Validation of priority values
- Supports: low, medium, high, urgent

**Tests**: 5+ tests for validation rules

---

#### `TaskStatus` (Phase 6)
**Purpose**: Enum value object for task status

**Responsibilities**:
- Type-safe status enumeration
- Validation of status values
- Supports: todo, in_progress, done, blocked

**Tests**: 5+ tests for validation rules

---

#### `Contributor` (Phase 6)
**Purpose**: Value object for project contributors

**Responsibilities**:
- Stores contributor name and role
- Immutable by design
- Validation of required fields

**Tests**: 5+ tests for validation rules

---

#### `RelatedWork` (Phase 6)
**Purpose**: Value object for related works references

**Responsibilities**:
- Stores work title, author, and type
- Immutable by design
- Validation of required fields

**Tests**: 5+ tests for validation rules

---

#### `NarrationSettings` (Phase 6)
**Purpose**: Value object for narration settings

**Responsibilities**:
- Stores point of view, tense, and target audience
- Immutable by design

**Tests**: 5+ tests for validation rules

---

#### `AIOperationType` (Phase 6, 9.0)
**Purpose**: Enum value object for AI operation types, used for usage tracking and mapped to `LLMProvider` methods

**Responsibilities**:
- Type-safe operation type enumeration with French display labels (`AI_OPERATION_LABELS`)
- Supports: `rewrite`, `narrative_analysis`, `stylistic_dna`, `characters`, `plot`, `worldbuilding`, `synthesis`, `chapter_summaries`, `canon_facts`, `chapter_generation`, `completion`, `character_chat`, `character_sheet`, `suggest_alternatives`

**Tests**: 5+ tests for validation rules

---

#### `AutocompletePreferences` (Phase 10.0)
**Purpose**: Per-project autocomplete configuration with 6 settings and defaults

**Properties**:
- `enabled` (boolean, default: true)
- `suggestionLength` (`'short' | 'medium' | 'long'`, default: `'medium'`)
- `audace` (`'prudent' | 'balanced' | 'bold'`, default: `'balanced'`)
- `smartPrefetch` (boolean, default: true)
- `partialAcceptance` (boolean, default: true)
- `learnFromRejections` (boolean, default: false)

---

#### `AutocompleteIntent` (Phase 10.0)
**Purpose**: Implicit variant intent for a completion suggestion — natural by default, discreetly cycled through by the author

**Supports**: `natural`, `shorter`, `tenser`, `more_concrete`, `dialogue`

**Helper Functions**:
- `nextAutocompleteIntent(current)` - Next intent in the cycle (wraps around); backs the discrete "regenerate" shortcut
- `autocompleteIntentByNumber(n)` - The intent at 1-based position `n` (1 = natural … 5 = dialogue), or `null` out of range; backs numeric shortcuts to pick a variant directly

**Tests**: 10+ tests covering the cycle and numeric lookup

---

#### `AutocompleteOutcome` (Phase 10.0)
**Purpose**: Terminal outcome of a suggestion interaction, for telemetry aggregation

**Supports**: `accepted_full`, `accepted_partial`, `rejected_escape`, `superseded_typing`, `empty`, `prefetch_discarded` (a silently prefetched suggestion that was ready but invalidated before the author promoted it — an LLM call paid for and thrown away)

**Tests**: 5+ tests for validation rules

---

#### `CanonFacts` / `CanonFactSource` / `CanonExtractionPreferences` (Phase 10.0)
**Purpose**: The canon-fact extraction output shape and its provenance/preference value objects

**`CanonFactSource`**: Provenance enum — `derived` (LLM-extracted) | `author` (written/edited by the author). Enables refutability: author facts survive re-extraction, derived facts may be replaced by `CanonFactRepository.replaceDerived()`.

**`CanonFacts` / `ExtractedCanonFact`**: The LLM extraction output shape (`LLMProvider.generateCanonFacts()` returns `{ facts: ExtractedCanonFact[] }`). Each `ExtractedCanonFact` carries: `entity`, `statement`, `validFromChapter` (0-based), `evidence` (short backing quote), optional `category` (1-5, see `CanonFact`), and optional `invalidates` — the statement of a **prior belief this fact contradicts**; when present, the earlier fact with the same entity and that statement is closed with a `validToChapter` rather than deleted. `isValidExtractedCanonFact()` validates parsed LLM JSON before it's trusted.

**`CanonExtractionPreferences`**: Per-project trigger mode — `manual` (author explicitly triggers extraction) | `session-end` (extraction runs automatically at the end of a writing session). Embedded in `ProjectSettings` via `getCanonExtractionPreferences()`/`updateCanonExtractionPreferences()`, default `manual`.

**Tests**: Covered in `CanonFact` entity and canon-extraction use case tests

---

#### `AIOperationPolicy` (Phase 10.0)
**Purpose**: The fixed generation policy for the `autocomplete` operation specifically — not a general per-operation-type policy table

**Responsibilities**:
- A single constant (`AUTOCOMPLETE_POLICY`): reasoning off, a strict output token budget (256), a low temperature (0.3) favoring continuity over invention, and `latencyClass: 'realtime'`
- Consumed by `LLMProvider` implementations so completion parameters stay consistent across OpenAI/Anthropic/Google
- Other AI operations do not currently have an equivalent policy value object — each `LLMProvider.generate*()` method carries its own parameters internally

**Tests**: Covered by autocomplete provider tests

---

#### `ChatMessage` (Phase 9.0)
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

#### `ModelPricing` (Phase 9.0)
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

#### `WordAlternative`
**Purpose**: A single contextual-thesaurus synonym proposal — layer 2 of the thesaurus feature (AI-powered, scene-aware), returned by `Thesaurus.getSynonyms()` and `LLMProvider.suggestAlternatives()`

**Responsibilities**:
- Carries `word`, a `sceneEffect` justification (why this alternative fits the specific sentence/scene, not just a generic synonym), and an optional `register` (e.g. soutenu, familier)
- Validates both `word` and `sceneEffect` are non-empty

**Tests**: Covered by thesaurus use case tests

---

#### `SnapshotType`
**Purpose**: Enum value object for the provenance of a project snapshot

**Supports**: `manual` (author-triggered), `automatic` (scheduler-triggered), `restore` (created by restoring an earlier snapshot), `safety` (captured before a destructive action)

**Tests**: See `SnapshotType.test.ts`

---

#### `AutomaticSnapshotInterval`
**Purpose**: The closed set of allowed automatic-snapshot frequencies, shared by `ProjectSettings` and the scheduler contract

**Supports**: `5 | 15 | 30 | 60` (minutes)

**Tests**: Covered by `ProjectSettings`/automatic-snapshot use case tests

---

#### `PaginatedResult<T>` (Phase 4.1+)
**Purpose**: Generic pagination result for collections

**Properties**:
- `items: T[]` - Items for current page
- `totalCount: number` - Total item count across all pages
- `page: number` - Current page number (1-indexed)
- `pageSize: number` - Items per page
- `totalPages: number` - Total page count
- `hasNextPage: boolean`, `hasPreviousPage: boolean`

**Helper**: `createPaginatedResult(items, totalCount, page, pageSize)` - Derives `totalPages`/`hasNextPage`/`hasPreviousPage`

**Usage**: Blog article pagination and other list endpoints

**Note**: This file physically lives in `src/domain/interfaces/PaginatedResult.ts` (not `value-objects/`) but is documented here since it's a plain data shape, not a port/contract.

---

### Interfaces

#### `LLMProvider` (Phase 3.6, 9.0)
**Contract**: AI text generation and analysis service — the central abstraction all three provider implementations satisfy

**Methods**:
- `generateRewrites(text, context?, authorProfile?)` → `RewriteProposal[]` (exactly 3)
- `testConnection()` → `ConnectionTestResult`; `getProviderName()`, `getModel()`
- `generateNarrativeAnalysis(fullText)` → `NarrativeAnalysis`
- `generateStylisticDNA(fullText)` → `StylisticDNA`
- `generateCharacters(fullText)` → `Characters`
- `generateCanonFacts(fullText, characterNames)` → `CanonFacts` — extracts atomic facts for the known cast only, each carrying the 0-based chapter index where it becomes true
- `generatePlot(fullText)` → `Plot`
- `generateWorldbuilding(fullText)` → `Worldbuilding`
- `generateSynthesis(fullText, previousAnalyses)` → `Synthesis` — meta-analysis aggregating the other fiches
- `generateChapterSummaries(fullText)` → `ChapterSummaries`
- `generateChapter(fullText, generationType, projectContext?)` → `ChapterGeneration`
- `generateCompletion(textBeforeCursor, textAfterCursor?, projectContext?)` → `string` — 1-3 sentence completion
- `generateCompletionStream(textBeforeCursor, textAfterCursor?, projectContext?)` → `AsyncIterableIterator<string>`
- `chatStream(messages, systemPrompt)` → `AsyncIterableIterator<string>` (Phase 9.0)
- `generateCharacterSheet(characterName, existingFields, projectContext)` → all 8 `CharacterProfile` fields except `name` (Phase 9.0)
- `suggestAlternatives(word, sentence, authorProfile?)` → `WordAlternative[]` (3-5 proposals) — layer 2 of the contextual thesaurus
- `getLastTokenUsage?()` → `TokenUsage | null` — optional; exposes input/output/cached counts after any call (Phase 9.0)
- `getLastExchange?()` → `ExchangeContent | null` — optional; exposes `{ systemPrompt, input, output }` of the most recent call, consumed by the AI transparency ledger (`AIExchange`)

**Implementations**: `OpenAIProvider`, `AnthropicProvider`, `GoogleProvider`

---

#### `DocumentParser`
**Contract**: Document import service

**Methods**:
- `parse(buffer, filename)` → `Promise<TextDocument>` (Phase 1)
- `parseToChapters(buffer, filename)` → `Promise<Chapter[]>` (Phase 2)
  - Splits document by H1 headings
  - Preserves formatting as TipTap JSON
  - Falls back to single chapter if no H1 found

**Implementations**: `DocxParser`

---

#### `DocumentExporter`
**Contract**: Document export service

**Methods**:
- `export(document, filename)` → `Promise<Buffer>` (Phase 1)
- `exportProject(project, filename)` → `Promise<Buffer>` (Phase 2)
  - Exports all chapters with page breaks
  - Preserves formatting from TipTap JSON
  - Adds chapter titles as H1 headings

**Implementations**: `DocxExporter`

---

#### `ProjectRepository` (Phase 3)
**Contract**: Project persistence abstraction with multi-tenant support

**Methods**:
- `createProject(userId, project)` → `Promise<Project>`
- `loadProject(userId, projectId)` → `Promise<Project | null>`
- `listProjects(userId)` → `Promise<Project[]>`
- `updateProject(userId, project)` → `Promise<Project>`
- `deleteProject(userId, projectId)` → `Promise<void>`
- `updateChapter(userId, projectId, chapter)` → `Promise<void>` (Phase 3 optimization)
- `findPublishedByToken(projectId, token)` → `Promise<Project | null>` (Phase 5.0)

**Implementation**: `MongoDBProjectRepository` (MongoDB Atlas)

**Multi-Tenant Isolation**: All methods require `userId` to ensure data isolation between users
**Public Access**: `findPublishedByToken` allows unauthenticated access to published projects

---

#### `UserRepository` (Phase 3)
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

#### `CorrectionHistoryRepository` (Phase 3.7)
**Contract**: Correction history persistence abstraction with multi-tenant support

**Methods**:
- `save(userId, history)` → `Promise<CorrectionHistory>`
- `listByChapter(userId, projectId, chapterId)` → `Promise<CorrectionHistory[]>`
- `listByProject(userId, projectId)` → `Promise<CorrectionHistory[]>`
- `delete(userId, historyId)` → `Promise<void>`

**Implementation**: `MongoDBCorrectionHistoryRepository`

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

#### `EmailService` (Phase 3.8)
**Contract**: Email notification service abstraction

**Methods**:
- `sendApprovalRequest(user, approveUrl, rejectUrl)` → `Promise<void>`
- `sendApprovalConfirmation(user)` → `Promise<void>`
- `sendRejectionNotification(user)` → `Promise<void>`

**Implementation**: `ResendEmailService` (Resend API)

---

#### `BlogArticleRepository` (Phase 4.0)
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

#### `ArticleViewRepository`
**Contract**: Blog article view persistence, deduplicated by visitor fingerprint

**Methods**:
- `hasRecentView(articleId, visitorHash)` → `Promise<boolean>` - Dedup check within the TTL window
- `create(view)` → `Promise<void>`
- `deleteOlderThan(olderThan)` → `Promise<number>` - TTL cleanup (views older than 24h)

**Implementation**: `MongoDBArticleViewRepository`

---

#### `ContactMessageRepository` (Phase 3.11)
**Contract**: Contact message persistence abstraction

**Methods**:
- `create(message)` → `Promise<ContactMessage>`
- `findById(id)` → `Promise<ContactMessage | null>`
- `listAll()` → `Promise<ContactMessage[]>`
- `delete(id)` → `Promise<void>`

**Implementation**: `MongoDBContactMessageRepository`

---

#### `ContentConverter` (Phase 4.1)
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

**Purpose**: Allows entities like `Provider` to accept an ID as a parameter, keeping the `crypto` dependency in the Infrastructure layer

---

#### `LLMProviderFactory` (Phase 3.5)
**Contract**: Factory for creating LLM provider instances

**Methods**:
- `create(provider: Provider)` → `LLMProvider` - Creates LLM provider from Provider entity

**Implementation**: `LLMProviderFactoryImpl`

**Purpose**: Centralizes LLM provider instantiation for testing provider connections

---

#### `FolderParser` (Phase 5.1)
**Contract**: Folder parsing for multi-file imports

**Methods**:
- `parseFolder(files)` → `Promise<Chapter[]>` - Parse folder of files to chapters

**Implementation**: `MarkdownFolderParser`

**Purpose**: Enables importing folders of Markdown files as chapters

---

#### `CharacterRepository` (Phase 6)
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

#### `ProjectSettingsRepository` (Phase 6)
**Contract**: Project settings persistence abstraction

**Methods**:
- `create(userId, settings)` → `Promise<ProjectSettings>`
- `findByProjectId(userId, projectId)` → `Promise<ProjectSettings | null>`
- `update(userId, settings)` → `Promise<ProjectSettings>`
- `delete(userId, settingsId)` → `Promise<void>`
- `deleteAllByOwner(userId)` → `Promise<void>`

**Implementation**: `MongoDBProjectSettingsRepository`

---

#### `ProjectTaskRepository` (Phase 6)
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

#### `ResearchDocumentRepository` (Phase 6)
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

#### `WritingGoalRepository` (Phase 6)
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

#### `CharacterConversationRepository` (Phase 9.0)
**Contract**: Character conversation persistence abstraction with multi-tenant support

**Methods**:
- `create(ownerId, conversation)` → `Promise<CharacterConversation>`
- `findById(ownerId, conversationId)` → `Promise<CharacterConversation | null>`
- `findByCharacterId(ownerId, characterId)` → `Promise<CharacterConversation[]>`
- `save(ownerId, conversation)` → `Promise<CharacterConversation>` (upsert)
- `delete(ownerId, conversationId)` → `Promise<void>`

**Implementation**: `MongoDBCharacterConversationRepository`

---

#### `AIUsageRepository` (Phase 6)
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

#### `AutocompleteEventRepository` (Phase 10.0)
**Contract**: Autocomplete telemetry event persistence and aggregation

**Methods**:
- `save(event)` → `Promise<void>`
- `findByProject(projectId, filters?)` → `Promise<AutocompleteEvent[]>`
- `getAggregatedStats(projectId, dateRange?)` → `Promise<AutocompleteStats>`

**Implementation**: `MongoDBAutocompleteEventRepository`

---

#### `CanonFactRepository` (Phase 10.0)
**Contract**: Canon fact persistence — the canon ledger — with temporal selection and derived/author reconciliation

**Methods**:
- `save(fact)` → `Promise<CanonFact>`
- `update(ownerId, fact)` → `Promise<void>`
- `delete(ownerId, factId)` → `Promise<void>`
- `listByProject(ownerId, projectId)` → `Promise<CanonFact[]>`
- `findForSelection(ownerId, projectId, entities, chapterIndex)` → `Promise<CanonFact[]>` — facts about the given entities valid at `chapterIndex` (`validFromChapter <= chapterIndex AND (validToChapter is null OR validToChapter >= chapterIndex)`)
- `replaceDerived(ownerId, projectId, facts, reprocessedChapterIds?)` → `Promise<void>` — atomically replaces `derived` facts; when `reprocessedChapterIds` is given, only facts sourced from those chapters are replaced, preserving facts from chapters not reprocessed
- `deleteAllByOwner(ownerId)` → `Promise<void>`

**Implementation**: `MongoDBCanonFactRepository`

---

#### `CanonExtractionStateRepository` (Phase 10.0)
**Contract**: Tracks per-project incremental extraction state (per-chapter content hashes), so re-extraction only reprocesses chapters that changed

**Methods**:
- `getChapterHashes(ownerId, projectId)` → `Promise<Map<string, string>>`
- `saveChapterHashes(ownerId, projectId, hashes)` → `Promise<void>`

**Implementation**: `MongoDBCanonFactRepository` (same collection, separate interface)

---

#### `RateLimitRepository` (Phase 10.0)
**Contract**: Shared, cross-instance rate limiting backed by a persistent store — needed because in-memory limiters are useless on serverless (each instance counts alone and resets on cold start)

**Methods**:
- `consumeFixedWindow(key, windowMs, maxPerWindow)` → `Promise<RateLimitResult>` — accounts for one hit against `key`, bucketed into fixed windows; returns `{ allowed, retryAfterSeconds? }`

**Implementation**: `MongoDBRateLimitRepository`

---

#### `RateLimiter`
**Contract**: General-purpose rate limiting abstraction, distinct from `RateLimitRepository` — a lookup-and-record interface (`checkLimit`/`recordAttempt`/`resetLimit`) keyed by identifier + action, rather than the fixed-window primitive above

**Methods**:
- `checkLimit(identifier, action)` → `Promise<RateLimitResult>` — `{ allowed, remainingAttempts, resetInSeconds }`
- `recordAttempt(identifier, action)` → `Promise<void>`
- `resetLimit(identifier, action)` → `Promise<void>`

**Purpose**: Used for auth/registration-style flows (e.g. login attempts) where "remaining attempts" and manual reset are meaningful, as opposed to the raw fixed-window primitive `RateLimitRepository` provides for generic abuse-vector throttling

---

#### `ModelPricingRepository`
**Contract**: Model pricing persistence and retrieval

**Methods**:
- `upsertMany(entries)` → `Promise<void>`
- `findByProvider(provider)` → `Promise<ModelPricingEntry[]>`
- `findAll()` → `Promise<ModelPricingEntry[]>`
- `update(id, data)` → `Promise<ModelPricingEntry | null>`
- `delete(id)` → `Promise<void>`

**Implementation**: `MongoDBModelPricingRepository`

---

#### `AIExchangeRepository`
**Contract**: AI exchange transparency ledger persistence — list queries return metadata-only summaries; content is decrypted only on detail fetch

**Methods**:
- `save(exchange)` → `Promise<AIExchange>`
- `findByOwner(userId, filters?)` → `Promise<AIExchangeSummary[]>` — metadata-only, no decryption
- `findById(userId, id)` → `Promise<AIExchange | null>` — full, decrypted exchange
- `distinctModels(userId)` → `Promise<string[]>` — for filter facets
- `deleteAllByOwner(userId)` → `Promise<void>`
- `ensureIndexes()` → `Promise<void>` (also enforces the TTL index for `expiresAt`)

**Implementation**: `MongoDBExchangeRepository`

---

#### `WordCountSnapshotRepository`
**Contract**: Daily word-count checkpoint persistence

**Methods**:
- `upsertForDay(userId, snapshot)` → `Promise<WordCountSnapshot>` - Idempotent per `(owner, project, localDate)`
- `findByProjectId(userId, projectId, range?)` → `Promise<WordCountSnapshot[]>` - Ordered ascending, optional `fromDate`/`toDate` bounds
- `findLatestBefore(userId, projectId, localDate)` → `Promise<WordCountSnapshot | null>`
- `deleteAllByOwner(userId)` → `Promise<void>`

**Implementation**: `MongoDBWordCountSnapshotRepository`

---

#### `WritingQuotaRepository`
**Contract**: Recurring writing quota persistence scoped by `ownerId`

**Methods**:
- `create(userId, quota)` → `Promise<WritingQuota>`
- `findById(userId, quotaId)` → `Promise<WritingQuota | null>`
- `findByProjectId(userId, projectId)` → `Promise<WritingQuota[]>`
- `update(userId, quota)` → `Promise<WritingQuota>`
- `delete(userId, quotaId)` → `Promise<void>`
- `deleteAllByOwner(userId)` → `Promise<void>`

**Implementation**: `MongoDBWritingQuotaRepository`

---

#### `PricingClient`
**Contract**: Fetches model pricing entries from an external source

**Methods**:
- `fetchPricingEntries()` → `Promise<Omit<ModelPricingEntry, 'id'>[]>`

**Purpose**: Abstracts `OpenRouterPricingClient` so use cases in the Application layer never import infrastructure directly

**Implementation**: `OpenRouterPricingClient`

---

#### `Thesaurus`
**Contract**: Word alternative lookup

**Methods**:
- `getSynonyms(word)` → `Promise<WordAlternative[]>`

**Implementation**: `ConjugationAwareThesaurus` (wraps `JeuxDeMotsThesaurus` + `FrenchMorphology`)

---

#### `Morphology`
**Contract**: Lemmatisation / conjugation

**Methods**:
- `lemmatise(word)` → `Promise<string>`
- `conjugate(lemma, form)` → `Promise<string>`

**Implementation**: `FrenchMorphology`

---

#### `SpellChecker`
**Contract**: Offline dictionary-based spell checking

**Methods**:
- `correct(word)` → `boolean` - Whether the word is recognized as correctly spelled
- `suggest(word)` → `string[]` - Candidate corrections

**Purpose**: Replaced an AI-based spelling-analysis approach (June 2026) — spelling is now checked against an offline dictionary rather than sent to an LLM, for speed and cost. The author's custom dictionary and ignored-words list live on `ProjectSettings` (`getCustomDictionary()`/`getIgnoredWords()` and friends), layered on top of the dictionary this interface checks against.

**Implementation**: An offline French dictionary-backed implementation (see Infrastructure layer)

---

#### `BlobStorage` (Phase 6)
**Contract**: Blob storage abstraction for images

**Methods**:
- `upload(file, path)` → `Promise<{ url: string }>`
- `delete(url)` → `Promise<void>`

**Implementation**: `VercelBlobStorage`

---

#### `ProviderRepository`
**Contract**: Persistence for user-configured `Provider` (AI credential) entities, with multi-tenant isolation

**Methods**:
- `create(userId, provider)` → `Promise<Provider>` - Throws on `ownerId` mismatch
- `findById(userId, providerId)` → `Promise<Provider | null>`
- `listProviders(userId)` → `Promise<Provider[]>` - Sorted by `createdAt` descending
- `update(userId, provider)` → `Promise<Provider>`
- `delete(userId, providerId)` → `Promise<void>`
- `isUsedByProjects(userId, providerId)` → `Promise<boolean>` - Guards deletion of a provider still referenced by a project
- `deleteAllByOwner(userId)` → `Promise<number>` - RGPD account deletion

**Implementation**: `MongoDBProviderRepository`

**Security**: The interface's doc comments flag this as CRITICAL for multi-tenant isolation — every method must filter on `userId`/`ownerId`

---

#### `SnapshotRepository`
**Contract**: Persistence for `Snapshot` entities — sequential numbering, paginated history, presentation-metadata updates, tombstoning, and a compact activity log

**Methods**:
- `getNextSequenceNumber(ownerId, projectId)` → `Promise<number>` - Atomically allocates the next sequence number (starts at 1); numbers are never reused
- `save(ownerId, snapshot)` → `Promise<void>` - Snapshots are immutable once saved
- `findByProjectId(ownerId, projectId)` → `Promise<Snapshot[]>` - Newest first
- `findPageByProjectId?(ownerId, projectId, query: SnapshotPageQuery)` → `Promise<SnapshotPage>` - One chronological page for the history UI (filterable by `type`, `authorId`, date range, `beforeNumber` cursor); optional, for older test doubles
- `findLatestByProjectId(ownerId, projectId)` → `Promise<Snapshot | null>`
- `findById(ownerId, snapshotId)` → `Promise<Snapshot | null>`
- `updateMetadata?(ownerId, snapshot)` → `Promise<void>` - Presentation-only fields; captured content stays immutable
- `tombstone?(ownerId, snapshot)` → `Promise<void>` - Replaces restorable data with an immutable audit tombstone
- `recordActivity?(activity: SnapshotActivity)` → `Promise<void>` - Appends a compact audit event: `created | restored | renamed | commented | automation-configured | deleted | automatic-snapshots-pruned` — **activity entries never contain captured manuscript content**, only metadata, deliberately excluding the manuscript from the audit trail
- `deleteByIds?(ownerId, snapshotIds)` → `Promise<number>` - Deletes automatic snapshots selected by the retention policy
- `deleteByProjectId(ownerId, projectId)` → `Promise<void>`
- `deleteAllByOwner(ownerId)` → `Promise<number>` - RGPD account deletion

**Implementation**: `MongoDBSnapshotRepository`

---

#### `AutomaticSnapshotRepository`
**Contract**: Server-side scheduling clock for automatic snapshots — coordinates open editor sessions, saved changes, and one global due-time per project, using a distributed-lock-style claim pattern so only one process captures a given due snapshot

**Methods**:
- `configure(ownerId, projectId, intervalMinutes)` → `Promise<void>` - Sets or clears (`null`) the automatic-snapshot interval
- `recordSavedChange(ownerId, projectId, now)` → `Promise<void>` - Marks that unsaved work exists, feeding the next due-time calculation
- `heartbeat(ownerId, projectId, sessionId, now)` → `Promise<void>` - Keeps an open editor session alive for `hasOpenSession` checks
- `claimDueSnapshot(ownerId, projectId, now)` → `Promise<AutomaticSnapshotSchedule | null>` - Atomically claims a due snapshot for capture, or `null` if none is due / already claimed
- `hasOpenSession(ownerId, projectId, now)` → `Promise<boolean>` - Whether any editor session is currently open (via recent heartbeats)
- `completeSnapshot(ownerId, projectId, claimedChangeRevision, now)` → `Promise<void>` - Marks a claimed capture as successfully completed
- `releaseFailedSnapshot(ownerId, projectId, now)` → `Promise<void>` - Releases the claim after a failed capture so it can be retried
- `recordPruningActivity(ownerId, projectId, prunedCount, now)` → `Promise<void>` - Logs how many automatic snapshots the retention policy pruned

**Implementation**: `MongoDBAutomaticSnapshotRepository`

---

#### `BookPreviewCacheRepository`
**Contract**: Whole-book PDF preview cache — metrics (page offsets) plus the rendered PDF blob — keyed by `{ projectId, profileId, ownerId }`

**Methods**:
- `save(entry, pdf)` → `Promise<void>` - Upserts the metrics document and replaces the cached PDF blob
- `loadMetrics(projectId, profileId, ownerId)` → `Promise<BookPreviewCacheEntry | null>`
- `loadPdf(projectId, profileId, ownerId)` → `Promise<Buffer | null>`

**Implementation**: A MongoDB (metrics document) + GridFS (PDF blob) implementation

---

#### `PresentationOverrideRepository`
**Contract**: Persistence for per-chapter presentation overrides, scoped to the `passerelle` profile

**Methods**:
- `save(chapterId, ownerId, overrides)` → `Promise<void>`
- `load(chapterId, ownerId)` → `Promise<PresentationOverrideLayer | null>`
- `delete(chapterId, ownerId)` → `Promise<void>`

**Implementation**: `MongoDBPresentationOverrideRepository`

---

#### `CustomAnnexRepository`
**Contract**: Persistence for author-inserted `CustomAnnex` front/back-matter annexes

**Methods**:
- `findByProjectId(ownerId, projectId)` → `Promise<CustomAnnex[]>` - Sorted by placement then order
- `findById(ownerId, id)` → `Promise<CustomAnnex | null>`
- `countByProjectAndPlacement(ownerId, projectId, placement)` → `Promise<number>` - Used to append a new annex at the end of its zone
- `create(ownerId, annex)` → `Promise<CustomAnnex>`
- `update(ownerId, annex)` → `Promise<CustomAnnex>`
- `delete(ownerId, id)` → `Promise<void>`
- `deleteByProjectId(ownerId, projectId)` → `Promise<void>` - Cascade delete on project deletion
- `deleteAllByOwner(ownerId)` → `Promise<number>` - RGPD account deletion

**Implementation**: `MongoDBCustomAnnexRepository`

---

#### `PasswordResetTokenRepository`
**Contract**: Persistence for the password-reset flow's single-use tokens

**Methods**:
- `create(data: CreatePasswordResetToken)` → `Promise<PasswordResetToken>` - Should invalidate any existing tokens for the same user
- `findValidToken(token)` → `Promise<PasswordResetToken | null>` - `null` if the token doesn't exist, is expired, or was already used
- `markAsUsed(tokenId)` → `Promise<boolean>` - Returns whether a token was found and marked
- `invalidateAllForUser(userId)` → `Promise<void>` - Used when a new token is issued or the password changes
- `deleteExpired()` → `Promise<number>` - Cleanup

**Implementation**: `MongoDBPasswordResetTokenRepository`

---

#### `ApprovalTokenGenerator`
**Contract**: Generates tamper-proof, deterministic tokens for the account-approval email links

**Methods**:
- `generateToken(userId)` → `string` - Deterministic: same input produces the same output
- `verifyToken(userId, token)` → `boolean`

**Implementation**: An HMAC-based generator (see Infrastructure layer)

---

#### `CaptchaVerifier`
**Contract**: CAPTCHA verification, abstracted so the provider (hCaptcha, reCAPTCHA, etc.) can be swapped

**Methods**:
- `verify(token, remoteIp?)` → `Promise<CaptchaVerificationResult>` - `{ success, errorCodes? }`

**Implementation**: An hCaptcha-backed implementation (see Infrastructure layer)

---

## Testing

**Coverage**: See [README.md](../../README.md) for current statistics.

All domain logic has near-perfect test coverage with isolated unit tests:
- CorrectionHistory: 15+ tests (entity creation, validation) (Phase 3.7)
- ProjectMetadata: 10+ tests (CRUD, caching logic, hash validation) (Phase 3.6)
- MetadataType: 3+ tests (validation)
- User: 5+ tests (validation, creation) (Phase 3)
- Chapter: 15 tests (content management, metadata, validation)
- Project: 25+ tests (collection management, business rules, owner tracking)
- Character: 20+ tests (entity creation, updates, validation) (Phase 6)
- ProjectSettings: 20+ tests (entity creation, updates, autocomplete/canon/pagination preferences) (Phase 6, 10.0) — see also `ProjectSettings.autocomplete.test.ts`
- ProjectTask: 25+ tests (entity creation, status transitions, validation) (Phase 6)
- ResearchDocument: 15+ tests (entity creation, updates) (Phase 6)
- WritingGoal: 15+ tests (entity creation, progress calculation) (Phase 6)
- AIUsageRecord: 15+ tests (entity creation, cost calculation) (Phase 6)
- TaskPriority, TaskStatus: 10+ tests (validation) (Phase 6)
- Contributor, RelatedWork, NarrationSettings: 15+ tests (validation) (Phase 6)
- AIOperationType: 5+ tests (validation) (Phase 6)
- CharacterConversation: 10+ tests (creation, message appending, validation) (Phase 9.0)
- ChatMessage: 10+ tests (creation, role constraints) (Phase 9.0)
- ModelPricing: 20+ tests (cost computation, cached-token discounting) (Phase 9.0)
- AutocompleteEvent: 20+ tests (state transitions, validation) (Phase 10.0)
- CanonFact: 20+ tests (creation, temporal validity, category defaulting, source tracking) (Phase 10.0)
- AutocompletePreferences: covered by ProjectSettings tests (Phase 10.0)
- AutocompleteIntent, AutocompleteOutcome: 15+ tests (validation, cycle/numeric lookup) (Phase 10.0)
- CanonFacts, CanonFactSource, AIOperationPolicy: 10+ tests (Phase 10.0)
- ChapterAnalysis: 30+ tests (entity, filtering, statistics) (Phase 7)
- AnalysisCategory, AnalysisSeverity: 10+ tests (validation) (Phase 7)
- AnalysisIssue: 15+ tests (status changes) (Phase 7)
- RepetitionCluster: 10+ tests (Phase 7)
- StyleRigor: 10+ tests (validation) (Phase 7)
- Provider: covered by `Provider.test.ts` (credential validation, mutation/re-validation state)
- Snapshot: covered by `Snapshot.test.ts` (chapter capture, restore-type invariants, tombstone model)
- SnapshotType: covered by `SnapshotType.test.ts`
- AutomaticSnapshotRetention (domain service): covered by retention policy tests (20-latest/daily/weekly, timezone handling)
- PublicationProfile: covered by `PublicationProfile.test.ts`
- LevelStyleSet: covered by `LevelStyleSet.test.ts` (clamping, closed-value validation, profile defaults)
- BlogArticle: covered by `BlogArticle.test.ts`; ArticleView: covered by view-counting integration tests
- AIExchange, WordCountSnapshot, WritingQuota, BookPreviewCacheEntry, CustomAnnex, PasswordResetToken: covered by their respective use case tests
- TextDocument: 15 tests (legacy entity)
- TextSelection: 9 tests (boundary cases)
- RewriteProposal: 6 tests (validation)

## Design Patterns

**Entities**:
- Immutability: Most updates return new instances (`Provider` is a deliberate exception — it mutates in place, since its API key is treated as sensitive live-updatable configuration rather than a versioned fact)
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

**Domain Services**:
- Used sparingly — only when a business rule doesn't naturally belong to a single entity (`AutomaticSnapshotRetention` is the sole example: it reasons over a whole collection of snapshots)
- Stateless pure functions/classes, same purity constraints as the rest of the Domain layer

---

## Changelog

For phase-by-phase implementation history, see [CHANGELOG.md](../../CHANGELOG.md).
