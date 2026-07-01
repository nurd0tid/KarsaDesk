# AI Project Context

## App

VibeForge

## Purpose

AI Coding Workspace that combines Kanban, Planner, Schedule, Web IDE, AI Agent, Logs, and Project Context.

## Branding

VibeForge only. KarsaDesk fully removed.

## Current Architecture

Next.js 16 App Router + Tailwind CSS v4 + shadcn/ui (base-ui/react-based v4) + Zustand + TanStack Query + NocoDB REST API.

## Important Architecture Notes

- shadcn/ui components use `@base-ui/react` NOT the older Radix UI.
- `DialogTrigger` from @base-ui/react does NOT support `asChild`.
- `react-resizable-panels` v4: exports are `Group`, `Panel`, `Separator` (not `PanelGroup`, `PanelResizeHandle`).
- NocoDB: all access is server-side (API routes). Secrets never in client bundle.
- NocoDB returns JSON with column **Title** as key (e.g. `record['Field Name']`), not `column_name`. Always use `getField(rec, 'field_name', 'Field Name')` helper.
- Monaco Editor: `@monaco-editor/react` used with `dynamic` import in workspace page.

## Provider Local Config

- AI provider API keys and settings are stored locally in `.vibeforge/providers.json`.
- Provider records (name, type, base URL, default model) live in NocoDB.
- API key resolution: `resolveApiKey(providerId, mode, envName, directKey)` from `src/lib/local-config.ts`.
- Modes: `env` (from process.env), `direct` (stored in local JSON), `none` (no key needed, e.g. Ollama).

## MCP Support

- MCP server configurations stored in `.vibeforge/mcp.json`.
- API routes: `GET/POST/DELETE /api/mcp` manage servers.
- Settings page (`/settings`) has a UI to add, remove, enable/disable MCP servers.
- The agent loop (`/api/ai/chat/route.ts`) reads enabled MCP servers and lists them in the system prompt.

## Agent Loop

- `/api/ai/chat/route.ts` implements a server-side agentic loop (up to 10 iterations).
- SSE stream events: `thought`, `tool_call`, `tool_result`, `content`, `done`.
- Tools available: `list_directory`, `read_file`, `edit_file`, `run_command`.
- Agent state (`isAgentRunning`, `agentStatusText`) is stored in Zustand so it persists across tab switches.

## Chat Session Management

- Sessions auto-save on first user message.
- `saveChatSession()` in `workspace.store.ts` creates or updates a persisted session.
- `/new`, `/sessions`, `/clear` commands available in the AI input.
- `@skill` triggers skill-specific prompts; `#file` triggers file search.

## Folder Structure

```
src/
├── app/
│   ├── layout.tsx                  ← root layout (ThemeProvider, QueryProvider, Toaster)
│   ├── (app)/
│   │   ├── layout.tsx              ← app shell (Sidebar, main, StatusBar, CommandPalette)
│   │   ├── dashboard/page.tsx
│   │   ├── projects/page.tsx       ← CRUD projects, SweetAlert2 delete
│   │   ├── tasks/page.tsx          ← Kanban board with TaskDrawer sheet
│   │   ├── planner/page.tsx
│   │   ├── schedule/page.tsx
│   │   ├── workspace/page.tsx      ← VS Code-like IDE with Monaco + resizable panels + AI Agent
│   │   ├── agents/page.tsx
│   │   ├── providers/page.tsx      ← CRUD AI providers
│   │   ├── logs/page.tsx           ← daily + weekly logs tabs
│   │   ├── docs/page.tsx
│   │   └── settings/page.tsx       ← General, NocoDB, Workspace, MCP config
│   └── api/
│       ├── projects/route.ts + [id]/route.ts
│       ├── tasks/route.ts + [id]/route.ts
│       ├── providers/route.ts + [id]/route.ts + models/route.ts
│       ├── logs/daily/route.ts + weekly/route.ts
│       ├── ai/chat/route.ts        ← Agent loop with SSE streaming
│       ├── mcp/route.ts            ← MCP server CRUD
│       └── workspace/              ← tree, file, git, terminal APIs
├── components/
│   ├── ui/                         ← shadcn components
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── StatusBar.tsx
│   │   └── CommandPalette.tsx
│   ├── common/
│   │   ├── LoadingState.tsx
│   │   ├── EmptyState.tsx
│   │   └── ErrorState.tsx
│   └── providers/
│       └── QueryProvider.tsx
├── features/
│   ├── projects/hooks.ts
│   └── tasks/
│       ├── hooks.ts
│       └── components/TaskDrawer.tsx
├── lib/
│   ├── nocodb.ts                   ← NocoDB REST client (server-side)
│   ├── nocodb-fields.ts            ← getField / getFieldBool helpers
│   ├── local-config.ts             ← Provider local config + API key resolution
│   ├── query-client.ts
│   └── utils.ts
├── stores/
│   ├── ui.store.ts                 ← Zustand: activeProjectId, taskDrawer state
│   └── workspace.store.ts          ← Zustand: files, AI messages, sessions, agent state
└── types/
    └── index.ts                    ← TypeScript types matching NocoDB schema
```

## Current Status

MVP Phase 2: IN PROGRESS
- Build: passing
- Typecheck: passing
- All pages implemented with loading/empty/error states
- AI Agent loop with tool execution operational
- MCP server configuration supported
- Chat session auto-save on first message
- Agent status persists across tab switches

## Workflow

All work must be stored in NocoDB, not only reported in chat. NocoDB credentials must be configured in `.env.local` first.

## Important Rule

Do not mark task done if blockers remain. Do not expose secrets.
