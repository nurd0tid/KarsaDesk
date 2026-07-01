# NocoDB Setup

## Environment

Use `.env.local`:

```env
NOCODB_BASE_URL=https://app.nocodb.com
NOCODB_WORKSPACE_ID=your_workspace_id
NOCODB_BASE_ID=your_base_id
NOCODB_API_TOKEN=your_nocodb_api_token
```

Actual secret values must not be committed.

## User Supplied Setup

The user has a NocoDB workspace and base configured.

Agent may read `.env.local` directly during development to access actual credentials.

Never print the token.

## Setup Steps

1. Create NocoDB base.
2. Create tables listed in `nocodb-schema.md`.
3. Create API token.
4. Add values to `.env.local`.
5. Test connection from server-side route.
6. Build NocoDB client wrapper.
7. Validate CRUD for projects and tasks first.
