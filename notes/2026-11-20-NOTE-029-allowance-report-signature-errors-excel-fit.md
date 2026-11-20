# Discussion: Allowance report signature errors Alert + Excel fit

- **Id:** NOTE-029
- **Date:** 2026-11-20
- **Meeting:** **MEET-025**
- **Status:** tracked; **TICK-059** done
- **Tickets:** **TICK-059**
- **Context:** Follow-on to **NOTE-028** / **TICK-058** — UI feedback for file/signature failures; Excel signature sizing.

## Notes

- **Alerts:** Allowance tab shows closable `Alert type="error"` above report content for data load, primary-signature list load, per-image file fetch (e.g. `file.read` Forbidden / 403), and Excel download failures. Signature image errors keep the first message (dedupe).
- **Root cause of many 403s:** RBAC denies `file.read` for the signed-in user; Alert surfaces the Forbidden body. Fixing access is role permission assignment, not UI.
- **Excel:** Signature column embeds use full `TABLE_ROW_HEIGHT` (pt→px); width = height × natural aspect from `createImageBitmap`; no fixed aspect that stretches.

## Decisions

| # | Decision |
| --- | --- |
| D73 | Allowance report failures (including signature file 403) show as error Alerts above content, not only toast/console. |
| D74 | Excel signature images: height = cell height; width keeps natural aspect ratio (no distort). |

## Action items

| Item | Owner | Ticket |
| --- | --- | --- |
| Alerts + Excel image fit | draungminoo | **TICK-059** |
| Ensure roles that view report signatures have `file.read` | draungminoo | (ops / role admin) |
