# HLU Server

NestJS 12 API for Heartland Union.

## Setup

```bash
cp .env-mock .env
# edit .env database credentials
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

Default port: **3300** (`PORT` in `.env`).

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

Entities live in `src/entities/`. Migration files go under `migrations/`.

## Scripts

```bash
npm run start:dev
npm run build
npm run beautify
npm run lint
npm test
```
