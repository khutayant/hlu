# Meeting: Reconcile tickets from day 1

- **Id:** MEET-002
- **Date:** 2026-11-07
- **Attendees:** draungminoo
- **Status:** tracked; board backfilled
- **Note:** **NOTE-002**
- **Tickets:** **TICK-001**–**TICK-015** (all `done/`; Oct under `done/2026-10/`)
- **Earlier:** **MEET-001** (RBAC/systems/admin seed session) — ticket ids renumbered to **TICK-012**–**TICK-015**
- **Context:** User asked to track/reconcile tickets from project day 1 (2026-10-24) using local `tickets` / `discussions` boards (not Notion).

## Notes

### Board rules applied

- One markdown file = one ticket; finished → `done/` (October archived in `done/2026-10/`).
- Chronological **TICK-NNN** from scaffold forward.
- Prior session tickets (users/permissions, systems, admin seed, board) renumbered **012–015**; old **001–004** ids retired via “Supersedes board id” notes.
- Meetings/notes: keep **MEET-001** for RBAC session; this meet records the day-1 backfill.

### Timeline covered

| When | Tickets |
| --- | --- |
| 2026-10-24 | **001** scaffold/remote · **002** base path/Vercel · **003** vaccination i18n/mycal · **004** version/deploy-ui |
| 2026-10-31 | **005** EPI branding |
| 2026-11-06–07 | **006** Work app |
| 2026-11-07 | **007** Keycloak · **008** files/entities/seed engine · **009** profile/cover · **010** role list/shell · **011** modules RBAC catalog · **012**–**015** (was MEET-001 scope) |

### Gaps / not filed as separate tickets

- One-off empty commit messages / version-only bumps (`1.0.x`) folded into **TICK-004** / deploy flow.
- Temporary card-hide for deploy test folded into **TICK-005**.
- Uncommitted vs committed: tickets track implemented work in trees, not only pushed commits.

## Decisions

| # | Decision | Lock |
| --- | --- | --- |
| D6 | Day-1 reconcile backfills chronological done tickets; does not invent backlog for undone ideas. | preferred |
| D7 | October tickets live under `done/2026-10/`; November flat in `done/`. | preferred |
| D8 | Renumber early board ids so TICK-001 = project start; point MEET-001 at TICK-012–015. | preferred |

## Action items

| Item | Owner | Ticket |
| --- | --- | --- |
| Commit/push `ticket` + `discussion` branches when ready | draungminoo | **TICK-015** |
| Optional: extend git-push-all for ticket/discussion | — | follow-up |
