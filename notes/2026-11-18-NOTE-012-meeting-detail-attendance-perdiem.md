# Discussion: Meeting detail, attendance, perdiem menu

- **Id:** NOTE-012
- **Date:** 2026-11-18
- **Meeting:** **MEET-008**
- **Status:** tracked; **TICK-025** done
- **Tickets:** **TICK-025**
- **Context:** Meeting list already existed. User asked for detail page with side menu, attendance recording/import, and a perdiem receipt menu entry.

## Notes

### Detail shell

- Routes: `/meeting/:id/details`, `/attendance`, `/attendance-import`, `/perdiem-receipt`.
- Side menu matches Locations / User role (full-height bleed panel). Menu stays visible while loading/failed.
- Meeting name in list is `Typography.Link` (blue) → details.

### Attendance

- Entity `MeetingAttendanceInfo`: meeting + employee + optional remark; unique (meeting, employee).
- APIs under `v1/meeting-attendance` (list, create, import, import/resolve, set active). Subject `meeting`.
- List toolbar: Active/Inactive left; Search · Import · Add new right.
- Add dialog: remote employee Select (name / focal / employee no); empty query shows 50 active employees; option lines = name / `employeeNo · focalNo`.
- Import columns: **Name** (mandatory, not stored), **Focal No** (mandatory), **Remark** (optional). Template is Excel (green headers); upload accepts xlsx/csv. Correct | Incorrect filter below title, above table. Dedicated URL so refresh keeps import view.
- Ribbon **Close** on `/attendance-import` navigates to `/meeting/:id/attendance` only; other meeting sections still Close to `/meeting`.
- MM: Focal No → **နယ်မြေခံအမှတ်**; Add new → **အသစ်ထည့်ရန်**; Attendance List → **တက်ရောက်သူစာရင်း**.

### Perdiem

- Menu **Perdiem Receipt** / **နေ့တွက်စရိတ် တောင်းခံလွှာ** with coming-soon panel only (no calculation yet).

### Ops

- No TypeORM migration written by agent; user must create `meeting_attendance_info` (and any prior `meeting_master` if missing).

## Decisions

| # | Decision |
| --- | --- |
| D35 | Meeting detail uses the shared side-menu shell; attendance import uses Name (verify only) + Focal No + Remark, with its own URL; Perdiem Receipt is menu-only until calculation is specified. |
| D36 | On attendance-import, ribbon Close closes that page only (back to attendance list), not the whole meeting app. |

## Action items

| Item | Owner | Ticket |
| --- | --- | --- |
| Implement detail + attendance + perdiem menu | draungminoo | **TICK-025** |
| Create DB table(s) without agent migration | draungminoo | **TICK-025** |
