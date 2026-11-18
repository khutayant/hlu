# Discussion: Project master

- **Id:** NOTE-008
- **Date:** 2026-11-18
- **Meeting:**
- **Status:** tracked; **TICK-021** done
- **Tickets:** **TICK-021**
- **Context:** Projects area under Masters (Projects / Batches / Doses). Renamed from an early “program” draft — use **project** only.

## Notes

- `ProjectMaster`: `name`, `projectNo` (`PJ` + `YYYY` + 4 digits), optional `description`.
- `projectNo` via `GenCodeService` + `CODE_STRUCTURE.projectNo`; immutable after create.
- Server CRUD `/v1/project`; RBAC subject `project`.
- Work UI: Masters → Projects → Projects panel; Batches/Doses still placeholders.
- Sessions masters page removed from Work UI (entity/table can remain until a later cleanup).
- No migration in this ticket — apply `project_master` SQL from **TICK-021** manually.

## Decisions

| # | Decision |
| --- | --- |
| D25 | Domain name is **Project** (not Program). Number format `PJ[YYYY][4 digits]` (e.g. `PJ20260001`), auto-assigned on create. |
| D26 | Batches and Doses stay placeholders until their masters are scoped. |
| D27 | Remove Sessions from Masters sidebar/routes for now. |

## Action items

| Item | Owner | Ticket |
| --- | --- | --- |
| Project entity, APIs, UI; remove Sessions page | draungminoo | **TICK-021** |
