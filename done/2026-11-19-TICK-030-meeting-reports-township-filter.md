# Meeting reports: per-tab township multi-filter

- **Id:** TICK-030
- **Status:** done
- **Repos:** WORK | SERVER
- **Opened:** 2026-11-19
- **Finished:** 2026-11-19
- **Creator:** draungminoo
- **Assignee:** draungminoo
- **Related:** **TICK-026**

## Goal

Filter attendance and allowance reports by township independently, with multi-select chips.

## Scope

- [x] Township multi-select above each report’s content (not a shared parent filter)
- [x] Attendance and Allowance keep separate filter state
- [x] Empty selection = all townships on Attendance; selection filters table + Excel + allowance totals
- [x] Show all selected names as chips; dropdown width fits option text
- [x] Attendance API exposes `townshipId` for filtering

## Out of scope

- Server-side paginated report filter (client filters loaded attendees)
- Perdiem/other report tabs

## Done when

- [x] Each report tab can filter by one or more townships without affecting the other tab
- [x] Excel download respects that tab’s filter

## Follow-up

- Allowance empty-filter gate (must select township) → **TICK-035** / **D46**
