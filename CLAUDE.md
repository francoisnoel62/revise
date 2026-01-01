# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Revise** is an ultra-minimalist AI-assisted writing tool focused on a single, high-value action: rewriting selected text blocks without breaking creative flow. This is NOT a chat AI or verbose assistant - it's a production tool designed for demanding writers.

### Core Value Proposition
- Select text → Trigger rewrite → Receive 5 stylistically distinct proposals → Insert chosen version instantly
- Success metric: Users prefer this flow over copy-pasting to ChatGPT

### MVP Scope
The MVP is deliberately minimal. Document persistence is explicitly OUT OF SCOPE:
- No server-side storage
- No session persistence
- Documents are ephemeral (in-memory only during session)
- User is responsible for saving their work

**Critical rule**: If a feature isn't essential to the selection → replacement loop, it's out of scope.

## Architecture Principles

This project MUST follow Clean Architecture principles adapted to Next.js:

### Layer Separation

1. **Domain Layer** (`/domain`)
   - Pure business logic, no framework dependencies
   - Entities: `TextDocument`
   - Business rules for text rewriting

2. **Application Layer** (`/application`)
   - Use cases orchestrating domain logic
   - `ImportDocumentUseCase` - Handle document import (txt, docx, pdf)
   - `RewriteTextUseCase` - Core rewriting logic
   - `ExportDocumentUseCase` - Handle document export

3. **Infrastructure Layer** (`/infrastructure`)
   - External service implementations
   - `LLMProvider` interface with OpenAI implementation
   - Document parsers (pdf-parse, mammoth for docx)
   - Document exporters

4. **Interface Layer** (`/app`, `/components`)
   - React components and UI
   - TipTap editor integration
   - API routes/Server Actions (orchestration only, no business logic)

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

- **Framework**: Next.js 16+ (App Router)
- **Rendering**: React Server Components
- **Editor**: TipTap
- **UI Components**: shadcn/ui
- **Document Parsing**: pdf-parse, mammoth
- **AI Provider**: OpenAI API
- **Data Storage**: None (MVP is ephemeral)

## Key Features & Constraints

### Document Import/Export
- **Import formats**: .docx
- **Export formats**: .docx
- Documents converted to plain text, no advanced formatting guaranteed
- Without document loading capability, the tool has no functional value

### Text Rewriting Flow
1. User selects text block
2. Contextual "Réécrire" button appears
3. AI generates exactly 5 proposals
4. Each proposal has "Insérer" button
5. Selected text is replaced
6. Undo available (Ctrl+Z)

No discussion, no configuration, no onboarding.

### AI Prompting Strategy
- Single, fixed, carefully crafted prompt
- Generate 5 clearly differentiated variants
- Strict preservation of original meaning
- Maintain author's voice
- Prohibit clichés and filler
- **The prompt is a critical product component**

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

### Testing Focus
- Test with real long-form text
- Verify proposal diversity
- Validate text replacement accuracy
- Ensure undo functionality works correctly

## Future Evolution Path

This MVP is the foundation for a surgical writing tool that may evolve toward:
- Custom styles
- Voice memory
- Advanced stylistic analysis

But NOT before proving the core value: instant rewriting.
