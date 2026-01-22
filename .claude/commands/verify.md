# Verify Code Quality

Execute a systematic verification of the codebase and **fix all issues until everything passes**.

## Instructions

Run the following checks **in sequence** and **fix all issues until 100% green**:

### 1. Lint Check
```bash
npm run lint
```
- If lint fails → **FIX the lint errors** → re-run lint
- **LOOP until lint passes completely**

### 2. Test Suite
```bash
npm test -- --run
```
- If tests fail → **FIX the failing tests** → re-run tests
- **LOOP until ALL tests pass (100% green)**
- NEVER delete a test to make it pass
- NEVER skip failing tests

### 3. Build Check
```bash
npm run build
```
- If build fails → **FIX the build errors** → re-run build
- **LOOP until build succeeds**

## Critical Rules

1. **NEVER stop until everything is green**
2. **Fix issues, don't skip them**
3. **Run checks in order**: lint → tests → build
4. After fixing an issue, **re-run from the beginning** (lint → tests → build)
5. If a fix breaks something else, fix that too
6. **Continue looping until all 3 checks pass consecutively**

## Fixing Strategy

When fixing issues:
- **Lint errors**: Fix the code to comply with ESLint rules
- **Test failures**:
  - Read the failing test to understand what it expects
  - Fix the implementation code (NOT the test)
  - Only fix the test if it has a genuine bug
- **Build errors**:
  - Fix TypeScript type errors
  - Fix import/export issues
  - Fix Next.js configuration issues

## Output Format

After achieving 100% green:

```
## Verification Complete

| Check | Status | Details |
|-------|--------|---------|
| Lint  | PASS | clean |
| Tests | PASS | X tests passing |
| Build | PASS | success |

All checks passed. Code is ready for commit.
```

If stuck after multiple attempts, report:
- What was tried
- What's still failing
- Ask for guidance

## This skill enforces CLAUDE.md rules:
- ALL test failures are YOUR responsibility
- NEVER delete a test because it's failing
- Fix broken things immediately
