# Head-office employees: optional township and HO focal prefix

- **Id:** TICK-028
- **Status:** done
- **Repos:** SERVER | WORK
- **Opened:** 2026-11-19
- **Finished:** 2026-11-19
- **Creator:** draungminoo
- **Assignee:** draungminoo
- **Related:** **TICK-019**, **TICK-020**

## Goal

Support head-office staff with no township, and require their focal numbers to use the `HO` letter prefix.

## Scope

- [x] `EmployeeMaster.township` / `townshipId` nullable (migration)
- [x] Create/update/import: no township → focal letter prefix must be `HO`; with township → must match that township’s `focalPrefix`
- [x] Employee form and import UI validate the same rules
- [x] Local HO raw/list CSVs, title/position seeds, attendance rematch for HO focals; employee-list layout under `employee-data` (`employee-focal` / `employee-ho`)

## Out of scope

- Changing session-number generation (**TICK-027**)
- UI “head office” master entity

## Done when

- [x] Head-office employees can be saved without a township using `HO…` focals
- [x] Township employees still require matching township focal prefixes
