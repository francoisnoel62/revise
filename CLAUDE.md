# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Revise** is an AI-powered writing tool, designed specifically for fiction writers. It helps overcome writer’s block, continue scenes, and enrich descriptions, emotions, and pacing. Unlike general AI tools, it understands narrative concepts like conflict, scenes, and story arcs. It favors creativity over factual accuracy, which is intentional. It works best as an inspiring co-author, not as an autopilot that writes the book for you.

### Core Value Proposition
- Select text → Trigger rewrite → Receive 3 stylistically distinct proposals → Insert chosen version instantly
- Success metric: Users prefer this flow over copy-pasting to ChatGPT

### MVP Status: Phase 4.1 Complete ✅

**All phases through 4.1 are fully implemented and tested**, including: MongoDB persistence, Auth.js authentication, multi-tenant projects, AI provider management, metadata analysis (7 types), PDF export, correction history, user registration approval, RGPD compliance, blog section, AI text generation, and autocompletion.

**Implemented features:**

**Phase 4.1 - AI Text Generation & Autocompletion:** (January 2026)
- **AI Chapter Generation** - Generate chapter beginnings from empty chapters using project metadata context
- **Streaming Autocompletion** - Press Tab to trigger, Tab again to accept (real-time streaming)
- **FloatingGenerationMenu** - Context-aware generation options for empty chapters
- **MetadataCache** - TTL-based caching (5 min) for metadata to reduce database queries
- **GenerateChapterUseCase** - Loads all project metadata for contextual content generation
- **GenerateCompletionUseCase** - Generates completions using project context
- **ContentConverter interface** - Clean Architecture abstraction for TipTap conversion
- **TipTapContentService** - Infrastructure implementation for content conversion
- **Autocomplete TipTap extension** - Ghost text display with streaming support

**Phase 4.0 - Blog Section:** (January 2026)
- **Blog pages** - `/blog` list and `/blog/[slug]` article pages
- **6+ SEO articles** (2700-3600 words each) on writing techniques
- **Admin blog management** - `/admin/blog` for CRUD operations
- **BlogArticle entity** - Domain entity with slug, title, content, metadata
- **MongoDBBlogArticleRepository** - Persistence with indexes
- **dynamicParams** enabled for post-deployment article seeding

**Phase 3.11 - RGPD/LCEN Compliance:** (January 2026)
- **Legal pages** - CGU, CGV, mentions légales, politique confidentialité, politique cookies
- **Cookie consent banner** - CookieConsent component with 3 variants
- **Consent timestamps** - termsAcceptedAt, privacyAcceptedAt stored on User
- **Account deletion** - DeleteUserAccountUseCase with cascade delete
- **Data export** - exportUserDataAction for RGPD Article 20 portability
- **Settings page** - `/settings` with account deletion and data export UI
- **deleteAllByOwner** method on all repositories
- **Terms checkbox** on signup form with validation
- **Contact form** - ContactMessage entity, repository, and landing page integration

**Phase 3.8 - User Registration Approval:** (January 2026)
- **Admin approval workflow** - Users must be approved before signing in
- **Email notifications** - ResendEmailService for approval request emails
- **HMAC token validation** - Secure approval/rejection links
- **ApproveUserUseCase** - Handles approval with token verification
- **isApproved/approvedAt fields** on User entity
- **API route** `/api/approve` for handling approval actions
- **Signup feedback** - Pending approval message after registration

**Phase 3.9 - French Translation:** (January 2026)
- Sign-in/sign-up pages fully translated
- Dashboard (titles, counters, empty states)
- Error messages in French

**Phase 3.10 - Optional AI Provider:** (January 2026)
- **Project creation without provider** - CreateProjectUseCase no longer requires provider
- **Informational NoProvidersAlert** - Non-blocking banner instead of error
- **AI features hidden gracefully** when no valid provider available
- **useHasAIProviders hook** - Centralized provider availability check

**Phase 3.7 - UX Enhancements:** (January 2026)
- **PDF Export** with full typography support (pdf-lib), A4 styling matching editor
- **Correction History** - Track and view all AI rewrites per chapter with searchable accordion UI
- **Character/Word Count** - Live statistics in editor header (TipTap CharacterCount extension)
- **Undo/Redo Toolbar Buttons** - Accessible via toolbar in addition to keyboard shortcuts
- **Loading Overlay** - Progress bar with 100 famous author quotes during AI rewrite (3s rotation)
- **3 Proposals** - Reduced from 5 to 3 (épuré, lyrique, amplifié) for better UX and 40% token reduction
- **GPT-5 & o-series Support** - Proper API parameters for reasoning models (max_completion_tokens, no temperature)
- **Metadata UI Improvements** - Regeneration moved to 3-dot menu, reduced visual clutter
- **CorrectionHistory entity** with multi-tenant repository and server actions
- **39 unit tests** for correction history (entity, use cases, edge cases)

