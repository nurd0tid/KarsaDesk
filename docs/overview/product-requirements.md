# Product Requirements Document

## Product Name

VibeForge

## Problem

Developer yang menggunakan AI coding agent sering menghadapi masalah:

- Task tersebar di chat, kanban, docs, dan IDE.
- AI sering lupa context.
- AI sering hanya membuat report, tidak menyimpan progress.
- Planning tidak otomatis menjadi task.
- Task besar tidak dibagi per hari.
- Project context tidak terupdate.
- Provider AI berbeda-beda dan workflow tidak konsisten.
- User tetap harus membuka VS Code, terminal, dan tools lain.

## Solution

VibeForge menyediakan satu workspace berbasis web untuk:

- Project management
- AI planning
- Schedule breakdown
- Kanban tasks
- Web IDE
- AI agent execution
- Logs
- Project context
- Provider management

## Core Users

- Solo developer
- AI-assisted developer
- Team lead
- Product builder
- Internal dev team
- Open-source maintainer

## Core Modules

### Dashboard

Overview project, task aktif, today plan, blocker, recent logs, provider status.

### Projects

Kelola project, repository, stack, context docs, active workspace.

### Planner

AI memecah objective besar menjadi planning.

### Schedule

Breakdown planning menjadi beberapa hari.

### Kanban

Task board untuk backlog, todo, in progress, review, testing, done, blocked.

### Workspace

Web IDE seperti VS Code.

### AI Agents

Agent planner, coder, reviewer, tester, devops, documentation.

### AI Providers

Connect provider seperti OpenAI, OpenRouter, OpenCode, Zen, Ollama, vLLM, OpenAI Compatible.

### Logs

Daily logs, weekly logs, agent runs, agent logs, decision logs.

### Docs

Project context, architecture, frontend, backend, database, UI/UX, API, deployment.

## MVP Scope

- App shell
- Branding VibeForge
- Projects CRUD with NocoDB
- Tasks Kanban with NocoDB
- Planner UI
- Schedule UI
- Workspace IDE shell
- Provider settings UI
- Logs UI
- NocoDB client
- AI rules and docs

## Out of Scope for First MVP

- Full remote code execution
- Full local file bridge
- Multi-user auth
- Billing
- Marketplace
- Advanced permission system

These can be planned after MVP.
