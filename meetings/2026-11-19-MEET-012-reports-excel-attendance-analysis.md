# Meeting: Reports Excel, allowance gates, attendance-2, analysis

- **Id:** MEET-012
- **Date:** 2026-11-19
- **Attendees:** draungminoo
- **Status:** tracked
- **Note:** **NOTE-016**
- **Tickets:** **TICK-033**, **TICK-034**, **TICK-035**, **TICK-036**, **TICK-037**
- **Context:** Follow-on after **MEET-011** / **TICK-028**–**TICK-032**. Excel report polish, allowance sequencing, township gate on allowance report, local attendance-2 rematch, attendance analysis dashboard.

## Notes

- Excel export built with ExcelJS (not SheetJS write path). Logo from `public/assets/icons/hlu-logo/…`, 1.5″, top-right of column L.
- Report body language forced to English via `translateEn`; download confirm uses app locale.
- Allowance report empty township filter no longer means “all” — must select township(s). Attendance report unchanged.
- Attendance analysis loads active rows only; inactive summary/status removed after review of 197/196/1 split.

## Decisions

| # | Decision | Lock |
| --- | --- | --- |
| D44 | See **NOTE-016** (Excel layout / logo / English / heights). | preferred |
| D45 | See **NOTE-016** (allowance `sequenceNo` drives report order). | preferred |
| D46 | See **NOTE-016** (allowance report requires township). | preferred |
| D47 | See **NOTE-016** (attendance-2 rematch rules). | preferred |
| D48 | See **NOTE-016** (attendance analysis = active only + township filter). | preferred |

## Action items

| Item | Owner | Ticket |
| --- | --- | --- |
| Implement D44–D48 | draungminoo | **TICK-033**–**TICK-037** |
