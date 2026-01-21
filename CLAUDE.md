# CLAUDE.md

Governance rules for Claude Code. See [README.md](README.md) for features, [docs/architecture.md](docs/architecture.md) for technical details.

## Project Context

**Revise** is an AI-powered writing assistant for fiction authors.

**Mission**: Augment the author's creative process without ever replacing their voice.

**Founding principles**:
- AI suggests, author decides
- Always offer choices, never impose
- Preserve and enrich the text's singularity
- Writings belong to the author, never used for training

## Architecture Constraints

This project follows Clean Architecture:

- Domain depends on nothing
- Application depends only on Domain
- Infrastructure depends on Application and Domain
- Interface depends on Application and Domain
- AI providers abstracted behind `LLMProvider` interface
- Parsers/exporters must be swappable implementations
- UI components contain zero business logic
- All repositories filter by `ownerId` (multi-tenant isolation)

## Development Rules

### Test-Driven Development (MANDATORY)

1. Write failing test first
2. Confirm it fails
3. Write minimal code to pass
4. Confirm success
5. Refactor while green

**Principles**:
- ALL test failures are YOUR responsibility
- NEVER delete a test because it's failing
- NEVER write tests that only test mocked behavior
- NEVER implement mocks in E2E tests

### ABOUTME Comments (MANDATORY)

ALL code files MUST start with:
```typescript
// ABOUTME: [What this file does]
// ABOUTME: [Additional context]
```

### Naming Conventions

Names tell WHAT code does, NOT HOW or its HISTORY.

❌ Never: `ZodValidator`, `NewAPI`, `LegacyHandler`, `ImprovedInterface`
✅ Good: `Tool`, `RemoteTool`, `Registry`, `execute()`

### Code Comments

- NEVER add comments about "improved", "better", "new"
- Comments explain WHAT or WHY, never history
- NEVER remove comments unless provably false

### Git Workflow

- Commit frequently
- NEVER skip pre-commit hooks
- NEVER use `git add -A` without `git status` first

### Systematic Debugging

**ALWAYS find root cause. NEVER fix symptoms.**

1. Reproduce consistently
2. Read error messages carefully
3. Check recent changes (git diff)
4. Find working examples in the same codebase
5. Compare against reference implementations
6. Form single hypothesis
7. Test minimally
8. If fix fails, STOP and re-analyze

**NEVER add multiple fixes at once.**

### Code Quality

- Prefer simple over clever
- Readability is PRIMARY
- NEVER rewrite without EXPLICIT permission
- Fix broken things immediately
- Make SMALLEST reasonable changes

## AI Behavior

Current defaults (may evolve based on user needs):

- 3 stylistic variations: épuré, lyrique, amplifié
- Language-preserving (FR→FR, EN→EN)

## Product Principles

Every feature must respect these principles:

- **Author's voice first** - AI suggests, author decides. Never impose.
- **Always offer choices** - Multiple alternatives, never a single answer.
- **Transparency** - Users know what AI does and can control it.
- **Ownership** - Writings belong to the author, never used for training.

What does NOT belong in Revise:
- Features that write "instead of" the author without their control
- Automations that erase the text's singularity
- Functionalities that standardize the voice

## Testing

- ALL tests must pass before committing
- New features REQUIRE new tests
- `npm test` | `npm run test:coverage` | `npm run test:integration`
