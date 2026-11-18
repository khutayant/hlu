# Discussion: Country and Township created-by / updated-by

- **Id:** NOTE-011
- **Date:** 2026-11-18
- **Meeting:** **MEET-007**
- **Status:** tracked; **TICK-024** done
- **Tickets:** **TICK-024** (follows **TICK-020**)
- **Context:** Location masters at `/masters/location/country` and `/masters/location/township`. User asked to add created by and updated by, with name and date, on both tables.

## Notes

- Country and township lists drop the single Updated datetime column.
- **Created by** and **Updated by** each show the person's name on the first line and the datetime underneath (same cell pattern as project / title / employee).
- Name is `firstName` + `lastName`, or `username` when the full name is empty. Missing actor shows an em dash.
- Server: `CountryService` and `TownshipService` load `UserMaster` for the ids on the page and return `createdBy` / `updatedBy` as `{ id, name }`.
- Labels: EN “Created by” / “Updated by”; MM “ဖန်တီးသူ” / “ပြင်ဆင်သူ”.

## Decisions

| # | Decision |
| --- | --- |
| D34 | Country and township tables show Created by and Updated by as name plus date, not a lone Updated timestamp. |

## Action items

| Item | Owner | Ticket |
| --- | --- | --- |
| API actor names + both location tables | draungminoo | **TICK-024** |
