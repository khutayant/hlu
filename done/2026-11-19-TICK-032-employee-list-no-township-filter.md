# Employee list: No Township filter

- **Id:** TICK-032
- **Status:** done
- **Repos:** WORK | SERVER
- **Opened:** 2026-11-19
- **Finished:** 2026-11-19
- **Creator:** draungminoo
- **Assignee:** draungminoo
- **Related:** **TICK-028**

## Goal

On `/staff/employee`, filter employees that have no township (head office).

## Scope

- [x] Township filter option **No Township** (`__none__`)
- [x] Server list: `townshipName=__none__` → `employee.townshipId IS NULL`
- [x] Export respects the same filter
- [x] Gender / township / position dropdowns: option panel width fits content

## Out of scope

- Overview dashboard “No Township” matrix filter (separate if needed)

## Done when

- [x] Selecting No Township lists only employees without a township
