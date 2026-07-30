# Interface Layer (App Router + Components)

Next.js App Router pages, layouts, UI components, and state management.

## Rules:
- Depends on Application and Domain layers
- Orchestrates use cases via Server Actions and Zustand store
- No business logic in components
- UI components are pure presentation
- State management delegated to Zustand store

## Contents:

### App Router

---

#### `app/page.tsx` (Landing page)
**Purpose**: Public marketing landing page for Revise Studio

**Features**:
- Value proposition, feature cards, testimonials, beta-signup CTA
- `ContactForm` component (submits to `contact-actions.ts`)
- SEO metadata (title/description)

**Note**: This is the marketing landing page, not the editor. The manuscript editor
lives at `app/editor/page.tsx` (see below).

---

#### `app/editor/page.tsx` (Main editor page)
**Purpose**: The manuscript editor — loads a project from the database via the
`?project={id}` URL param and coordinates writing, AI, and publication-preview features

**Features**:
- A4-equivalent semantic editing pane alongside a live paged (Chromium/Paged.js)
  publication preview, both driven by `EditorPreviewLayout`
- Project/chapter loading from MongoDB, auto-redirect to dashboard if no project ID
- Session-based project access (only projects owned by the authenticated user)
- **SaveStatus** indicator for auto-save progress
- **FormattingToolbar** for rich text and typography controls
- **ChaptersSheet** (left panel) for chapter navigation
- **ProposalsSheet** (right panel) for AI rewrite proposals, **PublishDialog**,
  **ExportDialog**, **CommandPalette**, **SearchReplaceBar**
- **CorrectionHistoryDialog** and **SnapshotHistoryDialog** (two independent history
  features — see "Distinguishing the two history features" below)
- **ThesaurusPalette**, spell-check (via `SpellCheckExtension`/`SpellCheckPalette`,
  wired inside `TextEditor`), autocomplete (Tab-triggered ghost text via the
  `Autocomplete` TipTap extension)
- **EndnoteModal** / **EndnotesPanel** for endnote authoring and browsing, resolved
  across chapters via `useEndnoteLocator`
- **PublicationProfileSelector**, **LevelStylesPanel**, **PublicationPreview**,
  **BackgroundPageCounter** — live publication-profile switching and page-count caching
  (see "Publication profiles & book pagination" below)
- **FloatingGenerationMenu** / **AnalysisConfigDialog** / **ChapterAnalysisPanel** for
  AI chapter generation and chapter verification (grammar, punctuation, style, repetition)
- **NotificationBell** (project-scoped notifications, e.g. canon staleness)
- Session-end canon-freshness check via `useSessionEndTrigger` + `useCanonFreshnessCheck`

**Server Actions used** (non-exhaustive — this page is the main integration point):
`rewrite-text.ts`, `provider-actions.ts`, `project-actions.ts`,
`chapter-generation-actions.ts`, `project-settings-actions.ts`,
`presentation-override-actions.ts`, `analysis-actions.ts`

**Workflow**:
1. Load project from database (via URL param)
2. Import DOCX/Markdown folder → chapters created in store and saved to database
3. Navigate chapters via ChaptersSheet (auto-saves to MongoDB)
4. Edit with formatting/spell-check/thesaurus/autocomplete → auto-saves after 1s
5. Rewrite text → ProposalsSheet; generate chapter → FloatingGenerationMenu
6. Export project → DOCX or PDF, format derived from the active publication profile

---

#### `app/dashboard/page.tsx`
**Purpose**: Project management dashboard

**Features**:
- Lists all projects for the authenticated user
- **CreateProjectDialog** for new project creation with title input
- Project cards with metadata (title, last updated, chapter count)
- Rename project (inline editing), delete project (with confirmation dialog)
- Empty state for new users, auto-redirect to editor on project click
- **NoProvidersAlert** when no AI providers configured

**Components Used**: `CreateProjectDialog`, `ProjectCard`, `EmptyState`,
`AlertDialog`, `Dialog`, `NoProvidersAlert`

**Server Actions**:
- `loadProjectsAction` → `ListProjectsUseCase`
- `createProjectAction` → `CreateProjectUseCase`
- `renameProjectAction` → `UpdateProjectTitleUseCase`
- `deleteProjectAction` → `DeleteProjectUseCase`

---

#### `app/auth/signin/page.tsx`
**Purpose**: User sign-in page

**Features**: Email/password form, validation, error messages, auto-redirect to
dashboard, link to sign-up and to `/auth/forgot-password`

**Server Actions**: `signInAction` — validates credentials, creates session

---

#### `app/auth/signup/page.tsx`
**Purpose**: User registration page

**Features**: Email/password form, password confirmation, validation, error
messages (duplicate email, weak password), auto-redirect to dashboard

**Server Actions**: `signUpAction` — creates user, hashes password, creates session

---

#### `app/auth/forgot-password/page.tsx`
**Purpose**: Password reset request page

**Features**: Email input, submits to `requestPasswordResetAction`, always shows a
neutral "check your email" confirmation state (does not reveal whether the email exists)

**Server Actions**: `requestPasswordResetAction` → `RequestPasswordResetUseCase`
(`app/actions/password-actions.ts`)

---

#### `app/auth/reset-password/page.tsx`
**Purpose**: Password reset completion page, gated by a one-time token in the URL

**Features**: Reads `?token=` from the URL, new-password + confirmation form, error
state for an invalid/expired token, success state with link to sign-in

**Server Actions**: `resetPasswordAction` → `ResetPasswordUseCase`
(`app/actions/password-actions.ts`, throws `InvalidTokenError` on a bad/expired token)

---

### Project Cockpit (`app/project/[projectId]/cockpit/**`)

The cockpit is the project's control-panel: a sidebar-driven set of sub-pages
(`CockpitSidebar` groups them into "Pilotage" — overview, tasks, objectives,
settings — and "Contenu" — characters, metadata, canon, research, usage).

---

#### `app/project/[projectId]/cockpit/page.tsx`
**Purpose**: Cockpit overview — project statistics (word count, chapter count,
reading time, progress)

---

#### `app/project/[projectId]/cockpit/characters/page.tsx`
**Purpose**: Character management — create, view, edit, delete character profiles

**Components Used**: `CharacterCard`, `CharacterForm`, `CharacterChatSheet`

---

#### `app/project/[projectId]/cockpit/canon/page.tsx`
**Purpose**: Canon facts registry — the authoritative, atomic list of established
facts per character/entity, each with a valid-chapter range (`validFromChapter` /
`validToChapter`)

**Features**:
- Facts grouped by entity (character name), sorted alphabetically
- Each fact tagged **auteur** (author-entered, never overwritten by regeneration) or
  **dérivé** (extracted by AI)
- Manual create/edit/delete of facts (author-sourced facts only — editing a derived
  fact re-tags it as author-sourced)
- **Générer / Régénérer** button — runs `GenerateCanonFactsUseCase`, an incremental
  extraction that replaces only derived facts and always preserves author facts
- Rate-limited to 1 generation per 30s per project (fixed-window, fails open on a
  limiter-store outage)
- Staleness detection: `checkCanonFreshnessAction` hashes the current manuscript text
  and compares it to the hash stored on each derived fact; a mismatch shows a
  **"Faits canon périmés"** banner and pushes an actionable `canon-stale` notification
  (via `useNotificationStore`) offering a one-click regenerate
- Delete confirmation dialog (facts, including author ones, are never removed silently)

**Server Actions** (`app/actions/canon-actions.ts`):
- `listCanonFactsAction`, `createCanonFactAction`, `updateCanonFactAction`,
  `deleteCanonFactAction`
- `generateCanonFactsAction` → `GenerateCanonFactsUseCase` (rate-limited)
- `checkCanonFreshnessAction` — compares current manuscript hash to stored fact hashes

