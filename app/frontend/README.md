# Frontend

`frontend/` owns only UI, rendering, and HTTP integration.

Responsibilities:

- Next.js app router pages and layouts
- admin/public presentation logic
- client-safe API calls through `src/lib/api-client.ts`
- server-side page helpers that call backend HTTP

Not owned here anymore:

- Prisma schema
- migrations
- seed logic
- DB access
- backend business logic

Key env vars:

- `NEXT_PUBLIC_API_BASE_URL`
- `INTERNAL_API_BASE_URL`

Operational notes:

- frontend expects the backend API to be available
- browser-side requests use `NEXT_PUBLIC_API_BASE_URL`
- server-side page requests use `INTERNAL_API_BASE_URL`
- frontend does not own migrations, seeds, or DB access

The frontend should talk to the backend API. It should not import Prisma or database utilities.
