# Discussion: Admin Users, account active, User vs Employee

- **Id:** NOTE-005
- **Date:** 2026-11-17
- **Meeting:** MEET-005
- **Status:** tracked; **TICK-018** done; **TICK-019** done
- **Tickets:** **TICK-018** · **TICK-019**
- **Context:** Reconcile admin-Users / active-status work, then deliver EmployeeMaster + Staff UI.

## Notes

- Server: `UserModule` list + `PATCH /user/:id/active`; auth rejects inactive; role-user list includes `profileImage`.
- Work: `/admin/user` Users page; Staff employee list/import/export/profile under `/staff/employee`.
- Callback inactive → Alert error + `auth.accountInactive`.
- **TICK-019:** `EmployeeMaster`, employee APIs, CSV import/export, `EMPLOYEE_MANAGEMENT_SYSTEM` gate, `{subject}:manage` seeds, `ALL_SYSTEM` wildcard (client + rules).
- Home apps: Admin / Staff / Masters only; Test sidebar on `/` and `/test` (dev).

## Decisions

| # | Decision |
| --- | --- |
| D16–D22 | See **MEET-005** (D21 ribbon Close later fixed to parent/home routes, not history back). |

## Action items

| Item | Owner | Ticket |
| --- | --- | --- |
| Track + commit Users/active | draungminoo | **TICK-018** ✓ |
| EmployeeMaster + Staff UI | draungminoo | **TICK-019** ✓ |
