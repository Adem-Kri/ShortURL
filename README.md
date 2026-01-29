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

## Notes (Windows + Prisma)

If you see `EPERM: operation not permitted, rename ... query_engine-windows.dll.node`, a Node process is locking Prisma’s engine.

- Stop `npm run dev` (and any other Node processes)
- Re-run: `npx prisma generate`

## Deploy notes

- SQLite works well for local/demo use. For real production, consider moving rate limiting to Redis (Upstash) and the DB to Postgres.
- If you deploy behind a proxy, set `TRUST_PROXY=1` and ensure `x-forwarded-proto`/`x-forwarded-host` are correct.
