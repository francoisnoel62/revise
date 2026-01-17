# Interface Layer (App Router + Components)

Next.js App Router pages, layouts, UI components, and state management.

**Status**: ✅ Phase 4.1 Complete (180+ component tests + 25+ store tests + 90+ server action tests)

## Rules:
- Depends on Application and Domain layers
- Orchestrates use cases via Server Actions and Zustand store
- No business logic in components
- UI components are pure presentation
- State management delegated to Zustand store

## Contents:

### App Router ⭐ ENHANCED (Phase 4.1)

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

#### `app/project/[projectId]/metadata/page.tsx` ⭐ NEW (Phase 3.6)
**Purpose**: Metadata list page showing all analyses for a project

**Features**:
- Lists all metadata documents for the project
- GenerateCard for creating new analyses
- MetadataCard for each existing analysis
- Filter by metadata type (narrative, characters, plot, etc.)
- Navigation to metadata editor
- Delete metadata with confirmation

**Components Used**:
- `GenerateCard` - Card UI for generating new metadata analyses
- `MetadataCard` - Display metadata with title, type, last updated

**Server Actions**:
- `listMetadataAction` → `ListMetadataUseCase`
- `createMetadataAction` → `CreateMetadataUseCase`
- `generateNarrativeAnalysisAction` → `GenerateNarrativeAnalysisUseCase`
- (+ 5 other generation actions for each analysis type)
- `deleteMetadataAction` → `DeleteMetadataUseCase`

**Tests**: 10+ tests covering list display and metadata actions

---

#### `app/project/[projectId]/metadata/[metadataId]/page.tsx` (Phase 3.6)
**Purpose**: Rich text editor for metadata content

**Features**:
- TipTap-based rich text editor (same as chapter editor)
- Auto-save integration (1-second debounce)
- Metadata title editing
- Formatting toolbar (bold, italic, underline, etc.)
- Back navigation to metadata list
- Loading states

**Components Used**:
- `TextEditor` - TipTap editor component (reused from chapter editor)
- `FormattingToolbar` - Rich text controls (reused)
- `SaveStatus` - Auto-save indicator

**Server Actions**:
- `loadMetadataAction` → `LoadMetadataUseCase`
- `updateMetadataContentAction` → `UpdateMetadataContentUseCase`
- `updateMetadataTitleAction` → `UpdateMetadataTitleUseCase`

**Tests**: 10+ tests covering editor functionality

---

#### `app/blog/page.tsx` ⭐ NEW (Phase 4.0)
**Purpose**: Blog article list page

**Features**:
- Lists all published blog articles
- Article cards with title, excerpt, date
- Category/tag filtering
- Responsive grid layout
- SEO metadata

**Tests**: 5+ tests covering list display

---

#### `app/blog/[slug]/page.tsx` ⭐ NEW (Phase 4.0)
**Purpose**: Individual blog article page

**Features**:
- Full article content rendering
- Author and date display
- Social sharing buttons
- Related articles suggestions
- SEO metadata with Open Graph

**Tests**: 5+ tests covering article rendering

---

#### `app/admin/blog/page.tsx` ⭐ NEW (Phase 4.0)
**Purpose**: Admin blog management page

**Features**:
- List all articles (published and drafts)
- Create new article
- Edit existing article
- Delete article with confirmation
- Publish/unpublish toggle
- Admin access protection

**Server Actions**:
- `listBlogArticlesAction` → `ListBlogArticlesUseCase`
- `createBlogArticleAction` → `CreateBlogArticleUseCase`
- `updateBlogArticleAction` → `UpdateBlogArticleUseCase`
- `deleteBlogArticleAction` → `DeleteBlogArticleUseCase`

**Tests**: 10+ tests covering admin CRUD

---

#### `app/settings/page.tsx` ⭐ NEW (Phase 3.11)
**Purpose**: User account settings page

**Features**:
- Account deletion with password confirmation
- Data export (RGPD Article 20)
- Profile information display
- Consent information
- Danger zone for destructive actions

