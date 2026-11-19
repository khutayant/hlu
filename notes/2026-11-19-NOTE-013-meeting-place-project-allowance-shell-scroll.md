# Discussion: Meeting place/project, allowance, shell scroll

- **Id:** NOTE-013
- **Date:** 2026-11-19
- **Meeting:** **MEET-009**
- **Status:** tracked; **TICK-026** done
- **Tickets:** **TICK-026**
- **Context:** After attendance/perdiem menu (**TICK-025**), extend meeting fields, rename allowance, fix CORS PUT, and unify side-menu shell scrolling.

## Notes

### Meeting master fields

- `place`: optional string (256); wired create/update/list/search/detail/form/i18n.
- `project`: optional FK to `ProjectMaster`; public API returns `projectId` + `{ id, name, projectNo }`; list supports `projectId` query; form Select above name; list filter + column.

### Allowance (was Perdiem)

- Menu/route **Allowance** / **ထောက်ပံ့ကြေး** (`/meeting/:id/allowance`); old `/perdiem-receipt` redirects.
- Entity `MeetingAllowanceMaster` registered for later calc (placeholder UI; no agent migration).

### Dialog / API UX

- Edit: meeting number as secondary text under dialog title (not an input).
- From and To date-times share one row; dialog width ~560.
- Meeting update HTTP method is **PATCH** (PUT blocked by CORS `Allow-Methods`).

### Side-menu shell scroll

- Root cause: shells used `100vh − toolbar − RIBBON_MIN_HEIGHT` while ribbon grows with title+description → outer + inner scroll.
- Fix: home layout locked to viewport (`height: 100%`, overflow hidden); Content `flex:1; overflow:auto`; shells use `calc(100% + content pads)` with negative margins; nav/main each `overflow:auto` and stretch.
- Applied to: meeting detail, project master, location master, user-role detail.
- Profile page keeps sticky-in-flow nav (not this shell).

### Ops

- No TypeORM migrations by agent; user must add columns/tables as needed.

## Decisions

| # | Decision |
| --- | --- |
| D37 | Meeting `place` and `project` are optional; Perdiem menu is renamed Allowance; meeting update is PATCH; full-bleed side-menu shells fill remaining Content height so menu and content scroll separately (no outer page scroll). |

## Action items

| Item | Owner | Ticket |
| --- | --- | --- |
| Implement place/project/allowance/dialog/PATCH/shell | draungminoo | **TICK-026** |
| Create/alter DB without agent migration | draungminoo | **TICK-026** |
