# Meeting: Title + employee title reconcile

- **Id:** MEET-006
- **Date:** 2026-11-18
- **Attendees:** draungminoo
- **Status:** tracked
- **Note:** **NOTE-009**, **NOTE-010**
- **Tickets:** **TICK-022**, **TICK-023**
- **Context:** User asked to track/reconcile changes after TitleMaster + employee title wiring (staff UI, `code`, CSV reseed).

## Notes

### Covered this session

| Area | Outcome | Ticket |
| --- | --- | --- |
| TitleMaster + `code` + upsert seed + migration | done | **TICK-022** |
| Staff `/staff/title`, ဂုဏ်ပုဒ်, name/code cell | done | **TICK-022** |
| Employee `titleId` FK, form/list, TEMP import upsert | done | **TICK-023** |
| CSV name-only + keep Burmese + `title-focal-no.sql` | done | **TICK-023** |

### Still open (not new tickets)

- Revert TEMP employee create upsert / import duplicate skip after reseed completes.
- Run `title-focal-no.sql` after employee import (ops step).

## Decisions

| # | Decision | Lock |
| --- | --- | --- |
| D29–D31 | See **NOTE-009** (`code`, staff UI, ဂုဏ်ပုဒ်). | preferred |
| D32–D33 | See **NOTE-010** (name vs title FK; TEMP upsert). | preferred |

## Action items

| Item | Owner | Ticket |
| --- | --- | --- |
| Board updated for title/employee title work | draungminoo | **TICK-022**, **TICK-023** |
| Revert TEMP upsert after reseed | draungminoo | follow-up |
