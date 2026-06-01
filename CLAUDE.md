# CLAUDE.md

Governance rules for Claude Code — things that are **always true** in this repo.
For the product "why" see [.claude/philosophie.md](.claude/philosophie.md);
for features see [README.md](README.md); for technical detail see [docs/architecture.md](docs/architecture.md).
Repeatable procedures live in skills/commands, not here (see "Skills & commands" below).

## Project Context

**Revise** is an AI-powered writing assistant for fiction authors. Its mission is to
augment the author's creative process **without ever replacing their voice**.
The founding principles (AI suggests / author decides, always offer choices, preserve
the text's singularity, the author owns their writing) are defined in
[.claude/philosophie.md](.claude/philosophie.md) and are binding on every feature.

## Tech Stack

- **Framework**: Next.js 16 (App Router) + React, TypeScript (strict)
- **Persistence**: MongoDB (native `mongodb` driver) — no ORM
- **Auth**: Auth.js (`next-auth` v5)
- **Editor**: TipTap
- **UI**: Tailwind CSS v4 + shadcn/ui (Radix primitives), dnd-kit
- **AI providers**: Anthropic SDK + Google GenAI SDK, behind the `LLMProvider` abstraction
- **Tests**: Vitest (unit/integration), Playwright (E2E)
- **Local DB**: Docker Compose (`npm run db:start`)

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

Write the failing test first; never ship behavior without a test. The full red-green-refactor
loop is in the **`tdd-cycle`** skill. Non-negotiable principles:

- ALL test failures are YOUR responsibility
- NEVER delete a test because it's failing
- NEVER write tests that only test mocked behavior
- NEVER implement mocks in E2E tests

### ABOUTME Comments (MANDATORY)

ALL code files MUST start with (enforced by the `check-edit` hook):

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
- NEVER use `git add -A` without `git status` first (enforced by the `guard-bash` hook)

### Debugging

ALWAYS find the root cause; NEVER fix symptoms. Use the **`systematic-debugging`** skill
(or the `/debug` command) for the full runbook — one hypothesis at a time, no piling on fixes.

### Code Quality

- Prefer simple over clever
- Readability is PRIMARY
- NEVER rewrite without EXPLICIT permission
- Fix broken things immediately
- Make SMALLEST reasonable changes

## Product Principles

Every feature must respect the principles in [.claude/philosophie.md](.claude/philosophie.md):
author's voice first (AI suggests, author decides), always offer choices, transparency,
and ownership (writings belong to the author, never used for training). Anything that writes
"instead of" the author, erases the text's singularity, or standardizes the voice does NOT
belong in Revise.

## Testing

- ALL tests must pass before committing (a pre-commit test run warns via the `guard-bash` hook)
- New features REQUIRE new tests
- `npm test` | `npm run test:coverage` | `npm run test:integration` | `npm run test:e2e`
- `npm run verify` runs lint → tests → build (see the `/verify` command)

## Skills & commands

- **Skills** (`.claude/skills/`): repeatable procedures — `tdd-cycle`, `systematic-debugging`, `journal`.
- **Subagents** (`.claude/agents/`): read-only research helpers used by the planning/research
  commands — `codebase-locator`, `codebase-analyzer`, `codebase-pattern-finder`,
  `docs-locator`, `docs-analyzer`.
- **Commands** (`.claude/commands/`): the workflow chain —
  `/simple_research_codebase_generic` → `/simple_create_plan_generic` →
  `/simple_implement_plan` → `/validate_plan` → `/simple_review_CTO` → `/commit`,
  plus `/verify`, `/arch-check`, `/docs-update`, `/describe_pr`, `/debug`.
