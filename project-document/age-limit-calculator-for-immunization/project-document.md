# Age Limit Calculator for Immunization

**App code:** C001  
**Location:** `src/pages/home/age-for-vaccination`  
**Product name (UI):** Age for vaccination / အသက်အလိုက် ကာကွယ်ဆေး

---

## Document control

| Field | Value |
| --- | --- |
| Document code | DOC-SW001 |
| Version | 1.0.0 |
| Documented date | 09-Nov-2026 |
| Author | Yan Sue |
| Reviewed by | Me, Brahms |
| Approved by | Me |
| Status | Recorded (retroactive) |
| Next review | — |

---

## Overview

Age Limit Calculator for Immunization is a front-end tool in the HLU UI that helps health workers decide whether a child is within the age window for selected routine vaccines (BCG and MMR), based on the child’s date of birth compared with a reference vaccination date (today by default, or a chosen date).

It does not store patient records, schedule appointments, or replace clinical judgment. It only shows date cutoffs so staff can compare against the child’s true date of birth.

---

## Description

The page presents the vaccination (as-of) date and three rule cards derived from that date:

1. **No vaccination (age exceeded)** — cutoff at as-of date − 60 months + 1 day. If the child’s DOB is on or before this cutoff, age-based vaccination is outside the intended window; staff are prompted to recheck age.
2. **Do not give BCG** — cutoff at as-of date − 12 months + 1 day. If the child’s DOB is on or before this day, BCG should not be given.
3. **MMR window** — give MMR only if the child’s DOB falls from as-of date − 60 months + 1 day through as-of date − 9 months (inclusive of that range as shown on screen).

Dates display in `DD-MMM-YYYY` (English) or Myanmar-digit Gregorian format (Myanmar locale). Staff can open Myanmar calendar (မြန်မာသက္ကရာဇ်) equivalents for the same Gregorian days. The as-of date defaults to today and can be changed with an on-page calendar.

The tool is available in English and Myanmar (မြန်မာ) and runs as part of the HLU web UI (including PWA where enabled).

This app was requested because field staff were immunizing children **outside the age range**, leading to **over-usage of vaccines**.

---

## Objectives

1. To prevent field staff from giving vaccination to children out of age range.
2. To get correct report data for the monitoring and evaluation team.

---

## Target users

- Field staff who give BCG and MMR and need age-window cutoffs on the vaccination day
- Program team members who support, validate, and train on the tool

---

## Scopes

### In scope

- Age-limit guidance for **BCG** and **MMR** only, relative to a vaccination (as-of) date
- Default as-of date = today; optional selection of another as-of date
- Display of cutoff dates so staff can compare with the child’s true date of birth
- English and Myanmar (မြန်မာ) UI labels and date display
- Myanmar calendar (မြန်မာသက္ကရာဇ်) view for the shown Gregorian dates
- Delivery as a page inside the HLU UI (`src/pages/home/age-for-vaccination`, app code C001)

### Out of scope

- Other vaccines beyond BCG and MMR
- Capturing, storing, or syncing child / patient records
- Electronic immunization registry, stock, or appointment scheduling
- Automatic eligibility decision that replaces clinical judgment
- Building or exporting M&E reports inside this page (correct use of age windows supports report quality; report systems themselves are outside this tool)
- Server APIs or admin / RBAC features (other HLU apps)

---

## Assumptions and limitations

### Assumptions

- Staff obtain and use the child’s **true** date of birth before applying the cutoffs.
- The vaccination (as-of) date on Card 1 is the correct reference day for the session (today, or a deliberately chosen date).
- Users understand BCG and MMR age rules as shown; the tool supports judgment and does not replace it.
- English or Myanmar locale is selected to match the user’s language needs.

### Limitations

- The tool does **not** capture, store, or validate the child’s DOB; comparison is done by the user.
- Only **BCG** and **MMR** age windows are covered; other antigens are out of scope.
- It does not produce M&E reports, registries, or stock/appointment workflows.
- Cutoffs depend on calendar month arithmetic as implemented; unusual calendars or manual overrides are not handled beyond the on-screen as-of date and Myanmar era display.
- Clinical contraindications, dosing, and cold-chain decisions are outside this app.

---

## UI design

The page is a single vertical column (narrow max width) so field staff can read it top-to-bottom on phone or desktop without side-by-side panels.

### Layout (top → bottom)

