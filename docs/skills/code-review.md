# Skill: Code Review

## Purpose

Review code changes against acceptance criteria and the definition of done.

## Required Behavior

1. Run `run_command` with `git diff` to get the current diff of modified files.
2. List modified files using `run_command` with `git diff --name-only`.
3. Read each modified file using `read_file` to understand the full context.
4. Read `docs/ai/project-context.md` and `docs/standards/definition-of-done.md` for evaluation criteria.
5. Use Context7 when package docs are involved.
6. Use Sequential Thinking for complex reasoning.
7. Follow AGENTS.md constraints.
8. Save review output to NocoDB if applicable.
9. Do not mark task done if blockers remain.

## Workflow

1. Run `git diff --name-only` to list all changed files.
2. Run `git diff` (or `git diff --staged`) to get the full diff.
3. For each modified file, read the full file using `read_file` for context.
4. Evaluate against:
   - Correctness: Does the code do what it should?
   - Standards: Does it follow existing code conventions?
   - Security: Are secrets exposed? Are inputs validated?
   - TypeScript: Are types correct? Any `any` overuse?
   - UI: Does it match the VS Code-like design guidelines?
5. Compile findings into a structured review.

## Output Format

- **Summary:** Overall verdict (Approved / Needs Changes / Blocked).
- **Files Reviewed:** List of reviewed files.
- **Findings:**
  - `[file:line]` — Description of issue or praise.
- **Security Check:** Any secrets, hardcoded keys, or vulnerabilities found.
- **NocoDB Records:** Updated if applicable.
- **Blockers:** Critical issues that must be fixed.
- **Next Steps:** Recommended fixes.

## Done Rule

This skill is complete only when all changed files have been reviewed and the review is documented.
