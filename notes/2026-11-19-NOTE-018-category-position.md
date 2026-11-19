# Discussion: Category master UI, drill-down, position category

- **Id:** NOTE-018
- **Date:** 2026-11-19
- **Meeting:** **MEET-014**
- **Status:** tracked; **TICK-042**–**TICK-045** done
- **Tickets:** **TICK-042**, **TICK-043**, **TICK-044**, **TICK-045**
- **Context:** After **MEET-013** / **NOTE-017**. Category CRUD on existing master; hierarchy UX; position category FK.

## Notes

- **Reuse entity:** `CategoryMaster` already has name, code, description, parent, `isPosting`. Added API `/v1/category` + masters UI. Code pattern `A-Z0-9_`.
- **Seeds:** `file-category.upsert.json` unchanged; `position-category.upsert.json` adds `POSITION_CATEGORIES` / `HEAD_OFFICE_POSITION`.
- **Drill-down:** level view + locator bar (`root / Name`); URL `?path=CODE[/CHILD…]`.
- **Position:** nullable `categoryId` migration; Staff Positions form/table show category (select filtered to children of `POSITION_CATEGORIES`).
- **Admin sidebar:** removed Test from `ADMIN_PAGE_MENU`.

## Decisions

| # | Decision |
| --- | --- |
| D53 | Implement category management on existing `CategoryMaster` (no new entity). |
| D54 | Category UI is root/parent/child drill-down with `/` locator and `?path=` persistence. |
| D55 | `PositionMaster.category` is optional `CategoryMaster`; Staff Positions UI supports it. |
| D56 | Admin sidebar does not include Test (home/dev only). |

## Action items

| Item | Owner | Ticket |
| --- | --- | --- |
| Admin remove Test menu | draungminoo | **TICK-042** |
| Category API + masters page | draungminoo | **TICK-043** |
| Category drill-down + URL | draungminoo | **TICK-044** |
| Position ↔ category | draungminoo | **TICK-045** |
