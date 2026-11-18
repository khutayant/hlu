# Meeting: Meeting detail, attendance, perdiem menu

- **Id:** MEET-008
- **Date:** 2026-11-18
- **Attendees:** draungminoo
- **Status:** tracked
- **Note:** **NOTE-012**
- **Tickets:** **TICK-025**
- **Context:** Continue meeting app work: name click → detail with side menu; attendance list + import; perdiem receipt menu; UX polish.

## Notes

### Covered this session

| Area | Outcome | Ticket |
| --- | --- | --- |
| Meeting detail shell + name link (blue) | done | **TICK-025** |
| Side menu aligned with other pages | done | **TICK-025** |
| `MeetingAttendanceInfo` + APIs (no migration) | done | **TICK-025** |
| Attendance list + add (employee search) | done | **TICK-025** |
| Attendance mass import + Excel template + own URL | done | **TICK-025** |
| Import ribbon Close → attendance list only | done | **TICK-025** |
| Perdiem Receipt menu (placeholder) | done | **TICK-025** |
| MM labels (နယ်မြေခံအမှတ်, အသစ်ထည့်ရန်, …) | done | **TICK-025** |

## Decisions

| # | Decision | Lock |
| --- | --- | --- |
| D35 | See **NOTE-012** (detail shell; attendance import columns; perdiem menu only). | preferred |
| D36 | See **NOTE-012** (attendance-import Close → attendance only). | preferred |

## Action items

| Item | Owner | Ticket |
| --- | --- | --- |
| Board updated for meeting detail + attendance | draungminoo | **TICK-025** |
| User creates `meeting_attendance_info` table (no agent migration) | draungminoo | **TICK-025** |
