# Docs board + Age Limit Calculator documents

- **Id:** TICK-017
- **Status:** done
- **Repos:** DOCS
- **Opened:** 2026-11-09
- **Finished:** 2026-11-09
- **Creator:** draungminoo
- **Assignee:** draungminoo
- **Related:** **MEET-004** / **NOTE-004** · extends **TICK-016** (push-all) for branch `docs`

## Goal

Stand up `docs/` as its own HLU branch, move the Age Limit Calculator project document out of the UI tree, and add field-facing documentation for that app only.

## Scope

- [x] Init `docs/` git repo on branch `docs`, remote `https://github.com/khutayant/hlu.git`
- [x] `package.json` + `scripts/git-push.sh` + Cursor git-push rule for `docs`
- [x] Wire `docs` into `scripts/git-push-all.sh` and git-push rules (ui, server, hlu-work, tickets, discussions)
- [x] Move `hlu/notes/project-document/age-limit-calculator-for-immunization/` → `docs/project-document/age-limit-calculator-for-immunization/`
- [x] Add `docs/documentation/age-limit-calculator-for-immunization/documentation.md` (how to use C001)

## Out of scope

- First commit / push of `docs` (explicit commit + push when asked)
- Project charter and functional-requirements content (placeholders were empty; only `project-document.md` remains)
- Committing git-push rule edits on other branches until asked

## Done when

- [x] Age Limit docs live under `docs/` only (project document + documentation)
- [x] Bare **git push** includes branch `docs` once the repo has commits
