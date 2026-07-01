# Skill: Create Task

## Purpose

Create small Kanban tasks from planning or user requests and store them in NocoDB tasks.

## Required Behavior

1. Run `list_directory docs` or check for schema documentation.
2. If schema documentation is unavailable, ensure you structure the tasks cleanly for the Kanban board.
3. Read `docs/ai/project-context.md` for current context.
4. Use Context7 when package docs are involved.
5. Use Sequential Thinking for complex reasoning.
6. Follow AGENTS.md rules.
7. Break down large requests into small, manageable Kanban tasks.
8. Save output to NocoDB using appropriate API routes or helpers.
9. Do not mark task done if blockers remain.

## Workflow

1. Review the input plan or user request.
2. Break the work down into cohesive tasks (e.g., UI, API, Store).
3. Ensure each task has a clear title, description, and status.
4. If generating JSON to send to NocoDB, ensure it uses Title Case keys if required by `AGENTS.md`.
5. Output the created tasks list.

## Output Format

- **Summary:** Brief description of the tasks created.
- **Tasks Created:**
  - `[Task Title]`: Brief description of what this task entails.
- **NocoDB Records:** Confirmation of records created.
- **Blockers:** Any issues encountered.
- **Next Steps:** Recommendation on which task to tackle first.

## Done Rule

This skill is complete only when the tasks are defined and (if applicable) saved to NocoDB.
