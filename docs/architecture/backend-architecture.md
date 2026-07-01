# Backend Architecture

## Overview
VibeForge's backend runs inside Next.js API Route Handlers (App Router). There is no separate backend server — all server-side logic executes in Next.js server functions.

## API Conventions
- **Route Structure:** `src/app/api/<resource>/route.ts` for collections, `src/app/api/<resource>/[id]/route.ts` for individual records.
- **Standard Response:** `{ ok: true, data: ... }` or `{ ok: false, error: { code, message } }`.
- **NocoDB Integration:** All NocoDB calls use column **Title** keys (not `column_name`). When reading records, always check both `record.field_name` and `record['Field Name']`.

## Key API Endpoints
| Route | Method | Purpose |
|---|---|---|
| `/api/projects` | GET, POST | List/create projects |
| `/api/projects/[id]` | GET, PATCH, DELETE | Single project operations |
| `/api/tasks` | GET, POST | List/create tasks |
| `/api/schedules` | GET, POST | List/create schedule items |
| `/api/workspace/tree` | GET | Read project file tree |
| `/api/workspace/file` | GET, PUT | Read/write individual files |
| `/api/workspace/browse` | GET | Browse directories for folder picker |
| `/api/workspace/validate-path` | POST | Validate local project path |
| `/api/git/info` | GET | Get git status, branch, and remote info |
| `/api/docs` | GET | Serve project documentation files |
| `/api/providers` | GET, POST | Manage AI provider configurations |

## File System Access
- File system operations use Node.js `fs/promises` and `path` modules.
- Path traversal prevention: All paths are resolved against a whitelist of project directories or the configured `VIBEFORGE_WORKSPACE_ROOT`.
- Sensitive files (`.env`, `.env.local`) are excluded from tree listings by default.

## NocoDB Integration
- **Connection:** REST API v1 via `NOCODB_BASE_URL` and `NOCODB_API_TOKEN` environment variables.
- **Tables:** Projects, Tasks, TaskPlans, Schedules, DailyLogs, WeeklyLogs, AgentRuns, AgentLogs, Providers, Skills, Decisions, Blockers, ProjectContextUpdates.
- **Error Handling:** Graceful handling of NocoDB errors (not configured, invalid token, table not found, network error).

## Git Operations
- Uses `child_process.exec` to run `git` commands safely on project directories.
- Supports: `git status`, `git branch`, `git remote`, `git diff`, `git log`.
- Results are parsed and returned as structured JSON responses.
