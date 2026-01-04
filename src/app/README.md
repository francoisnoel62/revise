# Interface Layer (App Router + Components)

Next.js App Router pages, layouts, and UI components.

**Status**: ✅ Complete (17 component tests)

## Rules:
- Depends on Application and Domain layers
- Orchestrates use cases via Server Actions
- No business logic in components
- UI components are pure presentation

## Contents:

### App Router (✅ Implemented)

#### `app/page.tsx`
Main application page orchestrating the complete user journey.

**Features**:
- Document state management (ephemeral, in-memory)
- Editor selection tracking
- Rewrite flow coordination
- Performance monitoring (3s target warning)

**State Management**:
- Content (editor text)
- Selection (from/to positions)
- Proposals (AI-generated alternatives)
- UI state (button visibility, loading)

#### `app/layout.tsx`
Root layout with metadata and global styling.

#### Server Actions (`app/actions/`)

**`import-document.ts`**
- Uses `ImportDocumentUseCase`
- Handles file buffer from client
- Returns plain text content

**`export-document.ts`**
- Uses `ExportDocumentUseCase`
- Creates .docx buffer from content
- Returns base64-encoded file for download

**`rewrite-text.ts`**
- Uses `RewriteTextUseCase`
- Tracks performance duration
- Returns 5 proposals or error

### UI Components (✅ Implemented)

#### Editor Components (`components/editor/`)

**`TextEditor`**
- TipTap editor with StarterKit
- Real-time selection tracking
- Content change propagation
- Undo/redo support (Ctrl+Z/Ctrl+Shift+Z)
- 4 tests covering editing and selection

**`RewriteButton`**
- Contextual button positioned near selection
- Shows/hides based on selection state
- Loading state during API calls
- 5 tests covering visibility and interaction

#### Document Components (`components/document/`)

**`DocumentControls`**
- Import button with file picker (.docx only)
- Export button with automatic download
- 3 tests covering import/export flows

#### Proposals Components (`components/proposals/`)

**`ProposalsPanel`**
- Displays 5 AI-generated alternatives
- Individual "Insérer" buttons per proposal
- Dismissible panel
- 5 tests covering display and insertion

#### UI Primitives (`components/ui/`)

**`button.tsx`**
- shadcn/ui Button component
- Multiple variants and sizes
- Used across all interactive elements

## Testing

All components tested with:
- React Testing Library
- User event simulation
- TipTap mock integration
- Full user interaction coverage
