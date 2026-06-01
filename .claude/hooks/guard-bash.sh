#!/bin/bash
# ABOUTME: PreToolUse hook for Bash — blocks bulk `git add -A/.` and runs the test suite as a warning before commits.
# ABOUTME: Bulk-add is blocked (exit 2); failing tests are a non-blocking warning, matching the checkpoint workflow.
set -uo pipefail

if ! command -v jq >/dev/null 2>&1; then
  echo "[guard-bash hook] 'jq' introuvable dans le PATH — la garde Bash est désactivée." >&2
  echo "Installez jq (https://jqlang.github.io/jq/) ; nécessite aussi Git Bash sous Windows." >&2
  exit 0
fi

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
    # Unit tests only — integration tests need MongoDB (docker) and would warn on every commit.
    if ! out=$("$VITEST" run --exclude '**/*.integration.test.ts' 2>&1); then
      {
        echo "⚠️  Unit tests are not green before this commit (warning only — commit allowed)."
        echo "Run 'npm run test:integration' (DB up) and /verify before pushing. Last lines:"
        printf '%s\n' "$out" | tail -n 20
      } >&2
    fi
  fi
  exit 0
fi

exit 0