**Server Actions**:
- `deleteUserAccountAction` → `DeleteUserAccountUseCase`
- `exportUserDataAction` → Data export utility

**Tests**: 8+ tests covering settings actions

---

#### Legal Pages ⭐ NEW (Phase 3.11)

**`app/mentions-legales/page.tsx`** - Legal mentions (LCEN compliance)
**`app/politique-confidentialite/page.tsx`** - Privacy policy (RGPD)
**`app/politique-cookies/page.tsx`** - Cookie policy
**`app/cgu/page.tsx`** - Terms of use
**`app/cgv/page.tsx`** - Terms of sale

**Features**:
- Static legal content pages
- Proper formatting and sections
- Back navigation
- French legal compliance

---

#### `app/api/approve/route.ts` ⭐ NEW (Phase 3.8)
**Purpose**: User approval API endpoint

**Features**:
- Handles approve/reject actions
- HMAC token validation
- Redirects after action
- Error handling

**Methods**:
- GET `/api/approve?action=approve&userId=xxx&token=yyy`
- GET `/api/approve?action=reject&userId=xxx&token=yyy`

---

#### `app/api/completion/stream/route.ts` ⭐ NEW (Phase 4.1)
**Purpose**: Streaming autocompletion endpoint

**Features**:
- Server-Sent Events (SSE) response
- Streaming completion tokens
- Project metadata context
- Rate limiting

**Methods**:
- POST with { projectId, text, position }

---

#### `app/page.tsx` (Landing/Editor Page)
**Purpose**: Main editor page with project loading from database

**Phase 3.5 Enhancements**:
- **Improved header layout** - Better project title visibility and navigation ⭐ NEW
- **DocumentControls in header** - Import/export accessible from header ⭐ NEW
- **UserMenu in header** - Profile dropdown with provider access ⭐ NEW

**Phase 3 Features**:
- **Project loading from database** - URL param `/editor?project={id}` loads project from MongoDB
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

**`app/actions/provider-actions.ts`** (delegates to Provider Use Cases):
- `createProviderAction` → `CreateProviderUseCase`
- `listProvidersAction` → `ListProvidersUseCase`
- `updateProviderAction` → `UpdateProviderUseCase`
- `deleteProviderAction` → `DeleteProviderUseCase`
- `testProviderConnectionAction` → `TestProviderConnectionUseCase`
- `validateProviderAction` → `ValidateProviderUseCase`

**`app/actions/metadata-actions.ts`** (Phase 3.6 - delegates to Metadata Use Cases):
- `createMetadataAction` → `CreateMetadataUseCase`
- `loadMetadataAction` → `LoadMetadataUseCase`
- `listMetadataAction` → `ListMetadataUseCase`
- `updateMetadataContentAction` → `UpdateMetadataContentUseCase`
- `updateMetadataTitleAction` → `UpdateMetadataTitleUseCase`
- `deleteMetadataAction` → `DeleteMetadataUseCase`
- `generateNarrativeAnalysisAction` → `GenerateNarrativeAnalysisUseCase`
- `generateCharactersAction` → `GenerateCharactersUseCase`
- `generatePlotAction` → `GeneratePlotUseCase`
- `generateStylisticDNAAction` → `GenerateStylisticDNAUseCase`
- `generateWorldbuildingAction` → `GenerateWorldbuildingUseCase`
- `generateSynthesisAction` → `GenerateSynthesisUseCase`

**`app/actions/correction-history-actions.ts`** ⭐ NEW (Phase 3.7):
- `saveCorrectionHistoryAction` → `SaveCorrectionHistoryUseCase`
- `listCorrectionHistoryAction` → `ListCorrectionHistoryUseCase`
- `deleteCorrectionHistoryAction` → `DeleteCorrectionHistoryUseCase`

