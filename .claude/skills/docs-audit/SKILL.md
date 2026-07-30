---
name: docs-audit
description: Full forensic audit of Revise's documentation against the real current code — not a diff against the last commit. Use when documentation is suspected to have drifted badly over time (stale CHANGELOG, contradictory READMEs, "is our documentation still accurate?", "audit all our docs", features that exist in code but aren't documented anywhere, or documented features that no longer exist). This is the heavy-duty counterpart to the lightweight `/docs-update` command — reach for `/docs-update` when docs just need to catch up with a recent PR, reach for this skill when the drift has accumulated for months across many unrelated changes and a diff-based approach won't catch it (fabricated content, removed features still documented, whole undocumented subsystems). Trigger this proactively whenever a user expresses doubt that Revise's docs reflect reality, not only when they name specific files.
---

# Docs Audit

The core idea: **don't trust existing documentation as a starting point — read the real code and treat every doc file as a claim to verify.** Diffing against a previous commit only catches drift since that commit; it misses errors that were wrong from the start, features documented and later removed, and gradual accumulation across dozens of unrelated PRs. This skill rebuilds ground truth from the code itself, then measures every doc file against it.

Skip this and go straight to `/docs-update` if the user just merged a PR and wants the docs caught up — that's a cheap diff-based job. Use this skill when the honest answer to "is this doc accurate?" requires actually reading the code.

## Step 0 — Check the git history is complete

A shallow clone silently truncates `git log`, which will make later "when was this built" reasoning wrong and can hide entire eras of work. Check first:

```bash
git rev-parse --is-shallow-repository
```

If `true`, run `git fetch --unshallow origin` before doing anything else. Confirm afterward with `git log --format="%ad" --date=short | tail -1` — it should reach back to the project's real start, not just a recent window.

## Step 1 — Rebuild ground truth from the code, not from docs

Spawn parallel Explore or general-purpose agents, one per architectural layer, each told explicitly to read the real source files and report what exists — not to summarize what the docs say. For Revise (Clean Architecture), the natural split is:

- **Domain** (`src/domain/entities`, `value-objects`, `interfaces`, `services`) — one agent
- **Application** (`src/application/use-cases`, `services`, `migration`, `rendering`, `strategies`) — one agent
- **Interface** (`src/app/**/page.tsx`, `route.ts`, `src/app/actions/*.ts`, `src/components/**`) — one agent
- **Infrastructure** (`src/infrastructure/**`) — one agent, or fold into the interface agent's pass if the codebase is small enough

Each agent should Glob first to get a complete file list (don't sample), then Read enough of each file to describe it accurately — class names, method signatures, real enum values, what's wired up in `src/infrastructure/config/providers.ts` versus what's dead code. Ask each one to flag discrepancies it notices against any README it happens to see in passing, but the primary deliverable is an accurate inventory, not a diff.

In parallel, reconstruct the real chronology from git rather than trusting any "Phase N" labels in the docs — they drift and this project's own CHANGELOG has proven internally inconsistent (phases out of chronological order, a Phase 6/6.1 split that doesn't match how the work was actually built). Pull the full commit log:

```bash
git log --format="%ad|%s" --date=short --reverse
```

Real dates are more trustworthy than phase numbers for describing *when* something shipped.

## Step 2 — Enumerate every doc file that claims to describe the code

Don't assume the file list from last time is still complete — new docs get added. Search fresh:

```bash
find . -iname "README*.md" -not -path "*/node_modules/*" -not -path "*/.git/*"
find docs -type f
find src/app/guide -name "page.tsx"   # in-app user guide, linked from the landing page
```

Known documentation surface as of this skill's creation (verify it's still current, don't hardcode blindly):
- `README.md` (root), `docs/README.md`, `docs/architecture.md`, `CHANGELOG.md`
- `src/domain/README.md`, `src/application/README.md`, `src/app/README.md`, `src/infrastructure/README.md`
- `docs/user/provider-management.md`, `docs/developer/api-reference.md`, `docs/developer/worktrees.md`
- `src/app/guide/**/page.tsx` — the in-app guide, reachable from the landing page footer; treat it as a real documentation surface, not just marketing copy
- `tests_ia_efficiency/README.md`
- `docs/adr/*.md` — architecture decision records; these usually stay accurate since they record a decision at a point in time rather than "current state," but check whether a major undocumented decision (e.g. swapping the PDF export engine) deserves a new ADR
- Explicitly **not** in scope: `.claude/skills/*` and `.claude/commands/*` (agent tooling, not product documentation) unless the user asks about those specifically

