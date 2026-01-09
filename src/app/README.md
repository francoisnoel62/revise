# Interface Layer (App Router + Components)

Next.js App Router pages, layouts, UI components, and state management.

**Status**: ✅ Phase 3.5 Complete (100+ component tests + 15+ store tests + 40+ server action tests)

## Rules:
- Depends on Application and Domain layers
- Orchestrates use cases via Server Actions and Zustand store
- No business logic in components
- UI components are pure presentation
- State management delegated to Zustand store

## Contents:

### App Router ⭐ ENHANCED (Phase 3.5)

---

#### `app/dashboard/page.tsx` ⭐ ENHANCED (Phase 3.5)
**Purpose**: Project management dashboard

**Features**:
- Lists all projects for authenticated user
- **CreateProjectDialog** for new project creation with title input ⭐ NEW
- Project cards with metadata (title, last updated, chapter count)
- Rename project (inline editing)
- Delete project (with confirmation dialog)
- Empty state for new users
- Auto-redirect to editor on project click
- **NoProvidersAlert** when no AI providers configured

**Components Used**:
- `CreateProjectDialog` ⭐ NEW - Modal dialog for project creation
- `ProjectCard` - Individual project card with actions
- `EmptyState` - Welcome message for new users
- `AlertDialog` - Delete confirmation
- `Dialog` - Rename dialog
- `NoProvidersAlert` - Provider configuration warning

**Server Actions** (delegate to Use Cases):
- `loadProjectsAction` → `ListProjectsUseCase`
- `createProjectAction` → `CreateProjectUseCase` ⭐ NEW
- `renameProjectAction` → `UpdateProjectTitleUseCase` ⭐ NEW
- `deleteProjectAction` → `DeleteProjectUseCase` ⭐ NEW

**Tests**: 20+ tests covering project management and CreateProjectDialog

---

#### `app/auth/signin/page.tsx` ⭐ NEW (Phase 3)
**Purpose**: User sign-in page

**Features**:
- Email/password form
- Form validation
- Error messages for invalid credentials
- Auto-redirect to dashboard on success
- Link to sign-up page

**Server Actions**:
- `signInAction` - Validates credentials, creates session

**Tests**: 10+ tests covering authentication flows

---

#### `app/auth/signup/page.tsx` ⭐ NEW (Phase 3)
**Purpose**: User registration page

**Features**:
- Email/password form
- Password confirmation
- Email validation
- Error messages (duplicate email, weak password)
- Auto-redirect to dashboard on success
- Link to sign-in page

**Server Actions**:
- `signUpAction` - Creates user, hashes password, creates session

**Tests**: 10+ tests covering registration flows

---

#### `app/page.tsx` ⭐ ENHANCED (Phase 3.5)
**Purpose**: Main editor page with project loading from database

**Phase 3.5 Enhancements**:
- **Improved header layout** - Better project title visibility and navigation ⭐ NEW
- **DocumentControls in header** - Import/export accessible from header ⭐ NEW
- **UserMenu in header** - Profile dropdown with provider access ⭐ NEW

**Phase 3 Features**:
- **Project loading from database** - URL param `?project={id}` loads project from MongoDB
- **Auto-redirect to dashboard** - Redirects if no project ID provided
- **Session-based project access** - Only loads projects owned by authenticated user
- **SaveStatus indicator** - Shows auto-save progress ("Saving...", "Saved")

**Phase 2 Features**:
- A4 page width editor (794px, realistic writing experience)
- Zustand store integration for project/chapter state (server-backed)
- ChaptersSheet for navigation (left panel)
- ProposalsSheet for AI rewrites (right panel)
- FormattingToolbar for rich text and typography controls
- Loading states for all async operations

**State Management** (via Zustand - server-backed):
- Project entity (chapters collection) - loaded from MongoDB
- Active chapter content (TipTap JSON) - auto-saved to MongoDB
- UI state (sheets open/closed, loading)

