# Interface Layer (App Router + Components)

Next.js App Router pages, layouts, UI components, and state management.

**Status**: ✅ Phase 2 Complete (53 component tests + 12 store tests)

## Rules:
- Depends on Application and Domain layers
- Orchestrates use cases via Server Actions and Zustand store
- No business logic in components
- UI components are pure presentation
- State management delegated to Zustand store

## Contents:

### App Router (✅ Phase 2 Implemented)

---

#### `app/page.tsx` ⭐ REWRITTEN
**Purpose**: Main application page with multi-chapter document management

**Phase 2 Features**:
- 80% width editor layout (comfortable writing space)
- Zustand store integration for project/chapter state
- ChaptersSheet for navigation (left panel)
- ProposalsSheet for AI rewrites (right panel)
- FormattingToolbar for rich text controls
- Unsaved changes detection with confirmation dialogs
- Loading states for all async operations

**State Management** (via Zustand):
- Project entity (chapters collection)
- Active chapter content (TipTap JSON)
- Unsaved changes tracking
- UI state (sheets open/closed, loading)

**Workflow**:
1. Import DOCX → Chapters created in store
2. Navigate chapters → ChaptersSheet
3. Edit with formatting → FormattingToolbar
4. Rewrite text → ProposalsSheet
5. Export project → All chapters to DOCX

---

#### `app/layout.tsx`
**Purpose**: Root layout with metadata and global styling

**Features**:
- Tailwind CSS v4 setup
- Metadata (title, description)
- Font configuration (Geist Sans/Mono)

---

#### Server Actions (`app/actions.ts`) ⭐ ENHANCED

**`importDocument`** (Phase 2):
- Uses `ImportProjectUseCase` via `DocxParser.parseToChapters()`
- Splits document by H1 headings
- Returns serialized project data (chapters array)
- Client reconstructs Project entity in store

**`exportProject`** (Phase 2):
- Uses `ExportProjectUseCase` via `DocxExporter.exportProject()`
- Exports all chapters with page breaks
- Preserves formatting
- Returns buffer as array for JSON serialization

**`rewriteText`** (Enhanced):
- Uses `RewriteTextUseCase` with `OpenAIProvider`
- Works with TipTap JSON content
- Tracks performance duration
- Returns 5 proposals or error
- Warning if > 3s (development mode)

---

### State Management ⭐ NEW

#### `store/projectStore.ts` (Zustand)
**Purpose**: Global state for project and chapter management

**State**:
- `project`: Project entity (chapters collection)
- `activeContent`: Current chapter content (TipTap JSON)
- `hasUnsavedChanges`: Dirty flag for unsaved edits

**Actions**:
- `setProject(project)` - Load imported project
- `setActiveChapter(chapterId)` - Navigate chapters
- `addChapter()` - Create new chapter
- `removeChapter(chapterId)` - Delete chapter
- `reorderChapters(fromIndex, toIndex)` - Drag & drop
- `updateActiveContent(content)` - Content edits (sets unsaved flag)
- `saveCurrentChapter()` - Persist active content to project
- `resetUnsavedChanges()` - Clear dirty flag

**Design**:
- No business logic (delegates to use cases)
- Calls Application layer use cases
- Thin wrapper around Project aggregate
- Optimized selectors for performance

**Tests**: 12 tests covering all state transitions

---

### UI Components (✅ Phase 2 Implemented)

---

#### Editor Components (`components/editor/`)

**`TextEditor` ⭐ ENHANCED**
**Purpose**: TipTap rich text editor with JSON storage

**Phase 2 Enhancements**:
- TipTap JSON content format (not plain text)
- Rich text extensions: Bold, Italic, Underline, Highlight
- Performance optimizations: `immediatelyRender: false`, `shouldRerenderOnTransaction: false`
- External content updates (chapter switching)
- `onEditorReady` callback for parent component

**Props**:
- `content`: TipTap JSON stringified
- `onContentChange`: Updates on edit
- `onSelectionChange`: Tracks selection for rewrite button
- `onEditorReady`: Callback with editor instance
- `placeholder`: Optional placeholder text

**Tests**: 8 tests covering editing, selection, formatting

---

**`FormattingToolbar` ⭐ NEW**
**Purpose**: Rich text formatting controls

**Features**:
- Bold (Ctrl+B), Italic (Ctrl+I), Underline (Ctrl+U), Highlight (Ctrl+Shift+H)
- Active state indicators (button highlights when format applied)
- Disabled state when format cannot be applied
- Icons from lucide-react
- Integrated with TipTap editor instance

**Tests**: 9 tests covering all formatting actions

---

**`RewriteButton`** (Phase 1 - maintained)
**Purpose**: Contextual button positioned near selection

**Features**:
- Shows/hides based on selection state
- Positioned dynamically near selection
- Loading state during API calls
- Keyboard accessible

**Tests**: 5 tests covering visibility and interaction

---

#### Navigation Components ⭐ NEW

**`ChaptersSheet`**
**Purpose**: Left-side navigation panel with drag & drop chapter management

**Features**:
- Dismissible Sheet (shadcn/ui)
- Chapter list with metadata (word count, character count)
- Active chapter highlighting
- Drag & drop reordering (dnd-kit)
- Add chapter button
- Delete chapter button (disabled for last chapter)
- Click to switch chapters