**Related settings**: `CanonExtractionPreferencesCard` (on the cockpit Settings page)
controls whether extraction also triggers automatically at session end
(`useSessionEndTrigger` + `useCanonFreshnessCheck` in the editor).

---

#### `app/project/[projectId]/cockpit/metadata/page.tsx` and `.../metadata/[metadataId]/page.tsx`
**Purpose**: Cockpit-nested metadata list and editor — generate and edit AI
narrative-analysis documents (narrative, characters, plot, stylistic DNA, worldbuilding,
synthesis, chapter summaries) for the project

**Features** (list page):
- `GenerateCard` for creating new analyses, `MetadataCard` per existing analysis
- **Staleness detection** — `checkMetadataFreshnessAction` flags analyses whose source
  chapters have changed since generation, shown per-card

**Features** (editor page): TipTap rich-text editor (reused from the chapter editor),
auto-save, title editing, formatting toolbar

**Server Actions** (`app/actions/metadata-actions.ts`): `listMetadataAction`,
`generateNarrativeAnalysisAction`, `generateCharactersAction`, `generatePlotAction`,
`generateStylisticDNAAction`, `generateWorldbuildingAction`, `generateSynthesisAction`,
`generateChapterSummariesAction`, `checkMetadataFreshnessAction`,
`updateMetadataContentAction`, `updateMetadataTitleAction`, `deleteMetadataAction`

> **⚠ Route duplication**: `app/project/[projectId]/metadata/**` (below) is an older,
> separate route wired to the *same* `metadata-actions.ts` but without freshness
> detection. Both routes are live in the codebase today; the cockpit-nested one
> (`cockpit/metadata/**`) is the current, actively-linked path (reachable from
> `CockpitSidebar` / `ProjectSettingsMenu`) and the one that should be kept. The
> older `project/[projectId]/metadata/**` route should be considered for
> deprecation/removal to avoid two parallel UIs for the same data.

---

#### `app/project/[projectId]/metadata/page.tsx` and `.../metadata/[metadataId]/page.tsx` (older route)
**Purpose**: Metadata list and editor — same underlying `metadata-actions.ts` as the
cockpit-nested route above, but **without** staleness detection

**Status**: Superseded by `cockpit/metadata/**`. Kept for now; see the duplication
note above.

---

#### `app/project/[projectId]/cockpit/editorial/page.tsx`
**Purpose**: Editorial annexes (front/back matter — dedication, epigraph, legal
notice, custom annexes) — cards per editorial type with TipTap editing, built on the
existing `ProjectMetadata` infrastructure plus `custom-annex-actions.ts` for
author-inserted annexes

---

#### `app/project/[projectId]/cockpit/objectives/page.tsx`
**Purpose**: Writing objectives — recurring daily/weekly writing quotas and progress
metrics (distinct from the older one-off `WritingGoal` feature, see below)

**Features**:
- CRUD for recurring quotas (`QuotaPeriod`: daily/weekly, target word count)
- **ActivityChart** — bar chart of words written per day; revision days (negative
  deltas) are shown distinctly, never framed as a failure
- **TodayPaceCard** — compact widget showing the author's current writing rhythm,
  timezone-aware
