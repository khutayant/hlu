# Keycloak authorization-code login (server + Work)

- **Id:** TICK-007
- **Status:** done
- **Repos:** SERVER | WORK
- **Opened:** 2026-11-07
- **Finished:** 2026-11-07
- **Creator:** draungminoo
- **Assignee:** draungminoo
- **Related:** **MEET-002** / **NOTE-002**

## Goal

Replace password login with Keycloak Auth Code + PKCE; upsert local `UserMaster` by `keycloakId` on login/refresh.

## Scope

- [x] Server auth login/callback/refresh/logout + token verify
- [x] `upsertUserFromToken` by `keycloakId`
- [x] Work Keycloak redirect auth (replace password form)
- [x] Auth layouts / guards as needed

## Out of scope

- Full RBAC enforcement (TICK-011+)
- Profile images (TICK-009)

## Done when

- [x] Users can sign in via Keycloak and get local user rows synced