**Props**:
- `chapters`: Array of Chapter entities
- `activeChapterId`: Currently active chapter
- `onSelectChapter`: Navigate to chapter
- `onAddChapter`: Create new chapter
- `onRemoveChapter`: Delete chapter
- `onReorderChapters`: Drag & drop handler

**Tests**: 11 tests covering navigation, drag-drop, and edge cases

---

#### Proposals Components

**`ProposalsSheet` ⭐ NEW**
**Purpose**: Right-side dismissible panel for AI proposals

**Features**:
- Dismissible Sheet (shadcn/ui)
- Displays 5 AI-generated proposals
- Individual "Insérer" button per proposal
- Optional style labels
- Scrollable content (ScrollArea)
- Auto-closes after insertion

**Props**:
- `open`: Sheet visibility
- `proposals`: Array of proposals with content and optional styleLabel
- `onInsert`: Insert proposal handler
- `onClose`: Close sheet handler

**Tests**: 10 tests covering display, insertion, and UX flows

---

**`ProposalsPanel`** (Phase 1 - legacy)
**Purpose**: Fixed bottom panel for AI proposals

**Status**: Maintained for backward compatibility
**Note**: New code should use `ProposalsSheet`

**Tests**: 5 tests covering display and insertion

---

#### Document Components

**`DocumentControls` ⭐ ENHANCED**
**Purpose**: Import/export controls with loading states

**Phase 2 Enhancements**:
- Loading states during import/export (spinner + disabled)
- Async handlers with proper error handling
- File input reset after import
- Multi-chapter import/export support

**Props**:
- `onImport`: Async import handler (receives FormData)
- `onExport`: Async export handler
- `importing`: Loading state for import
- `exporting`: Loading state for export

**Tests**: 3 tests covering import/export flows

---

#### UI Primitives (`components/ui/`)

**`button.tsx`**
- shadcn/ui Button component
- Multiple variants: default, outline, ghost, etc.
- Size variants: sm, md, lg
- Loading state support

**`sheet.tsx` ⭐ NEW**
- shadcn/ui Sheet component (drawer/sidebar)
- Used for ChaptersSheet and ProposalsSheet
- Accessible, keyboard navigable
- Dismissible with backdrop

**`scroll-area.tsx` ⭐ NEW**
- shadcn/ui ScrollArea component
- Custom scrollbars
- Used in ProposalsSheet for proposal list

---

## Testing

**Coverage**: 53 component tests + 12 store tests = 65 tests passing

**Component Tests** (53):
- TextEditor: 8 tests (rich text, selection, formatting)
- FormattingToolbar: 9 tests (formatting actions, active states)
- ChaptersSheet: 11 tests (navigation, drag-drop, CRUD)
- ProposalsSheet: 10 tests (display, insertion, UX)
- DocumentControls: 3 tests (import/export, loading)
- RewriteButton: 5 tests (visibility, positioning)
- ProposalsPanel: 5 tests (legacy)
- Other components: 2 tests

**Store Tests** (12):
- State initialization
- Project loading
- Chapter navigation
- Chapter CRUD operations
- Content updates
- Unsaved changes tracking

**Test Tools**:
- React Testing Library (user-centric assertions)
- Vitest (fast unit tests)
- TipTap mocks for editor testing
- Zustand mocks for store testing

---

## Design Patterns

**Component Architecture**:
- Presentational components (props-based API)
- No business logic in components
- Composed from shadcn/ui primitives
- Accessible by default (ARIA labels, keyboard nav)

**State Management**:
- Zustand for global state
- Local state for UI-only concerns
- Props for component communication
- Store delegates to Application use cases

**Performance Optimizations**:
- TipTap: `immediatelyRender: false`, `shouldRerenderOnTransaction: false`
- Zustand: Shallow equality checks
- Single editor instance (setContent for chapter switching)
- Lazy loading for sheets (on-demand rendering)

---

## Key Architectural Decisions

### Single Editor Instance
**Decision**: Use one TipTap editor and call `setContent()` to switch chapters

**Rationale**:
- Creating/destroying editors is expensive (8+ seconds for 30+ instances)
- Single instance with content swapping is instant (< 1ms)

**Trade-off**:
- Undo/redo history is shared across all chapters
- Acceptable for MVP, will be fixed in Phase 4

### 80% Width Layout
**Decision**: Editor takes 80% of screen width (not full width or centered)

**Rationale**:
- Comfortable line length for reading/writing
- Space for contextual UI elements (rewrite button)
- Professional writing tool aesthetic
- Leaves room for future enhancements

### Dismissible Sheets vs Fixed Panels
**Decision**: Use Sheets instead of persistent sidebars

**Rationale**:
- Maximizes writing space
- Aligns with minimalist UX philosophy
- User controls visibility
- Modern, clean interface

---

## Phase 2 Achievements

✅ Complete page rewrite with Zustand integration
✅ ChaptersSheet with drag & drop (dnd-kit)
✅ ProposalsSheet for AI proposals
✅ FormattingToolbar for rich text editing
✅ Enhanced TextEditor with TipTap JSON
✅ Enhanced DocumentControls with loading states
✅ Zustand store for global state (12 tests)
✅ 53 component tests passing
✅ 80% width editor layout
✅ Unsaved changes detection
✅ Server Actions for multi-chapter import/export
✅ No business logic in UI layer (delegated to use cases)
