# Logging Policy

## What to Log

- Agent run start/end.
- Task status changes.
- Errors.
- Fallback provider usage.
- Daily progress.
- Weekly summaries.
- Project context updates.
- Blockers.

## Where

- NocoDB tables.
- UI logs page.
- Markdown only for long-term context summaries.

## Do Not Log

- API tokens.
- Secret env values.
- Private keys.
