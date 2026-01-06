# Revise - Architecture Documentation

## Overview

Revise follows Clean Architecture principles with clear layer separation.

## Layer Structure

### Domain Layer (`src/domain/`)

Pure business logic with no framework dependencies.

**Entities**:
- `Chapter` - Single chapter with rich text content
- `Project` - Aggregate managing chapter collection
- `TextDocument` - Legacy single document (Phase 1)

**Value Objects**:
- `TextSelection` - Selection range
- `RewriteProposal` - AI-generated proposal

**Interfaces**:
- `DocumentParser` - Parse documents to entities
- `DocumentExporter` - Export entities to documents
- `LLMProvider` - AI rewriting service
- `ProjectRepository` - Persistence abstraction

### Application Layer (`src/application/`)

Use cases orchestrating domain logic.

**Use Cases**:
- `ImportProjectUseCase`
- `ExportProjectUseCase`
- `SwitchChapterUseCase`
- `AddChapterUseCase`
- `RemoveChapterUseCase`
- `ReorderChaptersUseCase`
- `UpdateChapterContentUseCase`
- `UpdateChapterTitleUseCase`
- `RewriteTextUseCase`

### Infrastructure Layer (`src/infrastructure/`)

External service implementations.

**Document**:
- `DocxParser` - Mammoth-based parser
- `DocxExporter` - docx library exporter
- TipTap conversion utilities

**AI**:
- `OpenAIProvider` - GPT-4o-mini integration

**Persistence** (Phase 2):
- `InMemoryProjectRepository` - Ephemeral storage

### Interface Layer (`src/app/`, `src/components/`)

React components and UI.

**Components**:
- `TextEditor` - TipTap editor
- `FormattingToolbar` - Rich text controls
- `ChaptersSheet` - Chapter navigation
- `ProposalsSheet` - AI proposals display
- `DocumentControls` - Import/export

**State**:
- `projectStore` - Zustand store

## Data Flow

### Import Flow

```
User selects file
  → Server Action (importDocument)
  → DocxParser.parseToChapters()
  → mammoth.convertToHtml()
  → htmlToTipTapJSON()
  → Chapter entities created
  → Project aggregate created
  → Store updated
  → UI renders
```

### Edit Flow

```
User types in editor
  → TipTap onUpdate event
  → editor.getJSON()
  → Store.updateActiveContent()
  → hasUnsavedChanges = true
  → UI shows indicator
```

### Export Flow

```
User clicks Export
  → Store.saveCurrentChapter()
  → Serialize project
  → Server Action (exportProject)
  → DocxExporter.exportProject()
  → TipTap JSON → DOCX
  → Buffer returned
  → Browser downloads file
```

## Key Design Decisions

### Single Editor Instance

We use one TipTap editor and call `setContent()` to switch chapters.

**Rationale**: Creating/destroying editors is expensive (8+ seconds for 30+ instances).

**Trade-off**: Undo/redo history is shared across chapters.

### TipTap JSON as Storage Format

We store content as stringified TipTap JSON.

**Benefits**:
- Structured, parseable
- Direct mapping to/from editor
- Ready for search, analysis
- Compatible with MongoDB

**Trade-offs**:
- Larger than plain text
- Requires conversion to/from DOCX

### Zustand for State Management

We use Zustand instead of Redux or Context.

**Rationale**:
- Lightweight (< 1KB)
- Simple API
- Good TypeScript support
- No boilerplate

### Database-Agnostic Repository

We use Repository pattern for future persistence.

**Phase 2**: InMemoryProjectRepository (ephemeral)
**Phase 3**: MongoProjectRepository or PostgresProjectRepository

**Benefit**: No changes needed to use cases or store when adding persistence.

## Performance Optimizations

1. **Editor**: `shouldRerenderOnTransaction: false`
2. **Store**: Shallow equality checks
3. **TipTap**: `immediatelyRender: false` for SSR
4. **Chapter Switching**: Use `setContent()`, don't destroy/recreate

## Testing Strategy

- **Unit Tests**: Domain and application layers (150+ tests)
- **Integration Tests**: Infrastructure and store (30+ tests)
- **E2E Tests**: Complete workflows (10+ tests planned)
- **Coverage Target**: 85%+ for critical paths

## Future Enhancements (Phase 3)

- Real persistence (MongoDB/PostgreSQL)
- Auto-save
- Undo per chapter
- Search across chapters
- Export individual chapters
- Collaborative editing
