# Worktree Done

End this isolated session: commit pending work, remove the worktree, and tell the user where to go next.

## Steps

1. **Check for uncommitted changes**
   Run `git status`. If there are uncommitted changes, stop and ask the user whether to commit or stash before continuing.

2. **Identify paths**
   Run:
   ```
   git rev-parse --show-toplevel
   git worktree list --porcelain
   ```
   The first `worktree` entry in the porcelain output is the main repo path.
   The current worktree path comes from `git rev-parse --show-toplevel`.

3. **Remove the worktree**
   ```powershell
   $mainRepo    = "<main-repo-path-from-step-2>"
   $worktreePath = "<current-path-from-step-2>"
   git -C $mainRepo worktree remove $worktreePath
   git -C $mainRepo worktree prune
   ```

4. **Confirm**
   Tell the user the worktree has been removed and they can `cd` back to the main repo:
   ```
   cd C:\Users\François\Desktop\dev\Revise
   ```
