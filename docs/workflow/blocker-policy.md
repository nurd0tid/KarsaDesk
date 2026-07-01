# Blocker Policy

## Rule

A task with unresolved blocker cannot be Done.

## Blocker Examples

- Missing dependency.
- Broken build.
- Type error.
- Unknown NocoDB schema.
- Missing env variable.
- Broken provider connection.
- UI not matching acceptance criteria.
- Security issue.
- Old branding remains.
- User requirement unclear but critical.

## Required Action

If blocker exists:

1. Set task status to `blocked`.
2. Create blocker record in NocoDB.
3. Document blocker in daily log.
4. Suggest next safe action.
5. Continue with other unblocked task if possible.

## Never

Never hide blocker.
Never mark Done with blocker.
Never pretend implementation is complete.
