# Debug

Root-cause debugging for Revise. Always use the `systematic-debugging` skill for the step-by-step runbook — this file is a quick-reference for environment checks specific to this project.

## Quick environment checks

### App
```bash
npm run dev          # start Next.js dev server, watch terminal for errors
npm run build        # reproduce a build-time error
```

### Tests
```bash
npm test                                    # full unit suite
npx vitest run path/to/file.test.ts         # single file
npm run test:integration                    # needs MongoDB running (docker)
npm run test:e2e                            # Playwright end-to-end
```

### Database (MongoDB via Docker)
```bash
npm run db:start     # start local MongoDB
npm run db:logs      # tail MongoDB logs
npm run db:stop      # stop
```
Connection string lives in `.env.local` (`MONGODB_URI`). Never hardcode credentials.

### Recent changes
```bash
git log --oneline -10
git diff HEAD~1
git stash list
```

### Type errors
```bash
npx tsc --noEmit
```

## When something is broken

Invoke `/systematic-debugging` — it enforces one hypothesis at a time and finding the root cause before touching code.
