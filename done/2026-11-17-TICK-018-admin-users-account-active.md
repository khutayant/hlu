# Admin Users list + account active status

- **Id:** TICK-018
- **Status:** done
- **Repos:** SERVER | WORK
- **Opened:** 2026-11-17
- **Finished:** 2026-11-17
- **Creator:** draungminoo
- **Assignee:** draungminoo
- **Related:** **MEET-005** / **NOTE-005** · builds on **TICK-007** (auth) · **TICK-010**–**TICK-013** (admin roles)

## Goal

Admin can manage login accounts (Users) separately from roles: list with search/filter, toggle active/inactive, and inactive accounts cannot sign in. Callback shows a translated error Alert.

## Scope

- [x] Server `UserModule`: `GET /user` (q, page, limit, active) + `PATCH /user/:id/active`
- [x] Auth: do not reactivate on login; reject inactive with `UnauthorizedException('User account is inactive')`
- [x] Role-user list joins `profileImage` for avatar display
- [x] hlu-work admin **Users** page (sidebar, default admin landing, TeamOutlined)
- [x] Status Switch (admin only, not self) + Active|Inactive Segmented + search right
- [x] Auth callback: map inactive errors → `t('auth.accountInactive')` + `Alert` type error
- [x] Related UI polish in same pass: ribbon Close → `navigate(-1)`, content holders, sticky Name/Actions on role tables, `DD-MMM-YYYY hh:mm:ss A`, role-users Name avatar, PWA `suppressWarnings`

## Out of scope

- Employee / HR table (`EmployeeMaster`) — see **TICK-019**
- Self-deactivate
- Soft-delete users

## Done when

- [x] Admin can filter Active/Inactive and toggle status
- [x] Inactive account cannot complete OAuth login
- [x] Callback shows i18n error Alert for inactive
