# Meeting: Meeting place/project, allowance, shell scroll

- **Id:** MEET-009
- **Date:** 2026-11-19
- **Attendees:** draungminoo
- **Status:** tracked
- **Note:** **NOTE-013**
- **Tickets:** **TICK-026**
- **Context:** Follow-on from **MEET-008** / **TICK-025**: place + project on meeting master; Perdiem → Allowance; dialog UX; PATCH; fix double-scroll on side-menu shells.

## Notes

### Covered this session

| Area | Outcome | Ticket |
| --- | --- | --- |
| `MeetingMaster.place` + UI/API | done | **TICK-026** |
| `MeetingMaster.project` (optional) + UI/API/filter | done | **TICK-026** |
| Perdiem → Allowance + `MeetingAllowanceMaster` | done | **TICK-026** |
| Edit dialog: meetingNo text; From/To one row; project above name | done | **TICK-026** |
| Meeting update PATCH (no PUT) | done | **TICK-026** |
| Shell scroll: meeting + project + location + user-role | done | **TICK-026** |
| Home layout viewport lock (`html`/`body`/`#root` height 100%) | done | **TICK-026** |

## Decisions

| # | Decision | Lock |
| --- | --- | --- |
| D37 | See **NOTE-013** (place/project optional; Allowance rename; PATCH; shell fills Content %). | preferred |

## Action items

| Item | Owner | Ticket |
| --- | --- | --- |
| Board updated for place/project/allowance/shell | draungminoo | **TICK-026** |
| User alters DB for `place`, `projectId`, allowance table (no agent migration) | draungminoo | **TICK-026** |
