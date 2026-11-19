# Meeting and Attendance Management System module gate

- **Id:** TICK-039
- **Status:** done
- **Repos:** SERVER | WORK
- **Opened:** 2026-11-19
- **Finished:** 2026-11-19
- **Creator:** draungminoo
- **Assignee:** draungminoo
- **Related:** **TICK-011**, **TICK-019** · **MEET-013** / **NOTE-017**

## Goal

Gate the meeting / attendance app behind a system module code (same pattern as Admin / Employee).

## Scope

- [x] Seed `MEETING_AND_ATTENDANCE_MANAGEMENT_SYSTEM` in `system-module.upsert.json`
- [x] `ModuleGate` on `/meeting*` routes
- [x] Home tile + meeting sidebar `moduleCode`
- [x] `ALL_SYSTEM` remains wildcard

## Out of scope

- Per-permission gates inside meeting screens
- Changing admin seed off `ALL_SYSTEM`

## Done when

- [x] Meeting routes / tile / sidebar require `MEETING_AND_ATTENDANCE_MANAGEMENT_SYSTEM` or `ALL_SYSTEM`
