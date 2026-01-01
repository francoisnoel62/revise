# Domain Layer

Pure business logic with zero framework dependencies.

## Rules:
- No imports from Next.js, React, or any external frameworks
- No infrastructure concerns (no OpenAI, no file I/O)
- Only business entities, value objects, and domain interfaces
- All code must be framework-agnostic and testable in isolation

## Contents:
- `entities/` - Core business entities (TextDocument)
- `value-objects/` - Immutable value objects (TextSelection, RewriteProposal)
- `interfaces/` - Domain service interfaces (LLMProvider)
