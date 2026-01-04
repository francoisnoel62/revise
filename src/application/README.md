# Application Layer

Orchestrates domain logic through use cases.

**Status**: ✅ Complete (15 tests passing)

## Rules:
- Depends only on Domain layer
- No framework-specific code
- No direct infrastructure implementations (use interfaces)
- Use cases are thin orchestrators, not business logic containers

## Contents:

### Use Cases (✅ Implemented)

#### `ImportDocumentUseCase`
Handles document import from .docx files.

**Dependencies**: `DocumentParser` interface
**Input**: File buffer, filename
**Output**: `TextDocument` entity
**Tests**: 5 tests covering success and error cases

#### `RewriteTextUseCase`
Core AI rewriting functionality.

**Dependencies**: `LLMProvider` interface
**Input**: `TextDocument`, `TextSelection`
**Output**: Array of 5 `RewriteProposal` objects
**Features**:
- Extracts context around selection (200 chars before/after)
- Validates selection boundaries
- Returns exactly 5 distinct proposals
- Performance tracking in development mode

**Tests**: 5 tests covering context extraction, validation, and proposals

#### `ExportDocumentUseCase`
Handles document export to .docx format.

**Dependencies**: `DocumentExporter` interface
**Input**: `TextDocument`, filename
**Output**: File buffer ready for download
**Tests**: 5 tests covering export scenarios

## Testing

All use cases tested with mocked dependencies following Clean Architecture principles.
