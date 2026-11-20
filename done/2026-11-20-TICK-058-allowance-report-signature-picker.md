# Allowance report — signature picker + shared editor

- **Id:** TICK-058
- **Status:** done
- **Repos:** WORK
- **Opened:** 2026-11-20
- **Finished:** 2026-11-20
- **Creator:** draungminoo
- **Assignee:** draungminoo
- **Related:** **MEET-024** / **NOTE-028** · follows **TICK-057** / **MEET-023**

## Goal

Reuse employee signature create/edit as a common component; from allowance report Signature cells, pick or create signatures for export without navigating to the employee page. In-memory picks only (no DB write for report selection).

## Scope

- [x] Shared `useEmployeeSignatureEditor` (`openCreate` / `openEdit` / `openView` / `openPreview`) + `SignaturePaperBlock`
- [x] Employee Signature tab uses shared create/edit
- [x] Allowance report Signature cell: padding 0; image fills cell height
- [x] Right-click menu: **View Signatures** / **Create New Signature** (add even if one exists)
- [x] View Signatures: large dialog (`80vh`), active-only card grid, select + **Use** → in-memory override for cell + Excel
- [x] Header **Add New** (normal size); create stacks on top of list (list stays open); list reloads after save
- [x] Left-click signed cell → single paper preview (not the list)
- [x] DialogProvider custom dialogs support stack (nested open/close)

## Out of scope

- Persisting report signature picks to DB
- Showing inactive signatures in the report picker

## Done when

- [x] Can open create/view/preview by `employeeId` from allowance report
- [x] **Use** updates report cell + Excel export in memory only
- [x] Add New does not dismiss the signatures list viewer
