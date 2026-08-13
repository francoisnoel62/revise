# Revise Documentation

Index de la documentation courante et des archives de Revise.

## 📚 Documentation Structure

### User Documentation
For writers and end users of Revise.

- **[AI Provider Management](./user/provider-management.md)** - Complete guide to configuring and managing AI providers
  - Getting API keys
  - Adding and testing providers
  - Security best practices
  - Troubleshooting
  - FAQ

### Developer Documentation
For developers working on or integrating with Revise.

- **[API Reference](./developer/api-reference.md)** - Contrats actifs des Server Actions de fournisseurs et de publication

### Project Documentation
High-level project information.

- **[docs/architecture.md](./architecture.md)** - Carte des couches, chemins actifs, correction locale et publication
- **[CLAUDE.md](../CLAUDE.md)** - Governance rules for Claude Code working in this repo (tech stack,
  Clean Architecture constraints, development rules). It no longer contains phase-by-phase feature
  history — see `docs/architecture.md` and `CHANGELOG.md` for that.

- **[README.md](../README.md)** - Project overview and quick start
  - Features overview
  - Installation instructions
  - Usage guide
  - Tech stack

## 🚀 Quick Links

### Getting Started
1. Read [README.md](../README.md) for project overview
2. Follow installation instructions
3. Set up [AI Provider](./user/provider-management.md)
4. Start writing!

### For Developers
1. Read [docs/architecture.md](./architecture.md) for architecture
2. Review [API Reference](./developer/api-reference.md)
3. Check test files for examples
4. Follow Clean Architecture principles

## 📖 Documentation by Topic

### Authentication & Security
- User authentication: See README.md → Quick Start
- Password security: bcrypt; forgot/reset password flow (`/auth/forgot-password`, `/auth/reset-password`)
- API key encryption: [Provider Management](./user/provider-management.md)
- Multi-tenant isolation: [Architecture](./architecture.md)
- AI transparency ledger: opt-in log of captured AI exchanges, encrypted at rest — see `docs/architecture.md`

### AI Providers
- **User Guide**: [Provider Management](./user/provider-management.md)
- **Developer Guide**: [API Reference](./developer/api-reference.md)
- Supported providers: OpenAI, Anthropic, Google (free-text model name, no predefined list)
- Connection testing: Rate limited (1 per 5 seconds)
- Model pricing synced dynamically from OpenRouter; admin panel at `/admin/pricing`

### Database & Persistence
- MongoDB integration: See [docs/architecture.md](./architecture.md)
- Auto-save: 1-second debounce
- Multi-tenant data isolation: All queries filtered by ownerId
- Encryption at rest: AES-256-GCM for API keys and transparency-ledger content (separate, domain-separated keys)

### Editor & Formatting
- TipTap rich text editor with a semantic content model (role decoupled from presentation)
- Manuscript editor with a separate paginated publication preview for KDP 6×9 and A5; Passerelle is a DOCX/Word or Google Docs flow
- Typography controls: per-profile font family, size, alignment, indent
- Keyboard shortcuts: See README.md → Usage

### Testing
- Unit tests: Vitest + React Testing Library
- Integration tests: Real API calls (OpenAI, Anthropic, Google)
- E2E tests: Playwright with auth seeding (`e2e/auth.setup.ts`)
- AI context scenarios: Manual workflow guides A–D (`tests_ia_efficiency/`) distinguish generation/rewrite context from the active autocomplete stream
- Use nearby tests and `npm run test:coverage` for current evidence rather than a figure hard-coded here

## 🔍 Find What You Need

### By Role

**I'm a Writer/User:**
- Start with [README.md](../README.md)
- Configure providers: [Provider Management](./user/provider-management.md)
- Learn shortcuts: README.md → Usage

**I'm a Developer:**
- Architecture: [Architecture](./architecture.md) and [CONTEXT.md](../CONTEXT.md)
- API docs: [API Reference](./developer/api-reference.md)
- Code examples: Check test files in `/src`

**I'm Deploying to Production:**
- Environment setup: README.md → Environment Variables
- Composition and runtime dependencies: [Architecture](./architecture.md) and `src/infrastructure/README.md`

