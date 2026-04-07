# Backend

`backend/` is the active standalone API service for Fons.

Responsibilities:

- Express HTTP API
- Prisma schema, migrations, and seed ownership
- PostgreSQL access
- admin auth/session verification
- booking, calendar, customer, and squad business logic
- request validation and error handling

Core structure:

```text
backend/
|-- prisma/
|   |-- migrations/
|   |-- schema.prisma
|   `-- seed.ts
|-- src/
|   |-- config/
|   |-- controllers/
|   |-- middleware/
|   |-- routes/
|   |-- services/
|   `-- utils/
|-- Dockerfile
`-- package.json
```

Key scripts:

```bash
npm run --workspace backend dev
npm run --workspace backend build
npm run --workspace backend prisma:generate
npm run --workspace backend prisma:migrate
npm run --workspace backend prisma:deploy
npm run --workspace backend prisma:seed
npm run --workspace backend db:seed:dev
```

Key env vars:

- `PORT`
- `NODE_ENV`
- `DATABASE_URL`
- `CORS_ORIGIN`
- `ADMIN_SESSION_SECRET`
- `LOG_LEVEL`
- `TRUST_PROXY`
- `REQUEST_BODY_LIMIT`
- `RUN_DB_MIGRATIONS`

Route groups:

- Public:
  - `/health`
  - `/api/public/*`
- Protected admin:
  - `/api/admin/auth/*`
  - `/api/admin/bookings*`
  - `/api/admin/calendar`
  - `/api/admin/customers*`
  - `/api/admin/squads*`
  - `/api/admin/service-types`

Protection notes:

- admin routes are guarded in backend middleware
- browser clients authenticate through the `fons_admin_token` cookie
- frontend server-side helpers may still forward the token as a bearer header for SSR calls
- login attempts are rate limited in backend memory
- public booking, availability, and reverse-geocode endpoints are rate limited separately

Operational notes:

- `RUN_DB_MIGRATIONS=true` lets the container apply `prisma migrate deploy` on startup
- production should inject a strong `ADMIN_SESSION_SECRET`
- dummy seed data is never run automatically on startup
- `npm run prisma:seed` or `npm run db:seed:dev` can create local dummy admin accounts outside production only when `ALLOW_DEFAULT_DEV_ADMIN_SEED=true`
- fallback dev-seed accounts now receive one-time random passwords that are printed once during the seed run
- `ALLOW_DEFAULT_DEV_ADMIN_SEED=true` enables that fallback for local Docker and non-production local runs
- request logging is enabled with request id, method, path, status, and duration

Error contract:

```json
{
  "ok": false,
  "error": {
    "category": "validation | conflict | rate_limit | security | system",
    "code": "machine_readable_code",
    "message": "Human readable message"
  }
}
```

Frontend should consume this service over HTTP. No Prisma/db access should remain active in `frontend/`.

Backup / restore:

```bash
docker compose exec postgres pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" > backups/fons_backup.sql
cat backups/fons_backup.sql | docker compose exec -T postgres psql -U "$POSTGRES_USER" "$POSTGRES_DB"
```
