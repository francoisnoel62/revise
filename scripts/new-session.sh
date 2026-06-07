# ABOUTME: Creates an isolated git worktree and launches Claude CLI inside it.
# ABOUTME: Symlinks node_modules and copies .env.local with a unique DB name.

set -e

NAME="${1:-session-$(date +%Y%m%d-%H%M)}"

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PARENT_DIR="$(dirname "$ROOT_DIR")"
WORKTREE_DIR="$PARENT_DIR/Revise-$NAME"
BRANCH_NAME="session/$NAME"

# --- Worktree ---
echo "Creating worktree '$BRANCH_NAME' at $WORKTREE_DIR ..."
git -C "$ROOT_DIR" worktree add "$WORKTREE_DIR" -b "$BRANCH_NAME"

# --- node_modules symlink (avoids reinstall) ---
SRC_MODULES="$ROOT_DIR/node_modules"
DST_MODULES="$WORKTREE_DIR/node_modules"
if [ -d "$SRC_MODULES" ] && [ ! -e "$DST_MODULES" ]; then
    echo "Linking node_modules ..."
    ln -s "$SRC_MODULES" "$DST_MODULES"
fi

# --- .env.local with unique MONGODB_DB_NAME ---
ENV_SRC="$ROOT_DIR/.env.local"
ENV_DST="$WORKTREE_DIR/.env.local"
if [ -f "$ENV_SRC" ]; then
    echo "Copying .env.local ..."
    SAFE_NAME="${NAME//[^a-zA-Z0-9]/_}"
    sed "s/^\\(MONGODB_DB_NAME=\\).*/\\1revise_$SAFE_NAME/" "$ENV_SRC" > "$ENV_DST"
fi

echo ""
echo "Environment ready"
echo "  Worktree : $WORKTREE_DIR"
echo "  Branch   : $BRANCH_NAME"
echo "  DB name  : revise_${NAME//[^a-zA-Z0-9]/_}"
echo ""
cd "$WORKTREE_DIR"
claude
