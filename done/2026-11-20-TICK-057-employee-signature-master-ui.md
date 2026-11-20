# Employee signature master — API + employee detail UI

- **Id:** TICK-057
- **Status:** done
- **Repos:** SERVER / WORK
- **Opened:** 2026-11-20
- **Finished:** 2026-11-20
- **Creator:** draungminoo
- **Assignee:** draungminoo
- **Related:** **MEET-023** / **NOTE-027** · follows local assets **TICK-056**

## Goal

Store and manage employee e-signatures (image + printed name/position) from the employee detail page, with free PNG crop (transparency) and no fixed output size.

## Scope

- [x] `EmployeeSignatureMaster` entity (primary partial unique per employee); register in `database.config`
- [x] `SIGNATURE_IMAGE` file category seed
- [x] Server `employee-signature` module (list / create / update / set active + image upload category check)
- [x] Employee detail menu-panel: Profile | Signature
- [x] Signature panel: list, create/edit dialog (Info | Signature), activate/deactivate confirm
- [x] Crop: PNG + transparency grid; free resize via crop-box handles; camera picks / preview opens image
- [x] Dialog UX: primary above description; no textarea resize; body–footer gap

## Out of scope

- Bulk import of `local-data/e-signature/data` into the table
- Allowance report signature picker / in-memory Use → **TICK-058**

## Done when

- [x] Can create/edit/list employee signatures from work UI against server API
- [ ] Apply DB migration for `employee_signature_master` on environments that need the table (local auto file: `migrations/current/1795152228608-auto-generated.ts` — run/confirm separately)
