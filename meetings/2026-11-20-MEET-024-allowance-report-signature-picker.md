# Meeting: Allowance report signature picker + shared editor

- **Id:** MEET-024
- **Date:** 2026-11-20
- **Attendees:** draungminoo
- **Status:** tracked
- **Note:** **NOTE-028**
- **Tickets:** **TICK-058**
- **Context:** After **TICK-057** signature master; wire report Signature column pick/create UX.

## Notes

- Extract လက်မှတ် ထည့်ရန် as common component; call with known `employeeId`.
- Allowance report: right-click Signature → View Signatures / Create New Signature; left-click signed cell → paper preview.
- List viewer: active cards, Use → memory-only for cell + Excel; Add New in header stacks create over list.
- Cell: padding 0; signature image full cell height.

## Decisions

| # | Decision | Lock |
| --- | --- | --- |
| D71 | See **NOTE-028**. | preferred |
| D72 | See **NOTE-028**. | preferred |
| — | Errors Alert + Excel image fit → **MEET-025** / **TICK-059**. | — |

## Action items

| Item | Owner | Ticket |
| --- | --- | --- |
| Implement D71–D72 | draungminoo | **TICK-058** |
