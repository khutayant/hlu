# Discussion: Allowance report signature picker + shared editor

- **Id:** NOTE-028
- **Date:** 2026-11-20
- **Meeting:** **MEET-024**
- **Status:** tracked; **TICK-058** done
- **Tickets:** **TICK-058**
- **Context:** Follow-on to **NOTE-027** / **TICK-057** — use signatures on allowance reports and open the editor from anywhere by `employeeId`.

## Notes

- **Shared API (hlu-work):** `components/employee-signature/employee-signature-editor-dialog.tsx` — `useEmployeeSignatureEditor`: `openCreate`, `openEdit`, `openView` (active list + Use), `openPreview` (single paper).
- **Allowance Signature cell:** zero padding; image fills row height; context-menu + click.
- **Context menu:** View Signatures (`လက်မှတ်များ ကြည့်ရန်` / View Signatures); Create New Signature (`လက်မှတ်အသစ် ဖန်တီးရန်` / Create New Signature) — create allowed even when employee already has signatures.
- **List viewer:** fixed dialog shell `width 920` / `height 80vh`, overflow scroll; active-only small cards; select card → **Use** replaces that employee’s report signature **in memory** (override map; Excel uses effective map). Not saved to DB.
- **Add New** in list dialog **header** (default button size); create opens as **stacked** dialog (DialogProvider stack) so list stays open; list reloads after save.
- **Left-click** cell with image → single paper preview dialog (not the list).
- **DialogProvider:** custom dialogs push/pop a stack; each modal scopes `closeDialog` / `setDialogActions` to its entry.
- **Follow-on:** page Alerts for file/signature errors + Excel cell-height aspect-fit → **NOTE-029** / **TICK-059**.

## Decisions

| # | Decision |
| --- | --- |
| D71 | Shared signature editor/viewer callable by `employeeId`; allowance report uses context menu + in-memory **Use** for export (no DB pick). |
| D72 | View Signatures lists **active** only; Add New stacks on top of the list; left-click shows single paper preview. |
| — | Errors Alert + Excel image fit → **D73–D74** / **NOTE-029**. |

## Action items

| Item | Owner | Ticket |
| --- | --- | --- |
| Shared editor + allowance picker UX | draungminoo | **TICK-058** |
