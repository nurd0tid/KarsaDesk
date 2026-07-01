# RECOVERY.md — Recovering From Context Loss

If the AI session resets, do this:

1. Read `README.md`.
2. Read `AGENTS.md`.
3. Read `CLAUDE.md`.
4. Read `.clinerules`.
5. Read `SESSION.md`.
6. Read `NEXT_ACTION.md`.
7. Read latest daily logs in NocoDB.
8. Read latest task status in NocoDB.
9. Read latest `docs/ai/project-context.md`.
10. Continue from the newest unfinished task.

## Never Assume Done

If status is unclear, verify:

- Build
- Typecheck
- Lint
- NocoDB logs
- Acceptance criteria
- UI state
- Blockers

## Update Session

After recovery, update `SESSION.md` with:

- Current phase
- Current task
- Blockers
- Next action
