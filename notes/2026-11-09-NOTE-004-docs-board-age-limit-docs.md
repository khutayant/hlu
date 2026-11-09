# Discussion: Docs board + Age Limit Calculator documents

- **Id:** NOTE-004
- **Date:** 2026-11-09
- **Meeting:** MEET-004
- **Status:** tracked; implemented
- **Tickets:** **TICK-017** done
- **Context:** New `docs` board for HLU project/usage documents; first content is Age Limit Calculator (C001 / DOC-SW001).

## Notes

- Removed `hlu/notes/` after the move (UI tree no longer holds project docs).
- `documentation.md` covers: how to use the four cards, formulas (`V − 60m + 1d`, `V − 12m + 1d`, MMR range through `V − 9m`), worked example for V = 09-Nov-2026, Gregorian vs မြန်မာသက္ကရာဇ် display, and what stays outside the page.
- Limitation wording from the project document: cutoffs are Gregorian month arithmetic from the on-screen as-of date; Myanmar era is display-only.
- Empty `project-charters.md` / `functional-requirements.md` were not kept after the move (they had no content).

## Decisions

| # | Decision |
| --- | --- |
| D12–D15 | See **MEET-004**. |

## Action items

| Item | Owner | Ticket |
| --- | --- | --- |
| First commit/push of `docs` when user asks | draungminoo | **TICK-017** |
