# Update Documentation

Update all documentation files to reflect recent code changes.

## Usage

```
/docs-update [commit-id]
```

**Arguments:**
- `commit-id` (optional): The commit hash to compare against. If not provided, compares against `origin/main`.

## Instructions

### Step 1: Analyze Changes

First, identify what changed since the reference point:

```bash
# If commit-id provided:
git diff <commit-id>..HEAD --stat
git log <commit-id>..HEAD --oneline

# If no commit-id:
git diff origin/main..HEAD --stat
git log origin/main..HEAD --oneline
```

Understand:
- Which files were added/modified/deleted
- What features were added or changed
- What architectural changes occurred
- Any new dependencies or configuration changes

### Step 2: Identify Documentation to Update

Check each documentation file and determine if it needs updates based on the changes:

| File | Update when... |
|------|----------------|
| `README.md` | Features, installation, usage, or project overview changes |
| `CLAUDE.md` | Development rules, architecture constraints, or AI behavior changes |
| `CHANGELOG.md` | Any significant changes (features, fixes, breaking changes) |
| `docs/architecture.md` | Architectural changes, new layers, patterns, or dependencies |
| `src/app/guide/**/page.tsx` | User-facing features or workflows change (in-app guide, linked from the landing page) |
| `docs/developer/api-reference.md` | API endpoints, Server Actions, or interfaces change |
| `docs/user/provider-management.md` | AI provider configuration changes |
| `src/domain/README.md` | Domain entities, value objects, or interfaces change |
| `src/application/README.md` | Use cases added/modified/removed |
| `src/infrastructure/README.md` | Repositories, providers, or external services change |
| `src/app/README.md` | Routes, pages, or Server Actions change |

### Step 3: Read and Update Each File

For each documentation file that needs updating:

1. **Read the current content** to understand its structure
2. **Identify sections that need changes** based on code changes
3. **Update only the affected sections** - don't rewrite entire files
4. **Preserve the existing style and tone**
5. **Keep changes minimal and focused**

### Step 4: Update CHANGELOG.md

Add a new entry at the top following this format:

```markdown
## [Unreleased] - YYYY-MM-DD

### Added
- New feature X for Y purpose

### Changed
- Modified Z to improve W

### Fixed
- Bug fix description

### Removed
- Removed deprecated feature
```

Only include sections that have actual changes.

## Critical Rules

1. **Read before writing** - Always read a doc file before modifying it
2. **Minimal changes** - Only update what's necessary, don't reorganize or reformat
3. **Accurate content** - Base updates on actual code changes, not assumptions
4. **Consistent style** - Match the existing documentation style
5. **No placeholders** - Don't add TODO or placeholder text
6. **Verify accuracy** - Cross-check documentation against actual code

## Documentation Standards

- Use present tense ("Add feature" not "Added feature" in descriptions)
- Be concise but complete
- Include code examples when relevant
- Update statistics (test counts, file counts) if mentioned
- Keep ABOUTME comment counts accurate if mentioned in docs

## Output Format

After updating documentation:

```
## Documentation Updated

### Files Modified:
- README.md: Updated feature list
- docs/architecture.md: Added new repository pattern
- CHANGELOG.md: Added entries for commits abc123..def456

### Changes Summary:
- [Brief description of what was documented]

### Commits Analyzed:
- abc123: Feature X
- def456: Fix Y
```

## Example

```
/docs-update abc1234
```

This will:
1. Compare HEAD against commit abc1234
2. Analyze all changes between those commits
3. Update relevant documentation files
4. Add CHANGELOG entries for those changes
