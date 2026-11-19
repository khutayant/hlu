# Immunization session number uses township focal prefix

- **Id:** TICK-027
- **Status:** done
- **Repos:** SERVER
- **Opened:** 2026-11-19
- **Finished:** 2026-11-19
- **Creator:** draungminoo
- **Assignee:** draungminoo
- **Related:** **TICK-020** (`TownshipMaster.focalPrefix`)

## Goal

Generate immunization session numbers from the selected township's `focalPrefix` instead of a fixed `SEC` prefix.

## Scope

- [x] On create, `sessionNo` = `{focalPrefix}{YYYY}{4 digits}` (e.g. `GN20260001`)
- [x] Sequence is per prefix and calendar year (`GenCodeService` prefix override)
- [x] Check constraint accepts 1–5 `A-Z0-9` plus 8 digits; existing `SEC…` values still match
- [x] Number stays assigned on create and is not editable

## Out of scope

- Rewriting existing `SEC…` session numbers
- Letting the user type a session number
- Changing other code types (project, meeting, employee)

## Done when

- [x] Creating a session for a township uses that township's `focalPrefix`
- [x] Two prefixes can each start at `0001` in the same year
- [x] Database check no longer requires the `SEC` prefix
