# Meeting allowance — exclude head office

- **Id:** TICK-046
- **Status:** done
- **Repos:** SERVER | WORK
- **Opened:** 2026-11-19
- **Finished:** 2026-11-19
- **Creator:** draungminoo
- **Assignee:** draungminoo
- **Related:** **TICK-034**, **TICK-035** · **MEET-015** / **NOTE-019**

## Goal

Flag allowance lines that exclude head-office attendees, surface that in the allowance UI, and zero those amounts on the allowance report for HO people.

## Scope

- [x] `MeetingAllowanceMaster.excludeHeadOffice` (boolean, default false) through create/update API + `toPublic`
- [x] Allowance panel: form switch; name column shows `[Exclude HO]` / `ဌာနချုပ် ချန်` when set (no separate table column)
- [x] Allowance report (`?tab=allowance`) + Excel: when `excludeHeadOffice`, unit/qty/total = 0 for attendees with no township (head office); row and grand totals follow

## Out of scope

- Changing how head office is defined beyond “no township”
- Auto-recomputing allowance quantities from attendance counts

## Done when

- [x] HO attendees show 0 on excluded allowance lines in UI report and Excel download
