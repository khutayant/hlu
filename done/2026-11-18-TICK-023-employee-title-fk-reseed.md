# Employee title FK + list reseed

- **Id:** TICK-023
- **Status:** done
- **Repos:** SERVER | WORK
- **Opened:** 2026-11-18
- **Finished:** 2026-11-18
- **Creator:** draungminoo
- **Assignee:** draungminoo
- **Related:** **TICK-022**; `local-data/employee-list/`

## Goal

Wire honorific **TitleMaster** onto employees; reseed employee list with name-only display names and attach titles by `focalNo`.

## Scope

- [x] `EmployeeMaster.title` → `TitleMaster` (nullable FK `titleId`)
- [x] Employee create/update/list/get expose `title`; form title select; list/profile show `Title Name`
- [x] Staff sidebar: Titles above Employees (`/staff/title`)
- [x] `employee-list.data.csv`: person name only (Latin or Burmese kept); honorific in `employee-list.title.csv`
- [x] `title-focal-no.sql`: map `focalNo` → `title_master.name` → set `titleId`
- [x] **TEMP** employee `create` upserts by `focalNo`; import skips DB-duplicate gate (revert after reseed)

## Out of scope

- Permanent import upsert (revert TEMP after reseed)
- Title on import CSV columns

## Done when

- [x] Employees can store/select honorific title
- [x] Regenerated import CSV has names without title prefix
- [x] SQL ready to attach titles by focal no
