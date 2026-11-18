# Country and Township masters

- **Id:** TICK-020
- **Status:** done
- **Repos:** SERVER | WORK
- **Opened:** 2026-11-18
- **Finished:** 2026-11-18
- **Creator:** draungminoo
- **Assignee:** draungminoo
- **Related:** **TICK-019** (employee still uses `townshipName` text for now)

## Goal

Add geography masters: **Country** and **Township**. District will sit between them later; only country + township for now.

## Scope

- [x] `CountryMaster` (name, code, description)
- [x] `TownshipMaster` (name, code, country FK, optional focal prefix / description)
- [x] CRUD APIs + permissions (`country`, `township`)
- [x] Masters UI pages (replace Location placeholder with Country + Township)
- [x] Seed Myanmar + Magway townships from local atomic list
- [x] Leave room for future `DistrictMaster` between country and township

## Out of scope

- District master (later)
- Migrating `employee.townshipName` to township FK (keep text until then)

## Done when

- [x] Admin can list/create/update/activate countries and townships
- [x] Township is scoped under a country
- [x] Seed loads default country + known townships