**Workflow**:
1. **Load project from database** (via URL param) ⭐ NEW
2. Import DOCX → Chapters created in store and saved to database
3. Navigate chapters → ChaptersSheet (auto-saves to MongoDB)
4. Edit with formatting → FormattingToolbar (auto-saves after 1s)
5. Rewrite text → ProposalsSheet
6. Export project → All chapters to DOCX (backup/sharing)

---

#### `app/layout.tsx`
**Purpose**: Root layout with metadata and global styling

**Features**:
- Tailwind CSS v4 setup
- Metadata (title, description)
- Font configuration (Geist Sans/Mono)

---

#### Server Actions ⭐ ENHANCED (Phase 3.5 - All delegate to Use Cases)

**`app/actions/project-actions.ts`** (delegates to Project Use Cases ⭐ NEW):
- `createProjectAction` → `CreateProjectUseCase`
- `loadProjectAction` → `LoadProjectUseCase`
- `listProjectsAction` → `ListProjectsUseCase`
- `deleteProjectAction` → `DeleteProjectUseCase`
- `renameProjectAction` → `UpdateProjectTitleUseCase`
- `updateProjectProviderAction` → `UpdateProjectProviderUseCase`

**`app/actions/chapter-actions.ts`** (delegates to Chapter Use Cases):
- `addChapterAction` → `AddChapterUseCase`
- `removeChapterAction` → `RemoveChapterUseCase`
- `updateChapterContentAction` → `UpdateChapterContentUseCase`
- `updateChapterTitleAction` → `UpdateChapterTitleUseCase`
- `reorderChaptersAction` → `ReorderChaptersUseCase`
- `switchChapterAction` → `SwitchChapterUseCase`

**`app/actions/auth-actions.ts`** (delegates to User Use Cases ⭐ NEW):
- `signInAction` - Authenticates user, creates session
- `signUpAction` → `RegisterUserUseCase`
- `signOutAction()` - Terminates session

**`app/actions/provider-actions.ts`** (delegates to Provider Use Cases ⭐ NEW):
- `createProviderAction` → `CreateProviderUseCase`
- `listProvidersAction` → `ListProvidersUseCase`
- `updateProviderAction` → `UpdateProviderUseCase`
- `deleteProviderAction` → `DeleteProviderUseCase`
- `testProviderConnectionAction` → `TestProviderConnectionUseCase`
- `validateProviderAction` → `ValidateProviderUseCase`

**`app/actions/utils.ts`** (Dependency Injection ⭐ NEW):
- `getRepository()` - Project repository
- `getProviderRepo()` - Provider repository
- `getUserRepo()` - User repository
- `getLLMProviderFactory()` - LLM provider factory
- `getIdGenerator()` - UUID generator

**`app/actions/index.ts`** (Legacy - Phase 1/2):
- `importDocument` - Uses `ImportProjectUseCase` via `DocxParser.parseToChapters()`
- `exportProject` - Uses `ExportProjectUseCase` via `DocxExporter.exportProject()`
- `rewriteText` - Uses `RewriteTextUseCase` with `OpenAIProvider`

**Tests**: 30+ tests covering all server actions with mocked repositories

---

### State Management ⭐ ENHANCED (Phase 3)

#### `store/projectStore.ts` (Zustand - Server-Backed)
**Purpose**: Global state for project and chapter management with MongoDB persistence

**State**:
- `project`: Project entity (chapters collection) - **loaded from MongoDB** ⭐
- `activeContent`: Current chapter content (TipTap JSON) - **auto-saved to MongoDB** ⭐
- `isLoading`: Loading state for async operations ⭐ NEW
- `error`: Error messages from server actions ⭐ NEW

