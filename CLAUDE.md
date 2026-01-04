# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Revise** is an ultra-minimalist AI-assisted writing tool focused on a single, high-value action: rewriting selected text blocks without breaking creative flow. This is NOT a chat AI or verbose assistant - it's a production tool designed for demanding writers.

### Core Value Proposition
- Select text → Trigger rewrite → Receive 5 stylistically distinct proposals → Insert chosen version instantly
- Success metric: Users prefer this flow over copy-pasting to ChatGPT

### MVP Status: Phase 1 Complete ✅

The MVP Phase 1 is **fully implemented and tested** with 87 passing tests including integration tests with OpenAI API.

**Implemented features:**
- Document import/export (.docx format)
- TipTap-based text editor with selection tracking
- Contextual "Réécrire" button on text selection
- AI-powered rewrite with 5 distinct proposals
- One-click proposal insertion
- Full undo/redo support (Ctrl+Z)
- Clean Architecture with complete test coverage

**Current scope:**
- Documents are ephemeral (in-memory only during session)
- User is responsible for saving their work via export
- No server-side persistence
- No session resumption

**Critical rule**: If a feature isn't essential to the selection → replacement loop, it's out of scope.

## Architecture Principles

This project MUST follow Clean Architecture principles adapted to Next.js:

### Layer Separation (✅ Fully Implemented)

1. **Domain Layer** (`src/domain`)
   - Pure business logic, no framework dependencies
   - Entities: `TextDocument`
   - Value Objects: `TextSelection`, `RewriteProposal`
   - Interfaces: `LLMProvider`, `DocumentParser`, `DocumentExporter`

2. **Application Layer** (`src/application`)
   - Use cases orchestrating domain logic
   - `ImportDocumentUseCase` - Handle .docx document import
   - `RewriteTextUseCase` - Core rewriting logic with OpenAI
   - `ExportDocumentUseCase` - Handle .docx document export

3. **Infrastructure Layer** (`src/infrastructure`)
   - External service implementations
   - `OpenAIProvider` - LLMProvider implementation with GPT-4
   - `DocxParser` - Document parsing using mammoth
   - `DocxExporter` - Document export using docx library

4. **Interface Layer** (`src/app`, `src/components`)
   - React components and UI
   - `TextEditor` - TipTap-based rich text editor
   - `RewriteButton` - Contextual rewrite trigger
   - `ProposalsPanel` - Display and insert proposals
   - `DocumentControls` - Import/export functionality
   - Server Actions for import, export, and rewrite operations

### Dependency Rules
- Domain depends on nothing
- Application depends only on Domain
- Infrastructure depends on Application and Domain
- Interface depends on Application and Domain
- OpenAI must be abstracted behind `LLMProvider` interface
- Parsers and exporters must be swappable implementations
- UI components contain zero business logic

This architecture enables future evolution (persistence, projects, memory) without refactoring.

## Technical Stack (Current Implementation)

- **Framework**: Next.js 16.1.1 (App Router)
- **Rendering**: React 19 with Server Components
- **Editor**: TipTap 3.14.0 with StarterKit
- **UI Components**: shadcn/ui + Radix UI
- **Styling**: Tailwind CSS v4 + tailwind-merge
- **Document Parsing**: mammoth (DOCX only)
- **Document Export**: docx library (DOCX only)
- **AI Provider**: OpenAI API (GPT-4o-mini)
- **Testing**: Vitest + React Testing Library + Playwright
- **Data Storage**: None (ephemeral, in-memory only)

## Key Features & Constraints

### Document Import/Export (✅ Implemented)
- **Import format**: .docx only
- **Export format**: .docx only
- Documents converted to plain text (formatting stripped during import)
- Export creates basic .docx with current editor content
- File handling via browser file input (no server upload)

### Text Rewriting Flow (✅ Implemented)
1. User loads document via "Importer" button
2. User selects text block in TipTap editor
3. Contextual "Réécrire" button appears near selection
4. User clicks button, AI generates exactly 5 proposals
5. Proposals displayed in panel below editor
6. Each proposal has "Insérer" button
7. Clicking "Insérer" replaces selected text
8. Full undo/redo available (Ctrl+Z / Ctrl+Shift+Z)
9. User exports document via "Exporter" button when done

No chat, no discussion, no configuration, no onboarding.

### AI Prompting Strategy (✅ Implemented)
- Single, fixed, carefully crafted system prompt in `OpenAIProvider`
- Generates exactly 5 stylistically distinct variants
- Strict preservation of original meaning and length
- Maintains author's voice and intent
- Uses GPT-4o-mini for balance of quality and speed
- Context-aware: uses surrounding text for better understanding
- Prohibits clichés, filler, and generic improvements
- Returns JSON array of 5 proposals
- **The prompt is a critical product component** - see `src/infrastructure/ai/OpenAIProvider.ts`

### UX Non-Negotiables
- No full-screen modals
- No sidebar
- No chat interface
- No AI jargon
- Maximum 2 clicks after selection
- Silent, fast, discreet interface

### Explicitly Excluded (Do Not Implement)
- Server-side persistence
- Autosave
- Session resumption
- Version control
- User accounts
- Document history
- Collaborative editing
- Advanced layout management
- Formatted export (PDF, DOCX with styling)
- Authentication
- User settings/preferences
- Streaming responses
- Database

## Performance Targets

- Selection → Proposals: < 3 seconds
- All 5 proposals must be genuinely different
- Zero need to explain or reconfigure requests
- Tool must be usable without documentation

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

### Testing Status (✅ Complete)

**Test Coverage**: 87 tests across all layers
- **Domain Layer**: 30 tests (TextDocument, TextSelection, RewriteProposal)
- **Application Layer**: 15 tests (all use cases)
- **Infrastructure Layer**: 21 tests (OpenAI, parsers, exporters)
- **Interface Layer**: 17 tests (all React components)
- **Integration Tests**: 6 tests (OpenAI API, document pipeline)

**Test Types**:
- Unit tests with mocked dependencies
- Integration tests with real OpenAI API
- E2E tests with Playwright (setup complete)
- Performance validation (< 3s target for rewrites)

**Verified Scenarios**:
- Real long-form text rewriting
- Proposal diversity and quality
- Text replacement accuracy
- Undo/redo functionality
- Document import/export pipeline
- Error handling and edge cases

## Future Evolution Path

This MVP is the foundation for a surgical writing tool that may evolve toward:
- Custom styles
- Voice memory
- Advanced stylistic analysis

But NOT before proving the core value: instant rewriting.
