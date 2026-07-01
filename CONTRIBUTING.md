# Contributing to VibeForge

Terima kasih ingin berkontribusi ke VibeForge.

## Development Principles

- Jangan membuat UI seperti admin template biasa.
- Jaga pengalaman seperti VS Code.
- Semua fitur utama harus punya loading, empty, error, skeleton, toast, dan confirmation state.
- Gunakan TypeScript secara ketat.
- Gunakan package terbaru yang stabil.
- Jangan commit secret.
- Update dokumentasi ketika mengubah arsitektur, API, database, workflow, atau UI pattern.

## Setup

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

## Pull Request Checklist

- [ ] Build berhasil.
- [ ] Typecheck berhasil.
- [ ] Lint berhasil.
- [ ] Acceptance criteria terpenuhi.
- [ ] UI states lengkap.
- [ ] No secret leaked.
- [ ] Docs diupdate jika perlu.
- [ ] Logs/context diupdate jika task dikerjakan oleh AI agent.
