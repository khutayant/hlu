# Meeting: HO employees, reports filters, PATCH-only, list filters

- **Id:** MEET-011
- **Date:** 2026-11-19
- **Attendees:** draungminoo
- **Status:** tracked
- **Note:** **NOTE-015**
- **Tickets:** **TICK-028**, **TICK-029**, **TICK-030**, **TICK-031**, **TICK-032**
- **Context:** Work after **MEET-010** / **TICK-027** — head office, import normalize, report filters, HTTP method policy, employee list filter.

## Notes

- Confirmed attendance import clears successful rows and keeps errors only.
- Token `"exp"` DEBUG is the first 401 before silent refresh; PUT CORS blocked updates until routes moved to PATCH and PUT was banned.
- Report township filter started as a common header, then moved to per-tab independent multi-select with full chips.

## Decisions

| # | Decision | Lock |
| --- | --- | --- |
| D39 | See **NOTE-015** (HO optional township + `HO` focal prefix). | preferred |
| D40 | See **NOTE-015** (attendance focal strip whitespace + uppercase). | preferred |
| D41 | See **NOTE-015** (per-tab report township multi-filter). | preferred |
| D42 | See **NOTE-015** (no PUT; PATCH-only updates). | preferred |
| D43 | See **NOTE-015** (employee list No Township). | preferred |

## Action items

| Item | Owner | Ticket |
| --- | --- | --- |
| Implement D39–D43 | draungminoo | **TICK-028**–**TICK-032** |