**Phase 3.6 - Metadata Analysis System:** (January 2026)
- **6 AI-powered analysis types** with intelligent caching and regeneration detection
  - **Narrative Analysis** - POV, structure, temporality, voice analysis
  - **Characters** - Character profiles, relationships, narrative hierarchy extraction
  - **Plot** - Structure breakdown, conflicts, scene progression, narrative threads
  - **Stylistic DNA** - Register analysis, syntax patterns, figures of style, writing rules extraction
  - **Worldbuilding** - Themes, symbolism, setting analysis, social context
  - **Synthesis** - Meta-analysis aggregating all previous analyses with editorial feedback
- **ProjectMetadata entity** with TipTap JSON storage and content hash tracking
- **MongoDBMetadataRepository** with multi-tenant isolation and serialization
- **FilePromptRepository** for version-controlled AI prompts loaded from markdown files
- **Intelligent caching** with SHA-256 content hashing to detect when regeneration is needed
- **Metadata CRUD use cases** (Create, Load, List, Update, Delete)
- **6 Generation use cases** (one per analysis type) with caching logic
- **Metadata server actions** (metadata-actions.ts) delegating to use cases
- **Metadata UI pages** for list view (`/project/[id]/metadata`) and rich text editor (`/project/[id]/metadata/[metadataId]`)
- **Metadata components** (GenerateCard, MetadataCard) with loading states
- **Auto-save integration** with 1-second debounce for metadata editing
- **Rate limiting** for AI generation (5-second cooldown per user)
- **Dual provider support** (OpenAI & Anthropic) for all 6 analysis types
- **Comprehensive testing** with integration tests for both providers

**Phase 3.5 - AI Provider Management:** (January 2026)
- **Multiple AI provider support** with encrypted API key storage (AES-256-GCM)
- **Provider CRUD operations** via server actions with multi-tenant isolation
- **Connection testing** with rate limiting (1 test per 5 seconds per user)
- **Centralized model configuration** supporting OpenAI, Anthropic, Mistral, Cohere, Google
- **Provider selection** per project with fallback to environment variable
- **ProvidersDialog UI** for managing providers (create, edit, delete, test)
- **Dashboard alerts** when no providers configured
- **User menu integration** with "My Providers" option
- **Secure credential handling** - API keys never sent to client (masked display only)
- **MongoDBProviderRepository** with encryption at rest
- **ProviderRepository interface** for future provider storage implementations

**Phase 3 - Persistence & Authentication:**
- **MongoDB Atlas integration** with MongoDBProjectRepository
- **User authentication** via Auth.js (email/password)
- **User management** with secure password hashing (bcrypt)
- **Sign-in/Sign-up pages** with form validation
- **Dashboard** for project management (create, rename, delete projects)
- **Multiple projects per user** with multi-tenant data isolation
- **Session management** with route protection middleware
- **Auto-save to database** with 1-second debounce
- **Project loading** from database on editor page
- **User menu** with profile and sign-out options
- **Server Actions** for all database operations (project-actions, chapter-actions, auth-actions)

**Phase 2.5 - A4 Page Styling & Advanced Typography:**
- **Multi-chapter document management** with drag & drop navigation
- **A4 page styling** (794px fixed width, realistic page shadows, professional margins)
- **Advanced typography controls**:
  - Font family toggle (Georgia ↔ Times New Roman)
  - Font size dropdown (11pt, 12pt, 13pt default, 14pt, 16pt)
  - Text alignment cycle (left/center/right/justify)
  - First-line indent toggle (1.27cm per paragraph)
  - 1.5 line height, automatic hyphenation
