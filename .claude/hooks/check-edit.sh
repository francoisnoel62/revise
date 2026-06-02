#!/bin/bash
# ABOUTME: PostToolUse hook for Write/Edit — enforces the ABOUTME header and ESLint on edited source files.
# ABOUTME: Blocks (exit 2) so Claude fixes deterministic issues immediately before moving on.
set -uo pipefail

if ! command -v jq >/dev/null 2>&1; then
  echo "[check-edit hook] 'jq' introuvable dans le PATH — le hook ne peut pas valider ce fichier." >&2
  echo "Installez jq (https://jqlang.github.io/jq/) ; nécessite aussi Git Bash sous Windows." >&2
  exit 0
fi

input=$(cat)
file=$(printf '%s' "$input" | jq -r '.tool_input.file_path // empty')
[ -z "$file" ] && exit 0

# Only act on source files under src/ or scripts/
case "$file" in
  *src/*|*scripts/*) ;;
  *) exit 0 ;;
esac
case "$file" in
  *.d.ts) exit 0 ;;
  *.ts|*.tsx|*.js|*.jsx|*.mjs|*.cjs) ;;
  *) exit 0 ;;
esac
[ -f "$file" ] || exit 0

# 1. ABOUTME header (must appear in the first 3 lines) — MANDATORY per CLAUDE.md
if ! head -n 3 "$file" | grep -q "ABOUTME:"; then
  {
    echo "Missing ABOUTME header in $file."
    echo "Per CLAUDE.md, every code file MUST start with:"
    echo "  // ABOUTME: [what this file does]"
    echo "  // ABOUTME: [additional context]"
  } >&2
  exit 2
fi

# 2. ESLint on the edited file (errors only). Skip silently if eslint isn't installed.
ESLINT="./node_modules/.bin/eslint"
if [ -x "$ESLINT" ]; then
  if ! out=$("$ESLINT" --quiet "$file" 2>&1); then
    {
      echo "ESLint errors in $file — fix them before continuing:"
      printf '%s\n' "$out"
    } >&2
    exit 2
  fi
fi

exit 0
