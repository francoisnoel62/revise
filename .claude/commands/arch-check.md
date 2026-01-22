# Architecture Check

Analyze recent changes and verify they respect the Clean Architecture principles.

## Usage

```
/arch-check [commit-id]
```

**Arguments:**
- `commit-id` (optional): The commit hash to compare against. If not provided, compares against `origin/main`.

## Instructions

### Step 1: Identify Changed Files

```bash
# List changed files since reference
git diff <commit-id|origin/main>..HEAD --name-only

# Get detailed diff for analysis
git diff <commit-id|origin/main>..HEAD
```

Focus on TypeScript files in:
- `src/domain/`
- `src/application/`
- `src/infrastructure/`
- `src/app/`
- `src/components/`

### Step 2: Check Layer Dependencies

For each changed file, verify import statements follow these rules:

#### Domain Layer (`src/domain/`)
**ALLOWED imports:**
- Other files in `src/domain/`
- External type libraries (only types, no runtime)

**FORBIDDEN imports:**
- `src/application/` ❌
- `src/infrastructure/` ❌
- `src/app/` ❌
- `src/components/` ❌
- Framework code (Next.js, React) ❌

#### Application Layer (`src/application/`)
**ALLOWED imports:**
- `src/domain/`
- Other files in `src/application/`

**FORBIDDEN imports:**
- `src/infrastructure/` ❌
- `src/app/` ❌
- `src/components/` ❌
- Framework code ❌

#### Infrastructure Layer (`src/infrastructure/`)
**ALLOWED imports:**
- `src/domain/`
- `src/application/`
- Other files in `src/infrastructure/`
- External libraries (MongoDB, OpenAI, etc.)

**FORBIDDEN imports:**
- `src/app/` ❌
- `src/components/` ❌
- React/Next.js runtime ❌

#### Interface Layer (`src/app/`)
**ALLOWED imports:**
- `src/domain/` (entities, interfaces)
- `src/application/` (use cases)
- `src/infrastructure/` (only in Server Actions for DI)
- `src/components/`
- Next.js, React

**FORBIDDEN imports:**
- Direct infrastructure in components (only through actions) ❌

#### Components (`src/components/`)
**ALLOWED imports:**
- Other components
- `src/types/` (UI types)
- `src/hooks/`
- `src/store/`
- `src/lib/` (utilities)
- React, UI libraries

**FORBIDDEN (business logic):**
- `src/domain/` (except type imports) ❌
- `src/application/` ❌
- `src/infrastructure/` ❌
- Direct API calls ❌
- Business logic in components ❌

### Step 3: Check Required Patterns

#### ABOUTME Comments
Every new TypeScript file MUST start with:
```typescript
// ABOUTME: [What this file does]
// ABOUTME: [Additional context]
```

Check: `grep -L "ABOUTME" <new-files>`

#### Multi-tenant Isolation
Repository methods MUST filter by `ownerId` or `userId`:
```typescript
// Required pattern in repositories
{ ownerId: ownerId }  // or userId
```

Check all repository queries include tenant filtering.

#### Use Case Structure
Use cases should:
- Have a single `execute()` method
- Receive dependencies via constructor
- Return typed results
- Not contain infrastructure details

#### Entity Immutability
Domain entities should:
- Use private fields with getters
- Return new instances on mutation
- Not expose internal state directly

### Step 4: Detect Common Violations

Look for these anti-patterns:

| Violation | Example | Fix |
|-----------|---------|-----|
| Domain importing infra | `import { MongoDBRepo } from '@/infrastructure'` | Use interface from domain |
| Business logic in component | `if (user.canEdit()) { ... }` in React | Move to use case |
| Direct DB in action | `await db.collection().find()` | Use repository |
| Missing ownerId filter | `find({ projectId })` without ownerId | Add `ownerId` filter |
| Infrastructure in domain | `import { ObjectId } from 'mongodb'` | Use string IDs |

### Step 5: Report Findings

Generate a report with:

```
## Architecture Check Report

**Commit range:** <base>..HEAD
**Files analyzed:** X files

### Layer Dependency Violations

| File | Violation | Severity |
|------|-----------|----------|
| src/domain/X.ts | Imports from infrastructure | CRITICAL |

### Missing Patterns

| File | Issue |
|------|-------|
| src/app/Y.ts | Missing ABOUTME comment |
| src/infrastructure/Z.ts | Query missing ownerId filter |

### Summary

- Total violations: X
- Critical: Y
- Warnings: Z

### Recommendations

[List specific fixes needed]
```

## Severity Levels

- **CRITICAL**: Layer violation that breaks Clean Architecture
- **HIGH**: Missing security pattern (ownerId filter)
- **MEDIUM**: Missing required pattern (ABOUTME)
- **LOW**: Style inconsistency

## Critical Rules

1. **NEVER approve code with CRITICAL violations**
2. **All repository queries MUST have tenant isolation**
3. **Domain layer must remain pure** - no framework imports
4. **Components must be dumb** - no business logic
5. **Fix violations before proceeding** - don't just report

## Auto-Fix Guidance

When violations are found:

1. **Layer violations**: Move code to correct layer or use interfaces
2. **Missing ABOUTME**: Add at file top with accurate description
3. **Missing ownerId**: Add filter to all repository queries
4. **Business logic in component**: Extract to use case, call from Server Action

## Example

```
/arch-check abc1234
```

This will:
1. Get all files changed between abc1234 and HEAD
2. Analyze imports in each file
3. Check for pattern compliance
4. Report violations with fix recommendations