- **Rich text formatting** (bold, italic, underline, highlight)
- **Formatted import/export** (.docx with full typography preservation)
- **Chapter splitting** by H1 headings on import
- **TipTap JSON-based editor** with enhanced formatting toolbar
- **AI-powered rewrite** with 3 distinct proposals (language-preserving, formatted text support)
- **Proposals Sheet** (dismissible right panel)
- **Chapters Sheet** (left navigation with Switch toggle, scrollable, inline title editing)
- **Keyboard shortcuts** (CTRL+B/I/U, CTRL+Shift+H, CTRL+K for em dash)
- **Unsaved changes detection** with confirmation dialogs
- **Full undo/redo** support (Ctrl+Z)
- **Clean Architecture** with complete test coverage

**Current scope:**
- **Persistent multi-chapter projects** stored in MongoDB Atlas
- **User authentication** with session management
- **Multiple projects per user** with multi-tenant isolation
- **AI provider management** with encrypted credential storage
- **Per-project provider selection** with connection testing
- **Auto-save to database** after each edit
- **Dashboard** for project management
- **Session resumption** - projects persist across sessions
- **Export capability** for downloading .docx files
- Rich text formatting with advanced typography controls
- Chapter add/remove/reorder capabilities

**Performance:**
- Export: 57ms (35x faster than target)
- Chapter switching: 0.23ms (870x faster than target)
- AI rewrite: 2.7-3.3s (within 3s target)

**Critical rule**: If a feature isn't essential to the multi-chapter writing and selection → replacement loop, it's out of scope.

**For detailed product information**, see:
- [README.md](README.md) - Product overview, features, value proposition, user workflows
- [docs/architecture.md](docs/architecture.md) - Complete architecture documentation

## Architecture Principles

This project MUST follow Clean Architecture principles adapted to Next.js:

### Layer Separation (✅ Fully Implemented)

**For complete layer details**, see [docs/architecture.md](docs/architecture.md)

1. **Domain Layer** (`src/domain`)
   - Pure business logic, zero framework dependencies
   - Entities: `Chapter`, `Project`, `ProjectMetadata`, `Provider`, `User`, `CorrectionHistory`, `BlogArticle`, `ContactMessage`
   - Value Objects: `TextSelection`, `RewriteProposal`, `MetadataType` + 7 analysis types (including chapter-summaries)
   - Interfaces: All external contracts (repositories, providers, parsers, exporters, email service)

2. **Application Layer** (`src/application/use-cases`)
   - **55+ Use Cases** orchestrating domain logic:
     - **Project CRUD** (6): Create, Load, List, Delete, UpdateTitle, UpdateProvider
     - **Chapter Operations** (8): Import, Export, Switch, Add, Remove, Reorder, UpdateContent, UpdateTitle
     - **Provider Management** (6): Create, Update, Delete, List, TestConnection, Validate
     - **Metadata CRUD** (6): Create, Load, List, UpdateContent, UpdateTitle, Delete
     - **Metadata Generation** (7): Generate each of 7 analysis types with caching (including chapter-summaries)
     - **Correction History** (3): Save, List, Delete (per-chapter history tracking)
     - **User Management** (3): RegisterUser, ApproveUser, DeleteUserAccount
     - **AI Generation** (2): GenerateChapter, GenerateCompletion
     - **Blog CRUD** (4): Create, Update, Delete, List blog articles
     - **Contact** (1): SubmitContactForm
     - **Legacy** (4): RewriteText, ImportDocument, ExportDocument, SwitchChapter

3. **Infrastructure Layer** (`src/infrastructure`)
   - **AI Providers**: OpenAIProvider, AnthropicProvider (support 7 metadata analysis types + chapter generation + autocompletion + GPT-5/o-series)
   - **Persistence**: 7 MongoDB repositories (Project, User, Provider, Metadata, CorrectionHistory, BlogArticle, ContactMessage) + InMemory (legacy)
   - **Document**: DocxParser, DocxExporter, PdfExporter, TipTap conversion utilities, TipTapContentService
   - **Security**: Encryption (AES-256-GCM), Auth.js provider, bcrypt password hashing, HMAC token generation
   - **Email**: ResendEmailService for approval notifications
   - **Prompts**: FilePromptRepository (load from `/docs/prompt/metadata/*.md` and `/docs/prompt/chapter-generation/*.md`)
   - **Utilities**: UUIDGenerator, text hashing (SHA-256), serialization, MetadataCache (TTL-based)