## Step 3 — Diagnose each file against the ground truth (read-only)

Spawn parallel `docs-analyzer`-style agents (read-only — Read, Grep, Glob, Bash; no Edit/Write), grouped sensibly by size (e.g. one agent for the small general docs, one for the two biggest layer READMEs, one for the other two, one for the guide pages, one for the remaining user/developer docs). Give each agent:

1. The specific ground-truth facts relevant to its files (paste the real class names, real enum values, real chronology from Step 1 — don't make the agent re-derive everything from scratch, that wastes the parallelism).
2. Instructions to read its assigned file(s) in full and report, file by file: what it currently claims, concrete errors or omissions (quoted or line-referenced), and a short recommended action per issue.

Common failure patterns worth explicitly asking each diagnostic agent to check for, because they recur:
- **Dead code presented as current** (an old implementation documented as "the" implementation after a newer one replaced it — check `src/infrastructure/config/providers.ts` or equivalent wiring, not just filenames).
- **Phantom features** (something documented that was never actually finished, or was removed — e.g. providers that never had a working implementation, entities/interfaces whose files no longer exist).
- **Redesigned value sets** (an enum or union type whose real values changed since the doc was written — these are easy to verify by reading the actual type definition).
- **Orphaned duplicate docs** (a doc that predates and overlaps with a newer canonical source — e.g. a standalone user guide superseded by an in-app guide; flag for merge-then-delete rather than leaving two sources of truth).
- **Broken cross-references** (a doc pointing at another file's old structure, e.g. referencing sections of `CLAUDE.md` that were since trimmed out).

## Step 4 — Turn the diagnosis into a plan and get it approved

This is a good fit for plan mode (`EnterPlanMode`). Don't skip straight to editing files — the combined diagnostic output at this scale (potentially 25+ files with real content) is a lot to commit to without the user's input on scope and sequencing. Before finalizing the plan, use `AskUserQuestion` for the choices that materially change the shape of the work:

- **Depth per file**: full detailed rewrite matching existing depth, versus a slimmer version that stops duplicating detail the code already provides. Layer READMEs in this project tend to want full rewrites (they're used as a real reference); marketing-adjacent docs tend to want trims.
- **What to do with orphaned/duplicate docs**: delete after merging unique content, versus keep both in sync going forward. Keeping both is rarely the right default — it's exactly the kind of thing that caused the drift in the first place.
- **Sequencing**: everything in one pass, versus tiered with a validation checkpoint between tiers (e.g. Tier 1 = the most user-visible docs like CHANGELOG/architecture.md/in-app guide, Tier 2 = the big layer READMEs, Tier 3 = smaller cleanup). Tiered is usually worth recommending when the total edit volume is large — it gives the user a chance to redirect before the expensive layer-README rewrites happen.

Write the plan file with concrete per-file actions (not just "update as needed") and call `ExitPlanMode`.

## Step 5 — Execute, verified against real code, committing per tier

For each tier, spawn parallel write-capable agents (general-purpose, not docs-analyzer — they need Edit/Write), one per file or small file group. Each agent's prompt should contain the specific diagnostic findings for its file(s) (copy them in — don't make the agent re-diagnose) plus explicit instructions to:

1. Read the current file in full first.
2. Verify anything it's unsure about against the real code before writing (the diagnostic may itself have gaps — agents in this project have repeatedly found additional errors beyond what was originally flagged when they double-checked against source).
3. Preserve the existing document's structure, voice, and formatting conventions — this is a correction-and-completion pass, not a rewrite-from-scratch, unless the user chose the "slimmer" depth option in Step 4.
4. Run a final grep for the specific wrong strings/claims it was asked to fix, and report whether they're gone.

After each tier's agents complete, commit and push with a commit message that states what was corrected and why (not just "update docs") — future readers of `git log` benefit from knowing a claim was wrong, not just that a file changed. Pause for user validation before starting the next tier unless they've asked for everything in one pass.

## Notes from experience

- Server errors mid-agent-run happen occasionally with large parallel batches; check `git status` before retrying — if it's clean, the retry is safe and cheap.
- Agents doing the Step 5 rewrite reliably find additional real errors beyond what Step 3 flagged (e.g. a page mislabeled as "the editor" when it's actually the landing page, a referenced file that doesn't exist under the name the docs use). Ask them to report these rather than silently fixing only the pre-flagged list, so the final summary to the user is complete.
- CHANGELOG "Phase N" numbering is a recurring source of confusion in this project — prefer adding new entries dated by month rather than continuing the phase-number sequence, and say so explicitly in the entry so future readers know why the convention changed.
