# Frontend Architecture

## Setup
The VibeForge frontend is built on Next.js 16 (App Router) utilizing React 19 features.

## Styling & Theme
- **Tailwind CSS v4:** Uses the latest v4 engine with `@tailwindcss/postcss`. Configuration is done via CSS variables rather than a legacy config file.
- **Dark Mode Support:** Managed via `next-themes` with custom slate/zinc dark variables matching VS Code's editor theme.
- **Font Stack:**
  - UI Font: Geist Sans or Inter.
  - Code/Terminal Font: JetBrains Mono (primary), Geist Mono, Fira Code, monospace fallbacks.

## Components & Base UI
- **shadcn/ui via Base UI:** All interactive primitives are built using `@base-ui/react` (rather than Radix UI).
- **Dialogs & Triggers:** Dialog triggers use the `render={}` render prop pattern instead of `asChild` (e.g., `<DialogTrigger render={<Button>Trigger</Button>} />`).
- **Form Handling:** Uses `react-hook-form` coupled with Zod resolvers.
- **Toasts:** Sonner (`sonner`) is the standard notification helper.
- **Alerts:** SweetAlert2 (`sweetalert2`) handles destructive/sensitive confirmations.
- **Panels:** Resizable layouts use `react-resizable-panels` (v4).

## State Management
1. **Zustand:**
   - `useUiStore` for global UI configurations (active project, sidebar collapse, etc.).
   - `useWorkspaceStore` for managing Monaco Editor workspace states (open tabs, active file, dirty files, AI message history, terminal outputs).
2. **React Query v5:**
   - Cache management for server-driven data (projects list, tasks list, schedules, daily logs).
   - Custom React hooks in `src/features/` encapsulate queries and mutations.

## Page Structure
- **Workspace IDE (`src/app/(app)/workspace/`)**: A flexible horizontal/vertical resizable editor dashboard containing Monaco Editor, file explorer tree, command line output logs, and the AI agent chat pane.
- **Schedule Board (`src/app/(app)/schedule/`)**: Weekly planner (Monday to Sunday) showing real dates, navigation buttons, and scheduled cards matching by scheduled date or falling back to day index.
- **Projects (`src/app/(app)/projects/`)**: Full details page listing workspaces, showing active git details (branch, clean/dirty), validate path checks, and detail sliding sheets.
- **Docs (`src/app/(app)/docs/`)**: Custom Markdown reader showing system documentation in high-contrast prose style.
