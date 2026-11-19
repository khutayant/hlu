# Local attendance-2 CSV focal rematch

- **Id:** TICK-036
- **Status:** done
- **Repos:** SERVER (local-data)
- **Opened:** 2026-11-19
- **Finished:** 2026-11-19
- **Creator:** draungminoo
- **Assignee:** draungminoo
- **Related:** **TICK-028**

## Goal

Match `local-data/attendance-list/attendance-2.csv` names to employee focal nos (HO + focal lists), with blanks on top and safe aliases.

## Scope

- [x] Rematch from employee-focal / employee-ho data CSVs
- [x] Spelling/transliteration aliases (Htwe↔Htay, Ju↔Jue, etc.) when unique
- [x] User corrections: blank Julia → Y018; remove duplicate Sandar Lin blank; Than → P042
- [x] Leave true ambiguities empty; keep missing-on-top order
- [x] Do not change Daw Ei in `employee-list.data.csv` (already P044); update a2 Ei → P044

## Out of scope

- Importing attendance-2 into a live meeting via API in this ticket

## Done when

- [x] `attendance-2.csv` focals reconciled against employee data with remaining blanks only where ambiguous/missing
