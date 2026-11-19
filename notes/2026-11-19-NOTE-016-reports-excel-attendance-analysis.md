# Discussion: Reports Excel, allowance gates, attendance-2, analysis

- **Id:** NOTE-016
- **Date:** 2026-11-19
- **Meeting:** **MEET-012**
- **Status:** tracked; **TICK-033**–**TICK-037** done
- **Tickets:** **TICK-033**, **TICK-034**, **TICK-035**, **TICK-036**, **TICK-037**
- **Context:** After **MEET-011** / **NOTE-015**. Excel downloads, allowance sequence, allowance township gate, local attendance-2 CSV, meeting attendance analysis UI.

## Notes

- **Excel:** meta title merges full width (content-fit height); other meta + table headers height **22**; data rows **28**. Label|value meta merges; no meta borders; no gridlines; no medium group borders. Logo 1.5″ TR at column L. Allowance sign-off three columns with label|value. Confirm before download.
- **English inside report:** titles, columns, gender labels, sign-off use `translateEn`; tabs/filters/toasts stay on app locale.
- **Allowance sequenceNo:** master field + UI; report/Excel columns ordered by sequence; Total Amount bold.
- **Allowance township gate:** no rows / no Excel / no sign-off until township selected. Attendance report still empty = all.
- **attendance-2.csv:** rematched to employee-focal/ho; aliases + user fixes (Y018 Julia, drop Sandar Lin dup blank, P042 Than Than Htay, Ei→P044 without editing data.csv Daw Ei).
- **Attendance analysis:** menu `attendance-analysis`; township multi-filter; **active only**.

## Decisions

| # | Decision |
| --- | --- |
| D44 | Meeting reports Excel uses ExcelJS with agreed merges, 1.5″ HLU logo at column L, fixed header height 22 (except title), English report copy, confirm-before-download. |
| D45 | Meeting allowances ordered by editable `sequenceNo` in UI and reports; Total Amount emphasized. |
| D46 | Allowance report displays data only when at least one township is selected. |
| D47 | Local `attendance-2.csv` focals match employee data with unique aliases; leave ambiguous names blank; missing rows stay on top. |
| D48 | Attendance Analysis dashboard analyses active attendees only, with optional township multi-filter (empty = all). |

## Action items

| Item | Owner | Ticket |
| --- | --- | --- |
| Reports Excel export | draungminoo | **TICK-033** |
| Allowance sequenceNo + order | draungminoo | **TICK-034** |
| Allowance require township | draungminoo | **TICK-035** |
| attendance-2 CSV rematch | draungminoo | **TICK-036** |
| Attendance analysis dashboard | draungminoo | **TICK-037** |
