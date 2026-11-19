# Category master — list/CRUD UI on existing entity

- **Id:** TICK-043
- **Status:** done
- **Repos:** SERVER | WORK
- **Opened:** 2026-11-19
- **Finished:** 2026-11-19
- **Creator:** draungminoo
- **Assignee:** draungminoo
- **Related:** **TICK-008** · **MEET-014** / **NOTE-018**

## Goal

Display and manage existing `CategoryMaster` at `/masters/category` (do not create a new entity).

## Scope

- [x] Category API (`/v1/category`) on existing entity: list/get/create/update/set-active
- [x] `PERMISSION_SUBJECT.CATEGORY` + seed permissions
- [x] Masters category page CRUD (name, code A–Z0-9_, parent, description)
- [x] Code check annotation on entity (`^[A-Z0-9_]+$`)
- [x] Seed `POSITION_CATEGORIES` → `HEAD_OFFICE_POSITION`

## Out of scope

- New CategoryMaster table/entity
- Replacing file-module category lookup

## Done when

- [x] `/masters/category` shows seeded categories and supports CRUD
