# Meeting: Category master UI, drill-down, position category

- **Id:** MEET-014
- **Date:** 2026-11-19
- **Attendees:** draungminoo
- **Status:** tracked
- **Note:** **NOTE-018**
- **Tickets:** **TICK-042**, **TICK-043**, **TICK-044**, **TICK-045**
- **Context:** Follow-on after **MEET-013**. Admin sidebar cleanup; category master management on existing entity; position ↔ category link.

## Notes

- Do **not** create a new CategoryMaster — use existing entity (already used by files).
- Category page: drill-down levels with locator `root / …` and `?path=` codes.
- Seed position categories: `POSITION_CATEGORIES` → `HEAD_OFFICE_POSITION`.
- Position master gains optional category FK; Staff Positions UI updated.

## Decisions

| # | Decision | Lock |
| --- | --- | --- |
| D53 | See **NOTE-018** (reuse CategoryMaster; no new entity). | preferred |
| D54 | See **NOTE-018** (category drill-down + URL path). | preferred |
| D55 | See **NOTE-018** (position optional category). | preferred |
| D56 | See **NOTE-018** (admin sidebar no Test). | preferred |

## Action items

| Item | Owner | Ticket |
| --- | --- | --- |
| Implement D53–D56 | draungminoo | **TICK-042**–**TICK-045** |