**`app/actions/utils.ts`** (Dependency Injection):
- `getRepository()` - Project repository
- `getProviderRepo()` - Provider repository
- `getUserRepo()` - User repository
- `getMetadataRepo()` - Metadata repository (Phase 3.6)
- `getCorrectionHistoryRepo()` - Correction history repository ⭐ NEW (Phase 3.7)
- `getPromptRepo()` - Prompt repository (Phase 3.6)
- `getLLMProviderFactory()` - LLM provider factory
- `getIdGenerator()` - UUID generator

**`app/actions/index.ts`** (Legacy - Phase 1/2):
- `importDocument` - Uses `ImportProjectUseCase` via `DocxParser.parseToChapters()`
- `exportProject` - Uses `ExportProjectUseCase` via `DocxExporter.exportProject()`
- `rewriteText` - Uses `RewriteTextUseCase` with `OpenAIProvider`

**Tests**: 30+ tests covering all server actions with mocked repositories

---

### State Management ⭐ ENHANCED (Phase 3)

#### `store/projectStore.ts` (Zustand - Server-Backed) ⭐ ENHANCED (Phase 3.7)
**Purpose**: Global state for project and chapter management with MongoDB persistence

**State**:
- `project`: Project entity (chapters collection) - **loaded from MongoDB**
- `activeContent`: Current chapter content (TipTap JSON) - **auto-saved to MongoDB**
- `correctionHistory`: Array of CorrectionHistory - **cached per chapter** ⭐ NEW (Phase 3.7)
- `isLoading`: Loading state for async operations
- `error`: Error messages from server actions

**Actions** (Phase 3/3.7 - Server-Backed):
- `loadProject(projectId)` - Loads project from MongoDB via server action
- `createProject()` - Creates new project in MongoDB
- `setProject(project)` - Sets loaded project
- `setActiveChapter(chapterId)` - Navigate chapters (auto-saves to MongoDB)
- `addChapter()` - Create new chapter (persists to MongoDB)
- `removeChapter(chapterId)` - Delete chapter (persists to MongoDB)
- `reorderChapters(fromIndex, toIndex)` - Drag & drop (persists to MongoDB)
- `updateActiveContent(content)` - Content edits (triggers auto-save)
- `saveCurrentChapter()` - Force save to MongoDB
- `updateChapterTitle(chapterId, title)` - Rename chapter (persists to MongoDB)
- `loadCorrectionHistory(chapterId)` - Load history for chapter ⭐ NEW (Phase 3.7)
- `saveCorrectionHistory(entry)` - Save new history entry ⭐ NEW (Phase 3.7)

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

**`NoProvidersAlert`** ⭐ NEW (Phase 3.5)
**Purpose**: Dashboard alert when no AI providers configured

**Features**:
- Warning message for missing provider configuration
- Link to provider management dialog
- Dismissible alert
- Only shows when provider list is empty

**Tests**: 5+ tests covering alert display and dismissal

---

#### Provider Components ⭐ NEW (Phase 3.5) (`components/providers/`)

**`ProvidersDialog`**
**Purpose**: Main dialog for managing AI providers

**Features**:
- Provider list with cards
- Add provider button
- Create/edit/delete provider flows
- Connection testing UI
- Dialog-based interaction

**Tests**: 10+ tests covering dialog interactions

---

**`ProviderForm`**
**Purpose**: Create/edit provider form with connection testing

**Features**:
- Provider type selection (OpenAI, Anthropic, Mistral, Cohere, Google)
- API key input (masked display)
- Model selection dropdown
- Connection test button with loading state
- Validation feedback
- Save/cancel actions

**Tests**: 15+ tests covering form validation and testing

---

**`ProviderCard`**
**Purpose**: Individual provider card with status and actions

**Features**:
- Provider name and type display
- Masked API key
- Model display
- Edit and delete actions
- Connection status indicator

**Tests**: 10+ tests covering card interactions

---

#### Metadata Components ⭐ NEW (Phase 3.6) (`components/metadata/`)

**`GenerateCard`**
**Purpose**: Card UI for generating new metadata analyses