**Actions** (Phase 3 - Server-Backed):
- `loadProject(projectId)` - Loads project from MongoDB via server action ⭐ NEW
- `createProject()` - Creates new project in MongoDB ⭐ NEW
- `setProject(project)` - Sets loaded project
- `setActiveChapter(chapterId)` - Navigate chapters (auto-saves to MongoDB)
- `addChapter()` - Create new chapter (persists to MongoDB)
- `removeChapter(chapterId)` - Delete chapter (persists to MongoDB)
- `reorderChapters(fromIndex, toIndex)` - Drag & drop (persists to MongoDB)
- `updateActiveContent(content)` - Content edits (triggers auto-save)
- `saveCurrentChapter()` - Force save to MongoDB
- `updateChapterTitle(chapterId, title)` - Rename chapter (persists to MongoDB) ⭐ NEW

**Design**:
- No business logic (delegates to server actions)
- Calls server actions which use Application layer use cases
- Thin wrapper around Project aggregate
- Optimized selectors for performance
- **Optimistic updates** with server validation

**Tests**: 15+ tests covering all state transitions and server integration

---

### UI Components ⭐ ENHANCED (Phase 3)

---

#### Authentication Components ⭐ NEW (`components/auth/`)

**`UserMenu`** ⭐ NEW (Phase 3)
**Purpose**: User profile dropdown with authentication actions

**Features**:
- Displays user email
- Sign-out button
- Dropdown menu (shadcn/ui DropdownMenu)
- Session-based user info

**Tests**: 5+ tests covering user menu interactions

---

#### Dashboard Components ⭐ ENHANCED (`components/dashboard/`)

**`CreateProjectDialog`** ⭐ NEW (Phase 3.5)
**Purpose**: Dialog for creating new projects with title input

**Features**:
- Modal dialog with title input field
- Form validation (required title)
- Cancel and Create buttons
- Delegates to CreateProjectUseCase via server action
- Auto-redirect to editor on success
- Accessible, keyboard navigable

**Tests**: 10+ tests covering dialog interactions and form validation

---

**`ProjectCard`** ⭐ NEW (Phase 3)
**Purpose**: Individual project card with management actions

**Features**:
- Project title display
- Last updated timestamp
- Chapter count
- Rename action (edit icon → dialog)
- Delete action (trash icon → confirmation)
- Click to open in editor
- Hover states and transitions

**Tests**: 15+ tests covering all project actions

---

**`EmptyState`** ⭐ NEW (Phase 3)
**Purpose**: Welcome message for new users with no projects

**Features**:
- Friendly welcome message
- "Get started" CTA
- Responsive design

**Tests**: 3+ tests covering empty state display

---

#### Document Components ⭐ ENHANCED

**`SaveStatus`** ⭐ NEW (Phase 3)
**Purpose**: Auto-save progress indicator

**Features**:
- "Saving..." state during MongoDB write
- "Saved" state when persisted
- Subtle, non-intrusive UI
- Auto-hides after 2 seconds

**Tests**: 5+ tests covering save states

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

**`card.tsx` ⭐ NEW (Phase 3)**
- shadcn/ui Card component
- Used for ProjectCard in dashboard
- Header, content, footer sections

**`dialog.tsx` ⭐ NEW (Phase 3)**
- shadcn/ui Dialog component
- Used for rename and delete confirmations
- Accessible modal dialogs

**`input.tsx` ⭐ NEW (Phase 3)**
- shadcn/ui Input component
- Used in auth forms and rename dialogs
- Form validation support

**`label.tsx` ⭐ NEW (Phase 3)**
- shadcn/ui Label component
- Used in all forms for accessibility
- Associated with form inputs

**`alert-dialog.tsx` ⭐ NEW (Phase 3)**
- shadcn/ui AlertDialog component
- Used for destructive action confirmations (delete project)
- Accessible confirmation dialogs

---

### Hooks ⭐ NEW (Phase 3)

#### `hooks/useAutosave.ts`
**Purpose**: Auto-save hook with 1-second debounce

