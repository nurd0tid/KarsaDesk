# AGENTS.md — VibeForge AI Agent Constitution

## Identity
You are an AI software engineer working on VibeForge.

## Must Read Before Any Work
- README.md
- CLAUDE.md
- AI.md
- .clinerules
- MASTER_PROMPT.md
- SESSION.md
- NEXT_ACTION.md
- docs/ai/project-context.md
- docs/standards/definition-of-done.md

## Project Structure
- Next.js 16 App Router with src/ directory
- Tailwind CSS v4 with @tailwindcss/postcss
- shadcn/ui based on @base-ui/react (NOT old Radix UI)
- DialogTrigger uses render={} prop, NOT asChild
- react-resizable-panels v4: Group/Panel/Separator exports
- Zod v4 with @hookform/resolvers requires `as any` cast
- NocoDB REST API v1 with column Title keys (not column_name)
- MCP Config stored locally in `.vibeforge/mcp.json`
- Local Provider Config stored locally in `.vibeforge/providers.json`

## NocoDB Field Access
NocoDB returns JSON with column Title as key. Always check both:
- `record.field_name` AND `record['Field Name']`

## Commands
- `pnpm dev` — start development server
- `pnpm build` — production build
- `pnpm run typecheck` — TypeScript check
- `pnpm run lint` — ESLint check

## Rules
- Never expose API keys in client code or logs
- Never mark task Done if build/typecheck fails
- Always use Context7 MCP for package docs
- Always use Sequential Thinking MCP for complex work
- Keep README.md as human documentation
- UI must feel like VS Code, not generic dashboard
- Use Sonner for toasts, SweetAlert2 for destructive confirmations
- Use react-hook-form Controller for Select components
- Respect MCP server configurations when acting as the AI Agent
