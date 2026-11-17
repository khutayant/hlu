# Discussion: Admin Users, account active, User vs Employee

- **Id:** NOTE-005
- **Date:** 2026-11-17
- **Meeting:** MEET-005
- **Status:** tracked; **TICK-018** done; **TICK-019** future
- **Tickets:** **TICK-018** · **TICK-019**
- **Context:** Reconcile uncommitted admin-Users / active-status / callback Alert work, plus the agreed User–Employee link shape.

## Notes

- Server: `UserModule` list + `PATCH /user/:id/active`; auth rejects inactive; role-user list includes `profileImage`.
- Work: `/admin/users` page, sidebar Users (TeamOutlined), admin default landing Users; role tables sticky Name 250 + Actions; format-date helper; PWA `suppressWarnings`.
- Callback inactive → Alert error + `auth.accountInactive`.
- Employee table not started; decision locked in **MEET-005** D19–D20.

## Decisions

| # | Decision |
| --- | --- |
| D16–D22 | See **MEET-005**. |

## Action items

| Item | Owner | Ticket |
| --- | --- | --- |
| Track + commit reconcile (server, work, boards) | draungminoo | **TICK-018** |
| Later: EmployeeMaster + Staff UI | draungminoo | **TICK-019** |
