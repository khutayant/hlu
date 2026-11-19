# Discussion: Session number uses township focal prefix

- **Id:** NOTE-014
- **Date:** 2026-11-19
- **Meeting:** **MEET-010**
- **Status:** tracked; **TICK-027** done
- **Tickets:** **TICK-027** (uses **TICK-020** `focalPrefix`)
- **Context:** Immunization Sessions at `/masters/project/immunization-sessions`. User asked how session no is set, then to use the township's `focalPrefix` as a dynamic prefix.

## Notes

- Previously `CODE_STRUCTURE.sessionNo` was fixed: `SEC` + year + 4 digits (`SEC20260001`), assigned in `ImmunizationSessionService.create` via `GenCodeService`. The form does not accept a number; edit shows it disabled.
- Now the prefix is the selected township's `focalPrefix` (1–5 chars, `A-Z0-9`, already stored uppercase). Example: `GN20260001`.
- Passing `prefix` into `getInfoCode` overrides the structure prefix and keeps a separate yearly counter for that prefix. Townships that share a `focalPrefix` share the sequence, because `sessionNo` is globally unique.
- Check `CHK_immunization_session_sessionNo`: `^[A-Z0-9]{1,5}[0-9]{8}$`. Existing `SEC2026…` rows still pass. Migration `ManualGenerated1795100000000` applied locally.
- `sessionNo` column stays `varchar(16)` (max length 5 + 4 + 4 = 13).

## Decisions

| # | Decision |
| --- | --- |
| D38 | Immunization session numbers use the township `focalPrefix` + year + 4 digits. The sequence is per prefix and year. The number is generated on create and is immutable. |

## Action items

| Item | Owner | Ticket |
| --- | --- | --- |
| Prefix from township + check migration | draungminoo | **TICK-027** |
