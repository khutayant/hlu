# Discussion: Module gates, profile roles, analysis download

- **Id:** NOTE-017
- **Date:** 2026-11-19
- **Meeting:** **MEET-013**
- **Status:** tracked; **TICK-038**–**TICK-041** done
- **Tickets:** **TICK-038**, **TICK-039**, **TICK-040**, **TICK-041**
- **Context:** After **MEET-012** / **NOTE-016**. Analysis Excel for by-position; Meeting + Master module gates; profile roles API; profile sidebar align fix.

## Notes

- **Position download:** `SectionCard` extra button → SheetJS `.xlsx` (name / count / % + total). Locales en/mm.
- **Meeting gate:** code `MEETING_AND_ATTENDANCE_MANAGEMENT_SYSTEM`; routes `/meeting*`, home app tile, meeting sidebar.
- **Master gate:** code `MASTER_MANAGEMENT_SYSTEM`; routes `/masters*`, home app tile, masters sidebar.
- **Profile roles:** `listGrantedRoles` / `GET user-role/me/roles`; tags under **Roles**; empty state string.
- **Profile menu align:** original `[sidebar card][content card]` kept; remove sticky/`top: 120` that pushed the menu down (~120px) under layout overflow.

## Decisions

| # | Decision |
| --- | --- |
| D49 | Attendance Analysis by-position table supports Excel download (filter-aware). |
| D50 | Meeting app gated by `MEETING_AND_ATTENDANCE_MANAGEMENT_SYSTEM` (or `ALL_SYSTEM`). |
| D51 | Profile shows all assigned RBAC roles; menu uses original card layout top-aligned (no sticky offset). |
| D52 | Masters app gated by `MASTER_MANAGEMENT_SYSTEM` (or `ALL_SYSTEM`). |

## Action items

| Item | Owner | Ticket |
| --- | --- | --- |
| Position table download | draungminoo | **TICK-038** |
| Meeting module gate | draungminoo | **TICK-039** |
| Profile roles + align | draungminoo | **TICK-040** |
| Master module gate | draungminoo | **TICK-041** |
