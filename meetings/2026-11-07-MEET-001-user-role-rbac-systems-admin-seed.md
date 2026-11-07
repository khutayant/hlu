# Meeting: User-role RBAC, systems, ADMIN seed

- **Id:** MEET-001
- **Date:** 2026-11-07
- **Attendees:** draungminoo
- **Status:** tracked; implemented this session
- **Note:** **NOTE-001**
- **Tickets:** **TICK-012** done · **TICK-013** done · **TICK-014** done · **TICK-015** done
- **Later:** Day-1 board backfill → **MEET-002** / **NOTE-002** (**TICK-001**–**011** + renumber)
- **Context:** Track-changes for HLU Work role detail (users/permissions/systems) and server seed order for ADMIN.

## Notes

### Product / UI

- Role detail sections: Users, Permissions, Systems (`modules` route; label စနစ်များ / Systems).
- Permissions: description ellipsis + Ant Design **Popover** (not Tooltip); dialog footer fixed; table-only vertical scroll; checkbox + name sticky left; search/footer normal size, table small.
- Menu panel and main content scroll independently.

### Server / seed

- `UserRoleModuleMapping`; APIs mirror permissions.
- Module seed includes wildcard `ALL_SYSTEM`.
- User-role seed: **ADMIN** only.
- Permission seed (routes + `PERM_ALL_MANAGE`) then **seed-admin** relationships: ADMIN → ALL_SYSTEM + PERM_ALL_MANAGE.
- Data seeder upsert: accept `UNIQUE (code, "deletedToken")` from Postgres (quoted camelCase).

### Process

- **Track changes** = update/create **tickets** + **meetings** + **notes** under HLU `tickets/` / `discussions/` — not Notion.
- New empty repos added to workspace; branches must be `ticket` and `discussion`.

## Decisions

| # | Decision | Lock |
| --- | --- | --- |
| D1 | Permission `description` is human text only (strip/stop `APIs:` suffix). | preferred |
| D2 | Systems UX mirrors permissions (batch ≤20, candidates, soft-deactivate mapping). | preferred |
| D3 | ADMIN relationships seed only after module + role + permission seeds succeed. | preferred |
| D4 | Track changes uses local markdown boards (`tickets` / `discussions`), not Notion. | preferred |
| D5 | `tickets/` branch = `ticket`; `discussions/` branch = `discussion`; same GitHub remote as other HLU apps. | preferred |

## Action items

| Item | Owner | Ticket |
| --- | --- | --- |
| Wire git-push for ticket/discussion branches if needed | — | follow-up |
| Confirm ADMIN seed on next server restart | draungminoo | **TICK-014** |