### By Task

**Setting up AI providers:**
→ [Provider Management Guide](./user/provider-management.md)

**Understanding the architecture:**
→ [Architecture](./architecture.md)

**Using the Server Actions API:**
→ [API Reference](./developer/api-reference.md) → Server Actions API

**Writing tests:**
→ Tests colocated with the capability and `tests_ia_efficiency/` where applicable

**Troubleshooting issues:**
→ [Provider Management](./user/provider-management.md)

## 🆕 Archive historique — What's New

> Cette section est conservée telle qu'elle a été écrite. Ses noms de composants, compteurs et
> descriptions de flux ne constituent pas la source de vérité de l'état présent. Pour le code
> actif, consulter `docs/architecture.md` et les README de couche ; pour la chronologie, consulter
> **[CHANGELOG.md](../CHANGELOG.md)**.

### Phase 9.0 - Character Chat & Character Sheet Auto-Fill (June 2026) ✅

**Character Chat**:
- ✅ Chat with any character from your project in their own voice (streaming SSE)
- ✅ Conversation history persisted and resumed across sessions
- ✅ Copy button on character replies for direct manuscript insertion
- ✅ `CharacterChatSheet` component with real-time streaming

**Character Sheet Auto-Fill**:
- ✅ "Auto-fill" button in `CharacterForm` — AI generates 8 character fields from manuscript + metadata
- ✅ Author reviews and decides what to keep; nothing is persisted automatically

**AI Cost Tracking**:
- ✅ All three providers now capture real token counts (input/output/cached) including from streams
- ✅ `ModelPricing` table computes euro cost per call — cost stored per record, not retroactively recalculated
- ✅ `UsageStatsCard` shows euro cost and cached-token figures

**Editor Navigation**:
- ✅ `ProjectSettingsMenu` — quick access to all cockpit sections from the editor header

### Phase 8.0 - AI Contextual Strategy (June 2026) ✅

**AI Context from Author Material**:
- ✅ AI now writes from the author's own metadata and research documents
- ✅ "Author edit wins" — edited analyses are never silently overridden
- ✅ Staleness indicator on `MetadataCard`
- ✅ Research documents feed into completion and chapter generation by locality

### Phase 5.1 - Markdown Folder Import (January 2026) ✅

**Markdown Support**:
- ✅ Import folder of .md files as chapters
- ✅ FolderParser interface for domain abstraction
- ✅ MarkdownParser for single file parsing
- ✅ MarkdownFolderParser for folder structure
- ✅ ImportFolderUseCase for orchestration
- ✅ IndentHeading TipTap extension

### Phase 5.0 - Public Project Sharing (January 2026) ✅

**Sharing Features**:
- ✅ Publish projects via unique public links
- ✅ PublishDialog for publishing UI
- ✅ PublicReader for read-only view
- ✅ Project entity enhanced (shareToken, isPublished, publishedAt)
- ✅ Publishing use cases (Publish, Unpublish, LoadPublished)
- ✅ `/read/[projectId]/[token]` public route

### Phase 4.1+ - UX Enhancements (January 2026) ✅

**UI/UX Improvements**:
- ✅ Unified AI Menu (AIMenuDropdown)
- ✅ Command Palette (Cmd/Ctrl+Shift+I)
- ✅ Responsive mobile design
- ✅ Reading time display
- ✅ Blog pagination (5 articles per page)

### Phase 4.1 - AI Text Generation & Autocompletion (January 2026) ✅

**AI-Powered Content Generation**:
- ✅ AI Chapter Generation - Generate chapter beginnings from empty chapters using project metadata context
- ✅ Streaming Autocompletion - Press Tab to trigger, Tab again to accept (real-time ghost text)
- ✅ FloatingGenerationMenu - Context-aware generation options for empty chapters
- ✅ MetadataCache - TTL-based caching (5 min) for metadata to reduce database queries

**Technical Achievements**:
- ✅ GenerateChapterUseCase with full metadata context loading
- ✅ GenerateCompletionUseCase for autocompletion
- ✅ ContentConverter interface (Clean Architecture abstraction)
- ✅ TipTapContentService infrastructure implementation
- ✅ Autocomplete TipTap extension with streaming support
- ✅ SSE endpoint `/api/completion/stream` for real-time completion

