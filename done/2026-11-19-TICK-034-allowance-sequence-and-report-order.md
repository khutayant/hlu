# Allowance sequenceNo + report column order

- **Id:** TICK-034
- **Status:** done
- **Repos:** SERVER | WORK
- **Opened:** 2026-11-19
- **Finished:** 2026-11-19
- **Creator:** draungminoo
- **Assignee:** draungminoo
- **Related:** **TICK-026**

## Goal

Order meeting allowances by editable `sequenceNo` in UI and reports (including Excel).

## Scope

- [x] `sequenceNo` on `MeetingAllowanceMaster` + migration/backfill
- [x] Create/update APIs accept `sequenceNo`
- [x] Allowance panel can set sequence
- [x] Allowance report (table + Excel) columns follow `sequenceNo` ASC
- [x] Bold Total Amount column (header + values) in report UI/Excel

## Out of scope

- Drag-and-drop reorder UX beyond numeric sequence field

## Done when

- [x] Changing sequence changes report/Excel column order
- [x] Total Amount reads as the emphasized total column
