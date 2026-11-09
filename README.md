# HLU — Tickets

Project board as folders. **One markdown file = one ticket.** Move the file when status changes.

## Branches

| Local folder | Branch |
| --- | --- |
| `tickets/` | `ticket` |

Remote: `https://github.com/khutayant/hlu.git` (same as ui/server/hlu-work).

## Git push

- This folder only: `npm run git:push` (branch `ticket`)
- All HLU branches: `bash /Users/aungminoo/Projects/HLU/scripts/git-push-all.sh`

## Lanes

| Folder | Meaning |
| --- | --- |
| `backlog/` | Agreed work, not started |
| `in-progress/` | Currently being implemented |
| `done/` | Finished (implemented) |
| `future/` | Ideas, later |
| `wont-do/` | Cancelled / will not implement |
| `plan/` | Day todo — not a ticket |

## File name

`YYYY-MM-DD-TICK-NNN-short-slug.md`

Ticket No is sequential (`TICK-001`, `TICK-002`, …). Copy `_template.md`. Next number after existing: **TICK-018**.

October 2026 tickets are archived under `done/2026-10/`. Current-month tickets stay flat in `done/`.

## How we work

1. Discuss first. Do not code yet until agreed.
2. Create a ticket in `backlog/` (or `future/` if later).
3. Do not invent tickets for unrelated past work.
4. Implement only on explicit command; move to `in-progress/`, then `done/`.
5. **Track changes:** update tickets + discussions (meetings/notes) for this thread. Create a new ticket when the change set has no ticket. Finished work → `done/`. Do not start coding from track-changes alone.
