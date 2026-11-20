# E-signature data folders — rename to `[empNo]-[focalNo].ext`

- **Id:** TICK-056
- **Status:** done
- **Repos:** WORK
- **Opened:** 2026-11-20
- **Finished:** 2026-11-20
- **Creator:** draungminoo
- **Assignee:** draungminoo
- **Related:** **MEET-022** / **NOTE-026**

## Goal

Organize raw e-signature images under `hlu-server/local-data/e-signature/data/` by area folder (`hlu`, `myaing`, `saw`, …) and rename linked files to `[employeeNo]-[focalNo].ext` when the match is clear.

## Scope

- [x] Create `data/<area>` folders (lowercase): `hlu`, `myaing`, `saw`, `yesagyo`, `ggw`, `pauk`, `tilin`
- [x] Copy from `raw-data/E-Signature_*` (and nested folders)
- [x] Rename clear unique employee matches to `[empNo]-[focalNo].ext` (DB lookup)
- [x] Leave unmatched / ambiguous files as kebab names
- [x] HLU: use preferred Brahms (`dr-brahms-1`) and Me (`me-1`) only

## Out of scope

- Uploading signatures into the app / employee profile wiring
- Pushing `local-data` / `dir` to GitHub

## Done when

- [x] All township/HO raw signature sets processed into `data/`; clear matches use emp-focal filenames
