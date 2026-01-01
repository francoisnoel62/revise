# Revise

An ultra-minimalist AI-assisted writing tool focused on one high-value action: instant text rewriting without breaking creative flow.

## Core Value Proposition

Select text → Trigger rewrite → Receive 5 stylistically distinct proposals → Insert chosen version instantly.

This is **not** a chat AI or verbose assistant. It's a production tool designed for demanding writers who value speed, precision, and minimal interruption.

## Key Features

- **Instant Rewriting**: Select any text block and get 5 distinct, high-quality alternatives
- **Document Import**: Load `.docx` files to start working immediately
- **Document Export**: Export your work as `.docx`
- **Minimalist UX**: No modals, no sidebars, no AI jargon - maximum 2 clicks after selection
- **Ephemeral by Design**: No server-side storage, no sessions - you control your data

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

- **Framework**: Next.js 16+ (App Router)
- **Rendering**: React Server Components
- **Editor**: TipTap
- **UI Components**: shadcn/ui
- **Document Parsing**: pdf-parse, mammoth
- **AI Provider**: OpenAI API
- **Architecture**: Clean Architecture principles

## Architecture

The project follows Clean Architecture adapted to Next.js:

```
/domain          - Pure business logic, no framework dependencies
/application     - Use cases orchestrating domain logic
/infrastructure  - External service implementations (OpenAI, parsers, exporters)
/app             - Next.js App Router pages and API routes
/components      - React UI components
```

### Layer Dependencies

- Domain depends on nothing
- Application depends only on Domain
- Infrastructure depends on Application and Domain
- Interface (app/components) depends on Application and Domain

This architecture enables future evolution without refactoring.

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

1. **Import a document** - Load your `.txt`, `.docx`, or `.pdf` file
2. **Select text** - Highlight any text block you want to rewrite
3. **Click "Réécrire"** - Trigger the rewrite action
4. **Choose a proposal** - Click "Insérer" on your preferred variant
5. **Continue writing** - Undo available with Ctrl+Z

## Performance Targets

- Selection → Proposals: < 3 seconds
- All 5 proposals must be genuinely different
- Zero need to explain or reconfigure requests
- Tool must be usable without documentation

## AI Prompting

The prompt is a critical product component:
- Single, fixed, carefully crafted prompt
- Generates 5 clearly differentiated variants
- Strict preservation of original meaning
- Maintains author's voice
- Prohibits clichés and filler

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
