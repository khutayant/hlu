# Discussion: Country and Township masters

- **Id:** NOTE-006
- **Date:** 2026-11-18
- **Meeting:**
- **Status:** tracked; **TICK-020** done
- **Tickets:** **TICK-020**
- **Context:** Geography masters under Masters. District later between country and township.

## Notes

- `CountryMaster` + `TownshipMaster` (township → `countryId` for now).
- Server CRUD `/v1/country`, `/v1/township`; RBAC subjects `country`, `township`.
- Work UI: `/masters/country`, `/masters/township` (replaces Location placeholder; `/masters/location` redirects).
- Seeds: Myanmar (`MM`) + Magway townships (GN, GS, MYAING, PAUK, SAW, TILIN, YESAGYO) with focal prefixes.
- Employee still uses free-text `townshipName` until a later ticket.
- Follow-up: list **Created by** / **Updated by** (name + date) on country and township — **TICK-024**, **NOTE-011**.

## Decisions

| # | Decision |
| --- | --- |
| D23 | Ship country + township only; insert district between them later without requiring employee FK migration yet. |
| D24 | Township scoped under country via `countryId` until `DistrictMaster` exists. |

## Action items

| Item | Owner | Ticket |
| --- | --- | --- |
| Country/Township entities, APIs, UI, seed | draungminoo | **TICK-020** |
