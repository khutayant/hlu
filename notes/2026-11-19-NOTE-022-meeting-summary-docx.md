# Discussion: Meeting summary DOCX export

- **Id:** NOTE-022
- **Date:** 2026-11-19
- **Meeting:** **MEET-018**
- **Status:** tracked; **TICK-052** done
- **Tickets:** **TICK-052**
- **Context:** After **MEET-017** / **NOTE-021**. Word export for reports summary tab.

## Notes

- **Library:** `docx` in hlu-work. Generator: `meeting-reports-summary-docx.tool.ts`.
- **Page:** A4; 1″ margins all sides.
- **Header:** `Template 01/2026` → centered HLU logo 2″×2″ → Section 1 meta (purple labels).
- **Content:** Sections 2–4 from sample structure with live participant/township counts (`N townships (names)`); Section 5 = gender % + tables 1–2 from UI filters; remaining sections placeholder; Agenda/Photo headings only.
- **Signature:** table rows — title, Signature (height 1.5″), Name:/Position:/Date: as label|empty value for Reported by and Approved by. No names filled.
- **UX:** confirm dialog before download.

## Decisions

| # | Decision |
| --- | --- |
| D64 | Summary report downloads as DOCX matching the sample design (A4, logo, sections through empty signature). |

## Action items

| Item | Owner | Ticket |
| --- | --- | --- |
| Summary DOCX export | draungminoo | **TICK-052** |
