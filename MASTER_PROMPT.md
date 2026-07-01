# MASTER PROMPT — Start VibeForge Full Build

Copy this prompt into your AI coding agent at the start of development.

---

You are the lead AI software engineer for VibeForge.

Your objective is to rebuild and complete VibeForge as a usable AI Coding Workspace application.

Do not only explain. Implement the application.

## Required First Steps

1. Read `README.md`.
2. Read `AGENTS.md`.
3. Read `CLAUDE.md`.
4. Read `.clinerules`.
5. Read `AI.md`.
6. Read `SESSION.md`.
7. Read `NEXT_ACTION.md`.
8. Read `RECOVERY.md`.
9. Read all relevant files in `docs/`.
10. If available, read `b2b-template/docs/ai` for reference templates.
11. Inspect the current source code.
12. Identify old branding, invalid architecture, and incomplete UI.
13. Use Context7 MCP for latest documentation of all packages.
14. Use Sequential Thinking MCP for planning the rebuild.

## Project Goal

Build VibeForge:

- Open-source AI Coding Workspace.
- Kanban task management.
- AI Planner.
- Schedule Breakdown.
- Web IDE like VS Code.
- NocoDB-backed workflow.
- Multi-provider AI integration.
- Daily logs and weekly logs.
- Project context management.
- Agent runs and logs.

## Branding

Final app name: VibeForge.

Remove:

- KarsaDesk
- karsadesk
- Karsa Desk
- old vibe-kanban folder naming as final branding

## Tech Stack

Use latest stable packages:

- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- Radix UI
- Lucide React
- Sonner
- SweetAlert2
- Monaco Editor
- xterm.js
- TanStack Query
- TanStack Table
- React Hook Form
- Zod
- Zustand or Jotai
- Framer Motion
- react-resizable-panels
- NocoDB REST API

## Mandatory App Modules

Build these modules:

1. Dashboard
2. Projects
3. Kanban Tasks
4. Planner
5. Schedule Breakdown
6. Workspace / Web IDE
7. AI Agents
8. AI Providers
9. Docs
10. Logs
11. Settings

## UI/UX Requirement

The app must feel like:

```txt
VS Code + Linear + GitHub + Notion + AI Agent
```

Workspace must include:

- Activity bar
- File explorer
- Monaco editor
- Editor tabs
- AI panel
- Current task
- Acceptance criteria
- Related docs
- Terminal
- Problems
- Output
- Git diff
- Logs
- Status bar

Do not create a generic admin dashboard.

## NocoDB Requirement

Use NocoDB for:

- Projects
- Tasks
- Task Plans
- Schedules
- Daily Logs
- Weekly Logs
- Project Context Updates
- Agent Runs
- Agent Logs
- Providers
- Skills
- Decisions
- Blockers

Read `.env.local` for actual NocoDB credentials if needed.

Do not expose secrets.

## Workflow Requirement

Every work session must:

1. Create or update plan.
2. Create or update tasks.
3. Save plan/task/logs to NocoDB.
4. Implement code.
5. Review.
6. Test.
7. Update daily log.
8. Update project context when needed.
9. Continue to next pending task.

## Blocker Rule

Never mark task done if blockers remain.

If build fails, task is not done.
If typecheck fails, task is not done.
If UI is incomplete, task is not done.
If acceptance criteria are missing, task is not done.
If NocoDB logging is missing, task is not done.

## Keep Going

Do not stop after setup.
Do not stop after one component.
Do not stop after one page.

Continue until MVP is usable.

## MVP Completion Criteria

MVP is usable when:

- App runs locally.
- Branding is VibeForge.
- Navigation works.
- Projects page works.
- Kanban page works.
- Planner page works.
- Schedule page works.
- Workspace page looks and behaves like an IDE shell.
- AI Providers page works.
- Logs page works.
- NocoDB client exists.
- Core tables can be read/written.
- UI states exist.
- Build/typecheck/lint pass.
- README remains open-source usage documentation.
- AGENTS/CLAUDE/.clinerules guide AI behavior.

Begin by reading all required documents, then create an implementation plan, then execute.
