# Security Standard

## Env

- `.env.local` may be read by agent.
- `.env.local` must not be committed.
- `.env.example` uses placeholders.

## Secrets

Never expose secrets in:

- README
- markdown docs
- logs
- screenshots
- commit messages
- browser bundles
- NocoDB plain records

## NEXT_PUBLIC

Only non-secret values may use `NEXT_PUBLIC_`.

## Token Rotation

If token is exposed publicly, rotate it.
