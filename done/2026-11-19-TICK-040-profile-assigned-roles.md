# Profile — show assigned roles + sidebar top align

- **Id:** TICK-040
- **Status:** done
- **Repos:** SERVER | WORK
- **Opened:** 2026-11-19
- **Finished:** 2026-11-19
- **Creator:** draungminoo
- **Assignee:** draungminoo
- **Related:** **TICK-009**, **TICK-012** · **MEET-013** / **NOTE-017**

## Goal

On My Profile, list every RBAC role assigned to the signed-in user; keep the original card sidebar layout top-aligned.

## Scope

- [x] `GET /user-role/me/roles` (auth only, no permission code)
- [x] Profile field **Roles** as tags (replacing single Keycloak `user.role` display)
- [x] Fix menu floating mid-page: remove broken `position: sticky; top: 120` (acted as relative offset)

## Out of scope

- Editing roles from profile
- Showing modules/permissions on profile

## Done when

- [x] Profile shows all active assigned roles
- [x] Profile/Security menu card aligns with top of content card