**Features**:
- Metadata type selector (6 types)
- Generate button with loading state
- AI provider indicator
- Rate limiting feedback (5-second cooldown)
- Error handling and display

**Tests**: 10+ tests covering generation flow

---

**`MetadataCard`**
**Purpose**: Display metadata with actions

**Features**:
- Metadata title and type display
- Last updated timestamp
- View button (navigates to editor)
- Delete button (with confirmation)
- Type-specific icons
- Hover states

**Tests**: 10+ tests covering card interactions

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

**`TextEditor` ⭐ ENHANCED (Phase 3.7)**
**Purpose**: TipTap rich text editor with JSON storage and live statistics

**Phase 3.7 Enhancements**:
- **CharacterCount extension** - Live word/character count ⭐ NEW
- **Word count display** in editor header
- Integration with FormattingToolbar undo/redo buttons

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

**Tests**: 10+ tests covering editing, selection, formatting, word count

---

**`FormattingToolbar` ⭐ ENHANCED (Phase 3.7)**
**Purpose**: Rich text formatting controls with undo/redo and history

**Phase 3.7 Enhancements**:
- **Undo/Redo buttons** - Visual buttons in addition to keyboard shortcuts ⭐ NEW
- **History button** - Opens CorrectionHistoryDialog ⭐ NEW
- **Word/character count display** ⭐ NEW

**Features**:
- Bold (Ctrl+B), Italic (Ctrl+I), Underline (Ctrl+U), Highlight (Ctrl+Shift+H)
- Undo (Ctrl+Z), Redo (Ctrl+Shift+Z) with visual buttons
- Active state indicators (button highlights when format applied)
- Disabled state when format cannot be applied
- Icons from lucide-react
- Integrated with TipTap editor instance

**Tests**: 12+ tests covering all formatting actions and new buttons

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

**`ProposalsSheet` ⭐ ENHANCED (Phase 3.7)**
**Purpose**: Right-side dismissible panel for AI proposals

**Features**:
- Dismissible Sheet (shadcn/ui)
- Displays **3 AI-generated proposals** (épuré, lyrique, amplifié) ⭐ UPDATED
- Individual "Insérer" button per proposal
- Style labels for each proposal
- Scrollable content (ScrollArea)
- Auto-closes after insertion
- **Correction history auto-saved on insert** ⭐ NEW (Phase 3.7)

**Props**:
- `open`: Sheet visibility
- `proposals`: Array of proposals with content and optional styleLabel
- `onInsert`: Insert proposal handler
- `onClose`: Close sheet handler

**Tests**: 10 tests covering display, insertion, and UX flows

---

**`LoadingOverlay`** ⭐ NEW (Phase 3.7)
**Purpose**: Loading overlay with author quotes during AI rewrite

**Features**:
- Progress bar animation
- **100 famous author quotes** rotating every 3 seconds
- Covers full editor area during AI processing
- Graceful fade in/out animations
- Accessible loading state

**Tests**: 5+ tests covering loading states and quote rotation

---

**`ProposalsPanel`** (Phase 1 - legacy)
**Purpose**: Fixed bottom panel for AI proposals

**Status**: Maintained for backward compatibility
**Note**: New code should use `ProposalsSheet`

**Tests**: 5 tests covering display and insertion

---

#### History Components ⭐ NEW (Phase 3.7)

**`CorrectionHistoryDialog`**
**Purpose**: Dialog displaying correction history for the current chapter

**Features**:
- Accordion UI for each correction entry
- Shows original text and all 3 proposals
- Copy to clipboard functionality
- Search/filter by text content
- Filter by date range
- Sorted by newest first
- Empty state when no history

**Tests**: 10+ tests covering dialog and history display

---

**`CorrectionHistoryTable`** (internal component)
**Purpose**: Renders the accordion list of history entries

**Features**:
- Expandable accordion items
- Original text display
- Proposal cards with copy button
- Timestamp formatting
- Accessible keyboard navigation

