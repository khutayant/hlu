# Category master — drill-down locator + URL path

- **Id:** TICK-044
- **Status:** done
- **Repos:** WORK
- **Opened:** 2026-11-19
- **Finished:** 2026-11-19
- **Creator:** draungminoo
- **Assignee:** draungminoo
- **Related:** **TICK-043** · **MEET-014** / **NOTE-018**

## Goal

Navigate categories as root / parent / child; remember depth in the URL.

## Scope

- [x] Drill-down: click parent with children to open next level
- [x] Locator bar above table: `root / …` (`/` divider only; baseline-aligned crumbs)
- [x] Persist path as `?path=CODE` / `?path=CODE/CHILD` (browser back/refresh)

## Out of scope

- Tree table expand-in-place (kept level drill-down)

## Done when

- [x] Path reflected in locator and query string
