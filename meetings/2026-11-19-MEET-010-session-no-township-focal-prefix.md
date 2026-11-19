# Meeting: Session number uses township focal prefix

- **Id:** MEET-010
- **Date:** 2026-11-19
- **Attendees:** draungminoo
- **Status:** tracked
- **Note:** **NOTE-014**
- **Tickets:** **TICK-027**
- **Context:** User asked how immunization session numbers are set, then required the prefix to come from the township `focalPrefix`.

## Notes

### Covered this session

| Area | Outcome | Ticket |
| --- | --- | --- |
| How `sessionNo` was set (`SEC` + year + sequence, server-only) | explained | **TICK-027** |
| Generate from township `focalPrefix`, sequence per prefix and year | done | **TICK-027** |
| Check constraint widened; existing `SEC…` values still valid | done | **TICK-027** |

## Decisions

| # | Decision | Lock |
| --- | --- | --- |
| D38 | See **NOTE-014** (focal prefix + year + 4 digits; per-prefix yearly sequence; immutable). | preferred |

## Action items

| Item | Owner | Ticket |
| --- | --- | --- |
| Board updated for session-number prefix | draungminoo | **TICK-027** |
