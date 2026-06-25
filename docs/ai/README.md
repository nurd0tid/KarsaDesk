# AI Memory Entry Point

Read in this order:

1. `AGENTS.md`
2. This file
3. `docs/ai/architecture.md`
4. Relevant application and package code
5. Relevant Next.js 16.2.6 documentation under `node_modules/next/dist/docs/`

## Daily logs

Append a new session to `docs/ai/daily-logs/YYYY-MM-DD.md`; never overwrite prior sessions. Record prompt, plan, changed files, verification, result, status, blockers, and next steps. UI changes also record desktop/mobile, light/dark, and loading/empty/error checks.

## Product invariants

- NocoDB stores structured work data; source, raw logs, paths, PIDs, and diffs stay local.
- One execution session owns one branch, worktree, OpenCode server, and OpenCode session ID.
- Permission mode defaults to supervised.
- Merge is always a separate explicit user action.
