# UI/UX Standard

## Target

VibeForge must feel like:

```txt
VS Code + Linear + GitHub + Notion + AI Agent
```

## Principles

### Desktop First

Prioritize desktop workflow.

Required:

- Resizable panels.
- Collapsible sidebar.
- Docked panels.
- Split editor.
- Context menu.
- Command palette.
- Keyboard shortcut.
- Status bar.
- Bottom panel.

### VS Code-like

Workspace must look and behave like a Web IDE.

### Information Dense

Avoid large empty cards.
Use compact spacing.
Make content useful.

### Zero Context Switching

User should be able to:

- Pick task.
- Read criteria.
- Open file.
- Edit code.
- Run terminal.
- Ask agent.
- Review diff.
- Update log.

Without leaving Workspace.

### Keyboard First

Target shortcuts:

- Cmd/Ctrl + K: Command palette
- Cmd/Ctrl + P: Open file
- Cmd/Ctrl + Shift + T: Open task
- Cmd/Ctrl + Shift + A: Open agent
- Cmd/Ctrl + Shift + L: Daily log
- Cmd/Ctrl + Shift + S: Schedule
- Cmd/Ctrl + Shift + K: Planner

## Required States

Every page must include:

- Loading
- Skeleton
- Empty
- Error
- Retry
- Toast
- Confirmation for destructive action

## Forbidden

- Generic admin dashboard
- CRUD-only pages
- Fake stats with no value
- Excessive whitespace
- Random gradients
- Inconsistent buttons
- Missing feedback
