# Web IDE UX

Workspace is the heart of VibeForge.

## Required Layout

```txt
┌──────────────────────────────────────────────────────────────┐
│ Command Bar / Top Bar                                        │
├────┬───────────────┬─────────────────────────┬───────────────┤
│Act │ Explorer      │ Editor Tabs             │ AI Panel      │
│Bar │ Files         │ Monaco Editor           │ Current Task  │
│    │ Search        │                         │ Criteria      │
│    │ Git           │                         │ Chat          │
│    │ Docs          │                         │ Related Docs  │
├────┴───────────────┴─────────────────────────┴───────────────┤
│ Terminal | Problems | Output | Git Diff | Logs | Testing      │
└──────────────────────────────────────────────────────────────┘
```

## Activity Bar

Items:

- Explorer
- Search
- Git
- Tasks
- AI
- Docs
- Logs
- Settings

## AI Panel

AI panel must include:

- Current task
- Acceptance criteria
- Checklist
- Related files
- Related docs
- Agent chat
- Suggested commands
- Run logs

## Bottom Panel

Tabs:

- Terminal
- Problems
- Output
- Git Diff
- Logs
- Testing

## Status Bar

Show:

- active project
- active branch
- active provider/model
- NocoDB sync status
- current task status
- terminal status
