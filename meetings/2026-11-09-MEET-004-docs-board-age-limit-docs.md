# Meeting: Docs board + Age Limit Calculator documents

- **Id:** MEET-004
- **Date:** 2026-11-09
- **Attendees:** draungminoo
- **Status:** tracked; implemented
- **Note:** **NOTE-004**
- **Tickets:** **TICK-017** done
- **Context:** Project document for Age Limit Calculator (DOC-SW001 / C001) lived under `hlu/notes/`. Empty `docs/` folder was added to the workspace; move documents there and treat `docs` like ticket/discussion.

## Notes

- Moved DOC-SW001 project document into `docs/project-document/age-limit-calculator-for-immunization/`.
- Usage documentation lives only under `docs/documentation/age-limit-calculator-for-immunization/documentation.md` (this app only; no shared multi-app doc tree).
- `docs/` mirrors tickets/discussions: `npm run git:push` → branch `docs`.
- Push-all and Cursor rules now list `docs` with ui / server / hlu-work / ticket / discussion.
- Local `docs` has files but **no commits yet**; other trees only dirty on `.cursor/rules/git-push.mdc` for the docs row.

## Decisions

| # | Decision | Lock |
| --- | --- | --- |
| D12 | `docs/` is branch `docs` on the shared `khutayant/hlu` remote; bare **git push** includes it via `git-push-all.sh`. | preferred |
| D13 | Age Limit project document path: `docs/project-document/age-limit-calculator-for-immunization/`. | preferred |
| D14 | Age Limit usage documentation path: `docs/documentation/age-limit-calculator-for-immunization/` only. | preferred |
| D15 | Named push: **`git push docs`** → from `docs/`, `npm run git:push` only. | preferred |

## Action items

| Item | Owner | Ticket |
| --- | --- | --- |
| Commit + push `docs` (and git-push rule edits) when asked | draungminoo | **TICK-017** |
