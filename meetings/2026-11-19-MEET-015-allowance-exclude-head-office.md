# Meeting: Allowance exclude head office

- **Id:** MEET-015
- **Date:** 2026-11-19
- **Attendees:** draungminoo
- **Status:** tracked
- **Note:** **NOTE-019**
- **Tickets:** **TICK-046**
- **Context:** Follow-on after **MEET-014**. Wire `excludeHeadOffice` on meeting allowances into UI and allowance report.

## Notes

- Entity column already present; expose via API + allowance CRUD UI.
- Name cell badge instead of a dedicated Exclude HO column.
- Report: HO = no township; excluded lines → all amounts 0 for those people.

## Decisions

| # | Decision | Lock |
| --- | --- | --- |
| D57 | See **NOTE-019** (excludeHeadOffice API + UI + report zeros). | preferred |

## Action items

| Item | Owner | Ticket |
| --- | --- | --- |
| Implement D57 | draungminoo | **TICK-046** |
