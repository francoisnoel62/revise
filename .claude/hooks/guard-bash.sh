#!/bin/bash
# ABOUTME: PreToolUse hook for Bash — blocks bulk `git add -A/.` and runs the test suite as a warning before commits.
# ABOUTME: Bulk-add is blocked (exit 2); failing tests are a non-blocking warning, matching the checkpoint workflow.
set -uo pipefail

input=$(cat)
cmd=$(printf '%s' "$input" | jq -r '.tool_input.command // empty')
[ -z "$cmd" ] && exit 0

# Block bulk git add — CLAUDE.md: never `git add -A` without `git status` first.
if printf '%s' "$cmd" | grep -Eq 'git[[:space:]]+add[[:space:]]+(-A|--all|\.)([[:space:]]|$)'; then
  {
    echo "Avoid 'git add -A', 'git add --all', or 'git add .'."
    echo "Run 'git status' first, then stage specific files (CLAUDE.md rule)."
  } >&2
  exit 2
fi

# Before a commit, run tests as a NON-BLOCKING warning (commit is still allowed).
if printf '%s' "$cmd" | grep -Eq 'git[[:space:]]+commit'; then
  VITEST="./node_modules/.bin/vitest"
  if [ -x "$VITEST" ]; then
    if ! out=$("$VITEST" run 2>&1); then
      {
        echo "⚠️  Tests are not green before this commit (warning only — commit allowed)."
        echo "Consider running /verify before pushing. Last lines:"
        printf '%s\n' "$out" | tail -n 20
      } >&2
    fi
  fi
  exit 0
fi

exit 0