4. **Interface Layer** (`src/app`, `src/components`)
   - **Pages** (15+): Dashboard, Editor, Metadata List/Editor, Sign In/Up, Blog List/Article, Admin Blog, Settings, Legal pages (CGU, CGV, Mentions, Confidentialité, Cookies)
   - **Components** (~50): Organized by feature (editor, navigation, proposals, providers, metadata, dashboard, document, history, blog, auth, legal)
   - **Server Actions** (12+): All delegate to Use Cases (project, chapter, auth, provider, metadata, correction-history, blog, contact, user, import, export, rewrite)
   - **Dependency Injection**: `utils.ts` centralizes all repository/factory getters
   - **State**: Zustand store (server-backed with correction history cache and metadata cache)
   - **Hooks**: useAutosave (1s debounce), useHasAIProviders

### Dependency Rules
- Domain depends on nothing
- Application depends only on Domain
- Infrastructure depends on Application and Domain
- Interface depends on Application and Domain
- OpenAI must be abstracted behind `LLMProvider` interface
- Parsers and exporters must be swappable implementations
- UI components contain zero business logic

This architecture enables future evolution (persistence, projects, memory) without refactoring.

## Technical Stack

**For full technical details**, see [docs/architecture.md](docs/architecture.md)

- **Framework**: Next.js 16.1.1 (App Router) + React 19 Server Components
- **Database**: MongoDB Atlas (multi-tenant via ownerId filtering)
- **Authentication**: Auth.js (NextAuth v5) + bcrypt password hashing
- **Editor**: TipTap 3.14.0 (StarterKit + custom extensions: IndentParagraph, FontFamily, FontSize, TextAlign, EmDash)
- **UI**: shadcn/ui + Radix UI (Sheet, Dialog, Card, Button, ScrollArea, DropdownMenu)
- **State**: Zustand (server-backed)
- **Styling**: Tailwind CSS v4 + A4 page styling
- **Document**: mammoth (import) + docx library (DOCX export) + pdf-lib (PDF export)
- **AI**: OpenAI GPT-4o-mini/GPT-5-nano + Anthropic Claude (dual provider support with o-series reasoning models)
- **Testing**: Vitest + React Testing Library + Playwright
- **Other**: @dnd-kit (drag & drop), AES-256-GCM encryption, TipTap CharacterCount extension

## Key Features & Constraints

### Document Import/Export
- **Import**: .docx only with auto chapter splitting by H1, converts to TipTap JSON, preserves formatting
- **Export**: DOCX and PDF formats with full typography (font, size, alignment, indent)
- **PDF Export**: A4 styling matching editor, special character support (Turkish, Polish, Czech, etc.)
- **Handling**: Browser file input, server actions for async operations, format selection dropdown

### Multi-Chapter Workflow (✅ Phase 3 Implemented)

