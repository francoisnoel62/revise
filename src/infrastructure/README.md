# Infrastructure Layer

Implements domain interfaces with concrete external services.

**Status**: ✅ Phase 10.0 Complete (see [README.md](../../README.md) for test statistics)

## Rules:
- Implements interfaces defined in Domain layer
- Contains all framework-specific and external service code
- AI provider SDKs, document parsers/exporters, file operations, persistence

## Contents:

### AI Provider (✅ Phase 7 Enhanced)

#### `OpenAIProvider` ⭐ ENHANCED (Phase 4.1, 9.0)
**Implements**: `LLMProvider` interface
**Technology**: OpenAI SDK with GPT-4o-mini/GPT-5-nano + o-series reasoning models

**Phase 9.0 Enhancements**:
- ✅ **`chatStream(messages, systemPrompt)`** - Streams character persona replies via `stream_options.include_usage`
- ✅ **`generateCharacterSheet(input)`** - AI-assisted 8-field character sheet generation
- ✅ **`getLastTokenUsage()`** - Captures input/output/cached tokens including from streaming operations

**Phase 8.0 Enhancements**:
- ✅ **Consumes context strings** - chapter/completion/rewrite receive ready-to-inject `projectContext` /
  `authorProfile` blocks; per-provider field-selection projection removed — projection now lives in `AIContextBuilder`
- ✅ **Worldbuilding in completion** - injects `worldRules` / `atmosphere` when available

**Phase 4.1 Enhancements**:
- ✅ **Chapter generation** - Generate chapter beginnings from metadata context
- ✅ **Autocompletion** - Streaming completion suggestions
- ✅ **generateChapterSummaries()** - Chapter-by-chapter summaries + narrative arc

**Phase 3.7 Enhancements**:
- ✅ **3 proposals** instead of 5 (épuré, lyrique, amplifié) - 40% token reduction
- ✅ **GPT-5 nano support** - gpt-5-nano-2025-08-07 with 400K context
- ✅ **o-series reasoning models** - Proper API parameters (max_completion_tokens, no temperature)

**Phase 3.6 Enhancements**:
- ✅ `generateNarrativeAnalysis()` - POV, structure, temporality, voice analysis
- ✅ `generateCharacters()` - Character profiles and relationships
- ✅ `generatePlot()` - Plot structure and conflicts
- ✅ `generateStylisticDNA()` - Register and syntax patterns
- ✅ `generateWorldbuilding()` - Themes and symbolism
- ✅ `generateSynthesis()` - Meta-analysis with editorial feedback

**Tests**: 35+ tests (unit + integration) covering all methods including chatStream and token tracking

---

#### `AnthropicProvider` ⭐ ENHANCED (Phase 3.6, 9.0)
**Implements**: `LLMProvider` interface
**Technology**: Anthropic SDK with Claude

**Phase 9.0 Enhancements**:
- ✅ **`chatStream`** - Captures token usage from `message_start` / `message_delta` SSE events
- ✅ **`generateCharacterSheet`** - AI-assisted character sheet generation
- ✅ **`getLastTokenUsage()`** - Exposes input/output/cached counts after any call

**Capabilities**:
- ✅ All 7 metadata analysis types (same as OpenAI)
- ✅ JSON-structured responses
- ✅ Error handling and retry logic
- ✅ **Consumes context strings** for generation/completion/rewrite (Phase 8.0)

**Tests**: 30+ tests (unit + integration) for all analysis types and streaming

---

#### `GoogleProvider` ⭐ ENHANCED (Phase 8.0, 9.0)
**Implements**: `LLMProvider` interface
**Technology**: Google Generative AI SDK with Gemini

**Phase 9.0 Enhancements**:
- ✅ **`chatStream`** - Captures token usage from `usageMetadata` chunks
- ✅ **`generateCharacterSheet`** - AI-assisted character sheet generation
- ✅ **`getLastTokenUsage()`** - Exposes input/output/cached counts

**Phase 8.0**:
- ✅ Rewrites inject the author profile (`authorProfile` context string)

**Tests**: 20+ tests covering streaming and token tracking

---

#### Rewrite Proposal Generation (`generateRewrites`)
**Purpose**: The core "AI suggests, author decides" feature — each of the three `LLMProvider`
implementations above (`OpenAIProvider`, `AnthropicProvider`, `GoogleProvider`) implements
`generateRewrites(text, context)` from the `LLMProvider` interface, so any configured provider
can serve rewrite proposals.

**Features** (shared shape across providers):
- Carefully crafted system prompt for text rewriting
- Context-aware generation (uses surrounding text)
- Generates exactly 3 distinct stylistic variants tagged `styleLabel`: **épuré**, **lyrique**, **amplifié**
- JSON-structured responses (`{ content, styleLabel }[]`)
- Error handling for API failures
- Works with both plain text and formatted text
- Strict meaning preservation; no clichés, no filler, no generic "improvements"; maintains the
  author's voice (see [.claude/philosophie.md](../../.claude/philosophie.md))

**`OpenAIProvider` configuration** (reference implementation):
- Model: `gpt-4o-mini` by default (configurable per `Provider` entity)
- Temperature: 0.7 (balance creativity and consistency)
- Response format: JSON object with a `proposals` array

**Tests**: Unit tests with mocked clients per provider, plus integration tests with real API
calls (performance target < 3s, typically 2.7-3.3s) and proposal-diversity verification.

---

#### `LLMProviderFactoryImpl` (Phase 3.5)
**Implements**: `LLMProviderFactory` interface
**Purpose**: Factory for creating LLM provider instances

**Features**:
- Creates LLM providers from `Provider` entities
- Supports exactly three provider types: **OpenAI**, **Anthropic**, **Google** — the `switch`
  throws `Unsupported provider type` for anything else (e.g. Mistral, Cohere are not implemented)
- Decrypts API keys before instantiation
- Used by `TestProviderConnectionUseCase` and `ValidateProviderUseCase`

**Methods**:
- `create(provider: Provider)` → `LLMProvider` - Creates provider instance

**Tests**: 5+ tests covering factory creation for all supported provider types

