# Version bump, publish, deploy-ui workflow

- **Id:** TICK-004
- **Status:** done
- **Repos:** UI | SERVER
- **Opened:** 2026-10-24
- **Finished:** 2026-10-31
- **Creator:** draungminoo
- **Assignee:** draungminoo
- **Related:** **MEET-002** / **NOTE-002**

## Goal

Separate version bump from publish; deploy-ui always patches version and pushes `ui` + `deploy-ui`.

## Scope

- [x] Version bump scripts bump only (no build/copy)
- [x] Separate version from publish
- [x] Server version-bump scripts + embedded UI refresh
- [x] `deploy-ui` requires clean tree, version patch, push `ui` and `deploy-ui`
- [x] Cursor rules for version-bump / git-push

## Out of scope

- Temporary card-hide deploy test (one-off, reverted in TICK-005 era)

## Done when

- [x] `version patch|minor|main` and `deploy:ui` documented and working
