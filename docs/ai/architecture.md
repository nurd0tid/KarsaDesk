# Architecture

The Next.js application renders the project rail, board, task composer, session workspace, terminal, changes, reviews, and settings. It communicates with a loopback-only Fastify orchestrator using JSON APIs and a WebSocket event stream.

The orchestrator owns filesystem access, Git worktrees, OpenCode servers, PTYs, SQLite runtime state, NocoDB synchronization, and process cleanup. Shared Zod contracts are published by `@vk/contracts`.

Structured entities are written locally first and placed in a sync outbox. NocoDB is the portable source of truth when connected. Local paths and high-volume artifacts never enter the outbox.

OpenCode servers run per kanban session in its managed worktree. Provider and model data is requested from OpenCode itself so project-level config and authenticated providers remain authoritative.
