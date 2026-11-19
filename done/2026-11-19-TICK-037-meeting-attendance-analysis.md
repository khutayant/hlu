# Meeting attendance analysis dashboard

- **Id:** TICK-037
- **Status:** done
- **Repos:** WORK
- **Opened:** 2026-11-19
- **Finished:** 2026-11-19
- **Creator:** draungminoo
- **Assignee:** draungminoo
- **Related:** **TICK-025**, **TICK-030**

## Goal

Add an Attendance Analysis menu section with an analytic dashboard for a meeting.

## Scope

- [x] Menu + route section `attendance-analysis`
- [x] Dashboard: total attendees, township count, gender pie, township bars, position table
- [x] Township multi-filter (options from this meeting’s attendees; empty = all)
- [x] Analyse **active** attendance only (no inactive cards/status chart)

## Out of scope

- Server aggregate API (client loads attendance pages)
- Export charts to Excel/PNG in this ticket

## Done when

- [x] `/meeting/:id/attendance-analysis` shows filtered active-attendance analytics
