# Discussion: E-signature data emp-focal rename

- **Id:** NOTE-026
- **Date:** 2026-11-20
- **Meeting:** **MEET-022**
- **Status:** tracked; **TICK-056** done
- **Tickets:** **TICK-056**
- **Context:** Raw signature packs → `local-data/e-signature/data/<area>/`.

## Notes

- **Pattern:** `[employeeNo]-[focalNo].ext` (e.g. `H0338-HO004.png`). If not sure, leave file.
- **Folders:** `hlu` (HO), `myaing` (M), `saw` (S), `yesagyo` (Y), `ggw` (GN+GS), `pauk` (P), `tilin` (T).
- **Match:** active employees by normalized display name within area focal prefix(es); ambiguous multi-matches left kebab.
- **Rough counts (linked / total):** hlu 8/15 · myaing 52/85 · saw 41/49 · yesagyo 41/58 · ggw 21/49 · pauk 47/51 · tilin 45/54.
- **HLU picks:** Brahms ← `dr-brahms-1`; Me ← `me-1` (old copies removed).
- **Git:** `dir` and this local-data work stay local (no git / not pushed).

## Decisions

| # | Decision |
| --- | --- |
| D68 | E-signature `data/<area>/` uses `[empNo]-[focalNo].ext` for clear matches only; unmatched stay kebab; area folder names lowercase (`hlu`, `myaing`, …). |

## Action items

| Item | Owner | Ticket |
| --- | --- | --- |
| Process all raw signature folders into data | draungminoo | **TICK-056** |
