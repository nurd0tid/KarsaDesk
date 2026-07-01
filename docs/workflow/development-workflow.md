# Development Workflow

## Main Flow

```txt
Project
↓
Read Context
↓
Planning
↓
Schedule Breakdown
↓
Create Tasks
↓
Workspace
↓
Agent Execution
↓
Review
↓
Testing
↓
Daily Log
↓
Context Update
↓
Done
```

## Planning

Before coding, create a plan.

Store to NocoDB `task_plans`.

## Schedule

For big work, break into day-based schedule.

Store to NocoDB `schedules`.

## Task

Every task must have:

- title
- description
- priority
- estimate
- acceptance criteria
- related docs/files
- dependencies
- status

Store to NocoDB `tasks`.

## Daily Logs

After every significant work session, create daily log.

Store to NocoDB `daily_logs`.

## Weekly Logs

Create weekly summary from daily logs and tasks.

Store to NocoDB `weekly_logs`.

## Context Update

Update context when architecture, database, UI, API, workflow, provider, or security changes.

Store to NocoDB `project_context_updates`.
