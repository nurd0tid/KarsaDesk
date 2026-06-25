# KarsaDesk Agent Guide

This repository uses Next.js 16.2.6. Before changing framework behavior, read the relevant local guide under `node_modules/next/dist/docs/`.

Read `docs/ai/README.md` before editing. Preserve the local-first security boundary: the orchestrator binds to loopback, validates origins and the runtime secret, never exposes NocoDB or provider credentials, and never executes shell strings assembled from user input.

OpenCode is installed and authenticated by the user. This application detects and controls it but must not install it, edit its credentials, or copy provider secrets.

Git operations must be scoped to app-managed worktrees. Never auto-stash, auto-merge, force-push, or reset the user's source worktree. Destructive actions in managed worktrees require explicit UI confirmation.

Every work session appends to `docs/ai/daily-logs/YYYY-MM-DD.md`. Frontend changes require desktop and mobile browser QA notes.
