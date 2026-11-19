# Allowance report — township URL + add head office

- **Id:** TICK-047
- **Status:** done
- **Repos:** WORK
- **Opened:** 2026-11-19
- **Finished:** 2026-11-19
- **Creator:** draungminoo
- **Assignee:** draungminoo
- **Related:** **TICK-030**, **TICK-035**, **TICK-046** · **MEET-016** / **NOTE-020**

## Goal

Persist report township filters in the URL, and optionally merge head-office-position employees into the allowance report.

## Scope

- [x] Attendance: `attendanceTownships` query (comma-separated ids + `__none__`)
- [x] Allowance: `allowanceTownships` query (same format); survives reload / tab switch
- [x] Allowance checkbox **Add head office** → `addHeadOffice=1`; merges active employees whose position category is `HEAD_OFFICE_POSITION` (dedupe by employee id); Excel uses same rows
- [x] `excludeHeadOffice` zeros also apply to those HO-position employees (not only no-township)

## Out of scope

- Server-side report filter APIs
- Changing attendance tab to auto-add HO positions

## Done when

- [x] Selected townships and add-HO flag restore from URL on allowance report
- [x] Checked add-HO includes all HO-position employees in table + Excel