**Tests**: Integrated with CorrectionHistoryDialog tests

---

#### Document Components

**`DocumentControls` ⭐ ENHANCED (Phase 3.7)**
**Purpose**: Import/export controls with format selection

**Phase 3.7 Enhancements**:
- **Format selection dropdown** - DOCX or PDF export ⭐ NEW
- PDF export with full typography support

**Phase 2 Enhancements**:
- Loading states during import/export (spinner + disabled)
- Async handlers with proper error handling
- File input reset after import
- Multi-chapter import/export support

**Props**:
- `onImport`: Async import handler (receives FormData)
- `onExport`: Async export handler (receives format: 'docx' | 'pdf')
- `importing`: Loading state for import
- `exporting`: Loading state for export

**Tests**: 5+ tests covering import/export flows and format selection

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

## Phase 4.1 Achievements

✅ **FloatingGenerationMenu** - AI chapter generation UI for empty chapters
✅ **Autocomplete TipTap extension** - Ghost text with streaming support
✅ **completion/stream API route** - SSE endpoint for autocompletion
✅ **useHasAIProviders hook** - Centralized provider availability check
✅ **180+ component tests** + 25+ store tests + 90+ server action tests

## Phase 4.0 Achievements

✅ **Blog pages** - List and article pages
✅ **Admin blog management** - CRUD interface
✅ **blog-actions.ts** - Server actions for blog CRUD
✅ **BlogCard component** - Article display

## Phase 3.11 Achievements

✅ **Settings page** - Account deletion and data export
✅ **Legal pages** - CGU, CGV, mentions, privacy, cookies
✅ **CookieConsent component** - RGPD cookie banner
✅ **ContactForm component** - Landing page integration
✅ **Terms checkbox** on signup form
✅ **user-actions.ts** - Delete account, export data

## Phase 3.8 Achievements

✅ **Approval API route** - `/api/approve` with HMAC validation
✅ **Pending approval message** - Signup feedback
✅ **Auth pages translated** - French localization

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

## Phase 3.7 Achievements

✅ **PDF Export** - Format selection dropdown with DOCX/PDF options
✅ **CorrectionHistoryDialog** - Accordion UI for viewing rewrite history
✅ **LoadingOverlay** - Progress bar with 100 famous author quotes
✅ **FormattingToolbar Enhanced** - Undo/Redo buttons, history button, word count
✅ **TextEditor Enhanced** - CharacterCount extension, word/character statistics
✅ **3 Proposals** - Reduced from 5 to 3 (épuré, lyrique, amplifié)
✅ **correction-history-actions.ts** - Server actions for history CRUD
✅ **getCorrectionHistoryRepo()** - New dependency injection helper
✅ **Store correction history cache** - Per-chapter history caching
✅ **235+ tests passing** - 140+ component + 20+ store + 75+ server action tests (up from 190+)
✅ **Clean Architecture Maintained** - All new UI follows established patterns

## Phase 3.6 Achievements

✅ **Metadata List Page** - List all metadata analyses for a project
✅ **Metadata Editor Page** - Rich text editor for metadata content with auto-save
✅ **GenerateCard Component** - UI for generating new metadata analyses
✅ **MetadataCard Component** - Display metadata with title, type, and actions
✅ **metadata-actions.ts** - Server actions delegating to 12 metadata use cases
✅ **getMetadataRepo() & getPromptRepo()** - New dependency injection helpers
✅ **Rate limiting extended** - Now covers metadata generation (5-second cooldown)
✅ **Clean Architecture Maintained** - All new UI follows established patterns

## Phase 3.5 Achievements

✅ **CreateProjectDialog** - New project creation with title input
✅ **Improved header layout** - Better project title visibility and navigation
✅ **DocumentControls in header** - Import/export accessible from header
✅ **UserMenu in header** - Profile dropdown integrated into header
✅ **Server Actions delegate to Use Cases** - Clean Architecture compliance
✅ **Dependency injection** via utils.ts - Centralized repository access
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