1. **Header** — app chip `C001`, page title, and short description of how to use the tool.
2. **Card 1 — Vaccination Date** — shows the as-of date (defaults to today). A calendar icon opens a date picker popover; a “Today” control resets to the current day. When the as-of date is today, a **Today** chip is shown.
3. **Info alert** — reminds staff to ask for the child’s **true** date of birth before applying the cutoffs.
4. **Card 2 — No vaccination (age exceeded)** — cutoff date (as-of − 60 months + 1 day) with warning that age may exceed the age-based window.
5. **Card 3 — Do not give BCG** — cutoff date (as-of − 12 months + 1 day); DOB on or before this day → do not give BCG.
6. **Card 4 — MMR window** — date range (as-of − 60 months + 1 day through as-of − 9 months); DOB must fall in this window to give MMR.

### Cards (numbered)

| # | Card | Purpose |
| --- | --- | --- |
| 1 | Vaccination Date | Reference (as-of) date for all cutoffs |
| 2 | No vaccination (age exceeded) | Upper age limit for age-based vaccination |
| 3 | Do not give BCG | BCG age cutoff |
| 4 | MMR window | Eligible DOB range for MMR |

### Interaction patterns

- **Cards** — each rule is an outlined paper block with an illustrative icon and a large, emphasized cutoff date.
- **သက္ကရာဇ် chip** — top-right on each date card; opens a dialog with the Myanmar calendar equivalent of the Gregorian date(s) shown.
- **Locale** — English and Myanmar; Gregorian display uses `DD-MMM-YYYY` (EN) or Myanmar digits / full month names (MM). MMR “from / until” wording order follows the active language.
- **No DOB input field** — the UI does not capture the child’s DOB; staff compare the printed cutoffs with the DOB they obtain verbally or from records.

---

## Formulas

Let **V** = Vaccination Date (Card 1; default = today).  
Cards **2**, **3**, and **4** are computed from **V**.

| Card | Formula | Rule |
| --- | --- | --- |
| **2** — No vaccination (age exceeded) | `V − 60 months + 1 day` | If child’s DOB is on or before this date → age exceeds the age-based vaccination window; recheck age. |
| **3** — Do not give BCG | `V − 12 months + 1 day` | If child’s DOB is on or before this date → do not give BCG. |
| **4** — MMR window | From `V − 60 months + 1 day` through `V − 9 months` | Give MMR only if child’s DOB falls within this range. |

Card **1** has no formula; it is the reference date **V** chosen by the user (or today).

### Note

**+ 1 day** is included on Card **2**, Card **3**, and the start date of Card **4**, to simplify field wording.

Without +1 day, staff would need: “on that day **and** earlier than that day.”  
With +1 day, staff can say: “**earlier than** this day” (i.e. earlier than day + 1), which covers the same DOB cases in plain language.

---

## Stakeholders

Stakeholders for this document (**DOC-SW001**, version **1.0.0**) and the Age Limit Calculator for Immunization (app code **C001**).

| # | Role | Name | Team |
| --- | --- | --- | --- |
| 1 | Project owner | Me | Program |
| 2 | Developer / analyst | Yan Sue | Program |
| 3 | Program | Me, Brahms, Sai Latt, Yan Sue | Program |
| 4 | Field staff | - | - |

---

## Milestones

| # | Milestone | Status | Date |
| --- | --- | --- | --- |
| 1 | Project start | Done | 22-Oct-2026 |
| 2 | Finalize requirements | Done | 24-Oct-2026 |
| 3 | UI finished | Done | 28-Oct-2026 |
| 4 | Review UI | Done | 29-Oct-2026 |
| 5 | Polish UI and finalize app | Done | 02-Nov-2026 |
| 6 | User manual finished | Done | 03-Nov-2026 |
| 7 | Training — Monthly Township Meeting | Done | 05-Nov-2026 |
| 8 | Project document **DOC-SW001** recorded | Done | 09-Nov-2026 |

### Note

This document is recorded **retroactively**. Milestone dates reflect when work happened; **DOC-SW001** was written after those events to record project existence and history.

---

## Signatures

By signing below, the undersigned acknowledge this document (**DOC-SW001**, version **1.0.0**) and the existence of the Age Limit Calculator for Immunization (app code **C001**).

<pre>
<strong>Frost</strong>                                               <strong>Brahms</strong>
Signature: ____________________                     Signature: ____________________
Date:      ____________________                     Date:      ____________________

<strong>Me</strong>                                                  <strong>Yan Sue</strong>
Signature: ____________________                     Signature: ____________________
Date:      ____________________                     Date:      ____________________
</pre>
