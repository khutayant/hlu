# Meeting detail, attendance list, and perdiem menu

- **Id:** TICK-025
- **Status:** done
- **Repos:** SERVER | WORK
- **Opened:** 2026-11-18
- **Finished:** 2026-11-18
- **Creator:** draungminoo
- **Assignee:** draungminoo

## Goal

Open a meeting from the list into a detail shell with a side menu; manage attendees (one-by-one and mass import); reserve a Perdiem Receipt section for later calculation.

## Scope

- [x] Clickable meeting name (link color) → `/meeting/:id/details`
- [x] Detail page side menu aligned with Locations / User role (Details, Attendance List, Perdiem Receipt)
- [x] `MeetingAttendanceInfo` entity (`meeting`, `employee`, `remark?`) — no migration authored by agent
- [x] Meeting-attendance APIs: list, create by focal no, import, resolve focals, set active
- [x] Attendance list UI: Active/Inactive · Search · Import · Add new
- [x] Add-attendee dialog: searchable employee select (name / focal / employee no), default 50 options
- [x] Mass import (same design as employee import): Name (verify only), Focal No, Remark; Excel template + CSV/XLSX upload; Correct | Incorrect filter; URL `/meeting/:id/attendance-import`
- [x] On `/attendance-import`, ribbon **Close** returns to `/attendance` only (not the meeting list)
- [x] MM: Focal No → **နယ်မြေခံအမှတ်**; Add new → **အသစ်ထည့်ရန်**; Attendance List → **တက်ရောက်သူစာရင်း**; Perdiem Receipt → **နေ့တွက်စရိတ် တောင်းခံလွှာ**
- [x] Perdiem Receipt menu + placeholder panel

## Out of scope

- TypeORM migration files (user creates table)
- Perdiem calculation / receipt generation logic
- Attendance print or PDF

## Done when

- [x] `/meeting/:id/details` shows meeting fields with side menu
- [x] `/meeting/:id/attendance` lists attendees; add + import work
- [x] `/meeting/:id/attendance-import` survives refresh; Close leaves import only
- [x] `/meeting/:id/perdiem-receipt` menu exists (placeholder)
