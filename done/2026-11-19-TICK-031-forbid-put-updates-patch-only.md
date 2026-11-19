# Forbid PUT; updates use PATCH only

- **Id:** TICK-031
- **Status:** done
- **Repos:** SERVER | WORK
- **Opened:** 2026-11-19
- **Finished:** 2026-11-19
- **Creator:** draungminoo
- **Assignee:** draungminoo
- **Related:** **TICK-026** (meeting PATCH)

## Goal

Never use HTTP PUT for app updates. CORS already allowed PATCH; PUT was blocking employee (and other) updates from the Vite origin.

## Scope

- [x] Convert remaining update routes from `@ApiPut` to `@ApiPatch` (employee, country, township, title, position, immunization-session, user-role)
- [x] Matching `hlu-work` handlers use `method: 'PATCH'`
- [x] Remove `ApiPut` from the API decorator catalog
- [x] Boot checker rejects any registered PUT route
- [x] CORS `ALLOW_METHODS` stays `GET, POST, PATCH, DELETE` (no PUT)

## Out of scope

- Keycloak Admin API scripts (external API still requires PUT)
- Changing create (POST) or set-active (already PATCH) semantics

## Done when

- [x] No app route uses PUT
- [x] Employee and other updates succeed via PATCH from localhost work UI
