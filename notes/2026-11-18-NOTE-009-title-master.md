# Discussion: Title master

- **Id:** NOTE-009
- **Date:** 2026-11-18
- **Meeting:** **MEET-006**
- **Status:** tracked; **TICK-022** done (extended with `code` + staff UI)
- **Tickets:** **TICK-022**, **TICK-023**
- **Context:** Honorific titles for people (`Daw`, `U`, `Dr.`), not job positions.

## Notes

- `TitleMaster`: unique `name`, unique `code` (`A-Z0-9_`), optional `description`.
- Server CRUD `/v1/title`; RBAC subject `title`.
- Seed: `res/seed/title-master/honorific-titles.upsert.json` (codes from `title.atomic.csv`).
- Migration: `migrations/current/1794978927154-manual-generated.ts` backfills `code` by name.
- Work UI: Staff sidebar **Titles** → `/staff/title` (name + secondary code). `/masters/title` redirects.
- Burmese UI label: **ဂုဏ်ပုဒ်**.
- Employee link / reseed: **TICK-023** / **NOTE-010**.

## Decisions

| # | Decision |
| --- | --- |
| D28 | Title = honorific. Job role stays as position elsewhere. |
| D29 | Unique keys: `name` **and** `code`. Seed uses `.upsert.json` on `code`. |
| D30 | Titles live under Staff (above Employees), not Masters menu. |
| D31 | Burmese product term for Title is **ဂုဏ်ပုဒ်**. |

## Action items

| Item | Owner | Ticket |
| --- | --- | --- |
| Title entity, APIs, upsert seed, migration, staff UI | draungminoo | **TICK-022** |
| Employee FK + CSV reseed helpers | draungminoo | **TICK-023** |
