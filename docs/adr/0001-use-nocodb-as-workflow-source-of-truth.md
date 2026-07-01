# ADR 0001: Use NocoDB as Workflow Source of Truth

## Status

Accepted

## Context

VibeForge needs persistent workflow storage for planning, tasks, schedules, daily logs, weekly logs, project context updates, agent runs, and provider configs.

## Decision

Use NocoDB as the primary workflow database.

## Consequences

- Agent output is not lost in chat.
- Workflow can be inspected and continued.
- AI provider can change without changing workflow.
