# Discussion: Report filename + DOCX polish

- **Id:** NOTE-023
- **Date:** 2026-11-19
- **Meeting:** **MEET-019**
- **Status:** tracked; **TICK-053** done
- **Tickets:** **TICK-053**
- **Context:** After **MEET-018** / **NOTE-022**.

## Notes

- **Filename:** `YYYYMMDD-Report-[Meeting Name]-[HH_mm_ss]` (+ `.docx` / `.xlsx`). Meeting name sanitized for filesystem. Used for summary Word and attendance/allowance Excel.
- **DOCX:** Six empty paragraphs under Photo Annex; signature table rows set `cantSplit: true`.

## Decisions

| # | Decision |
| --- | --- |
| D65 | Report downloads use `YYYYMMDD-Report-[Meeting Name]-[HH_mm_ss]`; summary DOCX keeps Photo Annex spacing and an unsplit signature table. |

## Action items

| Item | Owner | Ticket |
| --- | --- | --- |
| Filename + DOCX polish | draungminoo | **TICK-053** |
