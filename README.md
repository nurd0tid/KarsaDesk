# VibeForge

VibeForge is a powerful, integrated AI Coding Workspace designed to streamline the software development lifecycle. It brings together Kanban project management, an AI-powered Web IDE, a visual Planner, a Daily Schedule, and seamless integration with NocoDB.

## Features

- **Kanban Board:** Organize tasks visually with a fully-featured Kanban board.
- **AI Agent Workspace:** A VS Code-like Web IDE powered by Monaco Editor, complete with an AI agent (VibeForge AI) that can read files, edit code, and run terminal commands.
- **Project Planner & Schedule:** Plan upcoming features and schedule your daily tasks.
- **NocoDB Integration:** Uses NocoDB (REST API) as the backend database, ensuring your data is structured and easily accessible.
- **MCP (Model Context Protocol) Support:** Configure external MCP servers to extend the AI Agent's tool capabilities.
- **Local Provider Config:** Configure any OpenAI-compatible AI provider locally using `.vibeforge/` config without leaking keys into the database.

## Screenshots

*(Screenshots placeholder - add images of Workspace, Kanban, and Settings here)*

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **UI:** React 19, Tailwind CSS v4, shadcn/ui (powered by `@base-ui/react`)
- **State Management:** Zustand, TanStack Query
- **Editor:** `@monaco-editor/react`
- **Database:** NocoDB
- **Icons:** Lucide React

## Setup Instructions

### 1. Clone the repository
```bash
git clone https://github.com/your-org/vibe-kanban.git
cd vibe-kanban
```

### 2. Install dependencies
```bash
pnpm install
```

### 3. Environment Configuration
Copy the `.env.example` file to create your local environment variables:
```bash
cp .env.example .env.local
```
Fill in the NocoDB credentials (`NOCODB_BASE_URL`, `NOCODB_WORKSPACE_ID`, `NOCODB_BASE_ID`, `NOCODB_API_TOKEN`) in `.env.local`. 

### 4. Database Setup
Create the required NocoDB tables by running the setup script:
```bash
node scripts/setup-nocodb.js
```

### 5. Run the development server
```bash
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

## Configuring AI Providers

1. Navigate to the `/providers` page in the app.
2. Click **Add Provider**.
3. Enter the Provider Name, Base URL, and choose how the API key is provided (e.g., direct or via environment variables).
4. The API key is securely saved in `.vibeforge/providers.json` locally.

## Workspace & Keyboard Shortcuts

- **Ctrl+S / Cmd+S:** Save active file
- **Shift+Enter:** New line in AI chat input
- **@:** Trigger AI skill menu
- **#:** Trigger file search menu
- **/:** Trigger command menu (`/new`, `/sessions`, `/clear`)

## Contributing

We welcome contributions! Please follow the guidelines outlined in the repository to submit PRs, report issues, and improve VibeForge.
