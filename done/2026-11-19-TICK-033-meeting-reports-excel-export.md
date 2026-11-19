# Meeting reports Excel export (ExcelJS)

- **Id:** TICK-033
- **Status:** done
- **Repos:** WORK
- **Opened:** 2026-11-19
- **Finished:** 2026-11-19
- **Creator:** draungminoo
- **Assignee:** draungminoo
- **Related:** **TICK-030**

## Goal

Download Attendance and Allowance reports as styled `.xlsx` files that match the on-screen report layout.

## Scope

- [x] ExcelJS workbook download for attendance + allowance reports
- [x] Report meta: title full-width merge; label cols 1–2, value cols 3→end; no meta cell borders
- [x] HLU logo 1.5″ top-right aligned to column L
- [x] No sheet gridlines; thin table borders only (no medium group borders)
- [x] Row heights: title content-fit; other header/meta + table headers fixed 22; data/footer 28
- [x] Township / gender / organization / quantity columns fit content (table rows only)
- [x] Allowance Excel sign-off: Prepared / Approved / Verified with label|value underlines
- [x] Report interior copy always English (`translateEn`); UI chrome keeps app locale
- [x] Confirm dialog before Excel download

## Out of scope

- Server-side Excel generation
- PDF export

## Done when

- [x] Both report tabs download usable Excel matching agreed layout rules
- [x] Logo, sign-off, English labels, and heights behave as specified
