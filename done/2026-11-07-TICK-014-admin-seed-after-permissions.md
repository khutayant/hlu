# ADMIN seed after modules, role, and permissions

- **Id:** TICK-014
- **Status:** done
- **Repos:** SERVER
- **Opened:** 2026-11-07
- **Finished:** 2026-11-07
- **Creator:** draungminoo
- **Assignee:** draungminoo
- **Related:** **MEET-001** / **NOTE-001** · **MEET-002** / **NOTE-002**
- **Supersedes board id:** formerly TICK-003 before day-1 renumber

## Goal

Seed only `ADMIN` role; after permission seed, link `ALL_SYSTEM` + `PERM_ALL_MANAGE`.

## Scope

- [x] `user-role-master` ADMIN upsert
- [x] Upsert conflict `UNIQUE (code)` or `(code, deletedToken)` with quoted columns
- [x] `seed-admin` after successful permission seed

## Out of scope

- Seeding other roles / users onto ADMIN

## Done when

- [x] Startup order: modules/role → permissions → admin relationships
