---
name: tdd-cycle
description: Test-Driven Development red-green-refactor loop. Use when implementing a new feature, fixing a bug with a reproducible case, or adding behavior to existing code — any time you are about to write production code. Enforces writing the failing test first.
---

# TDD Cycle (red → green → refactor)

This project mandates Test-Driven Development. Follow the loop for every change to behavior.

1. **Write a failing test first.** Express the desired behavior as a test before any implementation.
2. **Confirm it fails** — and fails for the right reason (the behavior is missing, not a typo in the test).
3. **Write the minimal code to pass.** No more than what the test demands.
4. **Confirm it passes.** Run the test; see it green.
5. **Refactor while green.** Improve names and structure with the test protecting you. Keep it green.

## Principles (non-negotiable)

- ALL test failures are YOUR responsibility.
- NEVER delete a test because it's failing — fix the code or the test's correctness, never silence it.
- NEVER write tests that only assert mocked behavior.
- NEVER implement mocks in E2E tests.
- New features REQUIRE new tests.

## In this codebase

- Test runner: **Vitest** (`npm test`, `npm run test:coverage`, `npm run test:integration`).
- E2E: **Playwright** (`npm run test:e2e`).
- New code files must start with the `// ABOUTME:` header (enforced by a hook).
- After a phase, run the automated gates (lint, tests, type-check, build) — see the `/verify` command.
