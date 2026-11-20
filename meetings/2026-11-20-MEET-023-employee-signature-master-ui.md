# Meeting: Employee signature master + UI

- **Id:** MEET-023
- **Date:** 2026-11-20
- **Attendees:** draungminoo
- **Status:** tracked
- **Note:** **NOTE-027**
- **Tickets:** **TICK-057**
- **Context:** After **TICK-056** local e-sig files; wire entity + employee Signature tab.

## Notes

- Entity: name, primary (≤1 per employee), signatureImage, signatureName, signaturePosition, description, active.
- No agent-authored migration required at kickoff; table apply is operator-side (auto-generated migration may exist locally).
- UI: Profile | Signature menu panel; dialog split Info | Signature; name/position under Info; image on right.
- Crop: free size (handles on crop box), PNG alpha; camera = pick, click preview = open.

## Decisions

| # | Decision | Lock |
| --- | --- | --- |
| D69 | See **NOTE-027**. | preferred |
| D70 | Shared လက်မှတ် ထည့်ရန် editor by `employeeId`; allowance Signature cell context-menu Add Signature. | preferred |
| — | Report picker / stacked Add New / paper preview click → **MEET-024** / **TICK-058**. | — |

## Action items

| Item | Owner | Ticket |
| --- | --- | --- |
| Implement D69 | draungminoo | **TICK-057** |
| Apply `employee_signature_master` migration where needed | draungminoo | **TICK-057** |