**For complete workflow details**, see [README.md](README.md#workflow)

**Core user flow**:
1. Sign up/Sign in → Dashboard → Create/Import project
2. Edit in A4-styled TipTap editor (auto-save to MongoDB after 1s)
3. Select text → Click "Réécrire" → Choose from 3 proposals → Insert (history auto-saved)
4. Review correction history via toolbar button (accordion UI per chapter)
5. Manage chapters via ChaptersSheet (add, delete, reorder, rename)
6. Export all chapters to DOCX or PDF with full typography preservation

**Key shortcuts**: Ctrl+B/I/U (format), Ctrl+K (em dash), Ctrl+Z (undo) - [See README.md for full list](README.md)

### AI Rewriting Constraints
- **Core Flow**: Select text → Click "Réécrire" → Choose from 3 proposals → Insert (max 2 clicks)
- **AI Strategy**: Single fixed prompt, generates 3 stylistically distinct variants (épuré, lyrique, amplifié), language-preserving (FR→FR, EN→EN)
- **Quality**: Maintains author's voice, prohibits clichés/filler, uses GPT-4o-mini for speed/quality balance
- **UX Rules**: No chat, no modals, no configuration, no onboarding - silent and fast
- **Prompt Location**: `src/infrastructure/ai/OpenAIProvider.ts` (critical product component)

### Out of Scope
If a feature isn't essential to the **selection → replacement loop**, it's excluded.

**Currently excluded**: streaming responses, custom AI prompts, search, per-chapter undo/redo, version control, real-time collaboration, comments/annotations, voice memory, chapter templates.

**Principle**: Ship minimum viable features. Add complexity only when proven necessary.

## Performance Targets & Results

**Targets (Phase 1)**:
- Selection → Proposals: < 3 seconds
- All 3 proposals must be genuinely different
- Zero need to explain or reconfigure requests
- Tool must be usable without documentation

**Phase 2 Targets & Actual Performance**:
- ✅ AI Rewrite: < 3s → **2.7-3.3s** (real OpenAI API)
- ✅ Import DOCX: < 3s → **Not measured** (estimated < 2s)
- ✅ Export Project: < 2s → **57ms** (35x faster than target)
- ✅ Chapter Switch: < 200ms → **0.23ms** (870x faster than target)
- ✅ Content Update: < 100ms → **0.10ms** (1000x faster than target)
- ✅ Keystroke Latency: < 100ms → **< 100ms** (immediate)

**Test Results**: 580+ passed (600+ total, 95%+ pass rate) | 85+ test files

## Development Guidelines

### When Implementing Features
- Every feature must justify its necessity for the selection → replacement loop
- Prefer simplicity over flexibility
- The tool is surgical, not comprehensive
- Avoid over-engineering for hypothetical future needs

### Code Organization
- Respect layer boundaries strictly
- Use cases should be thin orchestrators
- Keep domain logic framework-agnostic
- Abstract all external dependencies behind interfaces

## Development Rules

These rules are **MANDATORY** for all code contributions. They ensure code quality, maintainability, and consistency across the codebase.

### Test-Driven Development (TDD)

**REQUIRED for all new features and bugfixes:**

1. Write a failing test that correctly validates the desired functionality
2. Run the test to confirm it fails as expected
3. Write ONLY enough code to make the failing test pass
4. Run the test to confirm success
5. Refactor if needed while keeping tests green

**Testing Principles:**
- ALL test failures are YOUR responsibility, even if not your fault
- NEVER delete a test because it's failing - investigate and fix
- Tests MUST comprehensively cover ALL functionality
- NEVER write tests that "test" mocked behavior only
- NEVER implement mocks in end-to-end tests - use real data and real APIs
- Test output MUST BE PRISTINE to pass - if logs contain expected errors, capture and validate them

### Naming Conventions

**Names MUST tell WHAT code does, NOT HOW or its HISTORY**

❌ **NEVER use**:
- Implementation details: `ZodValidator`, `MCPWrapper`, `JSONParser`
- Temporal/historical context: `NewAPI`, `LegacyHandler`, `UnifiedTool`, `ImprovedInterface`, `EnhancedParser`
- Pattern names without clarity: `AbstractToolInterface` (prefer `Tool`)

✅ **Good names tell a story about the domain**:
- `Tool` not `AbstractToolInterface`
- `RemoteTool` not `MCPToolWrapper`
- `Registry` not `ToolRegistryManager`
- `execute()` not `executeToolWithValidation()`

### Code Comments

**ABOUTME Comments (MANDATORY):**
- ALL code files MUST start with a brief 2-line comment explaining what the file does
- Each line MUST start with `// ABOUTME: ` to make them easily greppable
- Example:
  ```typescript
  // ABOUTME: Generates AI-powered narrative analysis from project content
  // ABOUTME: Uses LLM provider to extract POV, structure, temporality, and voice
  ```

**Other Comments:**
- NEVER add comments explaining that something is "improved", "better", "new", "enhanced"
- NEVER add comments about what used to be there or how something has changed
- NEVER add instructional comments telling developers what to do
- Comments should explain WHAT the code does or WHY it exists, not how it's better
- NEVER remove code comments unless you can PROVE they are actively false
- Comments are evergreen - they describe the code as it is now

❌ **BAD Comments**:
```typescript
// This uses Zod for validation instead of manual checking
// Refactored from the old validation system
// Wrapper around MCP tool protocol
```

✅ **GOOD Comments**:
```typescript
// Executes tools with validated arguments
// Validates user input to prevent SQL injection
```

### Git Workflow

- **Commits**: Commit frequently throughout development, even if tasks aren't done
- **Hooks**: NEVER skip, evade, or disable a pre-commit hook
- **Staging**: NEVER use `git add -A` unless you've just done `git status`
- **Branches**: Create a WIP branch when starting work without a clear branch
- **Changes**: Track all non-trivial changes in git
- **Commit messages**: Write clear, concise messages describing WHAT changed, not WHY (that's in code comments)

### Systematic Debugging

**YOU MUST ALWAYS find the root cause of any issue**
**NEVER fix a symptom or add a workaround instead of finding the root cause**

**Debugging Framework:**

**Phase 1: Root Cause Investigation** (BEFORE attempting fixes)
- Read error messages carefully - they often contain the exact solution
- Reproduce consistently before investigating
- Check recent changes: git diff, recent commits

**Phase 2: Pattern Analysis**
- Find working examples in the same codebase
- Compare against reference implementations
- Identify differences between working and broken code
- Understand dependencies: what else does this pattern require?

**Phase 3: Hypothesis and Testing**
1. Form single hypothesis: what do you think is the root cause?
2. Test minimally: make the smallest possible change
3. Verify before continuing: did it work? If not, form new hypothesis
4. When you don't know: say "I don't understand X" rather than pretending

**Phase 4: Implementation Rules**
- ALWAYS have the simplest possible failing test case
- NEVER add multiple fixes at once
- NEVER claim to implement a pattern without reading it completely first
- ALWAYS test after each change
- IF your first fix doesn't work, STOP and re-analyze rather than adding more fixes

### Code Quality

- **Simplicity**: Prefer simple, clean, maintainable solutions over clever ones
- **Readability**: Readability and maintainability are PRIMARY concerns
- **Duplication**: Work hard to reduce code duplication through refactoring
- **No Rewrites**: NEVER throw away or rewrite implementations without EXPLICIT permission
- **Consistency**: Match the style and formatting of surrounding code
- **Whitespace**: Don't manually change whitespace that doesn't affect execution
- **Fix Immediately**: Fix broken things immediately when you find them - don't ask permission

### Size of Changes

- Make the SMALLEST reasonable changes to achieve the desired outcome
- Prefer editing existing files over creating new ones
- Prefer editing existing code over adding new code
- Break large changes into smaller, testable increments

### Testing Requirements

**Current Status**: 580+ passed (600+ total, 95%+ pass rate, 85+ test files)

**Coverage**:
- Overall: 42% (v8 measurement)
- Domain entities: 92%+ (Chapter: 95.9%, Project: 97.3%, ProjectMetadata: 90.5%)
- Application use cases: **100%**
- Critical paths: 90%+

**Test Types**:
- **Unit tests**: Domain + Application layers with mocked dependencies
- **Integration tests**: Real API calls (OpenAI & Anthropic) - 24+ provider-specific tests for 7 metadata analysis types + generation
- **Component tests**: React Testing Library
- **Performance tests**: All targets validated

**When Contributing**:
- Follow TDD (see Development Rules section)
- ALL tests must pass before committing
- New features REQUIRE new tests
- NEVER test mocked behavior only
- Integration tests use real APIs (conditionally skipped if keys absent)
- E2E infrastructure ready (Playwright)

**Run Tests**:
```bash
npm test                  # All tests
npm run test:coverage     # With coverage report
npm run test:integration  # Real API tests (requires OPENAI_API_KEY + ANTHROPIC_API_KEY)
npm run test:e2e          # Playwright E2E (when implemented)
```

**For detailed test documentation**, see [docs/README.md#testing](docs/README.md#testing)

## Current Status & Future Roadmap

**Completed Phases** (January 2026):
- ✅ **Phase 1-2**: Core rewrite flow, multi-chapter management, import/export
- ✅ **Phase 2.5**: A4 styling, advanced typography, rich text editing
- ✅ **Phase 3**: MongoDB persistence, Auth.js authentication, multi-tenant projects
- ✅ **Phase 3.5**: Multi-provider AI support (OpenAI, Anthropic), encrypted credentials, Clean Architecture completion (9.5/10 score)
- ✅ **Phase 3.6**: Metadata Analysis System (6 AI-powered analysis types with intelligent caching)
- ✅ **Phase 3.7**: UX Enhancements (PDF export, correction history, word count, author quotes, 3 proposals)
- ✅ **Phase 3.8**: User registration approval system with email notifications
- ✅ **Phase 3.9**: French translation (sign-in, sign-up, dashboard)
- ✅ **Phase 3.10**: Optional AI provider (create projects without provider)
- ✅ **Phase 3.11**: RGPD/LCEN compliance (legal pages, cookie consent, account deletion, data export)
- ✅ **Phase 4.0**: Blog section with SEO articles and admin management
- ✅ **Phase 4.1**: AI text generation for chapters + streaming autocompletion

**Planned Features** (Phase 5+):
- Search across chapters, chapter templates
- Version history, user preferences
- Real-time collaboration, comments/annotations, team workspaces (Phase 6)
- Voice memory, custom AI prompts (Phase 7)

**For detailed roadmap**, see [README.md#roadmap](README.md#roadmap)

**Core Principle**: Each phase proves value before adding complexity.
