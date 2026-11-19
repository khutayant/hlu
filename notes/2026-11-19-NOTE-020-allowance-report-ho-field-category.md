# Discussion: Allowance report URL/HO add + field office category

- **Id:** NOTE-020
- **Date:** 2026-11-19
- **Meeting:** **MEET-016**
- **Status:** tracked; **TICK-047**–**TICK-048** done
- **Tickets:** **TICK-047**, **TICK-048**
- **Context:** After **MEET-015** / **NOTE-019**. Report UX persistence; include HO by position category; field vs head office categories.

## Notes

- **URL filters:** `attendanceTownships` / `allowanceTownships` (comma-separated UUIDs + `__none__` for no township). Allowance also `addHeadOffice=1`.
- **Add head office:** Checkbox on allowance report. Loads positions with category code `HEAD_OFFICE_POSITION`, then active employees on those positions; merges into table (and Excel) without duplicating attendees already present. `excludeHeadOffice` lines still zero HO-position people (and no-township).
- **Seed:** `FIELD_OFFICE_POSITION` under `POSITION_CATEGORIES` = non–head-office / field positions. Re-run category seed to apply.

## Decisions

| # | Decision |
| --- | --- |
| D58 | Report township selections are stored in the URL per tab. |
| D59 | Allowance report may add all employees in head-office positions via checkbox. |
| D60 | Position categories include `FIELD_OFFICE_POSITION` for non-HO roles. |

## Action items

| Item | Owner | Ticket |
| --- | --- | --- |
| Township URL + add HO | draungminoo | **TICK-047** |
| FIELD_OFFICE_POSITION seed | draungminoo | **TICK-048** |
