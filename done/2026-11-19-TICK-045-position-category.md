# Position master — optional CategoryMaster

- **Id:** TICK-045
- **Status:** done
- **Repos:** SERVER | WORK
- **Opened:** 2026-11-19
- **Finished:** 2026-11-19
- **Creator:** draungminoo
- **Assignee:** draungminoo
- **Related:** **TICK-043** · **MEET-014** / **NOTE-018**

## Goal

Attach optional `CategoryMaster` to `PositionMaster` and expose it on Staff → Positions.

## Scope

- [x] `PositionMaster.category` nullable ManyToOne + migration `categoryId`
- [x] Position API create/update/list includes `categoryId` / `category`
- [x] Staff positions UI: category column + form select (options under `POSITION_CATEGORIES`)

## Out of scope

- Filtering employees by position category
- Required category on every position

## Done when

- [x] Positions can be created/edited with a category (e.g. Head office position)
