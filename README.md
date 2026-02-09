# PDS ShortURL

Minimal-but-solid URL shortener built with Next.js (App Router) + Prisma + SQLite.

## Features

- Create short links (random code or custom alias)
- Redirect `/<code>` with click tracking (`clickCount`, `lastClickedAt`)
- `/links` list with instant search, filters, sort, responsive layout
- `/links/[code]` detail page with QR code + edit destination + delete
- Basic rate limiting backed by SQLite (no in-memory state)

## Local setup

1. Install dependencies

```bash
npm install
```

1. Configure environment

Create `.env`:

```bash
DATABASE_URL="file:./dev.db"
```

1. Run migrations (creates/updates SQLite DB)

```bash
npx prisma migrate dev
```

1. Start dev server

```bash
npm run dev
```

Open <http://localhost:3000>

## Environment variables

- `DATABASE_URL` (required)
  - Example: `file:./dev.db`
- `NEXT_PUBLIC_BASE_URL` (optional)
  - Used to generate full short URLs + QR codes in SSR.
  - Example: `https://short.example.com`
- `TRUST_PROXY` (optional)
  - Set to `1` when behind a reverse proxy that sets `x-forwarded-for`.

### Admin login (optional, recommended)

`/links` and link management APIs can be protected behind an admin login.

Set these in `.env`:

- `AUTH_SECRET` (required for admin auth)
  - A long random string used to sign the admin session cookie.
  - Example (PowerShell):
    - `openssl rand -base64 48`
- `ADMIN_EMAIL` (required)
  - Example: `admin@example.com`
- `ADMIN_PASSWORD` (required)
  - Plaintext password (intended for local/dev only).
  - Example: `00000000`

Notes:

- Link creation (`POST /api/links`) stays public.
- Management pages (`/links`, `/links/[code]`) redirect to `/admin/login` when not authenticated.
- The debug DB endpoint (`/api/_debug/db`) is disabled in production and requires admin auth in dev.

## Notes (Windows + Prisma)

If you see `EPERM: operation not permitted, rename ... query_engine-windows.dll.node`, a Node process is locking Prisma’s engine.

- Stop `npm run dev` (and any other Node processes)
- Re-run: `npx prisma generate`

## Deploy notes

- SQLite works well for local/demo use. For real production, consider moving rate limiting to Redis (Upstash) and the DB to Postgres.
- If you deploy behind a proxy, set `TRUST_PROXY=1` and ensure `x-forwarded-proto`/`x-forwarded-host` are correct.
