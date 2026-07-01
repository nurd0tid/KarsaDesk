# Skill: Daily Log

## Purpose

Create a daily log after a work session and store it in NocoDB daily_logs.

## Required Behavior

1. Run `run_command` with `git status` and `git diff` (or `git log`) to see which files were modified and what commits were made.
2. Read the changes to understand what was completed during the session.
3. Read `docs/ai/project-context.md` for current context.
4. Use Context7 when package docs are involved.
5. Use Sequential Thinking for complex reasoning.
6. Follow AGENTS.md constraints.
7. Save the daily log to NocoDB using appropriate API routes or helpers.
8. Do not mark task done if blockers remain.

## Workflow

1. Use `run_command` to inspect recent git commits: `git log -n 5 --oneline` or `git status`.
2. Map the changes to tasks or features.
3. Summarize the achievements, files changed, and any issues encountered.
4. Save the log to NocoDB.
5. Output the daily log to the user.

## Output Format

- **Summary:** Brief description of today's work.
- **Git Changes:** List of recent commits and modified files.
- **Achievements:** Key milestones completed today.
- **NocoDB Records:** Log entry created/updated.
- **Blockers:** Any lingering issues.
- **Next Steps:** Tasks for the next session.

## Done Rule

This skill is complete only when the daily log is saved in NocoDB.
