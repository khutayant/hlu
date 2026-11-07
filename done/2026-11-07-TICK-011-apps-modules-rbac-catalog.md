# Apps under modules + RBAC permission catalog

- **Id:** TICK-011
- **Status:** done
- **Repos:** SERVER | WORK
- **Opened:** 2026-11-07
- **Finished:** 2026-11-07
- **Creator:** draungminoo
- **Assignee:** draungminoo
- **Related:** **MEET-002** / **NOTE-002**

## Goal

Move feature apps under `src/apps/modules/`; `@Api*` permission codes; permission seed + conflict checks; Work module gate / ADMIN_SYSTEM.

## Scope

- [x] Relocate apps into `modules/` (engines stay)
- [x] API decorator checker + `PermissionSeedService`
- [x] Canonical `PERM_{SUBJECT}_{ACTION}`; manage/all bypass
- [x] RBAC guard wiring
- [x] Work `module.provider` / module-gate patterns

## Out of scope

- ADMIN relationship seed (TICK-014)
- Role permission UI assign (TICK-012)

## Done when

- [x] Route permissions seed into `PermissionMaster` without catalog conflicts
