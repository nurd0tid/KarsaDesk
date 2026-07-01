# System Architecture

## Overview
VibeForge is an open-source, local-first AI coding agent platform tailored for Next.js 16, using Tailwind CSS v4 and an integrated NocoDB backend as the primary knowledge and task tracking engine.

## Core Stack
- **Frontend/Backend:** Next.js 16 (App Router)
- **Styling:** Tailwind CSS v4 with PostCSS
- **Component Library:** shadcn/ui powered by `@base-ui/react` (replacing legacy Radix UI)
- **State Management:** Zustand (UI & Workspace), TanStack React Query v5 (Server State)
- **Icons:** Lucide React
- **Validation:** Zod v4 (with `as any` casting for react-hook-form resolvers due to typings)
- **Editor:** Monaco Editor (`@monaco-editor/react`)
- **Panels:** `react-resizable-panels` v4

## Local-First Philosophy
- **User Environment:** VibeForge runs entirely on the user's local machine via Node.js/Next.js.
- **Provider Connection:** API keys (OpenAI, Anthropic, Gemini, etc.) are managed locally via direct input or environment variables. No proxy server is used.
- **File System:** Workspace interactions directly read and manipulate the user's local git repositories using Node.js `fs` APIs.
- **Database:** Uses a local or user-provided NocoDB instance for Tasks, Projects, Logs, and Plans.

## Architecture Layers
1. **Presentation Layer (App Router):** Renders UI pages and layouts.
2. **Feature Modules (`src/features/`):** Encapsulated domains (projects, tasks, schedules, etc.) containing hooks and components.
3. **Workspace Core (`src/stores/workspace.store.ts`):** Manages file tree, editor states, terminal outputs, and AI interaction history.
4. **API Routes (`src/app/api/`):** Next.js API handlers bridging the React frontend with the local file system (Node `fs`, `child_process`) and NocoDB REST endpoints.
5. **NocoDB:** The source of truth for planning, scheduling, and logging. Data is accessed via REST API v1 using standard column Title keys.

## Data Flow
- **UI to Next.js API:** React Query fetches/mutates data.
- **Next.js API to File System:** Reads directories, parses git status, modifies files.
- **Next.js API to NocoDB:** Syncs tasks, records agent runs, retrieves context.
- **Next.js API to AI Providers:** Sends prompts, tools, and context to LLMs directly from the backend.
