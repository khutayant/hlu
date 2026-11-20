# Discussion: Employee signature master + UI

- **Id:** NOTE-027
- **Date:** 2026-11-20
- **Meeting:** **MEET-023**
- **Status:** tracked; **TICK-057** done (migration apply pending per env)
- **Tickets:** **TICK-057**
- **Context:** Employee e-signatures in app (not only local-data files).

## Notes

- **Entity:** `EmployeeSignatureMaster` — display when signing = image + `signatureName` + `signaturePosition`; at most one `primary` per employee (partial unique index).
- **Files:** category `SIGNATURE_IMAGE`.
- **Server:** `employee-signature` module (CRUD-ish list/create/update + set active).
- **Work UI:** employee detail → Profile | Signature; create/edit custom dialog (Info: name, signature name/position, primary, description; Signature: image picker).
- **Common editor:** `useEmployeeSignatureEditor` / `SignaturePaperBlock` in `components/employee-signature/` — open create/edit by `employeeId` from anywhere; employee Signature tab and allowance report reuse it. Follow-on report picker: **NOTE-028** / **TICK-058**.
- **Allowance report (early):** with **Add signature** on, primary/latest in Signature col + Excel. Extended picker UX → **NOTE-028**.
- **Crop / picker:** `freeResize` corner/edge handles; output PNG at cropped pixels (no fixed size); transparency grid; camera opens file pick; clicking preview opens lightbox; empty surface still picks.
- **Dialog polish:** primary above description; description `resize: none`; shared dialog footer padding/gap.
- **DB:** Operator must ensure `employee_signature_master` exists (local untracked/auto migration `1795152228608-auto-generated.ts` if present).

## Decisions

| # | Decision |
| --- | --- |
| D69 | Employee signatures live in `EmployeeSignatureMaster` + `SIGNATURE_IMAGE`; managed from employee Signature tab with free PNG crop (handles, no fixed size); camera picks / preview opens; migration apply is separate from entity/UI delivery. |
| D70 | လက်မှတ် ထည့်ရန် editor is a shared component callable by `employeeId`; allowance Signature cells expose context-menu Add Signature (add even when one exists). Extended in **D71–D72** / **NOTE-028**. |

## Action items

| Item | Owner | Ticket |
| --- | --- | --- |
| Ship entity + API + Signature UI | draungminoo | **TICK-057** |
| Run migration for signature table when ready | draungminoo | **TICK-057** |
