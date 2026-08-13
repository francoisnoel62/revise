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
- **AI providers**: Anthropic Claude, Google Gemini, OpenAI — all behind the `LLMProvider` abstraction
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
- NEVER use `git add -A` or `git add .` — the `guard-bash` hook blocks it. Stage specific files by name after `git status`.

#### Branches & Worktrees

Isolate parallel sessions in their own worktree + branch to avoid Git conflicts.

- Branch naming: `feature/<name>`, `bugfix/<name>`, `refactor/<name>`, `docs/<name>`
- Create a worktree: `git worktree add ../revise-<name> -b feature/<name>`
- List worktrees: `git worktree list`
- Remove a worktree when done: `git worktree remove ../revise-<name>`
- Launch Claude Code in a worktree: `cd` into its path, then start a new session there —
  one Claude Code session per worktree, never share a branch across sessions.

Examples:
```bash
# New feature, own worktree
git worktree add ../revise-export-epub -b feature/export-epub
cd ../revise-export-epub
claude

# Bugfix in parallel with the above
git worktree add ../revise-fix-toc -b bugfix/fix-toc
cd ../revise-fix-toc
claude
```

When finished: merge/PR the branch, then `git worktree remove <path>` from the main
worktree to clean up.

### Debugging

ALWAYS find the root cause; NEVER fix symptoms. Use the **`systematic-debugging`** skill
(or the `/debug` command) for the full runbook — one hypothesis at a time, no piling on fixes.

### Measure, don't assume

- NEVER optimize, delete, or rewrite on a suspicion. Measure first, and put the number in
  the commit message or the journal.
- A claim in a doc, an issue, or a `FIXME` is a lead, NOT a fact. Re-verify it before acting
  on it — stale claims outlive the code they describe.
- "Nothing to do" is a result. Record it **with its measurement**, so the question is not
  re-litigated from memory later.

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
- Run `npm test` before committing; use `/verify` for the full lint → tests → build loop.

## Skills & commands

Repeatable procedures live in `.claude/skills/` (tdd-cycle, systematic-debugging, journal) and `.claude/commands/`.
Hooks in `.claude/hooks/` require **Git Bash + `jq`** in PATH (Windows: install jq via WinGet). If `jq` is missing the hooks print a warning and no-op.

## Agent skills

### Issue tracker

Issues live in GitHub Issues (`github.com/francoisnoel62/revise`). See `docs/agents/issue-tracker.md`.

### Triage labels

Default vocabulary — `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context repo — one `CONTEXT.md` + `docs/adr/` at the root. See `docs/agents/domain.md`.
