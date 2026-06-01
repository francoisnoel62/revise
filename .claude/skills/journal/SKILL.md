---
name: journal
description: Capture and recall engineering insights, decisions, failed approaches, and Fanfan's preferences in a dated markdown log. Use when you learn something worth remembering (a non-obvious fix, a dead end, a preference, an architectural decision), and search it BEFORE starting a complex or unfamiliar task to recover past context. Entries live in docs/journal/ and are committed.
---

# Journal

A lightweight, git-committed memory. One file per month: `docs/journal/YYYY-MM.md`.

## When to write an entry
- You found a non-obvious root cause or fix worth remembering.
- An approach failed — record what and why, so it isn't retried blindly.
- Fanfan stated a preference or made an architectural decision.
- You notice something to fix later that's unrelated to the current task
  (journal it instead of fixing it now).

## How to write
1. Determine the current month file: `docs/journal/YYYY-MM.md` (today's date).
2. If it doesn't exist, create it with a `# Journal YYYY-MM` heading.
3. Append a new entry at the end — never rewrite existing entries:

```markdown
## YYYY-MM-DD — <short title>

**Context:** <what we were doing>
**Insight / decision:** <the durable takeaway>
**Why it matters:** <consequence or rule to follow next time>
**Refs:** <file:line, commit sha, or PR # if relevant>
```

4. Keep entries short and evergreen (describe the lasting lesson, not a play-by-play).
5. Commit the entry (Fanfan's rule: commit journal entries).

## How to search
Before a complex task, recall relevant past notes:
- `grep -rin "<topic>" docs/journal/`
- Read the most relevant month files fully before concluding.

## Rules
- Append-only in spirit: don't delete or rewrite past entries to "clean up".
- No secrets, tokens, or customer data in the journal.
- Names and notes describe WHAT/WHY, never "old vs new" history.
