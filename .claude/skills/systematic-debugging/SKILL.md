---
name: systematic-debugging
description: Root-cause debugging runbook. Use when investigating a bug, test failure, crash, or unexpected behavior — when something is broken and you need to find WHY before changing code. Enforces one hypothesis at a time and finding the root cause instead of patching symptoms.
---

# Systematic Debugging

**ALWAYS find the root cause. NEVER fix symptoms.**

Work through these steps in order. Do not skip ahead to a fix.

1. **Reproduce consistently.** Find the smallest reliable way to trigger the problem. If you can't reproduce it, you can't fix it.
2. **Read the error message carefully.** The stack trace and message usually name the cause. Read it fully before theorizing.
3. **Check recent changes.** `git diff`, `git log` — what changed around when this started?
4. **Find working examples in the same codebase.** How does a similar, working path do it?
5. **Compare against reference implementations.** Docs, library sources, prior art.
6. **Form a single hypothesis.** One concrete, testable explanation of the root cause.
7. **Test it minimally.** The smallest change or probe that confirms or refutes the hypothesis.
8. **If the fix fails, STOP and re-analyze.** Do not pile on more changes.

## Hard rules

- **NEVER add multiple fixes at once.** One hypothesis, one change, observe, then iterate.
- Prefer a minimal probe (log, assertion, breakpoint) over speculative edits.
- Once you find the root cause, state it explicitly before fixing.
- A test failure is YOUR responsibility — never delete or skip a test to make it pass.

## Output

When done, report: the symptom, the root cause (with `file:line`), the single change that fixes it, and how you verified.
