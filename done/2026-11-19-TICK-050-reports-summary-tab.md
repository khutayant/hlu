# Meeting reports — summary tab (tables 1–2)

- **Id:** TICK-050
- **Status:** done
- **Repos:** WORK
- **Opened:** 2026-11-19
- **Finished:** 2026-11-19
- **Creator:** draungminoo
- **Assignee:** draungminoo
- **Related:** **TICK-047**, **TICK-037** · **MEET-017** / **NOTE-021**

## Goal

Add a Reports summary tab with township-wise gender and participant-category matrices, filters, and per-table export/copy.

## Scope

- [x] Tab **Reports summary** last (`?tab=summary`); default remains attendance
- [x] Table 1: township × Female / Male / Total (no township → Head Office)
- [x] Table 2: participant category (position) × township columns + Head Office + Total
- [x] Require township multi-select (`summaryTownships`); **Add head office** (`summaryAddHeadOffice=1`) merges `HEAD_OFFICE_POSITION` employees
- [x] Table 2: all HO-position people roll up to hardcoded **Program and Supporting**
- [x] Per-table ⋮ menu: Download Excel + Copy table (HTML/TSV for Excel/Word)

## Out of scope

- Excel workbook of the full meeting report pack including summary
- Editable category labels beyond HO rollup

## Done when

- [x] Summary tables match selected townships (+ optional HO add) and support download/copy
