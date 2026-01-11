# Revise Documentation

Comprehensive documentation for Revise - the ultra-minimalist AI-assisted writing tool.

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

- **[API Reference](./developer/api-reference.md)** - Complete API documentation for provider management
  - Server Actions API
  - Domain entities
  - Data types
  - Security details
  - Testing examples
  - Performance considerations

### Project Documentation
High-level project information.

- **[CLAUDE.md](../CLAUDE.md)** - Guidance for Claude Code when working with this repository
  - Project overview and architecture
  - Implementation phases
  - Technical stack
  - Development guidelines

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
1. Read [CLAUDE.md](../CLAUDE.md) for architecture
2. Review [API Reference](./developer/api-reference.md)
3. Check test files for examples
4. Follow Clean Architecture principles

## 📖 Documentation by Topic

### Authentication & Security
- User authentication: See README.md → Quick Start
- Password security: bcrypt with 12 rounds
- API key encryption: [Provider Management](./user/provider-management.md#security-best-practices)
- Multi-tenant isolation: [API Reference](./developer/api-reference.md#security)

### AI Providers
- **User Guide**: [Provider Management](./user/provider-management.md)
- **Developer Guide**: [API Reference](./developer/api-reference.md)
- Supported providers: OpenAI, Anthropic, Mistral, Cohere, Google
- Connection testing: Rate limited (1 per 5 seconds)

### Database & Persistence
- MongoDB Atlas integration: See CLAUDE.md → Infrastructure Layer
- Auto-save: 1-second debounce
- Multi-tenant data isolation: All queries filtered by ownerId
- Encryption at rest: AES-256-GCM for API keys

### Editor & Formatting
- TipTap rich text editor: See CLAUDE.md → Phase 2.5
- A4 page styling: 794px width, professional margins
- Typography controls: Font family, size, alignment, indent
- Keyboard shortcuts: See README.md → Usage

### Testing
- Test coverage: **481 passed + 32 skipped (513 total, 94% pass rate)**
- Test files: 77 files (63 passed, 14 skipped)
- Unit tests: Vitest + React Testing Library
- Integration tests: Real API calls (OpenAI & Anthropic)
- Provider-specific integration tests: 12 tests (6 OpenAI + 6 Anthropic) - conditional
- E2E tests: Playwright (setup ready)
- Coverage: 40.8% global, 92%+ domain entities, 100% use cases
- See [API Reference](./developer/api-reference.md#testing) for examples

## 🔍 Find What You Need

### By Role

**I'm a Writer/User:**
- Start with [README.md](../README.md)
- Configure providers: [Provider Management](./user/provider-management.md)
- Learn shortcuts: README.md → Usage

**I'm a Developer:**
- Architecture: [CLAUDE.md](../CLAUDE.md)
- API docs: [API Reference](./developer/api-reference.md)
- Code examples: Check test files in `/src`

**I'm Deploying to Production:**
- Environment setup: README.md → Environment Variables
- Security checklist: [Provider Management](./user/provider-management.md#security-best-practices)
- Performance targets: [API Reference](./developer/api-reference.md#performance-considerations)

### By Task

**Setting up AI providers:**
→ [Provider Management Guide](./user/provider-management.md)

**Understanding the architecture:**
→ [CLAUDE.md](../CLAUDE.md) → Architecture Principles

**Using the Server Actions API:**
→ [API Reference](./developer/api-reference.md) → Server Actions API

**Writing tests:**
→ [API Reference](./developer/api-reference.md#testing)

**Troubleshooting issues:**
→ [Provider Management](./user/provider-management.md#troubleshooting)

## 🆕 What's New

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
- ✅ 481+ comprehensive tests (513 total with 32 skipped)

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
- ✅ **Multiple AI Providers** - OpenAI, Anthropic, Mistral, Cohere, Google
- ✅ **Encrypted Credential Storage** - AES-256-GCM encryption at rest
- ✅ **Per-Project Provider Selection** - Each project can use different providers
- ✅ **Connection Testing** - Rate-limited testing (1 per 5 seconds)
- ✅ **Provider CRUD** - Full management UI with create/edit/delete/test capabilities
- ✅ **MongoDBProviderRepository** - Encrypted provider storage with multi-tenant isolation

**Testing**:
- ✅ **481 Tests Passing** - Comprehensive coverage across all layers (513 total, 32 skipped)
- ✅ **100% Application Layer Coverage** - All use cases tested
- ✅ **92%+ Domain Layer Coverage** - Excellent business logic coverage (entities)
- ✅ **12 Provider-Specific Integration Tests** - Real API validation (OpenAI & Anthropic)

**Architecture Score**: 9.5/10 (up from 7.5/10 - all technical debt resolved)

See [CLAUDE.md](../CLAUDE.md#clean-architecture---technical-debt) for complete audit details.

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
├── user/                  # User-facing documentation
│   └── provider-management.md
├── developer/             # Developer documentation
│   └── api-reference.md
└── deployment/            # Deployment guides (future)
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
- Check [FAQ](./user/provider-management.md#faq)
- Review [Troubleshooting](./user/provider-management.md#troubleshooting)
- Open GitHub issue

**For Developers:**
- Review [API Reference](./developer/api-reference.md)
- Check test files for examples
- Open GitHub issue with technical details

---

**Documentation Version**: Phase 3.6 (January 2026)
**Last Updated**: January 10, 2026
**Status**: Complete ✅ - Metadata Analysis System (6 AI-powered analysis types with 400+ tests)
