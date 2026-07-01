# Skill: Planning

## Purpose

Create a structured plan before implementation. Store to task_plans or NocoDB tasks.

## Required Behavior

1. Run `list_directory .` to understand the top-level project structure.
2. Read `docs/ai/project-context.md` for current architecture context.
3. Read relevant source files using `read_file` before proposing changes.
4. Use Context7 when package docs are involved.
5. Use Sequential Thinking for complex multi-step reasoning.
6. Follow AGENTS.md constraints at all times.
7. Save output to NocoDB if the skill produces workflow data.
8. Do not mark task done if blockers remain.

## Workflow

1. Understand the request fully — ask clarifying questions if needed.
2. Explore the relevant code directories with `list_directory`.
3. Read key files impacted by the plan.
4. Formulate a step-by-step implementation plan.
5. Identify files to be created, modified, or deleted.
6. List potential blockers or missing information.
7. Output the final plan in the Output Format below.

## Output Format

- **Summary:** One paragraph describing the plan.
- **Actions:** Numbered list of concrete steps.
- **Files Changed:** List of files created/modified/deleted.
- **NocoDB Records:** Records created or updated (if applicable).
- **Blockers:** Any unresolved issues.
- **Next Steps:** What should be done after this plan.

## Done Rule

This skill is complete only when the plan is documented and saved (or reflected in NocoDB).
