# Coding Standard

## TypeScript

- Use strict typing.
- Avoid `any`.
- Use Zod for runtime validation.
- Keep types in feature modules.

## Components

- Small components.
- Reusable UI primitives.
- Feature-specific components in feature folders.

## Data

- Use TanStack Query for server state.
- Use Zustand/Jotai for UI state.
- Use NocoDB wrapper.

## Errors

- Catch API errors.
- Show user-friendly error.
- Log agent errors when relevant.

## Naming

- PascalCase for components.
- camelCase for variables/functions.
- kebab-case for routes/files when appropriate.
