# File upload APIs and master/mapping entities

- **Id:** TICK-008
- **Status:** done
- **Repos:** SERVER
- **Opened:** 2026-11-07
- **Finished:** 2026-11-07
- **Creator:** draungminoo
- **Assignee:** draungminoo
- **Related:** **MEET-002** / **NOTE-002**

## Goal

File upload module; expand entity layer (masters/mappings); data seeding engine for `res/seed`.

## Scope

- [x] File upload APIs (multer, categories by code)
- [x] Masters: category, module, permission, user-role, location, project, session, etc.
- [x] Mappings foundation (user-role permission/user; later module)
- [x] Data seeding engine (`*.upsert.json` / `*.insert.json`)
- [x] Category seed for file types; migrations as needed

## Out of scope

- Profile link APIs (TICK-009)
- Permission catalog seed from `@Api*` (TICK-011)

## Done when

- [x] Files upload to disk/DB; seed JSON applies on startup