### Phase 4.0 - Blog Section (January 2026) ✅

**Blog Features**:
- ✅ Blog pages - `/blog` list and `/blog/[slug]` article pages
- ✅ 6+ SEO articles (2700-3600 words each) on writing techniques
- ✅ Admin blog management - `/admin/blog` for CRUD operations

**Technical Achievements**:
- ✅ BlogArticle entity with slug, title, content, metadata
- ✅ MongoDBBlogArticleRepository with indexes
- ✅ dynamicParams enabled for post-deployment article seeding

### Phase 3.11 - RGPD/LCEN Compliance (January 2026) ✅

**Legal Compliance**:
- ✅ Legal pages - CGU, CGV, mentions légales, politique confidentialité, politique cookies
- ✅ Cookie consent banner - CookieConsent component with 3 variants
- ✅ Consent timestamps - termsAcceptedAt, privacyAcceptedAt stored on User
- ✅ Account deletion - DeleteUserAccountUseCase with cascade delete
- ✅ Data export - exportUserDataAction for RGPD Article 20 portability
- ✅ Settings page - `/settings` with account deletion and data export UI
- ✅ Contact form - ContactMessage entity, repository, and landing page integration

### Phase 3.8 - User Registration Approval (January 2026) ✅

**Approval System**:
- ✅ Admin approval workflow - Users must be approved before signing in
- ✅ Email notifications - ResendEmailService for approval request emails
- ✅ HMAC token validation - Secure approval/rejection links
- ✅ ApproveUserUseCase - Handles approval with token verification

### Phase 3.7 - UX Enhancements (January 2026) ✅

**Enhanced User Experience & New Features**:
- ✅ PDF Export - Full typography support with pdf-lib, A4 styling matching editor
- ✅ Correction History - Track and view all AI rewrites per chapter with searchable accordion UI
- ✅ Character/Word Count - Live statistics in editor header
- ✅ Undo/Redo Toolbar Buttons - Accessible via toolbar in addition to keyboard shortcuts
- ✅ Loading Overlay - Progress bar with 100 famous author quotes during AI rewrite (3s rotation)
- ✅ 3 Proposals - Reduced from 5 to 3 (épuré, lyrique, amplifié) for better UX and 40% token savings
- ✅ GPT-5 & o-series Support - Proper API parameters for reasoning models
- ✅ Metadata UI Improvements - Regeneration moved to 3-dot menu

**Technical Achievements**:
- ✅ CorrectionHistory entity with multi-tenant repository
- ✅ 3 new use cases (Save, List, Delete correction history)
- ✅ correction-history-actions server actions
- ✅ CorrectionHistoryDialog with accordion UI and copy functionality
- ✅ Zustand store cache for correction history
- ✅ PdfExporter with special character support (Turkish, Polish, Czech, etc.)
- ✅ 39 unit tests for correction history (entity, use cases, edge cases)
- ✅ TipTap CharacterCount extension integration

### Phase 3.6 - Metadata Analysis System (January 2026) ✅

**6 AI-Powered Analysis Types with Intelligent Caching**:
- ✅ Narrative Analysis - POV, structure, temporality, voice
- ✅ Characters - Profiles, relationships, narrative hierarchy
- ✅ Plot - Structure breakdown, conflicts, scene progression
- ✅ Stylistic DNA - Register, syntax patterns, figures of style
- ✅ Worldbuilding - Themes, symbolism, setting analysis
- ✅ Synthesis - Meta-analysis with editorial feedback

**Technical Achievements**:
- ✅ Smart caching with SHA-256 content hashing
- ✅ Dual provider support (OpenAI + Anthropic)
- ✅ 12 new use cases (6 CRUD + 6 Generation)
- ✅ ProjectMetadata entity with TipTap JSON storage
- ✅ FilePromptRepository for version-controlled prompts
- ✅ MongoDBMetadataRepository with multi-tenant isolation
- ✅ Metadata UI pages and components
- ✅ Comprehensive tests with intelligent caching

