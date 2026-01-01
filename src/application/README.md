# Application Layer

Orchestrates domain logic through use cases.

## Rules:
- Depends only on Domain layer
- No framework-specific code
- No direct infrastructure implementations (use interfaces)
- Use cases are thin orchestrators, not business logic containers

## Contents:
- `use-cases/` - Application use cases (RewriteTextUseCase, ImportDocumentUseCase, ExportDocumentUseCase)
