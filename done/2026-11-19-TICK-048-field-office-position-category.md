# Position category seed — FIELD_OFFICE_POSITION

- **Id:** TICK-048
- **Status:** done
- **Repos:** SERVER
- **Opened:** 2026-11-19
- **Finished:** 2026-11-19
- **Creator:** draungminoo
- **Assignee:** draungminoo
- **Related:** **TICK-045** · **MEET-016** / **NOTE-020**

## Goal

Add a seed category for non–head-office (field) positions under `POSITION_CATEGORIES`.

## Scope

- [x] `position-category.upsert.json`: `FIELD_OFFICE_POSITION` (“Field office position”) parented to `POSITION_CATEGORIES`

## Out of scope

- Auto-assigning existing positions to field vs head office
- Report filter by field-office category

## Done when

- [x] Seed file includes `FIELD_OFFICE_POSITION` alongside `HEAD_OFFICE_POSITION`
