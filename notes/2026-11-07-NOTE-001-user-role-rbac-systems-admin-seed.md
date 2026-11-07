# Discussion: User-role RBAC, systems, ADMIN seed

- **Id:** NOTE-001
- **Date:** 2026-11-07
- **Meeting:** MEET-001
- **Status:** tracked; implemented
- **Tickets:** **TICK-012**–**TICK-015** done
- **Context:** Session work on role users/permissions/systems UI + ADMIN post-permission seed; establish HLU ticket/discussion boards. Ticket ids renumbered in **MEET-002**.

## Notes

- Users/permissions panels and APIs shipped; permission desc popover; dialog scroll/footer; sticky checkbox/name.
- Systems (`modules`) panel + `UserRoleModuleMapping`; seed `ALL_SYSTEM`.
- Seed order: data JSON (modules, ADMIN role) → permission seed → admin relationships (`ALL_SYSTEM`, `PERM_ALL_MANAGE`).
- Upsert unique check fixed for `(code, deletedToken)` with quoted column names.
- Track changes = local `tickets` + `discussions` (branches `ticket` / `discussion`), not Notion.

## Decisions

| # | Decision |
| --- | --- |
| D1–D5 | See **MEET-001**. |

## Action items

| Item | Owner | Ticket |
| --- | --- | --- |
| Push board branches when remotes ready | draungminoo | **TICK-015** (done) · push-all → **TICK-016** |