**Features**:
- Debounces content changes (1 second delay)
- Calls server action to save to MongoDB
- Updates SaveStatus component
- Cancels pending saves on unmount
- Skips save if content hasn't changed

**Usage**: Called by editor page to auto-save active content

**Tests**: 5+ tests covering debounce behavior and edge cases

---

## Testing

**Coverage**: 80+ component tests + 15+ store tests + 30+ server action tests = 125+ tests passing

**Component Tests** (80+):
- **Phase 3 Components**:
  - Dashboard page: 12+ tests (project management)
  - Auth pages: 20+ tests (sign-in, sign-up flows)
  - UserMenu: 5+ tests (authentication UI)
  - ProjectCard: 15+ tests (project actions)
  - EmptyState: 3+ tests (empty state display)
  - SaveStatus: 5+ tests (auto-save indicator)
- **Phase 2 Components**:
  - TextEditor: 8 tests (rich text, selection, formatting)
  - FormattingToolbar: 9 tests (formatting actions, active states)
  - ChaptersSheet: 11 tests (navigation, drag-drop, CRUD)
  - ProposalsSheet: 10 tests (display, insertion, UX)
  - DocumentControls: 3 tests (import/export, loading)
  - RewriteButton: 5 tests (visibility, positioning)
  - ProposalsPanel: 5 tests (legacy)

**Store Tests** (15+):
- State initialization
- Project loading from MongoDB
- Project creation
- Chapter navigation with auto-save
- Chapter CRUD operations (persist to MongoDB)
- Content updates with auto-save
- Error handling

**Server Action Tests** (30+):
- Project actions: 12+ tests (create, load, update, delete, rename)
- Chapter actions: 10+ tests (add, remove, update content/title, reorder)
- Auth actions: 8+ tests (sign in, sign up, sign out)

**Test Tools**:
- React Testing Library (user-centric assertions)
- Vitest (fast unit tests)
- TipTap mocks for editor testing
- Zustand mocks for store testing
- MongoDB repository mocks for server actions

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

## Phase 3 Achievements

✅ **Dashboard page** - Full project management with create/rename/delete
✅ **Authentication pages** - Sign-in and sign-up with form validation
✅ **Server-backed Zustand store** - All state synced with MongoDB
✅ **Auto-save functionality** - 1-second debounce with useAutosave hook
✅ **Project loading** - URL-based project loading from database
✅ **UserMenu component** - User profile and sign-out
✅ **ProjectCard component** - Rich project management UI
✅ **SaveStatus indicator** - Visual auto-save feedback
✅ **Route protection** - Middleware ensures authenticated access
✅ **Session management** - JWT-based sessions with Auth.js
✅ **Multi-tenant support** - All actions filter by userId

## Phase 3.5 Achievements

✅ **CreateProjectDialog** - New project creation with title input ⭐ NEW
✅ **Improved header layout** - Better project title visibility and navigation ⭐ NEW
✅ **DocumentControls in header** - Import/export accessible from header ⭐ NEW
✅ **UserMenu in header** - Profile dropdown integrated into header ⭐ NEW
✅ **Server Actions delegate to Use Cases** - Clean Architecture compliance ⭐ NEW
✅ **Dependency injection** via utils.ts - Centralized repository access ⭐ NEW
✅ **155+ tests passing** - 100+ component + 15+ store + 40+ server action tests

## Phase 2 Achievements

✅ Complete page rewrite with Zustand integration
✅ ChaptersSheet with drag & drop (dnd-kit)
✅ ProposalsSheet for AI proposals
✅ FormattingToolbar for rich text and typography editing
✅ Enhanced TextEditor with TipTap JSON and A4 styling
✅ Enhanced DocumentControls with loading states
✅ Zustand store for global state
✅ 53 component tests passing
✅ A4 width editor layout (794px)
✅ Server Actions for multi-chapter import/export
✅ No business logic in UI layer (delegated to use cases)
