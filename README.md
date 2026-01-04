# Revise

An ultra-minimalist AI-assisted writing tool focused on one high-value action: instant text rewriting without breaking creative flow.

**Status**: MVP Phase 1 Complete ✅ (87 tests passing)

## Core Value Proposition

Select text → Trigger rewrite → Receive 5 stylistically distinct proposals → Insert chosen version instantly.

This is **not** a chat AI or verbose assistant. It's a production tool designed for demanding writers who value speed, precision, and minimal interruption.

## Key Features

- **Instant AI Rewriting**: Select any text block and get 5 distinct, high-quality alternatives powered by GPT-4
- **Document Import**: Load `.docx` files to start working immediately
- **Document Export**: Export your work as `.docx` when done
- **TipTap Editor**: Modern rich text editing with full undo/redo support
- **Minimalist UX**: No modals, no sidebars, no AI jargon - contextual rewrite button appears on selection
- **Ephemeral by Design**: No server-side storage, no sessions - you control your data
- **Fast Performance**: < 3 second target for rewrite generation

## MVP Scope

The MVP is deliberately minimal. Features out of scope:
- Server-side persistence
- User accounts or authentication
- Document history or version control
- Collaborative editing
- Advanced formatting
- Streaming responses

**Critical rule**: If it's not essential to the selection → replacement loop, it's out of scope.

## Tech Stack

- **Framework**: Next.js 16.1.1 (App Router)
- **Rendering**: React 19 with Server Components
- **Editor**: TipTap 3.14.0 with StarterKit
- **UI Components**: shadcn/ui + Radix UI
- **Styling**: Tailwind CSS v4
- **Document Parsing**: mammoth (DOCX)
- **Document Export**: docx library
- **AI Provider**: OpenAI API (GPT-4o-mini)
- **Testing**: Vitest + React Testing Library + Playwright
- **Architecture**: Clean Architecture principles

## Architecture

The project follows Clean Architecture adapted to Next.js with complete test coverage:

```
src/
├── domain/              Pure business logic (entities, value objects, interfaces)
│   ├── entities/        TextDocument
│   ├── value-objects/   TextSelection, RewriteProposal
│   └── interfaces/      LLMProvider, DocumentParser, DocumentExporter
│
├── application/         Use cases orchestrating domain logic
│   └── use-cases/       ImportDocument, ExportDocument, RewriteText
│
├── infrastructure/      External service implementations
│   ├── ai/             OpenAIProvider (GPT-4o-mini)
│   ├── document/       DocxParser, DocxExporter
│   └── config/         Environment configuration
│
└── app/components/      Next.js interface layer
    ├── app/            Pages and Server Actions
    ├── components/     React UI components
    └── lib/            UI utilities
```

### Layer Dependencies

- Domain: Zero dependencies (pure business logic)
- Application: Depends only on Domain
- Infrastructure: Implements Domain interfaces
- Interface: Uses Application use cases

This strict layering enables future evolution without refactoring.

## Getting Started

### Prerequisites

- Node.js 18+
- OpenAI API key

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env.local` file:

```env
OPENAI_API_KEY=your_api_key_here
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

```bash
npm run build
npm start
```

## Usage

1. **Import a document** - Click "Importer" and select your `.docx` file
2. **Edit your text** - Use the TipTap editor (supports undo/redo with Ctrl+Z)
3. **Select text** - Highlight any text block you want to rewrite
4. **Click "Réécrire"** - Contextual button appears near your selection
5. **Choose a proposal** - Review 5 AI-generated alternatives and click "Insérer" on your preferred variant
6. **Export when done** - Click "Exporter" to save your work as `.docx`

The document exists only in your browser session. Export to save your work.

## Performance Targets

- Selection → Proposals: < 3 seconds
- All 5 proposals must be genuinely different
- Zero need to explain or reconfigure requests
- Tool must be usable without documentation

## Testing

Comprehensive test suite with 87 passing tests:

```bash
npm test              # Run all unit tests
npm run test:ui       # Interactive test UI
npm run test:coverage # Generate coverage report
npm run test:integration  # Run integration tests with OpenAI
npm run test:e2e      # Run end-to-end tests with Playwright
```

**Test Coverage**:
- Domain Layer: Entities and value objects (30 tests)
- Application Layer: All use cases (15 tests)
- Infrastructure Layer: OpenAI, parsers, exporters (21 tests)
- Interface Layer: All React components (17 tests)
- Integration Tests: Real OpenAI API calls (6 tests)

## AI Prompting

The prompt is a critical product component (see `src/infrastructure/ai/OpenAIProvider.ts`):
- Single, fixed, carefully crafted system prompt
- Generates exactly 5 clearly differentiated variants
- Strict preservation of original meaning and length
- Context-aware: uses surrounding text for better understanding
- Maintains author's voice and intent
- Uses GPT-4o-mini for optimal speed/quality balance
- Prohibits clichés, filler, and generic improvements

## Contributing

This is an MVP focused on proving core value. Feature requests should align with the project's minimalist philosophy.

## License

[To be determined]

## Future Vision

This MVP is the foundation for a surgical writing tool that may evolve toward:
- Custom styles
- Voice memory
- Advanced stylistic analysis

But **not** before proving the core value: instant rewriting.
