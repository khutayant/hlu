# Title master

- **Id:** TICK-022
- **Status:** done
- **Repos:** SERVER | WORK
- **Opened:** 2026-11-18
- **Finished:** 2026-11-18
- **Creator:** draungminoo
- **Assignee:** draungminoo
- **Related:** employee-list honorific titles (`local-data/.../title.atomic.csv`); **TICK-023**

## Goal

Add **TitleMaster** for honorifics (`Daw`, `U`, `Dr.`, …): unique `name` + unique `code`, optional `description`.

## Scope

- [x] `TitleMaster` entity (`name` unique, `code` unique `A-Z0-9_`, `description?`)
- [x] CRUD APIs + RBAC subject `title` (list/create/update includes `code`)
- [x] Seed upsert from atomic titles (`res/seed/title-master/honorific-titles.upsert.json`)
- [x] Migration `1794978927154-manual-generated.ts` — add/backfill `code`
- [x] Work UI under Staff → Titles `/staff/title` (create/edit; name column shows code secondary)
- [x] `/masters/title` redirects to `/staff/title`; titles removed from masters sidebar

## Out of scope

- Employee FK / import reseed — **TICK-023**

## Done when

- [x] Admin can list/create/update/activate titles with `code`
- [x] Upsert seed loads Latin honorific titles + codes
- [x] Existing rows backfilled via migration
