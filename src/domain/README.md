# Domain Layer

Pure business logic with zero framework dependencies.

**Status**: ✅ Complete (30 tests passing)

## Rules:
- No imports from Next.js, React, or any external frameworks
- No infrastructure concerns (no OpenAI, no file I/O)
- Only business entities, value objects, and domain interfaces
- All code must be framework-agnostic and testable in isolation

## Contents:

### Entities (✅ Implemented)
- **`TextDocument`** - Represents a document with content and metadata
  - Handles content validation and updates
  - Manages document state (created date, last modified)
  - 15 tests covering all business rules

### Value Objects (✅ Implemented)
- **`TextSelection`** - Immutable representation of selected text range
  - Validates selection boundaries
  - Extracts selected content from text
  - 9 tests covering edge cases

- **`RewriteProposal`** - Immutable AI-generated text alternative
  - Validates proposal content
  - Supports optional style labels
  - 6 tests for validation rules

### Interfaces (✅ Implemented)
- **`LLMProvider`** - AI text generation contract
  - `generateRewrites()` returns exactly 5 proposals

- **`DocumentParser`** - Document import contract
  - `parse()` converts file buffer to plain text

- **`DocumentExporter`** - Document export contract
  - `export()` creates document buffer from text

## Testing

All domain logic has 100% test coverage with isolated unit tests.
