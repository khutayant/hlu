# Meeting place/project, allowance rename, dialog UX, shell scroll

- **Id:** TICK-026
- **Status:** done
- **Repos:** SERVER | WORK
- **Opened:** 2026-11-19
- **Finished:** 2026-11-19
- **Creator:** draungminoo
- **Assignee:** draungminoo

## Goal

Extend meeting master with place and optional project; rename Perdiem → Allowance with `MeetingAllowanceMaster`; polish create/edit dialog and meeting update verb; fix side-menu shell scrolling so menu and content scroll separately (all matching shells).

## Scope

- [x] `MeetingMaster.place` (`varchar` 256, nullable) + create/update DTOs, service (`toPublic`, search), work handler, form, list column, detail, en/mm
- [x] `MeetingMaster.project` optional `ManyToOne` → `ProjectMaster` + `projectId` filter/search, form Select (above name), list column/filter, detail
- [x] Rename Perdiem Receipt → **Allowance** / **ထောက်ပံ့ကြေး**; route `/allowance`; `/perdiem-receipt` redirects; `MeetingAllowanceMaster` entity (no migration by agent)
- [x] Edit dialog: meeting no as text under title (not disabled input); From/To on one row; project above name
- [x] Meeting update uses **PATCH** (not PUT) — CORS allow-methods
- [x] Side-menu shells fill remaining layout height (not `100vh − ribbon min`); menu + main scroll independently
- [x] Same shell scroll pattern: meeting detail, project master, location master, user-role detail; home layout viewport-locked

## Out of scope

- TypeORM migration files (user creates/alters tables)
- Allowance calculation / receipt generation logic
- Changing profile page sticky-nav layout (not a full-bleed shell)

## Done when

- [x] Create/edit/list/detail/search include place and optional project
- [x] Menu shows Allowance; allowance placeholder panel works
- [x] Meeting PATCH update works from work UI
- [x] Meeting (and sibling) detail shells: no outer page scroll; menu and content scroll separately
