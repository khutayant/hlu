# Allowance report — signature errors Alert + Excel image fit

- **Id:** TICK-059
- **Status:** done
- **Repos:** WORK
- **Opened:** 2026-11-20
- **Finished:** 2026-11-20
- **Creator:** draungminoo
- **Assignee:** draungminoo
- **Related:** **MEET-025** / **NOTE-029** · follows **TICK-058** / **MEET-024**

## Goal

Surface allowance-report failures (including signature file `403`s) as error Alerts above the report content, and embed Excel signature images at full cell height without distorting aspect ratio.

## Scope

- [x] Page Alerts above allowance content for load / signature-list / signature-image / Excel download errors (closable; image errors deduped)
- [x] Propagate `fetchAuthorizedFileUrl` failures from Signature cells into the Alert (was swallowed)
- [x] Excel embed: image height = data-row cell height; width from natural aspect ratio (`createImageBitmap`); horizontally centered

## Out of scope

- Granting `file.read` RBAC for roles missing it (operator / role admin; server still returns Forbidden until permitted)

## Done when

- [x] File/signature load Forbidden (and other report errors) visible as error Alert on the allowance tab
- [x] Excel signatures fill cell height without stretching
