# Attendance import: normalize focal numbers

- **Id:** TICK-029
- **Status:** done
- **Repos:** WORK | SERVER
- **Opened:** 2026-11-19
- **Finished:** 2026-11-19
- **Creator:** draungminoo
- **Assignee:** draungminoo
- **Related:** **TICK-025**

## Goal

On attendance import, normalize focal numbers so spaced/cased CSV values still match employees.

## Scope

- [x] Normalize: strip all whitespace + uppercase (e.g. ` ho 001 ` → `HO001`)
- [x] Apply on parse/validate, inline edit, resolve, and import (UI + server `normalizeFocalNo` / `parseFocalNo`)
- [x] Keep existing pattern/length/duplicate/missing/already-attending checks
- [x] After import, remove successfully imported rows; leave only non-imported / error rows (existing behaviour confirmed)

## Out of scope

- Re-checking township/HO prefix on import (employee already exists)
- Changing CSV column mapping

## Done when

- [x] Spaced or lowercase focals resolve and import when the employee exists
- [x] Successful rows disappear from the import grid; failures remain
