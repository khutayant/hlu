# Meeting reports — summary Word (DOCX) export

- **Id:** TICK-052
- **Status:** done
- **Repos:** WORK
- **Opened:** 2026-11-19
- **Finished:** 2026-11-19
- **Creator:** draungminoo
- **Assignee:** draungminoo
- **Related:** **TICK-050** · **MEET-018** / **NOTE-022**
- **Sample:** `hlu-server/local-data/meeting-summary-report/meeting-summary-report.sample.docx`

## Goal

Download the meeting reports summary as a Word document matching the sample design (not Excel).

## Scope

- [x] Summary tab button **Download summary report** (`.docx`) with confirm dialog
- [x] A4, 1″ margins; Times New Roman; purple `#77206E` Section 1 meta labels
- [x] Logo 2″×2″ centered between `Template 01/2026` and Section 1
- [x] Sections 1–5 filled from meeting + filtered participants; Section 2 uses numeric township count (e.g. `3 townships (…)`), not “three”
- [x] Sections 6–10 + Photo Annex: headings / placeholders; Agenda + Photo title-only
- [x] Signature block: Reported by / Approved by rows — Signature row 1.5″; Name / Position / Date as label|value (empty values)

## Out of scope

- Filling signature names or embedding photo annex images
- Editing objectives/methodology from the UI

## Done when

- [x] User can confirm and download a summary DOCX aligned with the sample layout