- **MilestoneMetricsCard** — pace, projection, streak, and average, framed as
  encouragement rather than pressure (per the product's founding principles)

**Server Actions** (`app/actions/writing-quota-actions.ts`): `createWritingQuotaAction`,
`listWritingQuotasAction`, `updateWritingQuotaAction`, `deleteWritingQuotaAction`; plus
`cockpit-actions.ts` → `getWorkflowMetricsAction` for the pace/streak metrics

**Distinct from**: `writing-goal-actions.ts` / the `WritingGoal` entity, an older,
simpler one-off goal (not recurring). Both exist in the codebase; the quota system is
the current, richer feature.

---

#### `app/project/[projectId]/cockpit/research/page.tsx`
**Purpose**: Research documents — notes, links, quotes, references attached to the
project

**Server Actions**: `research-document-actions.ts`

---

#### `app/project/[projectId]/cockpit/tasks/page.tsx`
**Purpose**: Project task board — table with filtering, creation, editing

**Server Actions**: `task-actions.ts`

---

#### `app/project/[projectId]/cockpit/usage/page.tsx`
**Purpose**: Detailed AI usage statistics for the project — charts and historical
cost/token data

**Server Actions**: `usage-actions.ts`; also embeds **AutocompleteStatsCard**
(acceptance/partial-acceptance/rejection/deletion rates and latency percentiles for
autocomplete, from `completion-actions.ts` / `/api/completion/telemetry/stats`)

---

#### `app/project/[projectId]/cockpit/settings/page.tsx`
**Purpose**: Project settings — title, cover, narration settings, contributors,
publication profile, and per-feature preference cards

**Components Used**: `AutocompletePreferencesCard` (suggestion length, audace, partial
acceptance, opt-in learning), `CanonExtractionPreferencesCard` (auto-trigger at session
end vs. manual only), `SpellCheckSettingsCard` (custom dictionary, ignored words)

**Server Actions**: `project-settings-actions.ts`

---

### AI Transparency Ledger

#### `app/historique-ia/page.tsx`
**Purpose**: "Journal de transparence IA" — the author's per-user, cross-project log
of every captured AI exchange

**Features**:
- Authenticated, scoped to the signed-in user (redirects to `/auth/signin` if
  unauthenticated)
- Lists exchange **metadata only** by default (operation, provider, model, tokens,
  cost, duration, timestamp); search and filters operate on metadata only
- Content (system prompt, input, output) is **decrypted only on demand**, when a row
  is expanded — this is the only path in the app that decrypts stored exchange content
- Cross-project: shows exchanges from every project the author owns

**Components Used**: `AIExchangeLedger` (interactive, cross-project table with a
plain-language detail view)

**Server Actions** (`app/actions/exchange-actions.ts`):
- `listAIExchangesAction` — metadata-only summaries, with filters (project, operation,
  model, date range)
- `getAIExchangeFacetsAction` — distinct models for filter UI
- `getAIExchangeAction` — decrypts and returns a single exchange's full content
- `getAIExchangeLoggingAction` / `setAIExchangeLoggingAction` — opt-in and retention
  window (1–365 days); enabling fails fast if the server-side encryption key isn't
  configured
- `purgeAIExchangesAction` — permanently erases all captured exchanges for the user

**Related settings**: `AIExchangeLoggingCard` (on `/settings`) — lets the author
opt in/out of content capture, choose the retention window, and trigger
`purgeAIExchangesAction` ("erase captured content").

---

### Dynamic AI Pricing (admin-only)

#### `app/admin/pricing/page.tsx`
**Purpose**: Admin page for managing AI model pricing entries synced from OpenRouter

**Features**:
- Gated by `getAuthenticatedAdminId()` (redirects to sign-in otherwise — this is a
  true admin-only page, not a role toggle in the UI)
- Table of all pricing entries (USD per million tokens), sorted by provider/prefix
- **SyncButton** — triggers `SyncModelPricingUseCase` against the OpenRouter pricing
  API, reports new/updated models
- **PruneButton** — deletes pricing entries no longer present upstream, with a
  confirmation and a removed-count summary
- **ModelPricingForm** / **ModelPricingTable** — manual edit of a single entry's
  input/output/cached-input rates and the `cachedInInput` flag

**Server Actions** (`app/actions/pricing-admin-actions.ts`, all admin-gated):
`listModelPricingAction`, `updateModelPricingAction`, `deleteModelPricingAction`,
`triggerPricingSyncAction`, `prunePricingAction`

**Related route**: `app/api/cron/sync-pricing/route.ts` — Vercel cron `GET` endpoint,
protected by a `CRON_SECRET` bearer token (when set), runs `SyncModelPricingUseCase`
on a daily 06:00 UTC schedule and emails a sync report via `ResendEmailService`.

---

### Settings & Account

#### `app/settings/page.tsx`
**Purpose**: User account settings page

**Features**:
- **Account deletion** — email-confirmation gated: the author must re-type their
  account email before the delete button becomes enabled; calls
  `deleteAccountAction` (in `auth-actions.ts`, not `user-actions.ts`)
- **Data export (RGPD Article 20)** — `exportUserDataAction` produces a full data
  portability export
- **AIExchangeLoggingCard** — AI transparency ledger opt-in/out and retention (see
  above)
- Password change via `changePasswordAction` (`password-actions.ts`)
- Profile information display, consent information, danger zone for destructive actions

**Server Actions**: `user-actions.ts` (`exportUserDataAction`), `auth-actions.ts`
(`deleteAccountAction`), `password-actions.ts` (`changePasswordAction`)

---

#### Legal Pages

**`app/mentions-legales/page.tsx`** — Legal mentions (LCEN compliance)
**`app/politique-confidentialite/page.tsx`** — Privacy policy (RGPD)
**`app/politique-cookies/page.tsx`** — Cookie policy
**`app/conditions-generales-utilisation/page.tsx`** — Terms of use (CGU)
**`app/conditions-generales-vente/page.tsx`** — Terms of sale (CGV)

Static legal content pages, French legal compliance, back navigation.

---

### Blog + Admin CMS

Public blog with a minimal admin CMS behind it, sharing `blog-actions.ts` for both
public reads and admin-only writes.

#### `app/blog/page.tsx`
**Purpose**: Public blog article list — published articles only, ISR-revalidated

#### `app/blog/[slug]/page.tsx`
**Purpose**: Public individual article page — full content, author/date, SEO
metadata with Open Graph; embeds **ViewCounter** (client component that records a
view once per 24h via a cookie + IP hash, calling `recordArticleViewAction`)

#### `app/admin/blog/page.tsx`
**Purpose**: Admin article list (published and drafts) — gated by
`getAuthenticatedAdminId()`, redirects to sign-in otherwise

**Components Used**: `BlogArticleList` (status, dates, edit/delete with confirmation)

#### `app/admin/blog/new/page.tsx` and `app/admin/blog/[id]/edit/page.tsx`
**Purpose**: Admin article create/edit forms — admin-gated

**Components Used**: `BlogArticleForm` (slug generation, markdown preview, publish
toggle, validation) — shared between create and edit modes

**Server Actions** (`app/actions/blog-actions.ts`):
- Public: `getPublishedArticlesAction`, paginated variant, `getArticleBySlugAction`,
  `recordArticleViewAction`
- Admin-only (`getAuthenticatedAdminId`): `createArticleAction`, `updateArticleAction`,
  `deleteArticleAction`, `listAllArticlesAction`, `getArticleByIdAction` — all
  `revalidatePath` the public blog routes (ISR) on write

---

### Whole-Book Preview & Pagination

#### `app/book-preview/page.tsx`
**Purpose**: "Whole-book" preview — renders the actual, server-generated
Chromium/Paged.js export PDF (cached in GridFS) inside an iframe, so what the author
sees is exactly what export produces

**Features**:
- Lazy generation: cold-cache generation of a 300–400-page book in Chromium can take
  a while, so the page shows a spinner up to a **150s client-side timeout**, with a
  "Réessayer" retry action
- Profile switcher (preview-only — does **not** change the project's active
  publication profile) between the print-ready profiles (KDP 6×9, A5)
- **Passerelle** pass-through: when the project's active profile is `passerelle`
  (Word/Google Docs sharing target), there is no paginated whole-book preview — the
  page shows an explanatory message instead
- Sidebar chapter (and sub-title, when TOC depth includes them) navigation that jumps
  the PDF via `#page=N` iframe anchors; the iframe is re-keyed on each jump because
  Chromium's built-in PDF viewer only honours `#page=N` at initial load

**Route config**: `app/book-preview/layout.tsx` — sets `maxDuration = 300` for the
route segment (the page itself is a Client Component and can't export route segment
config directly); cold whole-book pagination can wait up to ~120s server-side.
Vercel Hobby plans hard-cap function duration at 60s regardless of this value.

**Server Actions** (`app/actions/book-preview-actions.ts`): `getBookPreviewDataAction`
— lazily generates and caches the export PDF (content-hash keyed, so unchanged content
reuses the cache), returns navigation metrics (chapter/sub-title page offsets, total
page count) — the PDF bytes themselves are streamed by the route below.

**Related route**: `app/api/book-preview/pdf/route.ts` — streams the cached
whole-book PDF from GridFS for the authenticated owner (`project` + `profile` query
params, 404 if not yet cached, `Cache-Control: private, no-store`).

> **Production PDF exporter**: the production PDF pipeline is
> **`PagedPdfExporter`** (Chromium + Paged.js), not `pdf-lib`. It shares the same
> `PagedJsRenderer` / `TipTapToBookHtml` rendering path used by the in-editor
> `PublicationPreview` and the whole-book preview above, so preview and export stay
> visually identical.

---

#### `app/editor/paged-spike/page.tsx` — dev-only / experimental
**Purpose**: **"Spike #122"** — an isolated, standalone route proving live KDP 6×9
in-editor pagination with the shared `PagedJsRenderer`/`TipTapToBookHtml` renderer,
against a deterministic fixture (`fixture.ts`), independent of any persisted project

**Features**:
- Debounced (300ms) TipTap editor whose content re-renders through the paged
  preview iframe
- Reports live page-count and pagination-timing metrics (`data-page-count`,
  `data-pagination-ms`) received via `postMessage` from the preview iframe

**Related route**: `app/api/paged-spike/export/route.ts` — **dev-only**, returns
404 in production (`NODE_ENV === 'production'` check at the top of the handler).
Renders the posted TipTap content through the same Paged.js pipeline and exports a
PDF via a Playwright-launched headless Chromium — used only to validate the
rendering pipeline during development, not part of the production export path.

> Both files are explicitly experimental/spike code (see the file headers) and
> should not be treated as production surfaces.

---

### Publication Profiles & Book Pagination (components)

These components implement the shared "paged media" pipeline used by both the
in-editor preview and the whole-book preview/export above.

**`PublicationPreview`** (`components/editor/PublicationPreview.tsx`)
**Purpose**: Renders the active chapter through the shared `PagedJsRenderer` /
`TipTapToBookHtml` pipeline inside the editor

**Features**: Regenerates on content change (300ms debounce) and on publication
profile change; drives page-count reporting via `onPageCountChange`; carries editor
scroll position across re-renders via 1000-word scroll segments

---

**`PublicationProfileSelector`** (`components/editor/PublicationProfileSelector.tsx`)
**Purpose**: Controlled `<select>` between the print-ready profiles (KDP 6×9, A5) and
"Passerelle Word / Google Docs" — owns no switch behavior itself, just presentation

---

**`LevelStylesPanel`** (`components/editor/LevelStylesPanel.tsx`)
**Purpose**: Author-facing typography controls, one editable style per semantic text
role (titre-de-chapitre, sous-titre, corps, citation, épigraphe)

**Features**: Bound to exactly one `LevelStyleSet` for the currently active PDF
profile (KDP 6×9 or A5 — not applicable to passerelle); popover UI

---

**`BackgroundPageCounter`** (`components/editor/BackgroundPageCounter.tsx`)
**Purpose**: Silently renders one uncached chapter at a time in a hidden off-screen
iframe to populate the client-side page-count cache

**Features**: Cycles through the chapter queue via `onPageCount` callbacks; the
parent (editor page) is responsible for advancing to the next chapter

---

**`useBookPageOffset`** (`hooks/useBookPageOffset.ts`)
**Purpose**: Client-side page-count cache and book-wide page-offset computation

**Features**: Cache keyed by `profileId` (a profile switch evicts and recomputes
everything); per-chapter cache entries are evicted when a chapter's
`contentVersion` (last-edited timestamp) changes

---

**`presentation-override-actions.ts`** (`app/actions/presentation-override-actions.ts`)
**Purpose**: Save/load "passerelle"-only visual tweaks (`PresentationOverrideLayer`),
stored **separately** from chapter content so they're never destructive to the
manuscript

**Server Actions**: `savePresentationOverridesAction`, `loadPresentationOverridesAction`

---

**`ExportDialog`** (`components/document/ExportDialog.tsx`)
**Purpose**: Export dialog with chapter selection

**Features**: Export **format is derived from the active publication profile** — DOCX
for `passerelle`, PDF for print-ready profiles — there is no free format choice.
Calls `exportProject` / `exportProjectPdf` (defined in `app/actions.ts`, see the
Server Actions inventory below)

---

**`DocumentControls`** (`components/document/DocumentControls.tsx`)
**Purpose**: Header export-controls dropdown (DOCX / PDF), invoking the same
`exportProject` / `exportProjectPdf` server actions as `ExportDialog`

**Features**: Loading states during export, async handlers with error handling

---

### Endnotes

**`EndnoteModal`** (`components/editor/EndnoteModal.tsx`)
**Purpose**: Centered modal to compose an endnote's body

**Features**: Mini TipTap editor (Document/Paragraph/Text/Bold/Italic/Link only —
not the full formatting toolbar), returns the body as `EndnoteContent` (TipTap JSON)
on validate

---

**`EndnotesPanel`** (`components/editor/EndnotesPanel.tsx`)
**Purpose**: Read-only Sheet listing every endnote in the project, grouped by
chapter and numbered exactly as they will appear at export

**Features**: Edit/delete actions per note dispatch through `useEndnoteLocator`
(below); open state is controlled by the host page

---

**`EndnoteRef`** (`components/editor/extensions/EndnoteRef.ts`)
**Purpose**: TipTap mark/node extension implementing endnote references in the
manuscript

**Exports**: `isEndnoteContentEmpty()` helper, `EndnoteContent` type,
`findEndnoteRefByRank()` (used by `useEndnoteLocator`)

---

**`useEndnoteLocator`** (`hooks/useEndnoteLocator.ts`)
**Purpose**: Resolves an endnotes-panel action (chapter, rank) to a document
position — switches chapters first if needed and waits for the editor's real
re-seed (`readyChapterId`) before dispatching edit/delete

---

### Redesigned Autocomplete (v2)

#### `app/api/completion/stream/route.ts`
**Purpose**: SSE streaming endpoint for Tab-triggered and prefetched autocompletion

**Features**:
- Accepts `intent` (`natural`/etc.), `suggestionLength`, and `audace` preference
  parameters, validated against domain value objects, and prepended to the LLM
  context as directives
- **Two separate per-user rate-limit buckets**, both fixed-window and fail-open:
  60/min for manual (Tab-triggered) completions, 20/min for speculative prefetch —
  so a chatty prefetch can never starve the budget for completions the author
  actually asked for
- Input-size caps: 8000 chars before cursor, 2000 chars after — rejects (413)
  anything larger before doing any billed work
- Builds context via `AutocompleteContextBuilder` (previous chapters + canon facts);
  detects which known characters appear in the local text window via
  `detectEntities()` and injects only the temporally-valid canon facts for them
- Streams `metadata` (provider/model/canon-fact-count), text chunks, then a `done`
  event carrying first-token latency, all as SSE `data:` frames

---

#### `app/api/completion/telemetry/route.ts`
**Purpose**: Fire-and-forget lifecycle telemetry for autocomplete instrumentation
(one record per suggestion, plus a follow-up "deleted after insert" event)

**Features**: Rate-limited 300/min per user (fail-open — telemetry must never break
the editor); persists via `AutocompleteEvent` entity; swallows persistence errors
rather than surfacing them to the client

---

#### `app/api/completion/telemetry/stats/route.ts`
**Purpose**: Authenticated, project-scoped autocomplete statistics for the cockpit
usage page (`AutocompleteStatsCard`) — acceptance/partial/rejection/deletion rates,
latency percentiles, optional date-range filter

---

**`AutocompleteDot`** (`components/editor/AutocompleteDot.tsx`)
**Purpose**: Left-margin visual indicator of autocomplete state

**States**: `idle`/`waiting` (hidden), `prefetching` (breathing), `ready`
(breathing), `visible` (solid — ghost text currently shown)

---

**`Autocomplete`** (`components/editor/extensions/Autocomplete.ts`)
**Purpose**: TipTap extension implementing the full autocomplete lifecycle — silent
prefetch on idle → breathing dot → ghost text on Tab → accept

**Related**: `autocompleteHint.ts` (structured UI copy for the shortcut hint,
intent-variant labels), `autocompleteTelemetry.ts` (pure, framework-agnostic
lifecycle tracker producing telemetry payloads — no network/TipTap dependency, unit
tested in isolation), `lib/autocompleteTelemetryClient.ts` (the network client that
POSTs those payloads to `/api/completion/telemetry`)

---

**`AutocompletePreferencesCard`** (`components/cockpit/AutocompletePreferencesCard.tsx`)
**Purpose**: Per-project settings card — suggestion length, audace (creative
latitude), partial-acceptance behavior, opt-in learning

**`AutocompleteStatsCard`** (`components/cockpit/AutocompleteStatsCard.tsx`)
**Purpose**: Displays the lifecycle metrics from `/api/completion/telemetry/stats`
on the cockpit usage page

---

### Offline Spell-Check

**`SpellCheckExtension`** (`components/editor/SpellCheckExtension.ts`)
**Purpose**: TipTap extension driving red-underline decoration for misspelled words
via a ProseMirror plugin

---

**`SpellCheckPalette`** (`components/editor/SpellCheckPalette.tsx`)
**Purpose**: Inline palette shown on click of a red-underlined word

**Features**: Three actions — apply a suggestion, ignore in project (persistent),
add to dictionary (persistent)

---

**`spell-check-actions.ts`** (`app/actions/spell-check-actions.ts`)
**Purpose**: Dictionary-based spell checking using `nspell` + the `dictionary-fr`
(fr-FR) `.aff`/`.dic` pair, read directly off disk (Turbopack rewrites
`import.meta.url`-based imports in a way `fs.readFile` can't resolve) — **zero AI
tokens spent**

**Server Actions**: spell-check request, plus `addWordToCustomDictionaryAction`,
`removeWordFromCustomDictionaryAction`, `removeIgnoredWordAction`,
`clearIgnoredWordsAction`

---

**`SpellCheckSettingsCard`** (`components/cockpit/SpellCheckSettingsCard.tsx`)
**Purpose**: Manage the project's custom dictionary and ignored-words list, on the
cockpit Settings page

---

### Thesaurus

**`ThesaurusPalette`** (`components/editor/ThesaurusPalette.tsx`)
**Purpose**: Inline bubble palette for contextual word alternatives, two layers:
Layer 1 is instant lexical lookup, Layer 2 is on-demand AI suggestions
(`showAILayer` prop gates whether layer 2 is offered)

---

**`thesaurus-actions.ts`** (`app/actions/thesaurus-actions.ts`)
**Purpose**: Two actions — `getLexicalAlternativesAction` (fast, local lexical
lookup) and `getAIAlternativesAction` (AI-powered, scene-aware suggestions with
register, via `SuggestAlternativesUseCase` + `AIContextBuilder`)

---

### Project Snapshots

**`SnapshotHistoryDialog`** (`components/history/SnapshotHistoryDialog.tsx`)
**Purpose**: Triggered from the editor — create, consult, edit (name/description),
delete, and restore project snapshots

**Design**: Delegates editor-state mutation (restoring a snapshot into the live
project) to the project store; delegates history governance (listing, metadata
updates, deletion, retention) to server actions. Embeds `SnapshotComparisonDialog`.

---

**`SnapshotComparisonDialog`** (`components/history/SnapshotComparisonDialog.tsx`)
**Purpose**: Read-only diff viewer — a saved snapshot vs. a freshly server-captured
current state

**Features**: Shows changed chapter **structure** first (added/removed/reordered
chapters), then a textual and rich-block **side-by-side** diff per changed chapter

---

**`snapshot-actions.ts`** (`app/actions/snapshot-actions.ts`)
**Purpose**: Server Actions for the full snapshot lifecycle

**Server Actions**: creation (manual + `ProcessAutomaticSnapshotUseCase` for
automatic snapshots), `listSnapshotsAction`, `updateSnapshotMetadataAction`,
`deleteSnapshotAction`, `RestoreSnapshotUseCase`,
`loadSnapshotComparisonAction` → `LoadSnapshotComparisonUseCase`,
`GovernSnapshotHistoryUseCase` (retention policy)

> **Distinguishing the two history features**: **Project Snapshots**
> (`SnapshotHistoryDialog`/`SnapshotComparisonDialog`/`snapshot-actions.ts`) capture
> and restore the **whole project's** chapter set at a point in time. **Correction
> History** (`CorrectionHistoryDialog`/`CorrectionHistoryTable`/
> `correction-history-actions.ts`, documented below) is a **per-chapter** log of
> AI-rewrite proposals and what was inserted. They are independent features that
> happen to live in the same `components/history/` directory.

---

### Hooks (`hooks/`)

#### `hooks/useCharacterChat.ts`
**Purpose**: SSE connection management, message state, and conversation
persistence for character chat

**Features**: Opens a `fetch` SSE stream to `/api/character-chat/stream`, reads the
`meta` event to capture `conversationId` (new or resumed), appends streaming chunks
to the current assistant message, exposes `messages`, `sendMessage(text)`,
`isStreaming`, `error`

**Used by**: `CharacterChatSheet`

---

#### `hooks/useAutosave.ts`
**Purpose**: Auto-save hook with 1-second debounce

**Features**: Debounces content changes, calls a server action to save to MongoDB,
updates `SaveStatus`, cancels pending saves on unmount, skips save if content hasn't
changed

---

#### `hooks/useEndnoteLocator.ts`, `hooks/useBookPageOffset.ts`

See "Endnotes" and "Publication Profiles & Book Pagination" above.

---

### Character Chat, Cockpit & Editor Support (existing features, kept)

#### `app/api/character-chat/stream/route.ts`
**Purpose**: SSE streaming endpoint for character chat

**Features**: Emits a `meta` event first (carrying `conversationId`) so the client
can resume interrupted sessions; streams character reply chunks via
`ChatWithCharacterUseCase`; auth-protected; `runtime = 'nodejs'`

**Methods**: POST with `{ projectId, characterId, conversationId | null, message }`

---

#### `app/read/[projectId]/[token]/page.tsx`
**Purpose**: Public reader page for shared/published projects

**Features**: Read-only, no authentication required, token-based URL validation, A4
page styling preserved, chapter navigation, reading time per chapter, responsive

**Server Actions**: `loadPublishedProjectAction` → `LoadPublishedProjectUseCase`

---

#### `app/api/approve/route.ts`
**Purpose**: User approval API endpoint (approve/reject new sign-ups via an emailed
HMAC-signed link)

**Methods**: `GET /api/approve?action=approve&userId=xxx&token=yyy` (and
`action=reject`)

---

#### `app/api/auth/[...nextauth]/route.ts`
**Purpose**: Auth.js (`next-auth` v5) catch-all route — handles the credentials
sign-in flow and session management configured in
`src/infrastructure/auth/auth-config.ts`

---

#### `app/layout.tsx`
**Purpose**: Root layout with metadata and global styling

**Features**: Tailwind CSS v4 setup, metadata (title/description), font
configuration (Geist Sans/Mono)

---

### Guide pages (`app/guide/**`)

Ten static, SSR content pages forming an in-app user guide, hubbed from
`app/guide/page.tsx`. Each page is task-oriented and intentionally scoped to
capabilities that actually exist in the code (several file headers explicitly note
what is *not* implemented, to avoid documenting aspirational features):

- **`guide/page.tsx`** — hub page, routes the author to the right guide page
- **`guide/demarrer/page.tsx`** — "Premiers pas", a 5-minute onboarding walkthrough
- **`guide/editeur/page.tsx`** — the editor: A4 page, typography, shortcuts, word
  count, auto-save
- **`guide/assistant-ia/page.tsx`** — AI writing tools: 3-style rewrite, command
  palette, autocomplete (gestures, variants, the dot indicator)
- **`guide/manuscrit/page.tsx`** — manuscript management: chapters, import
  (.docx/Markdown), export (DOCX/PDF), cover, reading time, public sharing
- **`guide/personnages/page.tsx`** — character chat and auto-generated character
  sheets
- **`guide/cockpit/page.tsx`** — the Project Cockpit: tasks, objectives, research,
  autocomplete preferences, canon registry, AI usage stats
- **`guide/providers/page.tsx`** — configuring AI providers (OpenAI, Anthropic,
  Google AI), BYOK model, key encryption
- **`guide/publication/page.tsx`** — publication profiles (KDP 6×9/A5/passerelle),
  per-profile typography, TOC, annexes, whole-book preview
- **`guide/confidentialite/page.tsx`** — data ownership, RGPD, encryption, export/
  account deletion (trust/marketing page, links to the legal pages for the binding
  detail)

---

### Server Actions

Server actions live in two places:

- **`app/actions.ts`** (top-level file, sibling of the `app/actions/` directory) —
  document import/export and the original AI rewrite action:
  - `importDocument` — `ImportProjectUseCase` via the configured `DocumentParser`
  - `importFolder` — `ImportFolderUseCase` (Markdown-folder import)
  - `exportProject` — `ExportProjectUseCase` via the DOCX exporter; rejects if the
    project's active publication profile is not `passerelle`
  - `exportProjectPdf` — `ExportProjectUseCase` via the PDF exporter
    (`PagedPdfExporter`); rejects if the active profile *is* `passerelle`
  - `exportProjectLegacy` — `@deprecated`, kept for backward compatibility, operates
    on serialized project data directly rather than loading from the database
  - `rewriteText` — `RewriteTextUseCase` with a hardcoded `OpenAIProvider`
    (does not use the per-project provider selection; predates multi-provider support)

- **`app/actions/*.ts`** — one file per feature area, all `'use server'`, all
  delegating to Application-layer use cases. `app/actions/index.ts` is a **4-line
  barrel**, not a "legacy" action file:
  ```ts
  export * from './utils';
  export * from './project-actions';
  export * from './chapter-actions';
  export * from './auth-actions';
  ```
  It does **not** re-export `import-document.ts`, `export-document.ts`, or
  `rewrite-text.ts` — those live under `app/actions.ts` (above) and
  `app/actions/rewrite-text.ts` respectively, and callers import them directly by
  path (e.g. `DocumentControls.tsx` imports `exportProject`/`exportProjectPdf` from
  `@/app/actions`, which resolves to the top-level `app/actions.ts` file, not the
  `app/actions/` barrel — the two are separate modules that happen to share a name
  prefix).

**Full `app/actions/` inventory** (feature area → file):

| Area | File |
|---|---|
| Shared DI/auth utilities | `utils.ts` |
| Project CRUD | `project-actions.ts` |
| Project settings | `project-settings-actions.ts` |
| Chapters | `chapter-actions.ts` |
| Chapter AI generation | `chapter-generation-actions.ts` |
| Auth (sign-in/up/out, delete account) | `auth-actions.ts` |
| Password reset/change | `password-actions.ts` |
| AI providers | `provider-actions.ts` |
| Metadata (narrative analyses) | `metadata-actions.ts` |
| Chapter analysis/verification | `analysis-actions.ts` |
| Correction history (per-chapter AI-rewrite log) | `correction-history-actions.ts` |
| Project snapshots (whole-project history) | `snapshot-actions.ts` |
| Canon facts registry | `canon-actions.ts` |
| Characters | `character-actions.ts` |
| Character chat conversations | `character-conversation-actions.ts` |
| Autocomplete (non-streaming helpers) | `completion-actions.ts` |
| Thesaurus | `thesaurus-actions.ts` |
| Spell-check | `spell-check-actions.ts` |
| Editorial annexes (front/back matter) | `editorial-actions.ts` |
| Custom annexes | `custom-annex-actions.ts` |
| Presentation overrides (passerelle) | `presentation-override-actions.ts` |
| Whole-book preview | `book-preview-actions.ts` (+ `book-preview-types.ts`) |
| Publish/unpublish + public read | `publish-actions.ts` |
| Research documents | `research-document-actions.ts` |
| Tasks | `task-actions.ts` |
| Writing goals (one-off, older) | `writing-goal-actions.ts` |
| Writing quotas (recurring, current) | `writing-quota-actions.ts` |
| Word-count activity tracking | `word-count-tracking.ts` |
| Cockpit stats/workflow metrics | `cockpit-actions.ts` |
| AI usage tracking | `usage-actions.ts` |
| AI transparency ledger | `exchange-actions.ts` |
| AI model pricing (admin) | `pricing-admin-actions.ts` |
| Blog (public + admin CMS) | `blog-actions.ts` |
| Contact form | `contact-actions.ts` |
| RGPD data export | `user-actions.ts` |
| Rate limiting (test-connection cooldown) | `rate-limiter.ts` |

**Detail on the actions already covered above** (Canon, AI Transparency Ledger,
Pricing admin, Writing quotas, Spell-check, Thesaurus, Snapshots, Presentation
overrides, Book preview, Blog, Password, RGPD) — see their dedicated sections.

**`app/actions/project-actions.ts`**:
- `createProjectAction` → `CreateProjectUseCase`
- `loadProjectAction` → `LoadProjectUseCase`
- `listProjectsAction` → `ListProjectsUseCase`
- `deleteProjectAction` → `DeleteProjectUseCase`
- `renameProjectAction` → `UpdateProjectTitleUseCase`
- `updateProjectProviderAction` → `UpdateProjectProviderUseCase`

**`app/actions/chapter-actions.ts`**:
- `addChapterAction` → `AddChapterUseCase`
- `removeChapterAction` → `RemoveChapterUseCase`
- `updateChapterContentAction` → `UpdateChapterContentUseCase`
- `updateChapterTitleAction` → `UpdateChapterTitleUseCase`
- `reorderChaptersAction` → `ReorderChaptersUseCase`
- `switchChapterAction` → `SwitchChapterUseCase`

**`app/actions/auth-actions.ts`**:
- `signInAction` — authenticates user, creates session
- `signUpAction` → `RegisterUserUseCase`
- `signOutAction()` — terminates session
- `deleteAccountAction` — email-confirmation-gated account deletion (used by
  `app/settings/page.tsx`)

**`app/actions/provider-actions.ts`**:
- `createProviderAction` → `CreateProviderUseCase`
- `listProvidersAction` → `ListProvidersUseCase`
- `updateProviderAction` → `UpdateProviderUseCase`
- `deleteProviderAction` → `DeleteProviderUseCase`
- `testProviderConnectionAction` → `TestProviderConnectionUseCase`
- `validateProviderAction` → `ValidateProviderUseCase`

**`app/actions/metadata-actions.ts`** — see "Cockpit metadata" above; delegates to
`CreateMetadataUseCase`, `LoadMetadataUseCase`, `ListMetadataUseCase`,
`UpdateMetadataContentUseCase`, `UpdateMetadataTitleUseCase`, `DeleteMetadataUseCase`,
and one `Generate*UseCase` per analysis type, plus `checkMetadataFreshnessAction`.

**`app/actions/correction-history-actions.ts`**:
- `saveCorrectionHistoryAction` → `SaveCorrectionHistoryUseCase`
- `listCorrectionHistoryAction` → `ListCorrectionHistoryUseCase`
- `deleteCorrectionHistoryAction` → `DeleteCorrectionHistoryUseCase`

**`app/actions/publish-actions.ts`**:
- `publishProjectAction` → `PublishProjectUseCase`
- `unpublishProjectAction` → `UnpublishProjectUseCase`
- `loadPublishedProjectAction` → `LoadPublishedProjectUseCase`
- `getPublishStatusAction` — returns publish status for a project

**`app/actions/character-conversation-actions.ts`**:
- `createConversationAction`, `listConversationsAction`,
  `loadConversationMessagesAction`, `deleteConversationAction`

**`app/actions/utils.ts`** (Dependency Injection — composition root for server
actions):
- Auth: `getAuthenticatedUserId()`, `getAuthenticatedAdminId()`
- Repositories: `getRepository()` (project), `getProviderRepo()`, `getUserRepo()`,
  `getMetadataRepo()`, `getCustomAnnexRepo()`, `getCorrectionHistoryRepo()`,
  `getSnapshotRepo()`, `getAutomaticSnapshotRepo()`, `getWritingGoalRepo()`,
  `getWordCountSnapshotRepo()`, `getWritingQuotaRepo()`, `getAIUsageRepo()`,
  `getAutocompleteEventRepo()`, `getCanonFactRepo()`,
  `getCanonExtractionStateRepo()`, `getAIExchangeRepo()`, `getRateLimitRepo()`,
  `getBlogArticleRepo()`, `getArticleViewRepo()`, `getProjectTaskRepo()`,
  `getCharacterRepo()`, `getCharacterConversationRepo()`, `getProjectSettingsRepo()`,
  `getResearchDocumentRepo()`, `getPresentationOverrideRepo()`,
  `getBookPreviewCacheRepo()`
- Infrastructure services: `getBlobStorageInstance()`, `getEmailService()`,
  `getLLMProviderFactory()`, `getIdGenerator()`, `getDocumentParser()`,
  `getFolderParser()`, `getDocumentExporter(format)`, `getBookPreviewCacheComputer()`
- LLM provider resolution (usage-tracked): `getLLMProviderForProject()`,
  `getTrackedLLMProviderForProject()`, `getLLMProviderById()`,
  `getTrackedLLMProviderById()` — the "tracked" variants wrap the provider so its
  calls are recorded into `AIUsageRepository` and (if opted in) the AI Transparency
  Ledger

---

### State Management

#### `store/projectStore.ts` (Zustand — Server-Backed)
**Purpose**: Global state for project and chapter management with MongoDB persistence

**State**:
- `project`: Project entity (chapters collection) — loaded from MongoDB
- `activeContent`: Current chapter content (TipTap JSON) — auto-saved to MongoDB
- `correctionHistory`: Array of CorrectionHistory — cached per chapter
- `isLoading`: Loading state for async operations
- `error`: Error messages from server actions

**Actions**:
- `loadProject(projectId)`, `createProject()`, `setProject(project)`
- `setActiveChapter(chapterId)` — navigate chapters (auto-saves to MongoDB)
- `addChapter()`, `removeChapter(chapterId)`,
  `reorderChapters(fromIndex, toIndex)` — all persist to MongoDB
- `updateActiveContent(content)` — triggers auto-save
- `saveCurrentChapter()` — force save
- `updateChapterTitle(chapterId, title)`
- `loadCorrectionHistory(chapterId)`, `saveCorrectionHistory(entry)`

**Design**: No business logic (delegates to server actions which use Application
use cases); thin wrapper around the Project aggregate; optimized selectors;
optimistic updates with server validation

---

#### `store/notificationStore.ts` (Zustand)
**Purpose**: In-app, actionable notification queue (e.g. the canon-staleness banner
described above)

**Features**: `addNotification()`, `hasNotificationOfType()`; notifications can
carry an `action` with a `confirmMessage` and an `onConfirm` async handler, so a
notification can drive a real operation (e.g. "Régénérer" the canon) rather than
just informing

---

### UI Components

---

#### Authentication Components (`components/auth/`)

**`UserMenu`**
**Purpose**: User profile dropdown with authentication actions

**Features**: Displays user email, sign-out button, dropdown menu (shadcn/ui
DropdownMenu), session-based user info

---

#### Dashboard Components (`components/dashboard/`)

**`CreateProjectDialog`**
**Purpose**: Dialog for creating new projects with title input

**Features**: Modal dialog, title validation, Cancel/Create, delegates to
`CreateProjectUseCase` via server action, auto-redirect to editor on success

---

**`ProjectCard`**
**Purpose**: Individual project card with management actions

**Features**: Title, last-updated timestamp, chapter count, rename (edit icon →
dialog), delete (trash icon → confirmation), click to open in editor

---

**`EmptyState`**
**Purpose**: Welcome message for new users with no projects

---

**`NoProvidersAlert`**
**Purpose**: Dashboard alert when no AI providers are configured; links to provider
management; dismissible; only shows when the provider list is empty

---

#### Provider Components (`components/providers/`)

**`ProvidersDialog`**
**Purpose**: Main dialog for managing AI providers — list, add, create/edit/delete
flows, connection testing UI

---

**`ProviderForm`**
**Purpose**: Create/edit provider form with connection testing

**Features**:
- **Provider type selection: OpenAI, Anthropic, Google AI only.** `ProviderType`
  values and `PROVIDER_NAMES`/`PROVIDER_DOCS` (`infrastructure/config/ai-models.ts`)
  cover exactly these three; `LLMProviderFactoryImpl` throws on anything else.
  Mistral and Cohere are **not** supported anywhere in the codebase.
- API key input (masked display), model selection dropdown
- Connection test button with loading state, validation feedback, save/cancel

---

**`ProviderCard`**
**Purpose**: Individual provider card — name/type, masked API key, model, edit/
delete, connection status

---

#### Metadata Components (`components/metadata/`)

**`GenerateCard`**
**Purpose**: Card UI for generating new metadata analyses — type selector, generate
button with loading state, provider indicator, rate-limiting feedback (5s cooldown),
error handling

---

**`MetadataCard`**
**Purpose**: Display metadata with actions — title/type, last-updated, view (→
editor), delete (confirmation), type-specific icons

---

#### Cockpit Components (`components/cockpit/`)

**`CharacterCard`**
**Purpose**: Card for a character with edit and chat actions — the chat button
opens `CharacterChatSheet`

---

**`CharacterForm`**
**Purpose**: Create/edit character form

**Features**: Auto-fill button calls `generateCharacterSheetAction` and pre-fills
all 8 fields (aliases, description, traits, goals, relationships, etc.); the author
reviews and saves — nothing is written without an explicit save

---

**`CharacterChatSheet`**
**Purpose**: Right-side Sheet for chatting with a character persona in real time

**Features**: Streaming SSE replies via `/api/character-chat/stream`; conversation
history in chat bubbles; text input with Enter/Shift+Enter; copy button on each
reply (for direct manuscript insertion); conversation persists across sheet open/
close via `conversationId`

**Uses**: `useCharacterChat` hook

---

**`CanonExtractionPreferencesCard`**, **`AutocompletePreferencesCard`**,
**`AutocompleteStatsCard`**, **`SpellCheckSettingsCard`**, **`ActivityChart`**,
**`TodayPaceCard`**, **`MilestoneMetricsCard`** — see their respective feature
sections above (Canon, Autocomplete, Spell-check, Writing quotas).

---

#### Navigation Components (`components/navigation/`)

**`ProjectSettingsMenu`**
**Purpose**: Dropdown in the editor header for quick access to all cockpit sections

**Features**: Groups cockpit links into "Pilotage" (overview, tasks, objectives,
settings) and "Contenu" (characters, metadata, canon, research, usage), mirroring
`CockpitSidebar`; always accessible from the editor header

---

**`ChaptersSheet`**
**Purpose**: Left-side navigation panel with drag & drop chapter management

**Features**: Dismissible Sheet, chapter list with word/character counts, active
chapter highlighting, drag & drop reordering (dnd-kit), add/delete chapter (delete
disabled for the last chapter), click to switch chapters

**Props**: `chapters`, `activeChapterId`, `onSelectChapter`, `onAddChapter`,
`onRemoveChapter`, `onReorderChapters`

---

#### Proposals Components (`components/proposals/`)

**`ProposalsSheet`**
**Purpose**: Right-side dismissible panel for AI proposals — the active proposals UI

**Features**: Dismissible Sheet, displays 3 AI-generated proposals (épuré, lyrique,
amplifié), individual "Insérer" button per proposal, style labels, scrollable
content, auto-closes after insertion, correction history auto-saved on insert

**Props**: `open`, `proposals`, `onInsert`, `onClose`

---

**`LoadingOverlay`** / **`RewriteLoadingOverlay`**
**Purpose**: Loading overlay with rotating author quotes during AI rewrite —
progress bar, covers the full editor area, accessible loading state

---

**`ProposalsPanel`** — **dead code, not wired into the app**
**Purpose (historical)**: Fixed bottom panel for AI proposals, predating
`ProposalsSheet`

**Status**: The only remaining reference to `ProposalsPanel` anywhere in `src/` is
its own test file (`ProposalsPanel.test.tsx`). It is not imported by
`app/editor/page.tsx`, `app/page.tsx`, or any other component. It should be treated
as dead code — a candidate for removal rather than "legacy, maintained for backward
compatibility".

---

#### Publishing Components (`components/publish/`)

**`PublishDialog`**
**Purpose**: Dialog for publishing and sharing projects — publish/unpublish toggle,
share link generation and display, copy-to-clipboard, public URL preview, loading
states, confirmation for unpublish

---

**`PublicReader`**
**Purpose**: Read-only viewer for published projects — A4 page styling (identical
to editor), chapter navigation sidebar, reading time per chapter, responsive, no
authentication, token-based access validation

---

#### AI Menu Components (`components/editor/`, AI-related)

**`AIMenuDropdown`**
**Purpose**: Unified dropdown menu for AI features — rewrite (selection-aware),
generate (empty-chapter context), complete (Tab autocompletion trigger), keyboard
shortcut hints, contextual option availability

---

**`CommandPalette`**
**Purpose**: Keyboard-accessible command palette for AI actions — triggered by
Ctrl+Shift+I (Cmd+Shift+I on Mac), fuzzy search, keyboard navigation, auto-close on
selection

---

**`FloatingGenerationMenu`**
**Purpose**: Floating menu for AI chapter generation, invoked from the editor;
drives `generateChapterAction` (`chapter-generation-actions.ts`)

---

**`AnalysisConfigDialog`** / **`ChapterAnalysisPanel`**
**Purpose**: Configure and display chapter verification — grammar, punctuation,
style, repetition analysis, plus correction application (single or batch) via
`analysis-actions.ts` (`analyzeChapter`, `applyCorrection`, `applyBatchCorrections`)

---

#### History Components (`components/history/`)

**`CorrectionHistoryDialog`**
**Purpose**: Dialog displaying correction history for the current chapter

**Features**: Accordion UI per correction entry, shows original text and all 3
proposals, copy to clipboard, search/filter by text content and date range, sorted
newest-first, empty state

---

**`CorrectionHistoryTable`** (internal component)
**Purpose**: Renders the accordion list of history entries — expandable items,
original text display, proposal cards with copy button, timestamp formatting

---

**`SnapshotHistoryDialog`** / **`SnapshotComparisonDialog`** — see "Project
Snapshots" above; note the two history features are independent (Correction History
is per-chapter AI-rewrite log, Snapshots are whole-project point-in-time captures).

---

#### Document Components (`components/document/`, `components/ui/`)

**`SaveStatus`**
**Purpose**: Auto-save progress indicator — "Saving..." during write, "Saved" when
persisted, auto-hides after 2 seconds

---

**`DocumentControls`**, **`ExportDialog`** — see "Publication Profiles & Book
Pagination" above.

---

#### Editor Components (`components/editor/`)

**`TextEditor`**
**Purpose**: TipTap rich text editor with JSON storage and live statistics

**Features**:
- TipTap JSON content format; rich text extensions: Bold, Italic, Underline,
  Highlight, plus the `SpellCheckExtension` and `Autocomplete` extensions
- `CharacterCount` extension — live word/character count in the editor header
- Performance: `immediatelyRender: false`, `shouldRerenderOnTransaction: false`
- External content updates (chapter switching), `onEditorReady` callback

**Props**: `content` (TipTap JSON stringified), `onContentChange`,
`onSelectionChange`, `onEditorReady`, `placeholder`

---

**`FormattingToolbar`**
**Purpose**: Rich text formatting controls with undo/redo and history

**Features**: Bold/Italic/Underline/Highlight, Undo/Redo with visual buttons,
History button (opens `CorrectionHistoryDialog`), word/character count display,
active/disabled state indicators

---

**`RewriteButton`**
**Purpose**: Contextual button positioned near selection — shows/hides based on
selection state, loading state during API calls, keyboard accessible

---

**`SearchReplaceBar`**
**Purpose**: In-editor find & replace bar

---

**`SemanticAmbiguityBanner`**
**Purpose**: Editor banner surfacing semantic-role ambiguity when inserting AI
content (works with `PropositionInserter`'s `buildSemanticInsertContent` /
`getSemanticRoleFromAttrs`)

---

**`EditorPreviewLayout`**
**Purpose**: Layout component coordinating the semantic editing pane and the paged
publication preview side by side

---

#### UI Primitives (`components/ui/`)

shadcn/ui primitives used throughout: `button.tsx`, `sheet.tsx` (drawer/sidebar —
`ChaptersSheet`, `ProposalsSheet`, `EndnotesPanel`), `scroll-area.tsx`,
`card.tsx`, `dialog.tsx`, `input.tsx`, `label.tsx`, `alert-dialog.tsx`, `alert.tsx`,
`badge.tsx`, `select.tsx`, `switch.tsx`, `popover.tsx`, `dropdown-menu.tsx`,
`checkbox.tsx`, `textarea.tsx`, `skeleton.tsx` — all accessible, keyboard navigable,
composed by feature components rather than containing business logic themselves.

---

#### Admin Components (`components/admin/`)

**`ModelPricingForm`**, **`ModelPricingTable`**, **`SyncButton`**, **`PruneButton`**
— see "Dynamic AI Pricing" above.

**`BlogArticleForm`**, **`BlogArticleList`** — see "Blog + Admin CMS" above.

---

#### Landing Components (`components/landing/`)

**`ContactForm`**
**Purpose**: Contact form embedded in the landing page (`app/page.tsx`); submits to
`contact-actions.ts`, which stores the message in MongoDB

---

#### Notifications Components (`components/notifications/`)

**`NotificationBell`**
**Purpose**: Header bell showing actionable notifications from `notificationStore`
(e.g. canon staleness); click opens a list with the notification's `action` button
where present

---

#### Transparency Components (`components/transparency/`)

**`AIExchangeLedger`** — see "AI Transparency Ledger" above.

---

#### Settings Components (`components/settings/`)

**`AIExchangeLoggingCard`** — see "AI Transparency Ledger" above.

---

## Testing

Run `npm test` for the current unit/integration suite (Vitest) and `npm run test:e2e`
(or the Playwright config in the repo root) for end-to-end coverage. Coverage
figures change too often to keep an accurate hardcoded count here — check the test
runner's own summary output rather than this document.

**Test Tools**: React Testing Library (user-centric assertions), Vitest, TipTap
mocks for editor testing, Zustand mocks for store testing, MongoDB repository mocks
for server actions, Playwright for E2E.

---

## Design Patterns

**Component Architecture**:
- Presentational components (props-based API)
- No business logic in components
- Composed from shadcn/ui primitives
- Accessible by default (ARIA labels, keyboard nav)

**State Management**:
- Zustand for global state (project/chapter, notifications)
- Local state for UI-only concerns
- Props for component communication
- Store delegates to Application use cases via server actions

**AI Feature Pattern**: every AI-touching feature (rewrite, autocomplete, thesaurus
AI layer, chapter generation, canon extraction, character chat) routes its LLM calls
through `getTrackedLLMProviderForProject` / `getTrackedLLMProviderById`
(`app/actions/utils.ts`), so usage is recorded into `AIUsageRepository` and, if the
author has opted in, into the AI Transparency Ledger — no feature should call an
`LLMProvider` implementation directly and bypass tracking.

**Performance Optimizations**:
- TipTap: `immediatelyRender: false`, `shouldRerenderOnTransaction: false`
- Zustand: shallow equality checks
- Single editor instance (`setContent` for chapter switching)
- Lazy loading for sheets (on-demand rendering)
- Whole-book PDF generation is content-hash cached (GridFS) so unchanged manuscripts
  never re-pay Chromium/Paged.js pagination cost
- Autocomplete prefetch and manual completion are rate-limited in separate buckets
  so one can't starve the other

---

## Key Architectural Decisions

### Single Editor Instance
**Decision**: Use one TipTap editor and call `setContent()` to switch chapters

**Rationale**: Creating/destroying editors is expensive; single-instance content
swapping is effectively instant

**Trade-off**: Undo/redo history is shared across all chapters

### Paged Media Pipeline Shared Between Preview and Export
**Decision**: The in-editor `PublicationPreview`, the whole-book `/book-preview`,
and the production PDF exporter (`PagedPdfExporter`) all render through the same
`PagedJsRenderer` / `TipTapToBookHtml` pipeline

**Rationale**: What the author sees in the editor and in the whole-book preview is
guaranteed to be what export produces — no separate, drift-prone preview renderer

### Dismissible Sheets vs Fixed Panels
**Decision**: Use Sheets instead of persistent sidebars for chapter navigation and
AI proposals

**Rationale**: Maximizes writing space, aligns with minimalist UX philosophy, user
controls visibility

### Metadata Freshness as a Separate Concern from CRUD
**Decision**: Staleness detection (`checkMetadataFreshnessAction`,
`checkCanonFreshnessAction`) is a distinct action layered on top of plain CRUD
rather than folded into every read

**Rationale**: Lets freshness be computed lazily (on the pages that show it) without
forcing every list/load call to hash manuscript content

---

## Changelog

For phase-by-phase implementation history, see [CHANGELOG.md](../../CHANGELOG.md).
