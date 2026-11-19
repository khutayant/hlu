# Discussion: HO employees, reports filters, PATCH-only, list filters

- **Id:** NOTE-015
- **Date:** 2026-11-19
- **Meeting:** **MEET-011**
- **Status:** tracked; **TICK-028**–**TICK-032** done
- **Tickets:** **TICK-028**, **TICK-029**, **TICK-030**, **TICK-031**, **TICK-032**
- **Context:** Follow-on after session-number prefix (**TICK-027** / **NOTE-014**). Head-office employees, attendance import normalize, meeting report township filters, ban PUT, employee No Township filter.

## Notes

- Head office: township optional; focal letter prefix must be `HO`. With township, prefix must match `township.focalPrefix`. Local CSVs split under `employee-data/employee-focal` and `employee-ho`; attendance rematched including HO focals.
- Attendance import already drops successful rows and keeps errors. Focal normalize now strips **all** whitespace then uppercases (UI + server).
- Meeting reports: township multi-select is **per tab** (Attendance vs Allowance), chips show all selected names, dropdown fits content. Empty = all townships.
- Expired access token DEBUG logs are expected before reactive refresh on 401. Employee update failures were also CORS: PUT not allowed. Decision: never use PUT in app APIs; updates are PATCH only; `ApiPut` removed; checker forbids PUT.
- Employee list township filter adds **No Township** → server `__none__` → `townshipId IS NULL`. Filter menus use `popupMatchSelectWidth={false}`.

## Decisions

| # | Decision |
| --- | --- |
| D39 | Head-office employees may have no township; their focal numbers must start with `HO`. Township employees must match that township’s `focalPrefix`. |
| D40 | Attendance import normalizes focal nos by stripping all whitespace and uppercasing before validate/resolve/import. |
| D41 | Meeting report township filters are independent per report tab, multi-select with all chips visible; empty means all townships. |
| D42 | App HTTP updates never use PUT — PATCH only. `ApiPut` is removed; boot check fails on any PUT route. CORS stays without PUT. |
| D43 | Employee list township filter includes **No Township** for rows with null `townshipId`. |

## Action items

| Item | Owner | Ticket |
| --- | --- | --- |
| HO township + HO focal + local data | draungminoo | **TICK-028** |
| Attendance focal normalize | draungminoo | **TICK-029** |
| Reports township multi-filter | draungminoo | **TICK-030** |
| Forbid PUT / PATCH-only | draungminoo | **TICK-031** |
| Employee No Township filter | draungminoo | **TICK-032** |