### Phase 3.5 - Clean Architecture Completion (January 2026) ✅

**Clean Architecture Finalized**:
- ✅ **All Use Cases Created** - 13 new use cases across Project, Provider, and User domains
- ✅ **Dependency Injection** - Centralized via utils.ts (getRepository, getProviderRepo, getUserRepo, getLLMProviderFactory, getIdGenerator)
- ✅ **Domain Abstractions** - IdGenerator, LLMProviderFactory interfaces (zero crypto/infrastructure dependencies in Domain)
- ✅ **Infrastructure Implementations** - UUIDGenerator, LLMProviderFactoryImpl
- ✅ **Server Actions Refactored** - All delegate to Use Cases (no business logic in actions)
- ✅ **Complete Index Exports** - domain/index.ts, application/index.ts fully populated

**UI/UX Improvements**:
- ✅ **CreateProjectDialog** - New project creation with title input
- ✅ **Improved Header Layout** - Better project title visibility, DocumentControls, and UserMenu integration
- ✅ **Provider Components** - ProvidersDialog, ProviderForm, ProviderCard
- ✅ **NoProvidersAlert** - Dashboard alert for missing provider configuration

**AI Provider Management**:
- ✅ **Multiple AI Providers** - OpenAI, Anthropic, Google
- ✅ **Encrypted Credential Storage** - AES-256-GCM encryption at rest
- ✅ **Per-Project Provider Selection** - Each project can use different providers
- ✅ **Connection Testing** - Rate-limited testing (1 per 5 seconds)
- ✅ **Provider CRUD** - Full management UI with create/edit/delete/test capabilities
- ✅ **MongoDBProviderRepository** - Encrypted provider storage with multi-tenant isolation

**Testing**:
- ✅ **Comprehensive Test Coverage** - All layers fully tested
- ✅ **100% Application Layer Coverage** - All use cases tested
- ✅ **92%+ Domain Layer Coverage** - Excellent business logic coverage (entities)
- ✅ **12 Provider-Specific Integration Tests** - Real API validation (OpenAI & Anthropic)

**Architecture Score**: 9.5/10 (up from 7.5/10 - all technical debt resolved as of Phase 3.5)

See [docs/architecture.md](./architecture.md) for the current, maintained architecture audit.

## 📝 Contributing to Documentation

### Documentation Standards

**User Documentation:**
- Write for non-technical users
- Include step-by-step instructions
- Add screenshots where helpful
- Provide troubleshooting sections
- Keep FAQ up to date

**Developer Documentation:**
- Include code examples
- Document all public APIs
- Show error handling
- Provide performance considerations
- Link to relevant code

### File Organization

```
docs/
├── README.md              # This file - documentation index
├── architecture.md        # Full layer-by-layer architecture inventory (kept current)
├── adr/                    # Architecture Decision Records
├── agents/                 # Instructions for AI coding agents (issue tracker, triage labels...)
├── journal/                 # Append-only engineering journal
├── plans/                    # Feature handoff / planning documents
├── prompt/                    # Production prompt templates (loaded by FilePromptRepository)
├── user/                  # User-facing documentation
│   └── provider-management.md
└── developer/             # Developer documentation
    ├── api-reference.md
    └── worktrees.md
```

### Adding New Documentation

1. Choose appropriate directory (user/developer/deployment)
2. Follow existing format and style
3. Update this README.md with links
4. Test all code examples
5. Review for clarity and completeness

## 🐛 Found an Issue?

**Documentation Issues:**
- Unclear explanations
- Broken links
- Outdated information
- Missing examples

**How to Report:**
1. Open GitHub issue with "docs:" prefix
2. Specify which document
3. Describe the problem
4. Suggest improvements (optional)

## 📮 Need Help?

**For Users:**
- Review [Provider Management](./user/provider-management.md)
- Open GitHub issue

**For Developers:**
- Review [API Reference](./developer/api-reference.md)
- Check test files for examples
- Open GitHub issue with technical details

---

**Last reviewed**: 13 August 2026. L'index et `docs/architecture.md` sont mis à jour avec les
changements de capacité ; `CHANGELOG.md` reste la chronologie des livraisons.
