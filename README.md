# HLU Server

NestJS 12 API for Heartland Union.

## Setup

```bash
cp .env-mock .env
# edit .env (set DATABASE_URL)
npm install
npm run start:dev
```

## Endpoints

| Path | Description |
|------|-------------|
| `/` | Redirect to UI |
| `/ui/hlu` (+ SPA) | Packaged UI static files |
| `/health` | Liveness `{ status: "ok" }` |
| `/api/hlu/ping` | `{ status: "pong", timestamp }` |
| `/api/hlu/version` | App version info |
| `POST /api/hlu/v1/auth/login` | Keycloak login (`username` + `password`) |
| `POST /api/hlu/v1/auth/refresh` | Refresh tokens |
| `POST /api/hlu/v1/auth/logout` | Invalidate refresh token |
| `GET /api/hlu/v1/auth/me` | Current user (Bearer token) |

Default port: **3300** (`PORT` in `.env`).

## Auth (Keycloak)

Local Keycloak is expected at `http://localhost:3100` (admin / admin).

```bash
npm run keycloak:setup   # creates realm hlu, client hlu-server, user test/test
```

Env vars: `KEYCLOAK_URL`, `KEYCLOAK_REALM`, `KEYCLOAK_CLIENT_ID`, `KEYCLOAK_CLIENT_SECRET`.

Entities live under `libs/entity/src/` (`bases/`, `enums/`, `entities/`).

## Migrations (normal DB)

```bash
npm run migration:ts:create     # empty migration
npm run migration:ts:generate   # from entities
npm run migration:ts:run
npm run migration:ts:revert
npm run migration:ts:show
npm run migration:ts:auto       # generate + run
npm run migration:run           # run compiled migrations from dist/
```

Entities live in `libs/entity/src/`. Migration files go under `migrations/`.

## Scripts

```bash
npm run start:dev
npm run build
npm run deploy          # build + migration:run + start:prod (skips start on Vercel)
npm run start:prod      # node dist/src/main.js
npm run beautify
npm run lint
npm test
```

### Vercel

1. Set **Root Directory** to `hlu-server` (or the server branch checkout).
2. Set env vars in the project (at least `DATABASE_URL`, plus `ALLOW_ORIGINS`, etc.) — there is no `.env` file on Vercel.
3. Build Command: `npm run deploy` (or leave Nest’s default build if you run migrations separately).
4. Do not set a Start Command; Nest runs as a Vercel Function from `src/main.ts`.
