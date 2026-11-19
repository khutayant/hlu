# Discussion: Reports summary, name hover, position category chips

- **Id:** NOTE-021
- **Date:** 2026-11-19
- **Meeting:** **MEET-017**
- **Status:** tracked; **TICK-049**–**TICK-051** done
- **Tickets:** **TICK-049**, **TICK-050**, **TICK-051**
- **Context:** After **MEET-016** / **NOTE-020**.

## Notes

- **Name hover:** Attendance + allowance report name cells use a hover popover (employee no., focal, gender, township, position, experience). Excel unchanged.
- **Summary tab:** Last tab. Table 1 gender by township; Table 2 position × township. Requires `summaryTownships`; optional `summaryAddHeadOffice=1`. HO-position employees in Table 2 group as hardcoded **Program and Supporting**. Each table has ⋮ → Download Excel / Copy table.
- **Positions UI:** Category column shows name-only Tag (blue HO / green field).

## Decisions

| # | Decision |
| --- | --- |
| D61 | Report name cells show employee detail on hover (UI only). |
| D62 | Reports include a summary tab with tables 1–2, township/HO filters, and per-table download/copy; HO positions roll up to Program and Supporting. |
| D63 | Staff Positions category column is name-only colored chips. |

## Action items

| Item | Owner | Ticket |
| --- | --- | --- |
| Report name hover | draungminoo | **TICK-049** |
| Reports summary tab | draungminoo | **TICK-050** |
| Position category chips | draungminoo | **TICK-051** |
