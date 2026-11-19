# Meeting: Module gates, profile roles, analysis download

- **Id:** MEET-013
- **Date:** 2026-11-19
- **Attendees:** draungminoo
- **Status:** tracked
- **Note:** **NOTE-017**
- **Tickets:** **TICK-038**, **TICK-039**, **TICK-040**, **TICK-041**
- **Context:** Follow-on after **MEET-012** / **TICK-037**. Position-table download, system module gates for Meeting and Masters, profile assigned roles + sidebar align.

## Notes

- Attendance analysis **ရာထူးအလိုက်** table downloadable as Excel (client XLSX; filter-aware).
- New system modules: `MEETING_AND_ATTENDANCE_MANAGEMENT_SYSTEM`, `MASTER_MANAGEMENT_SYSTEM` (seed + UI ModuleGate / tile / sidebar). Admin with `ALL_SYSTEM` still sees all.
- Profile lists RBAC roles via `GET /user-role/me/roles`. Keep original profile card layout; sticky `top: 120` removed (was offsetting menu vertically).

## Decisions

| # | Decision | Lock |
| --- | --- | --- |
| D49 | See **NOTE-017** (position breakdown download). | preferred |
| D50 | See **NOTE-017** (meeting system module gate). | preferred |
| D51 | See **NOTE-017** (profile roles + top-aligned card menu). | preferred |
| D52 | See **NOTE-017** (master system module gate). | preferred |

## Action items

| Item | Owner | Ticket |
| --- | --- | --- |
| Implement D49–D52 | draungminoo | **TICK-038**–**TICK-041** |
