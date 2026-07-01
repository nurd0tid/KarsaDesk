# Implementation Rules

## Full Rebuild

If current app is broken, generic, or still KarsaDesk, rebuild.

## README Separation

README.md is for humans/open-source users.

AI instructions must live in:

- AGENTS.md
- CLAUDE.md
- AI.md
- .clinerules
- docs/ai
- MASTER_PROMPT.md

## Package Docs

Use Context7 before implementing package-specific code.

## Complex Reasoning

Use Sequential Thinking for complex decisions.

## Do Not Skip

- Loading state
- Empty state
- Error state
- Toast
- Confirmation
- NocoDB persistence
- Daily log
- Context update

## No Hardcoded Secrets

Use env.