**Note**: `src/infrastructure/config/providers.ts` has its own `createLLMProvider(provider)`
free function with the same `openai`/`anthropic`/`google` switch, used by the app's request path
instead of this factory class. The two implementations are kept in sync by hand — see
[Configuration → `providers.ts`](#providersts-⭐-new-phase-3) below.

---

#### `AnalysisLLMClient` ⭐ NEW (Phase 7)
**Purpose**: AI client for chapter verification analysis (grammar, punctuation, style, repetition)

`AnalysisLLMClient` is an **interface** (`GrammarLLMClient & PunctuationLLMClient & StyleLLMClient
& RepetitionLLMClient`, composed from the analysis strategies in `src/application/strategies/`),
with one concrete implementation per provider:

- **`OpenAIAnalysisLLMClient`** - uses the OpenAI SDK, default model `gpt-4o`, JSON response format
- **`AnthropicAnalysisLLMClient`** - uses the Anthropic SDK, default model `claude-sonnet-4-5-20250929`
- **`GoogleAnalysisLLMClient`** - uses the `@google/genai` SDK, default model `gemini-3-flash-preview`
- **`createAnalysisLLMClient(provider, apiKey, model?)`** - factory function selecting the right
  implementation for `'openai' | 'anthropic' | 'google'`

**Methods** (implemented identically in spirit by all three clients):
- `analyzeGrammar(content, { language })` → `GrammarAnalysisResponse`
- `analyzePunctuation(content, { language })` → `PunctuationAnalysisResponse`
- `analyzeStyle(content, { language, rigor, activeRules })` → `StyleAnalysisResponse`
- `analyzeRepetitions(content, { language, exclusions })` → `RepetitionAnalysisResponse`

**Note — spelling is not part of this client.** Spelling analysis used to go through an
`analyzeSpelling()` method on this client (AI-based, token-costed); that method was removed
(2026-06-23/25) and replaced by the offline nspell dictionary check — see
[Spell Checking](#spell-checking-offline-no-ai-tokens) below. `AnalysisLLMClient` today only
covers grammar, punctuation, style and repetition.

Each implementation shares the same JSON-extraction strategy (strips markdown code fences,
falls back to locating the outermost `{...}` object) and calls its SDK with `temperature: 0.3`
and an `8192`-token cap for consistent, complete structured output.

**Tests**: 30+ tests covering all analysis types across the three client implementations

---

### Document Parsers (✅ Phase 2 Enhanced)

#### `DocxParser`
**Implements**: `DocumentParser` interface
**Technology**: mammoth npm package

**Phase 1 (Legacy)**:
- `parse(buffer, filename)` → `Promise<TextDocument>`
- Extracts plain text (formatting stripped)

**Phase 2 (Enhanced)** ⭐:
- `parseToChapters(buffer, filename)` → `Promise<Chapter[]>`
- **HTML Import**: Uses `mammoth.convertToHtml()` instead of `extractRawText()`
- **Chapter Splitting**: Splits document by H1 (`<h1>`) headings
- **Formatting Preservation**: Converts HTML to TipTap JSON
- **Fallback**: Single chapter if no H1 found
- **Supported Formatting**: Bold, italic, underline, highlight

**Workflow**:
1. Convert DOCX to HTML using mammoth
2. Parse HTML DOM
3. Split by `<h1>` tags (chapter boundaries)
4. Extract chapter titles from H1 text
5. Convert each section's HTML to TipTap JSON
6. Create Chapter entities with formatted content
7. Return array (minimum 1 chapter)

**Tests**: 4 tests covering various DOCX structures and edge cases

---

#### `MarkdownParser`
**Purpose**: Parse single .md file to TipTap JSON

**Features**:
- Converts Markdown syntax to TipTap JSON
- Supports headings, bold, italic, lists
- Extracts title from first H1 or filename
- Clean conversion with minimal dependencies

**Tests**: 8+ tests covering Markdown parsing

---

#### `MarkdownFolderParser`
**Implements**: `FolderParser` interface
**Purpose**: Parse folder of .md files to Chapter array

**Features**:
- Processes folder of .md files
- Creates one Chapter per file
- Sorts by filename for consistent ordering
- Extracts chapter titles from content
- Filters non-.md files automatically

**Methods**:
- `parseFolder(files: File[])` → `Promise<Chapter[]>`

**Tests**: 10+ tests covering folder parsing

---

#### `CompositeDocumentParser`
**Implements**: `DocumentParser` interface
**Purpose**: Routes import parsing to the right parser by file extension

**Features**:
- Wraps a list of `DocumentParser` implementations (constructor throws if the list is empty)
- `supports(filename)` delegates to whichever wrapped parser recognizes the extension
- `getDocumentParser()` in `providers.ts` wires this with `[new DocxParser(), new MarkdownParser()]`,
  so a single import entry point handles both `.docx` and `.md`

---

### Document Exporters

#### `PagedPdfExporter` ⭐ Production PDF exporter (Paged.js + headless Chromium)
**Implements**: `DocumentExporter` interface
**Technology**: Playwright-driven headless Chromium rendering HTML paginated by
[Paged.js](https://pagedjs.org), printed to PDF via the Chrome DevTools Protocol

**Purpose**: This is the exporter actually served for PDF exports —
`getDocumentExporter('pdf')` in `providers.ts` returns `new PagedPdfExporter(baseUrl, new
PlaywrightBrowserLauncher())`. It renders the exact same paginated HTML/CSS used for the
in-app whole-book preview ("preview parity"), instead of laying out a PDF programmatically.

**Pipeline**: TipTap JSON → semantic HTML (`TipTapToBookHtml`) → publication CSS
(`BookCssBuilder`) → Paged.js pagination inside a headless Chromium page → `page.pdf()`.

**Collaborators** (`src/infrastructure/document/paged/`, ~13 files):
- **`PagedJsRenderer`** - Assembles the full standalone HTML document (front matter, TOC, body,
  endnotes, back matter) plus the inline bootstrap script that runs Paged.js's polyfill and
  signals `data-paged-ready` on the document element once pagination settles
- **`PlaywrightBrowserLauncher`** - The only file importing `playwright-core`; launches Chromium
  headless. On Vercel (`process.env.VERCEL`) it instead launches the Lambda-packaged binary from
  `@sparticuz/chromium`, since serverless functions ship no Chromium and have no writable
  Playwright browser cache
- **`TipTapToBookHtml`** - Converts TipTap JSON to the semantic HTML the book renderer consumes;
  applies French non-breaking-space typography (`frenchSpacing.ts`) and drops blank paragraphs
  that would otherwise strand a glued chapter-title heading at the bottom of a page
- **`BookCssBuilder`** - Turns a `PublicationProfile` (page size, margins, fonts) plus optional
  `LevelStyleSet` overrides into deterministic CSS `@page` / paged-media rules; embeds EB Garamond
  as `@font-face` when the profile uses it
- **`FrontMatterHtmlBuilder`** - Builds liminary pages: half-title, title, copyright (auto ©),
  dedication, epigraph, custom annexes, in that order
- **`BackMatterHtmlBuilder`** - Builds back matter: custom annexes first, then the legal-notice
  colophon on the last page
- **`EndnotesHtmlBuilder`** - Compiles a book's endnotes into a back-matter section grouped by
  chapter; numbering restarts per chapter and every note links back to its body call
- **`TocHtmlBuilder`** - Generates the table of contents `<nav>`; entries link to chapter section
  IDs and Paged.js resolves page numbers via CSS `target-counter`
- **`endnoteBubble.ts`** - Pure helpers for the endnote reading hover-bubble (geometry math),
  mirrored manually by an inline script in `PagedJsRenderer`'s iframe bootstrap
- **`resolveSyncScrollTarget.ts`** - Pure scroll-target math for keeping the editor and the
  paginated preview in sync, mirrored the same way
- **`richContentHtml.ts`** - Shared helpers turning a stored annex string into book HTML, always
  rendering TipTap JSON as text (never raw JSON) with a plain-text fallback
- **`frenchSpacing.ts`** - Turns a regular space adjacent to French high punctuation (`« ; : ! ?
  »`) into a non-breaking space so the sign can't be orphaned at the start of a wrapped line
- **`htmlEscape.ts`** - Single shared `escapeHtml()` so the various HTML builders can't drift

**Export methods** (`DocumentExporter` interface): `export()`, `exportProject()`,
`exportChapter()`, `exportChapters()` — all funnel into a shared `renderToPdf()` that strips
inline presentation attributes back to semantic markup (`stripToSemantic`, so a `PublicationProfile`'s
per-role typography drives layout instead of leaking editor defaults), builds the TOC/endnotes,
renders the HTML, and calls `page.pdf({ preferCSSPageSize: true, printBackground: true, width,
height })` sized from the `PublicationProfile`.

**Tests**: Extensive unit coverage per collaborator file (each has a matching `.test.ts`), plus
integration coverage of the full pipeline.

---

#### `DocxExporter` ⭐ ENHANCED (Phase 6.1)
**Implements**: `DocumentExporter` interface
**Technology**: docx npm package

**Phase 1 (Legacy)**:
- `export(document, filename)` → `Promise<Buffer>`
- Exports plain text to basic DOCX

**Phase 2 (Enhanced)** ⭐:
- `exportProject(project, filename)` → `Promise<Buffer>`
- **Multi-Chapter Export**: All chapters in single DOCX
- **Page Breaks**: Chapters separated by page breaks
- **Formatting Preservation**: TipTap JSON → DOCX formatting
- **Chapter Titles**: H1 headings for each chapter
- **Supported Formatting**: Bold, italic, underline, highlight

**Phase 6.1 Enhancements** ⭐:
- **Cover image support** - Includes cover image in export
- **Chapter selection** - Export only selected chapters

**Workflow**:
1. Iterate through all chapters in Project
2. For each chapter:
   - Add H1 heading with chapter title
   - Convert TipTap JSON to DOCX paragraphs/runs
   - Apply formatting (bold, italic, underline, highlight)
   - Add paragraphs to document
   - Add page break (except after last chapter)
3. Generate buffer

**Features**:
- Preserves rich text formatting
- Standard page layout (margins, spacing)
- Arial 11pt default font
- Professional document structure

**Tests**: 7 tests covering export scenarios and edge cases

---

#### `PdfExporter` — dead code, not wired
**Implements**: `DocumentExporter` interface
**Technology**: `pdf-lib` npm package (programmatic PDF layout: fonts, positioning, page breaks
drawn by hand)

**Status**: **Superseded by `PagedPdfExporter` and not referenced by `providers.ts` or any other
non-test file.** `getDocumentExporter('pdf')` never instantiates it — it is exercised only by
its own `PdfExporter.test.ts`. It predates the Paged.js/Chromium pipeline (A4 page styling,
special-character transliteration for WinAnsi encoding, cover image as first page, word-based
justification). Kept in the tree for its test coverage/history; do not extend it — new PDF export
work belongs in `PagedPdfExporter` and `document/paged/`.

---

### Reading Time Utility — moved out of Infrastructure

`formatReadingTime` now lives in `src/lib/utils.ts`, not under `src/infrastructure/`. It is a
pure function (200 words/minute estimate, TipTap JSON or plain text input) with no
infrastructure dependency, so it moved alongside the rest of the shared UI utilities. Consumers
include `PublicReader`, the public read page, and cockpit actions.

---

### Document Conversion Utilities

#### `tiptap-conversion.ts`
**Purpose**: Convert between HTML and TipTap JSON formats

**Functions**:
- `htmlToTipTapJSON(html: string)` → TipTap JSON object
- `tiptapJSONToPlainText(json: string)` → Plain text for display

**Supported Conversions**:
- HTML `<strong>` ↔ TipTap `bold` mark
- HTML `<em>` ↔ TipTap `italic` mark
- HTML `<u>` ↔ TipTap `underline` mark
- HTML `<mark>` ↔ TipTap `highlight` mark
- HTML `<p>` ↔ TipTap `paragraph` node
- HTML `<br>` ↔ Line breaks

**Tests**: 14 tests covering all conversion scenarios

---

### Encryption

Two independent AES-256-GCM helpers exist, each with its own PBKDF2-derived key and its own
salt (domain separation — compromising one does not help decrypt the other).

#### `crypto.ts` (`src/infrastructure/encryption/crypto.ts`)
**Purpose**: Encrypts AI provider API keys before they're stored by `MongoDBProviderRepository`

**Functions**:
- `encryptApiKey(plaintext)` → `{ encryptedData, iv, authTag }` (all hex strings)
- `decryptApiKey(encryptedData, iv, authTag)` → plaintext API key
- `maskApiKey(apiKey)` → display-safe masked string (e.g. `sk-proj-...6def`)

**Key derivation**: PBKDF2-SHA256, 100,000 iterations, salt `'revise-provider-salt'`, key from
`ENCRYPTION_KEY` (≥ 32 chars).

---

#### `FieldEncryption` (`src/infrastructure/security/FieldEncryption.ts`)
**Purpose**: Encrypts the content fields of the AI Transparency Ledger (captured prompts/outputs)
at rest, used by `MongoDBExchangeRepository`

**Class**: `FieldEncryption` — `encrypt(plaintext)` → `iv:authTag:ciphertext` (base64, colon
joined); `decrypt(blob)` → plaintext. Fresh random IV per call; the GCM auth tag guards against
tampering.

**Singleton accessor**: `getFieldEncryption()` — derives the key from `ENCRYPTION_KEY` via
PBKDF2-SHA256 (100,000 iterations, salt `'revise-exchange-salt'`, distinct from `crypto.ts`'s
provider-key salt above) and caches the instance for the process lifetime. Throws if the secret
is missing or under 32 characters, so exchange content is never silently stored unencrypted.

---

### Email Service ⭐ NEW (Phase 3.8)

#### `ResendEmailService`
**Implements**: `EmailService` interface
**Technology**: Resend API

**Purpose**: Transactional email — registration notification, welcome, password reset/changed,
and the admin pricing-sync report

**Methods** (all send via the Resend API with matching HTML + plain-text bodies):
- `sendRegistrationNotification(user)` - Notifies the admin of a new signup, with HMAC-signed
  approve/reject links (`HMACApprovalTokenGenerator`)
- `sendWelcomeEmail(user)` - Sends the onboarding welcome email once a user is active
- `sendPasswordResetEmail(user, resetLink)` - Sends the password-reset link (1-hour expiry stated
  in the copy; enforced by `PasswordResetTokenRepository`)
- `sendPasswordChangedEmail(user)` - Confirms a password change, with a "wasn't you?" warning
- `sendPricingSyncReport(report)` - Sends the admin a summary after the `/admin/pricing` cron sync,
  rendered via `renderPricingSyncReportEmail()` from `pricingSyncReportEmail.ts`

**Configuration**: `RESEND_API_KEY`, `ADMIN_EMAIL`, `EMAIL_FROM` (defaults to
`Revise <noreply@resend.dev>`)

**Tests**: 8+ tests covering email sending and templates

**Phase 6.1 Enhancements**:
- ✅ **Redesigned welcome email** - Modern layout with enhanced UX
- ✅ **Responsive email templates** - Mobile-friendly design

---

#### `pricingSyncReportEmail.ts`
**Purpose**: Pure HTML/text template builder for the pricing-sync admin report

**Functions**:
- `renderPricingSyncReportEmail(report: PricingSyncReport)` → `{ subject, html, text }`

Kept separate from `ResendEmailService` so the (long) HTML template can be unit-tested without
mocking the Resend client.

---

### Content Conversion ⭐ NEW (Phase 4.1)

#### `TipTapContentService`
**Implements**: `ContentConverter` interface
**Technology**: TipTap utilities

**Purpose**: Convert between TipTap JSON and other formats

**Methods**:
- `toPlainText(tiptapJson)` - Extract plain text for AI prompts
- `toHtml(tiptapJson)` - Convert to HTML for rendering
- `fromHtml(html)` - Parse HTML to TipTap JSON

**Tests**: 10+ tests covering conversion scenarios

---

### Caching ⭐ NEW (Phase 4.1)

#### `MetadataCache`
**Purpose**: TTL-based caching for project metadata

**Features**:
- 5-minute TTL for metadata documents
- Per-project cache keys
- Automatic invalidation on content change
- In-memory storage (Map)
- Thread-safe access

**Phase 8.0 Enhancements**:
- ✅ Stores the **built completion context string** (from `AIContextBuilder`), keyed by project/chapter
- ✅ `invalidate(userId, projectId)` clears a single project; `invalidateUser(userId)` clears all
- ✅ Research-doc create/update/delete invalidate the cached context so author edits take effect

**Tests**: 5+ tests covering caching behavior

---

### Authentication (Phase 3, 3.8 Enhanced)

#### `AuthJsProvider`
**Implements**: `AuthProvider` interface
**Technology**: Auth.js (NextAuth v5)

**Purpose**: Extracts user identity from the Auth.js JWT session for Server Actions — thin,
read-only adapter; sign-in/sign-up themselves go through Auth.js directly (`src/app/actions/auth-actions.ts`),
not through this class.

**Methods** (the real, current interface — no `signIn`/`signOut`/`createSession` methods exist):
- `getUserId()` → `Promise<string>` - Returns the current user's ID; throws `UnauthorizedError`
  if there's no active session
- `isAuthenticated()` → `Promise<boolean>` - Whether a session exists
- `getSession()` → `Promise<UserSession | null>` - Full session data (`userId`, `email`, `name`)

**Configuration** (`auth-config.ts`):
- Credentials provider setup
- Session strategy: JWT
- Custom callbacks for session/JWT
- TypeScript type extensions

**Tests**: 10+ tests covering authentication flows

---

#### `src/proxy.ts` — route protection (Next.js proxy convention)
**Purpose**: Redirects unauthenticated users away from protected routes and signed-in users away
from the sign-in/sign-up pages

This lives at `src/proxy.ts` (Next.js's proxy/middleware convention), not under
`src/infrastructure/` — documented here because it's the enforcement point for the auth flow
implemented by `AuthJsProvider`/`auth-config.ts` above.

**Protected routes** (redirect to `/auth/signin?callbackUrl=...` when logged out): `/dashboard`,
`/editor`, `/project` (prefix-matched)

**Auth routes** (redirect to `/dashboard` when already logged in): `/auth/signin`, `/auth/signup`

**Other behavior**:
- Signed-in users hitting `/` are redirected to `/dashboard`
- `/editor/paged-spike` is exempted outside production (fixture-only Paged.js spike page, must
  stay reachable by its deterministic browser test without DB-backed auth)
- Matcher excludes `/api/*`, `/_next/static/*`, `/_next/image/*`, `favicon.ico`

---

#### `HMACApprovalTokenGenerator`
**Implements**: `ApprovalTokenGenerator` interface
**Purpose**: HMAC-SHA256 tokens used in the admin registration-approval email links

Signs `userId` with the app's `AUTH_SECRET` so the approve/reject URLs sent by
`ResendEmailService.sendRegistrationNotification()` can't be forged or replayed with a different ID.

---

#### `SecureTokenGenerator`
**Implements**: `TokenGenerator` (from `RequestPasswordResetUseCase`)
**Purpose**: Cryptographically secure random tokens for password-reset links

Uses `crypto.randomBytes` (default 32 bytes). Generated tokens are persisted by
`MongoDBPasswordResetTokenRepository` with an expiry and single-use tracking.

---

### Persistence ⭐ ENHANCED (Phase 7)

#### `MongoDBProjectRepository` ⭐ NEW (Phase 3)
**Implements**: `ProjectRepository` interface
**Technology**: MongoDB Atlas with official Node.js driver

**Purpose**: Production persistence with multi-tenant isolation

**Methods**:
- `createProject(userId, project)` - Inserts project with ownerId
- `loadProject(userId, projectId)` - Loads project for specific user
- `listProjects(userId)` - Lists all projects for user (sorted by updatedAt)
- `updateProject(userId, project)` - Updates project (ownership verified)
- `deleteProject(userId, projectId)` - Deletes project (ownership verified)
- `updateChapter(userId, projectId, chapter)` - Optimized chapter update
- `findPublishedByToken(projectId, token)` - Load published project (no auth) ⭐ Phase 5.0

**Multi-Tenant Security**:
- **All queries filter by ownerId** to ensure data isolation
- No user can access another user's projects
- Enforced at database query level
- `findPublishedByToken` allows unauthenticated access to published projects only

**Serialization**:
- Uses `project-serializer` utilities
- Converts Project/Chapter entities to MongoDB documents
- Handles TipTap JSON storage
- Timestamps (createdAt, updatedAt)

**Tests**: 15+ tests covering CRUD operations and multi-tenant isolation

---

#### `MongoDBUserRepository` ⭐ NEW (Phase 3)
**Implements**: `UserRepository` interface
**Technology**: MongoDB Atlas with bcrypt

**Purpose**: User management with secure password storage

**Methods**:
- `createUser(user)` - Creates user with hashed password
- `findByEmail(email)` - Retrieves user by email (login)
- `findById(userId)` - Retrieves user by ID
- `emailExists(email)` - Checks if email already registered

**Security**:
- Passwords hashed with bcrypt (saltRounds: 10)
- Never stores plain-text passwords
- Email uniqueness enforced at database level

**Tests**: 10+ tests covering user management and security

---

#### `MongoDBProviderRepository`
**Implements**: `ProviderRepository` interface
**Technology**: MongoDB Atlas, API keys encrypted via `crypto.ts`

**Purpose**: Stores each user's configured AI providers (OpenAI/Anthropic/Google credentials + model)

**Methods**:
- `create(userId, provider)` - Encrypts the API key, then inserts
- `findById(userId, providerId)` - Loads and decrypts (ownership verified)
- `listProviders(userId)` - Lists all providers for user
- `update(userId, provider)` - Updates (re-encrypts key if changed)
- `delete(userId, providerId)` - Deletes provider
- `isUsedByProjects(userId, providerId)` - Guards deletion of a provider still assigned to a project
- `deleteAllByOwner(userId)` - Deletes all of a user's providers (RGPD)

---

#### `MongoDBMetadataRepository` (Phase 3.6)
**Implements**: `MetadataRepository` interface
**Technology**: MongoDB Atlas with official Node.js driver

**Purpose**: Metadata storage with multi-tenant isolation

**Methods**:
- `create(userId, metadata)` - Creates metadata document
- `findById(userId, metadataId)` - Loads metadata (ownership verified)
- `findByProjectId(userId, projectId)` - Lists all metadata for project
- `update(userId, metadata)` - Updates metadata
- `delete(userId, metadataId)` - Deletes metadata
- `findByProjectAndType(userId, projectId, type)` - Find specific analysis type

**Multi-Tenant Security**:
- All queries filter by `ownerId`
- Enforced at database query level

**Serialization**:
- Uses `metadata-serializer` utilities
- Handles TipTap JSON storage
- Stores content hash for cache invalidation
- Timestamps (createdAt, updatedAt)

**Tests**: 15+ tests covering CRUD operations and multi-tenant isolation

---

#### `MongoDBCorrectionHistoryRepository` ⭐ NEW (Phase 3.7)
**Implements**: `CorrectionHistoryRepository` interface
**Technology**: MongoDB Atlas with official Node.js driver

**Purpose**: Correction history storage with multi-tenant isolation

**Methods**:
- `save(userId, history)` - Creates history document
- `listByChapter(userId, projectId, chapterId)` - Lists history for chapter
- `listByProject(userId, projectId)` - Lists all history for project
- `delete(userId, historyId)` - Deletes history entry

**Multi-Tenant Security**:
- All queries filter by `ownerId`
- Enforced at database query level

**Indexing**:
- Indexes on (ownerId, projectId, chapterId) for efficient queries
- Sorted by createdAt descending (newest first)

**Serialization**:
- Uses `correction-history-serializer` utilities
- Stores proposals array with text content
- Timestamps (createdAt)

**Tests**: 10+ tests covering CRUD operations and multi-tenant isolation

---

#### `MongoDBBlogArticleRepository` ⭐ NEW (Phase 4.0)
**Implements**: `BlogArticleRepository` interface
**Technology**: MongoDB Atlas with official Node.js driver

**Purpose**: Blog article storage

**Methods**:
- `create(article)` - Creates blog article
- `findBySlug(slug)` - Loads article by URL slug
- `findById(id)` - Loads article by ID
- `listPublished()` - Lists published articles (sorted by date)
- `findAllPublishedPaginated(page, pageSize)` - Paginated listing ⭐ Phase 4.1+
- `listAll()` - Lists all articles (admin)
- `update(article)` - Updates article
- `delete(id)` - Deletes article

**Indexing**:
- Unique index on `slug`
- Index on `publishedAt` for listing

**Tests**: 10+ tests covering CRUD operations

---

#### `MongoDBContactMessageRepository` ⭐ NEW (Phase 3.11)
**Implements**: `ContactMessageRepository` interface
**Technology**: MongoDB Atlas with official Node.js driver

**Purpose**: Contact form message storage

**Methods**:
- `create(message)` - Creates contact message
- `findById(id)` - Loads message by ID
- `listAll()` - Lists all messages (admin)
- `delete(id)` - Deletes message

**Tests**: 5+ tests covering CRUD operations

---

#### `MongoDBArticleViewRepository`
**Implements**: `ArticleViewRepository` interface
**Technology**: MongoDB Atlas, TTL index for automatic cleanup

**Purpose**: Deduplicates blog view counts per visitor fingerprint

**Methods**:
- `hasRecentView(articleId, visitorHash)` - Whether this visitor already counted recently
- `create(view)` - Records a view
- `deleteOlderThan(olderThan)` - Manual/administrative pruning (in addition to the TTL index)

---

#### `MongoDBCharacterRepository` ⭐ NEW (Phase 6)
**Implements**: `CharacterRepository` interface
**Technology**: MongoDB Atlas with official Node.js driver

**Purpose**: Character storage with multi-tenant isolation

**Methods**:
- `create(userId, character)` - Creates character
- `findById(userId, characterId)` - Loads character (ownership verified)
- `findByProjectId(userId, projectId)` - Lists all characters for project
- `update(userId, character)` - Updates character
- `delete(userId, characterId)` - Deletes character
- `deleteAllByOwner(userId)` - Deletes all user's characters (RGPD)

**Multi-Tenant Security**:
- All queries filter by `ownerId`
- Enforced at database query level

**Tests**: 15+ tests covering CRUD operations and multi-tenant isolation

---

#### `MongoDBProjectSettingsRepository` ⭐ NEW (Phase 6)
**Implements**: `ProjectSettingsRepository` interface
**Technology**: MongoDB Atlas with official Node.js driver

**Purpose**: Project settings storage (narration settings, contributors, custom
dictionary/ignored-words for spell check, etc.)

**Methods**:
- `create(userId, settings)` - Creates project settings
- `findByProjectId(userId, projectId)` - Loads settings for project
- `update(userId, settings)` - Updates settings
- `delete(userId, settingsId)` - Deletes settings
- `deleteAllByOwner(userId)` - Deletes all user's settings (RGPD)

**Tests**: 15+ tests covering CRUD operations

---

#### `MongoDBProjectTaskRepository` ⭐ NEW (Phase 6)
**Implements**: `ProjectTaskRepository` interface
**Technology**: MongoDB Atlas with official Node.js driver

**Purpose**: Task storage with filtering and sorting

**Methods**:
- `create(userId, task)` - Creates task
- `findById(userId, taskId)` - Loads task (ownership verified)
- `findByProjectId(userId, projectId, filters?)` - Lists tasks with optional filters
- `update(userId, task)` - Updates task
- `delete(userId, taskId)` - Deletes task
- `getTaskSummary(userId, projectId)` - Aggregates task statistics
- `deleteAllByOwner(userId)` - Deletes all user's tasks (RGPD)

**Filtering**:
- By status (todo, in_progress, done, blocked)
- By priority (low, medium, high, urgent)
- Sorted by due date, priority, or creation date

**Tests**: 20+ tests covering CRUD, filtering, and aggregation

---

#### `MongoDBResearchDocumentRepository` ⭐ NEW (Phase 6)
**Implements**: `ResearchDocumentRepository` interface
**Technology**: MongoDB Atlas with official Node.js driver

**Purpose**: Research document storage

**Methods**:
- `create(userId, document)` - Creates document
- `findById(userId, documentId)` - Loads document (ownership verified)
- `findByProjectId(userId, projectId)` - Lists all documents for project
- `update(userId, document)` - Updates document
- `delete(userId, documentId)` - Deletes document
- `deleteAllByOwner(userId)` - Deletes all user's documents (RGPD)

**Tests**: 10+ tests covering CRUD operations

---

#### `MongoDBWritingGoalRepository` ⭐ NEW (Phase 6)
**Implements**: `WritingGoalRepository` interface
**Technology**: MongoDB Atlas with official Node.js driver

**Purpose**: Writing goal storage

**Methods**:
- `create(userId, goal)` - Creates goal
- `findById(userId, goalId)` - Loads goal (ownership verified)
- `findByProjectId(userId, projectId)` - Lists all goals for project
- `findActiveByProjectId(userId, projectId)` - Finds active goal
- `update(userId, goal)` - Updates goal
- `delete(userId, goalId)` - Deletes goal
- `deleteAllByOwner(userId)` - Deletes all user's goals (RGPD)

**Tests**: 10+ tests covering CRUD operations

---

#### `MongoDBWritingQuotaRepository`
**Implements**: `WritingQuotaRepository` interface
**Technology**: MongoDB Atlas with official Node.js driver

**Purpose**: Recurring writing quotas (e.g. "500 words/day"), distinct from the one-off
`WritingGoalRepository` above

**Methods**:
- `create(userId, quota)` - Creates quota
- `findById(userId, quotaId)` - Loads quota (ownership verified)
- `findByProjectId(userId, projectId)` - Lists quotas for project
- `update(userId, quota)` - Updates quota
- `delete(userId, quotaId)` - Deletes quota
- `deleteAllByOwner(userId)` - Deletes all user's quotas (RGPD)

---

#### `MongoDBWordCountSnapshotRepository`
**Implements**: `WordCountSnapshotRepository` interface
**Technology**: MongoDB Atlas with official Node.js driver

**Purpose**: Daily word-count snapshots feeding writing-goal/quota progress, one document per
owner/project/author-local day

**Methods**:
- `upsertForDay(userId, snapshot)` - Creates or overwrites today's snapshot
- `findByProjectId(userId, projectId, ...)` - Lists snapshots for a project (date-ranged)
- `findLatestBefore(userId, projectId, date)` - Latest prior snapshot, used to compute deltas
- `deleteAllByOwner(userId)` - Deletes all of a user's snapshots (RGPD)

**Indexing**: Ensures indexes on first use via `ensureIndexes()`, same pattern as the other
lazily-instantiated repositories in `providers.ts`.

---

#### `MongoDBUsageRepository` ⭐ ENHANCED (Phase 6, 9.0)
**Implements**: `AIUsageRepository` interface
**Technology**: MongoDB Atlas with official Node.js driver

**Purpose**: AI usage statistics with aggregation

**Methods**:
- `create(record)` - Creates usage record (now stores `costEur` and `cachedInputTokens`)
- `findByUserId(userId, filters?)` - Lists usage for user
- `findByProjectId(userId, projectId, filters?)` - Lists usage for project
- `getUsageStats(userId, projectId?, dateRange?)` - Aggregates total usage (incl. `totalCostEur`, `totalCachedInputTokens`)
- `getDailyUsage(userId, projectId?, days?)` - Daily usage breakdown
- `getUsageByOperation(userId, projectId?, dateRange?)` - Usage by operation type

**Aggregation Pipelines**:
- Total tokens, cached tokens, and euro cost calculation
- Daily grouping for charts
- Operation type breakdown

**Tests**: 15+ tests covering CRUD and aggregation

---

#### `MongoDBExchangeRepository` — AI Transparency Ledger, encrypted at rest
**Implements**: `AIExchangeRepository` interface
**Technology**: MongoDB Atlas + `FieldEncryption` (AES-256-GCM)

**Purpose**: Persists a record of every AI exchange (input, system prompt, output) for the AI
Transparency Ledger the author can audit, with **content fields encrypted at rest** — this is
the one repository that takes a second constructor argument, `getFieldEncryption()`, wired in
`providers.ts`.

**Methods**:
- `save(exchange)` - Encrypts content fields, then inserts. Content is capped at 50 KB/field
  before encryption (`exchange-truncation.ts`, see [Utils](#utils-⭐-enhanced-phase-7)) since
  analysis operations can send a whole manuscript
- `findByOwner(userId, filters?)` - Metadata-only list query (does not decrypt content, keeping
  listing cheap)
- `findById(userId, id)` - Loads and decrypts a single exchange
- `distinctModels(userId)` - Distinct model names used, for filter UIs
- `deleteAllByOwner(userId)` - RGPD deletion
- `ensureIndexes()` - Also sets up TTL-based automatic purge of old exchanges

---

#### `MongoDBSnapshotRepository`
**Implements**: `SnapshotRepository` interface
**Technology**: MongoDB Atlas, atomic sequence allocation

**Purpose**: Manual/named project snapshots (point-in-time save points an author can restore)

**Methods**:
- `getNextSequenceNumber(ownerId, projectId)` - Atomically allocates the next snapshot sequence number
- `save(ownerId, snapshot)` - Persists a snapshot
- `findByProjectId(ownerId, projectId)` - Lists a project's snapshots
- `findLatestByProjectId(ownerId, projectId)` - Latest snapshot
- `findById(ownerId, snapshotId)` - Single snapshot lookup
- `deleteByProjectId(ownerId, projectId)` / `deleteAllByOwner(ownerId)` - Bulk deletion (project
  deletion, RGPD)

**Multi-Tenant Security**: All queries filter by `ownerId`; sequence numbers are allocated atomically.

---

#### `MongoDBAutomaticSnapshotRepository`
**Implements**: `AutomaticSnapshotRepository` interface
**Technology**: MongoDB Atlas, atomic lease pattern

**Purpose**: The server-side clock/scheduler behind *automatic* project snapshots (as opposed to
the manual snapshots above) — tracks when a project last changed and whether a snapshot is due,
using an atomic lease so two concurrent editor sessions/tabs for the same project can't both
trigger a duplicate snapshot.

**Methods**:
- `configure(ownerId, projectId, intervalMinutes)` - Sets/disables the automatic interval
- `recordSavedChange(ownerId, projectId, now)` - Marks that content changed
- `heartbeat(ownerId, projectId, sessionId, now)` - Keeps an editor session's lease alive
- `claimDueSnapshot(ownerId, projectId, now)` - Atomically claims the right to take the next snapshot
- `hasOpenSession(ownerId, projectId, now)` - Whether another session currently holds the lease
- `completeSnapshot(...)` / `releaseFailedSnapshot(...)` - Resolves the claimed lease
- `recordPruningActivity(ownerId, projectId, prunedCount, now)` - Logs retention pruning

---

#### `MongoDBCharacterConversationRepository` ⭐ NEW (Phase 9.0)
**Implements**: `CharacterConversationRepository` interface
**Technology**: MongoDB Atlas with official Node.js driver

**Purpose**: Character conversation storage with multi-tenant isolation

**Methods**:
- `create(ownerId, conversation)` - Creates conversation document
- `findById(ownerId, conversationId)` - Loads conversation (ownership verified)
- `findByCharacterId(ownerId, characterId)` - Lists conversations for a character
- `save(ownerId, conversation)` - Upserts conversation (used to append messages)
- `delete(ownerId, conversationId)` - Deletes conversation

**Multi-Tenant Security**:
- All queries filter by `ownerId`
- Enforced at database query level

**Serialization**: Uses `character-conversation-serializer` (message array preserved in order)

**Tests**: 20+ tests covering CRUD operations and multi-tenant isolation

---

#### `MongoDBAnalysisRepository` ⭐ NEW (Phase 7)
**Implements**: `AnalysisRepository` interface
**Technology**: MongoDB Atlas with official Node.js driver

**Purpose**: Chapter analysis results, history, and exclusions storage

**ChapterAnalysis Methods**:
- `saveAnalysis(ownerId, analysis)` - Creates analysis document
- `findAnalysisByChapterId(ownerId, chapterId)` - Loads latest analysis
- `findAnalysisByContentHash(ownerId, chapterId, hash)` - Cache lookup
- `updateAnalysis(ownerId, analysis)` - Updates analysis
- `deleteAnalysis(ownerId, analysisId)` - Deletes analysis

**AnalysisHistory Methods**:
- `saveHistory(ownerId, history)` - Creates history entry
- `findHistoryByChapterId(ownerId, chapterId)` - Lists history
- `findHistoryById(ownerId, historyId)` - Loads history entry

**Ignored Issues Methods**:
- `saveIgnoredIssue(ownerId, issue)` - Saves ignored issue
- `findIgnoredIssues(ownerId, chapterId)` - Lists ignored issues
- `deleteIgnoredIssue(ownerId, issueId)` - Deletes ignored issue

**Repetition Exclusions Methods**:
- `saveRepetitionExclusion(ownerId, exclusion)` - Saves exclusion
- `findRepetitionExclusions(ownerId, projectId)` - Lists exclusions
- `deleteRepetitionExclusion(ownerId, exclusionId)` - Deletes exclusion

**Multi-Tenant Security**:
- All queries filter by `ownerId`
- Enforced at database query level

**Indexing**:
- Indexes on (ownerId, chapterId, contentHash) for efficient cache lookup
- Indexes on (ownerId, chapterId) for history queries

**Tests**: 25+ tests covering all CRUD operations and multi-tenant isolation

---

#### `MongoDBCanonFactRepository` — canon ledger (dual interface)
**Implements**: `CanonFactRepository` **and** `CanonExtractionStateRepository`
**Technology**: MongoDB Atlas with official Node.js driver

**Purpose**: The "canon ledger" of atomic manuscript facts (extracted or author-entered) used to
keep AI generation consistent with established story facts. Implements two domain interfaces in
one class; `providers.ts` keeps a single shared instance and hands it out for both
`getCanonFactRepository()` and `getCanonExtractionStateRepository()`.

**Methods**:
- `save(fact)` / `update(ownerId, fact)` / `delete(ownerId, factId)` - Fact CRUD
- `listByProject(ownerId, projectId)` - Lists all facts for a project
- `findForSelection(...)` - Temporal selection: facts valid as of a given chapter/point in the manuscript
- `replaceDerived(...)` - Reconciles AI-derived facts against author-entered ones
- `deleteAllByOwner(ownerId)` - RGPD deletion
- Plus the `CanonExtractionStateRepository` methods tracking extraction progress per project

**Multi-Tenant Security**: All queries filter by `ownerId`.

---

#### `MongoDBAutocompleteEventRepository` — instrumentation
**Implements**: `AutocompleteEventRepository` interface
**Technology**: MongoDB Atlas with official Node.js driver

**Purpose**: One document per autocomplete suggestion shown, for acceptance-rate instrumentation

**Methods**:
- `save(event)` - Records a suggestion event
- `markDeletedAfterInsert(...)` - Flags a suggestion the author deleted right after accepting it
  (signal that the suggestion wasn't actually good)
- `getStatsByProject(...)` - Aggregated acceptance stats
- `deleteAllByOwner(ownerId)` - RGPD deletion

---

#### `MongoDBRateLimitRepository` — persisted, cross-instance rate limiting
**Implements**: `RateLimitRepository` interface
**Technology**: MongoDB Atlas, atomic upsert + TTL index

**Purpose**: Fixed-window rate limiting that's consistent across serverless instances (unlike the
in-memory limiter below, which only sees traffic on the process it runs in). One atomic
`consumeFixedWindow(key, windowMs, maxInWindow)` upsert per hit; a TTL index automatically prunes
expired windows.

**Usage**: Backs at least three call sites, each with its own key prefix:
- `POST /api/completion/stream` — two **separate buckets** keyed `completion:${userId}` and
  `prefetch:${userId}` (manual vs. background-prefetch autocomplete requests get independent quotas)
- `POST /api/completion/telemetry` — `telemetry:${userId}`
- Canon-fact actions (`src/app/actions/canon-actions.ts`) — its own key prefix

Fails **open** on a store outage (a rate-limiter/DB blip should not break mid-sentence completion).

---

#### `MongoDBModelPricingRepository`
**Implements**: `ModelPricingRepository` interface
**Technology**: MongoDB Atlas, upsert on `(provider, prefix)`

**Purpose**: Persists AI model pricing entries synced from OpenRouter (see
[Pricing](#pricing) below), consumed by `/admin/pricing` and `ModelPricing.computeCost()`

**Methods**:
- `upsertMany(entries)` - Bulk upsert keyed by `(provider, prefix)`
- `findByProvider(provider)` - Lists entries for one provider
- `findAll()` - Lists every entry
- `update(id, data)` - Manual correction of a synced entry
- `delete(id)` - Removes an entry

---

#### `MongoDBBookPreviewCacheRepository` — GridFS-backed PDF cache
**Implements**: `BookPreviewCacheRepository` interface
**Technology**: MongoDB Atlas + GridFS

**Purpose**: Caches the whole-book paginated PDF preview so re-opening the preview panel doesn't
re-render every time. Keyed by `{ projectId, profileId, ownerId }`. Uses **GridFS** rather than
storing the PDF inline, since a whole-book export can exceed MongoDB's 16 MB document cap.

**Methods**:
- `save(entry, pdf)` - Writes the metrics document and the PDF blob (via `GridFSBucket`)
- `loadMetrics(...)` - Loads just the cache-hit metadata (page count, timing) without the PDF bytes
- `loadPdf(...)` - Streams the cached PDF bytes

Computed by `BookPreviewCacheComputer` (`getBookPreviewCacheComputer()` in `providers.ts`), which
wires `PlaywrightBrowserLauncher` + `PagedJsRenderer` + `WholeBookHtmlAssembler` — the same
paginated-rendering stack `PagedPdfExporter` uses for the export path.

---

#### `MongoDBCustomAnnexRepository`
**Implements**: `CustomAnnexRepository` interface
**Technology**: MongoDB Atlas with official Node.js driver

**Purpose**: Author-inserted book annexes (front-matter/back-matter extra pages — e.g. an "about
the author" page), sorted by placement then order

**Methods**:
- `findByProjectId(ownerId, projectId)` - Lists a project's annexes
- `findById(ownerId, id)` - Single annex lookup
- `countByProjectAndPlacement(...)` - Count for a given `AnnexPlacement`
- `create(ownerId, annex)` / `update(ownerId, annex)` / `delete(ownerId, id)` - CRUD
- `deleteByProjectId(ownerId, projectId)` / `deleteAllByOwner(ownerId)` - Bulk deletion

**Multi-Tenant Security**: All queries filter by `ownerId`.

---

#### `MongoDBPresentationOverrideRepository`
**Implements**: `PresentationOverrideRepository` interface
**Technology**: MongoDB Atlas, one document per chapter, upsert on save

**Purpose**: Per-chapter presentation overrides (e.g. manual pagination/typography tweaks layered
on top of a `PublicationProfile`) for the export/preview pipeline

**Methods**:
- `save(chapterId, ownerId, overrides)` - Upserts the override layer
- `load(chapterId, ownerId)` - Loads it (or `null`)
- `delete(chapterId, ownerId)` - Removes it

---

#### `MongoDBPasswordResetTokenRepository`
**Implements**: `PasswordResetTokenRepository` interface
**Technology**: MongoDB Atlas with official Node.js driver

**Purpose**: Secure password-reset token storage with expiration and single-use tracking

**Methods**:
- `create(data)` - Creates a token (paired with `SecureTokenGenerator`)
- `findValidToken(token)` - Looks up a token, honoring expiry/used state
- `markAsUsed(tokenId)` - Marks a token consumed after a successful reset
- `invalidateAllForUser(userId)` - Invalidates outstanding tokens (e.g. after a successful reset)
- `deleteExpired()` - Housekeeping cleanup

---

#### `InMemoryProjectRepository` (Phase 2 - Testing)
**Implements**: `ProjectRepository` interface
**Purpose**: Ephemeral storage for testing

**Methods**:
- `save(project)` - Stores in Map (in-memory)
- `findById(projectId)` - Retrieves from Map
- `findAll(userId)` - Returns all projects (simulated multi-tenancy)
- `delete(projectId)` - Removes from Map

**Characteristics**:
- Data lost on page refresh (by design)
- No persistence across sessions
- Fast (instant operations)
- Used for testing and legacy compatibility; `getProjectRepository()` in `providers.ts` returns
  this instead of `MongoDBProjectRepository` when `NODE_ENV === 'test'` and `USE_REAL_DB` is unset

**Tests**: 5 tests covering CRUD operations

---

#### Serializers

Each MongoDB repository above pairs with a serializer module converting domain entities ↔
MongoDB documents (mostly under `src/infrastructure/persistence/serialization/`, a few directly
in `persistence/`):

- **`project-serializer`** ⭐ NEW (Phase 3) - `serializeProject`/`deserializeProject`,
  `serializeChapter`/`deserializeChapter`. Preserves TipTap JSON content and timestamps.
- **`metadata-serializer`** ⭐ NEW (Phase 3.6) - `serializeMetadata`/`deserializeMetadata`,
  including content hash and metadata-type enum conversion.
- **`character-serializer`** ⭐ NEW (Phase 6) - `serializeCharacter`/`deserializeCharacter`.
- **`project-settings-serializer`** ⭐ NEW (Phase 6) - `serializeProjectSettings`/
  `deserializeProjectSettings`, handling nested value objects (NarrationSettings, Contributor,
  RelatedWork) and cover image URL.
- **`project-task-serializer`** ⭐ NEW (Phase 6) - `serializeProjectTask`/`deserializeProjectTask`.
- **`research-document-serializer`** ⭐ NEW (Phase 6) - `serializeResearchDocument`/
  `deserializeResearchDocument`.
- **`writing-goal-serializer`** ⭐ NEW (Phase 6) - `serializeWritingGoal`/`deserializeWritingGoal`.
- **`writing-quota-serializer`** - `serializeWritingQuota`/`deserializeWritingQuota`.
- **`word-count-snapshot-serializer`** - `serializeWordCountSnapshot`/`deserializeWordCountSnapshot`.
- **`ai-usage-serializer`** ⭐ NEW (Phase 6) - `serializeAIUsageRecord`/`deserializeAIUsageRecord`.
- **`ai-exchange-serializer`** - `serializeAIExchange`/`deserializeAIExchange`; leaves content
  fields as opaque encrypted blobs (encryption/decryption is `FieldEncryption`'s job, applied by
  the repository around the serializer, not inside it).
- **`character-conversation-serializer`** - message array preserved in order.
- **`chapter-analysis-serializer`** ⭐ NEW (Phase 7) - `serializeChapterAnalysis`/
  `deserializeChapterAnalysis`; handles nested `AnalysisIssue`/`RepetitionCluster` arrays.
- **`analysis-history-serializer`** ⭐ NEW (Phase 7) - `serializeAnalysisHistory`/
  `deserializeAnalysisHistory`.
- **`canon-fact-serializer`** - `serializeCanonFact`/`deserializeCanonFact`.
- **`autocomplete-event-serializer`** - `serializeAutocompleteEvent`/`deserializeAutocompleteEvent`.
- **`serialization/blog-article-serializer`** - `serializeBlogArticle`/`deserializeBlogArticle`.
- **`serialization/article-view-serializer`** - `serializeArticleView`/`deserializeArticleView`.
- **`serialization/correction-history-serializer`** - stores the proposals array with text content.
- **`serialization/custom-annex-serializer`** - `serializeCustomAnnex`/`deserializeCustomAnnex`.
- **`serialization/provider-serializer`** - stores the encrypted API key fields alongside provider
  metadata (never plaintext).

**Tests**: Each serializer is exercised through its owning repository's test suite rather than
standalone tests, except where noted above.

---

### Storage ⭐ NEW (Phase 6)

#### `VercelBlobStorage`
**Implements**: `BlobStorage` interface
**Technology**: Vercel Blob

**Purpose**: Cover image storage for projects

**Methods**:
- `upload(file, path)` - Uploads file to Vercel Blob
- `delete(url)` - Deletes file from Vercel Blob

**Features**:
- Automatic URL generation
- Content-type detection
- Error handling for upload failures

**Tests**: 10+ tests covering upload and delete operations

---

### Lexical

Zero-AI-token French synonym lookup, backed by MongoDB-hosted linguistic datasets rather than an
LLM call. `src/infrastructure/lexical/index.ts` exposes a `createThesaurus(db)` factory that
composes the two pieces below.

#### `JeuxDeMotsThesaurus`
**Implements**: `Thesaurus` interface
**Technology**: MongoDB (`jdm_synonyms` collection), sourced from the
[JeuxDeMots](https://www.jeuxdemots.org/) `r_syn` (synonym) relation index

**Purpose**: Base synonym lookup — `lookup(word)` normalizes (trim + lowercase) and does a direct
`_id` lookup, returning `[]` for unknown words.

---

#### `FrenchMorphology`
**Implements**: `Morphology` interface
**Technology**: MongoDB (`lexique_forms` / `lexique_conjugations` collections), sourced from the
[Lexique](http://www.lexique.org/) database

**Purpose**: Lemmatization and re-inflection so the thesaurus can work with conjugated verbs

**Methods**:
- `lemmatize(word)` → `MorphInterpretation[]` - Looks up all possible grammatical interpretations
  of a surface form (e.g. which lemma(s)/`cgram` a word could be)
- `inflect(lemma, cgram, morph)` → `string | null` - Produces one inflected surface form
- `inflectBatch(lemmas, cgram, morph)` → `Map<string, string>` - Batch version, used to re-inflect
  a whole list of synonym lemmas at once

---

#### `ConjugationAwareThesaurus` — decorator
**Implements**: `Thesaurus` interface
**Purpose**: Wraps a base `Thesaurus` (`JeuxDeMotsThesaurus`) with `FrenchMorphology` so a
conjugated verb (e.g. "mangeait") gets synonyms conjugated to match, not just infinitives.

**Algorithm**: Lemmatizes the input word; if it isn't a verb form (or is already a base/infinitive
form, since the synonym index is keyed by infinitive), falls straight through to the base
thesaurus. Otherwise it looks up synonyms of the lemma, re-inflects each synonym to the same
morphological form (tense/person/number) as the original word via `inflectBatch`, and falls back
to the lemma's own (infinitive) synonyms if none could be re-inflected — so the author always
gets *some* suggestion rather than an empty palette.

---

### Pricing

#### `OpenRouterPricingClient`
**Implements**: `PricingClient` interface
**Technology**: [OpenRouter](https://openrouter.ai) public models API (`GET
https://openrouter.ai/api/v1/models`, no API key required)

**Purpose**: Fetches current per-token pricing for OpenAI/Anthropic/Google models, used to keep
`MongoDBModelPricingRepository` current via the `/admin/pricing` page and its cron sync.

**Behavior**:
- `fetchPricingEntries()` → `Omit<ModelPricingEntry, 'id'>[]` - Fetches and normalizes OpenRouter's
  model list
- Filters to models under the `anthropic/`, `openai/`, `google/` prefixes; everything else is skipped
- Normalizes each OpenRouter model id into a matchable `prefix`: drops the provider segment,
  lowercases, and replaces `.` with `-` (e.g. `anthropic/claude-opus-4.8` → `claude-opus-4-8`) so
  it lines up with runtime model ids; longest-prefix matching specificity is handled downstream by
  `selectPricingEntry`
- Converts OpenRouter's per-token USD prices to USD-per-million-tokens; falls back to 10% of the
  input price for cached-input pricing when OpenRouter doesn't report it
- Exports `EUR_USD_RATE` (a hardcoded constant, manually updated when the rate drifts significantly)
  for USD → EUR conversion at query time

---

### Security ⭐ NEW (Phase 6.1)

#### `HCaptchaVerifier`
**Implements**: `CaptchaVerifier` interface
**Technology**: hCaptcha API

**Purpose**: Bot protection for registration

**Methods**:
- `verify(token, remoteIp?)` - Verifies hCaptcha token

**Features**:
- Server-side verification
- IP address logging
- Error handling for verification failures

**Tests**: 10+ tests covering verification scenarios

---

#### `InMemoryRateLimiter`
**Implements**: `RateLimiter` interface
**Purpose**: In-process rate limiting keyed by `action:identifier` (registration, login, etc.)

**Methods**:
- `checkLimit(key)` - Checks if rate limit exceeded
- `increment(key)` - Increments request count

**Features**:
- Per-action configurable limits/windows (defaults: registration 5/hour, login 10/15min, 100/hour
  otherwise)
- Automatic cleanup of expired entries
- In-memory `Map` storage — **only sees traffic on the process it runs in**

**Relationship to `MongoDBRateLimitRepository`**: this limiter predates the persisted one and is
still used for registration/login rate limiting, where single-instance-approximate limiting is an
acceptable tradeoff. Call sites that need correctness across serverless instances (autocomplete,
completion telemetry, canon-fact extraction) use `MongoDBRateLimitRepository` instead — see
[Persistence → `MongoDBRateLimitRepository`](#mongodbratelimitrepository--persisted-cross-instance-rate-limiting).

**Tests**: 15+ tests covering rate limiting scenarios

---

### Spell Checking (offline, no AI tokens)

There is **no infrastructure class** for spell checking — worth calling out explicitly since a
domain interface exists (`src/domain/interfaces/SpellChecker.ts`, `correct(word)` /
`suggest(word)`) but nothing under `src/infrastructure/` implements it. The
[nspell](https://github.com/wooorm/nspell) instance is constructed directly inside the server
action that needs it, `src/app/actions/spell-check-actions.ts`:

- Reads the `dictionary-fr` package's `.aff`/`.dic` files from `node_modules` directly with
  `fs.readFile` (rather than importing `dictionary-fr` normally) because Turbopack rewrites that
  package's `import.meta.url` to a bundle URL `fs.readFile` can't resolve
- Lazily constructs a module-level singleton `Nspell` instance cast to the `SpellChecker` interface
- `checkSpellingAction(words, customWords?)` checks each word: accepted unconditionally if
  capitalized (proper nouns/place names/sentence starts, common in fiction) or in the project's
  custom dictionary, otherwise checked against the French dictionary (case-sensitive then
  lowercased); misspelled words get up to 5 suggestions

This **replaced** an AI-based `analyzeSpelling()` path that used to live on `AnalysisLLMClient`
(removed 2026-06-23/25) — spell checking now costs zero AI tokens. See
[AI Provider → `AnalysisLLMClient`](#analysisllmclient-⭐-new-phase-7) for what that client covers
today (grammar/punctuation/style/repetition only).

---

### Prompts ⭐ NEW (Phase 3.6)

#### `FilePromptRepository`
**Implements**: `PromptRepository` interface
**Purpose**: Load AI prompts from markdown files

**Features**:
- Loads prompts from `/docs/prompt/metadata/` directory
- Version-controlled prompts (tracked in Git)
- Supports all 7 metadata analysis types
- File-based prompt management
- Error handling for missing prompts

**Methods**:
- `getPrompt(type: MetadataType)` → `Promise<string>`

**File Structure**:
```
docs/prompt/metadata/
├── narrative_analysis.md
├── characters.md
├── plot.md
├── stylistic_dna.md
├── worldbuilding.md
└── synthesis.md
```

**Tests**: 5+ tests covering prompt loading and error handling

---

### Utils ⭐ ENHANCED (Phase 7)

#### `UUIDGenerator`
**Implements**: `IdGenerator` interface
**Purpose**: UUID generation for entity IDs

**Features**:
- Uses `crypto.randomUUID()` for secure UUID generation
- Stateless, no external dependencies
- Used by CreateProjectUseCase and CreateProviderUseCase

**Methods**:
- `generate()` → `string` - Returns a new UUID v4

**Tests**: 3+ tests covering UUID generation

---

#### `text-hasher` (Phase 3.6) — ⭐ MOVED to Application (Phase 8.0)
**Purpose**: SHA-256 content hashing for cache invalidation

`hashText` now lives in `src/application/utils/text-hash.ts`. It moved out of Infrastructure in
Phase 8.0 because the Application layer (the Generate* use cases and `CheckMetadataFreshnessUseCase`)
consumes it directly and must not depend on Infrastructure. The old infrastructure file was
removed. There is no separate `ContentHashService` — an earlier version of this document described
one, but no such class exists in the codebase; `hashText` is the single content-hashing utility.

---

#### `ObjectIdGenerator` ⭐ NEW (Phase 6)
**Purpose**: Generate MongoDB ObjectIds on the frontend

**Features**:
- Generates valid MongoDB ObjectIds
- Works in browser environment
- Used for optimistic UI updates

**Functions**:
- `generateObjectId()` → `string` - Returns a new ObjectId string

**Tests**: 3+ tests covering ObjectId generation

---

#### `canon-facts-parsing.ts`
**Purpose**: Shared request-building and response-validation helpers for canon-fact extraction,
kept identical across the three `LLMProvider` implementations

**Functions**:
- `buildCanonFactsUserMessage(fullText, characterNames)` - Builds the extraction prompt's user
  message (known cast + full manuscript; chapter order defines each fact's 0-based `validFromChapter`)
- Validates/normalizes the LLM's JSON output against `CanonFacts`/`isValidExtractedCanonFact`

---

#### `exchange-truncation.ts`
**Purpose**: Caps the byte size of captured AI Transparency Ledger content before encryption and storage

**Functions**:
- `MAX_EXCHANGE_FIELD_BYTES` = 50 KB per field (input/systemPrompt/output)
- Truncates oversized content with a `'…[contenu tronqué]'` marker rather than rejecting it —
  analysis operations legitimately send a whole manuscript, so unbounded storage would bloat the
  database

Used by `MongoDBExchangeRepository.save()` before content reaches `FieldEncryption`.

---

### Configuration ⭐ ENHANCED (Phase 7)

#### `env.ts`
**Purpose**: Environment variable validation and access

**Variables** (grouped under `config.*`):
- `OPENAI_API_KEY` / `OPENAI_MODEL` - Fallback provider used before a user configures their own
- `MONGODB_URI` / `MONGODB_DB_NAME` - MongoDB Atlas connection
- `AUTH_SECRET` / `AUTH_TRUST_HOST` - Auth.js session secret and Vercel host-trust override
- `ENCRYPTION_KEY` - Shared secret both `crypto.ts` (provider API keys) and `FieldEncryption`
  (transparency-ledger content) derive their PBKDF2 keys from, with distinct salts
- `RESEND_API_KEY` / `ADMIN_EMAIL` / `EMAIL_FROM` - Email service
- `NEXT_PUBLIC_APP_URL` (falls back to `VERCEL_URL`, then `localhost:3000`) - Base URL used to
  build email links and asset URLs for PDF export

**Features**:
- `validateConfig()` runs at startup: warns (dev) or throws (production) on missing/short
  secrets, and enforces `AUTH_SECRET`/`ENCRYPTION_KEY` are ≥ 32 characters
- Type-safe access via the `config` object (`as const`)

---

#### `ai-models.ts`
**Purpose**: Static display metadata for provider setup UI — not runtime provider selection logic

**Exports**:
- `PROVIDER_NAMES` - Display name per `ProviderType` (`'OpenAI'`, `'Anthropic'`, `'Google AI'`)
- `PROVIDER_DOCS` - Setup documentation URL per provider, shown when a user adds a `Provider`

---

#### `database.ts` ⭐ NEW (Phase 3)
**Purpose**: MongoDB Atlas connection management

**Features**:
- Singleton connection instance
- Connection pooling
- Automatic reconnection
- Error handling and logging
- Graceful shutdown

**Functions**:
- `getDatabase()` - Returns the cached MongoDB `Db` handle, connecting lazily
- Connection caching for serverless environments

**Tests**: 10+ tests covering connection scenarios

---

#### `providers.ts` ⭐ Composition root

**Purpose**: Single dependency-injection composition root — every use case and server
action/route gets its infrastructure implementations from here rather than `new`-ing MongoDB
repositories directly. This file grows with every new repository/service and is intentionally
not exhaustively enumerated below (last full audit: ~30 exported factory functions); treat this
as a representative sample and **read the file itself** for the current, complete list.

**Repository factories** (one `get*Repository()` per interface documented in
[Persistence](#persistence-⭐-enhanced-phase-7) above) — most are lazily-instantiated module-level
singletons that call `ensureIndexes()` on first use, e.g.:
- `getProjectRepository()` - `MongoDBProjectRepository` in production, `InMemoryProjectRepository`
  under `NODE_ENV === 'test'` (unless `USE_REAL_DB` is set)
- `getUserRepository()`, `getProviderRepository()`, `getMetadataRepository()`,
  `getCharacterRepository()`, `getAIExchangeRepository()` (wires in `getFieldEncryption()`),
  `getCanonFactRepository()` / `getCanonExtractionStateRepository()` (share one instance),
  `getRateLimitRepository()`, `getBookPreviewCacheRepository()`, … and the rest of the
  repositories listed above

**Non-repository factories**:
- `getAuthProvider()` → `AuthJsProvider`
- `createLLMProvider(provider: Provider)` → `LLMProvider` - Instantiates OpenAI/Anthropic/Google
  directly from a `Provider` entity's type, **bypassing `LLMProviderFactoryImpl`**. This is the
  function actually used on the request path (`LLMProviderFactoryImpl` above is used by the
  provider-testing use cases). The duplication is worth flagging as a possible latent
  inconsistency to eventually consolidate, but is left as-is here — this document only describes
  what exists.
- `getDocumentParser()` → `CompositeDocumentParser([DocxParser, MarkdownParser])`;
  `getDocxParser()` is a `@deprecated` alias kept for backward compatibility
- `getFolderParser()` → `MarkdownFolderParser`
- `getDocumentExporter(format: 'docx' | 'pdf' = 'docx')` → `DocxExporter` or
  `PagedPdfExporter(config.app.baseUrl, new PlaywrightBrowserLauncher())`
- `getBookPreviewCacheComputer()` → `BookPreviewCacheComputer` wired to
  `PlaywrightBrowserLauncher` + `PagedJsRenderer` + `WholeBookHtmlAssembler`
- `getContentConverter()` → `TipTapContentService`
- `getBlobStorage()` → `VercelBlobStorage('covers')`
- `getPromptRepository()` → `FilePromptRepository`

**Benefits**:
- Centralized dependency injection
- Easy swapping of implementations
- Testability with mocks
- Singleton pattern for repositories that need `ensureIndexes()`

**Tests**: Covered indirectly through the use cases/actions that consume these factories, plus
targeted provider-instantiation tests.

---

## Integration Testing

**Document Pipeline** (2 tests):
- DOCX import → Chapter entities → DOCX export
- Round-trip formatting preservation validation

**OpenAI Integration** (4 tests):
- Real API calls with GPT-4o-mini
- Proposal generation with actual context
- Performance validation (2.7-3.3s actual)
- Diversity verification across proposals

---

## Design Decisions

### Why TipTap JSON?

**Benefits**:
- Structured, parseable format
- Direct mapping to/from editor
- Ready for search and analysis
- Compatible with MongoDB (BSON)
- Framework-agnostic

**Trade-offs**:
- Larger than plain text (~2-3x)
- Requires conversion to/from DOCX
- Limited to TipTap-supported formatting

### Why mammoth.convertToHtml()?

**Phase 1**: Used `mammoth.extractRawText()` (plain text only)
**Phase 2**: Switched to `mammoth.convertToHtml()` (formatting preserved)

**Rationale**:
- HTML is intermediate format easy to parse
- Preserves bold, italic, underline, highlight
- Standard DOM API for parsing
- Reliable H1 detection for chapter splitting

### Why docx library?

**Alternatives Considered**:
- mammoth (read-only, no export)
- docx-templates (complex, overkill)
- html-docx-js (poor formatting control)

**Why docx**:
- Full programmatic control
- Excellent formatting support
- Active maintenance
- TypeScript support

### Why Paged.js + headless Chromium for PDF export, not pdf-lib?

**`pdf-lib` (`PdfExporter`, superseded)**: draws every page by hand — text runs, positioning,
page breaks, special-character transliteration. Correct but a second, independent layout engine
that inevitably drifts from what the in-app editor/preview actually shows.

**`PagedPdfExporter` (current)**: renders the *same* semantic HTML + CSS the whole-book preview
uses, paginates it with Paged.js inside real Chromium, and lets the browser's own print pipeline
produce the PDF. Slower and heavier (a browser process per export/preview computation) but
guarantees preview/export parity and gets correct native text layout, hyphenation, and font
handling for free instead of reimplementing it.

---

## Performance

All infrastructure operations exceed targets:

| Operation | Target | Actual | Status |
|-----------|--------|--------|--------|
| Export Project (DOCX) | < 2s | 57ms | ✅ 35x faster |
| In-Memory Save | < 100ms | ~0.1ms | ✅ 1000x faster |
| In-Memory Load | < 100ms | ~0.1ms | ✅ 1000x faster |
| OpenAI Rewrite | < 3s | 2.7-3.3s | ✅ Within target |

PDF export (`PagedPdfExporter`) is not in this table — it launches a headless Chromium instance
per call and its latency is dominated by browser startup + Paged.js pagination, not by
infrastructure-layer code; see the whole-book preview cache
(`MongoDBBookPreviewCacheRepository`) for how repeated PDF renders are avoided.

---

## Changelog

For phase-by-phase implementation history, see [CHANGELOG.md](../../CHANGELOG.md).
