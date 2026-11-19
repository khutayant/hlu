# Meeting: Allowance report URL/HO add + field office category

- **Id:** MEET-016
- **Date:** 2026-11-19
- **Attendees:** draungminoo
- **Status:** tracked
- **Note:** **NOTE-020**
- **Tickets:** **TICK-047**, **TICK-048**
- **Context:** Follow-on after **MEET-015**. Report filter persistence; add HO by position category; field-office category seed.

## Notes

- Township multi-select remembered per tab in query string.
- Add head office = employees on `HEAD_OFFICE_POSITION` positions, not only no-township.
- Seed `FIELD_OFFICE_POSITION` for non-HO positions.

## Decisions

| # | Decision | Lock |
| --- | --- | --- |
| D58 | See **NOTE-020** (township filters in URL). | preferred |
| D59 | See **NOTE-020** (add head office checkbox). | preferred |
| D60 | See **NOTE-020** (FIELD_OFFICE_POSITION seed). | preferred |

## Action items

| Item | Owner | Ticket |
| --- | --- | --- |
| Implement D58–D59 | draungminoo | **TICK-047** |
| Implement D60 | draungminoo | **TICK-048** |
