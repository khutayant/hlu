# Discussion: Allowance exclude head office

- **Id:** NOTE-019
- **Date:** 2026-11-19
- **Meeting:** **MEET-015**
- **Status:** tracked; **TICK-046** done
- **Tickets:** **TICK-046**
- **Context:** After **MEET-014** / **NOTE-018**. Allowance flag for excluding head-office people from a line’s pay.

## Notes

- **Field:** `MeetingAllowanceMaster.excludeHeadOffice` boolean (default false). Create/update DTOs + service + `toPublic`.
- **UI (`/meeting/.../allowance`):** Switch on create/edit. Table name column shows secondary badge `[Exclude HO]` (EN) / `ဌာနချုပ် ချန်` (MM, no brackets) when true — no separate column.
- **Report (`?tab=allowance` + Excel):** Head office = attendee with empty/null `townshipId`. For those rows, excluded lines render unit price, quantity, and total as **0**; per-row total and footer grand total recompute accordingly.

## Decisions

| # | Decision |
| --- | --- |
| D57 | Allowances may exclude head office; HO people get 0 on those lines in the allowance report (UI + Excel). |

## Action items

| Item | Owner | Ticket |
| --- | --- | --- |
| excludeHeadOffice API/UI/report | draungminoo | **TICK-046** |
