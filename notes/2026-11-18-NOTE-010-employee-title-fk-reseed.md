# Discussion: Employee title FK + reseed

- **Id:** NOTE-010
- **Date:** 2026-11-18
- **Meeting:** **MEET-006**
- **Status:** tracked; **TICK-023** done
- **Tickets:** **TICK-023** (depends **TICK-022**)
- **Context:** Attach honorifics to employees; reseed list with title stripped from `displayName`.

## Notes

- `EmployeeMaster.title` ManyToOne → `TitleMaster` (`titleId` nullable).
- API/UI: title select on form; list/profile show `Title + Name`.
- Build script: `employee-list.data.csv` = person name only; `employee-list.title.csv` keeps titled display + title + personName.
- Keep Burmese person names when present (do not blank).
- `title-focal-no.sql`: VALUES(`focalNo`,`title name`) → UPDATE `employee_master."titleId"`.
- **TEMP:** `EmployeeService.create` upserts by `focalNo`; import does not skip existing focals. Revert after full reseed.

## Decisions

| # | Decision |
| --- | --- |
| D32 | `displayName` stores person name only; honorific is FK to TitleMaster. |
| D33 | Temporary create upsert by `focalNo` for one-time list reseed; then restore create-only + import duplicate skip. |

## Action items

| Item | Owner | Ticket |
| --- | --- | --- |
| FK + UI + CSV + TEMP upsert | draungminoo | **TICK-023** |
| Revert TEMP upsert after reseed | draungminoo | follow-up (no ticket yet) |
