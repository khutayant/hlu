# Age Limit Calculator for Immunization

**App code:** C001  
**On-screen name:** Age for vaccination / အသက်အလိုက် ကာကွယ်ဆေး  
**Page:** HLU UI home (`/` ; `/age-for-vaccination` opens the same page)  
**Source:** `hlu/src/pages/home/age-for-vaccination`  
**Project document:** `project-document/age-limit-calculator-for-immunization/project-document.md` (DOC-SW001)

This page shows date cutoffs for **BCG** and **MMR** so field staff can compare them with a child’s true date of birth. It does not store the child, and it does not mark a child allowed or not allowed. Staff read the cards and decide.

Default language is Myanmar (မြန်မာ). English is available from the language control. The choice is kept in the browser.

---

## How to use it

1. Open the page. Card 1 shows today’s date as the vaccination date.
2. If the session day is a different day, open the calendar on Card 1 and pick that day. **Today** in the calendar returns to the current day. A **Today** / **ယနေ့** chip appears beside the title only when the selected day is today.
3. Ask for the child’s **true** date of birth. The blue note under Card 1 says this: “Ask for the child's true date of birth.” / “ကလေး၏ မွေးနေ့အမှန်ကို မေးပါ။”
4. Compare that date of birth with Cards 2, 3, and 4. Every cutoff is calculated from the date on Card 1. Changing Card 1 updates the other cards immediately.
5. There is no date-of-birth box and no Save. When the next child is seen, compare again. Change Card 1 only when the vaccination day itself changes.

---

## Screen, top to bottom

| # | Card | English | Myanmar | What staff compare |
| --- | --- | --- | --- | --- |
| 1 | Vaccination date | Vaccination Date | ကာကွယ်ဆေးထိုးမည့်နေ့ | The reference day. Hint: “You can change the date.” / “ကာကွယ်ဆေးထိုးမည့်နေ့ကို ပြောင်းလဲလို့ ရပါသည်။” |
| 2 | Age exceeded | If the child's date of birth is **earlier than** the date shown, age is past the age-based window. Recheck the age. | ကလေး၏မွေးနေ့သည် ဤနေ့ထက် ပို၍စောပါက — အသက်သည် သတ်မှတ်အသက်ထက် ကျော်လွန်နေပါသည်။ အသက်ကို ပြန်လည်စစ်ဆေးပါ။ | Date of birth against one cutoff |
| 3 | BCG | If the child's date of birth is **earlier than** the date shown, do not give BCG. | ဤနေ့ထက် ပို၍စောပါက ဘီစီဂျီ မထိုးရ။ | Date of birth against one cutoff |
| 4 | MMR | Give MMR only when the date of birth is **from** the first date **until** the second date. | ပထမရက် မှ ဒုတိယရက် နေ့အထိ ရှိနေမှသာ MMR ကာကွယ်ဆေးထိုးရမည်။ | Date of birth against a range. Both ends count. |

Each card has an icon and a large date. A **သက္ကရာဇ်** chip on the card opens the Myanmar-era reading of that same day (both days, on the MMR card).

---

## Formulas

**V** is the vaccination date on Card 1.

| Card | Date on screen | How to apply it |
| --- | --- | --- |
| 2 | `V − 60 months + 1 day` | Date of birth **earlier than** this day: the child is past the age-based window. Recheck age before vaccinating. |
| 3 | `V − 12 months + 1 day` | Date of birth **earlier than** this day: do not give BCG. |
| 4 | From `V − 60 months + 1 day` through `V − 9 months` | Give MMR only when the date of birth falls on one of these days or between them. |

“Earlier than” means the child’s date of birth is before the printed day. A date of birth **on** the printed day of Card 2 or Card 3 is not earlier than that day.

The extra day is there so staff can say “earlier than this day” in one phrase. The same children are covered as “on or before `V − 60 months`” (Card 2) and “on or before `V − 12 months`” (Card 3).

Months are Gregorian calendar months, the same subtraction the page uses. A day that does not exist in the target month lands on the last day of that month (for example, 31 March minus one month lands on the last day of February).

---

## Worked example

Vaccination date **V = 09-Nov-2026** (၀၉-နိုဝင်ဘာ-၂၀၂၆).

| Card | English | Myanmar digits | မြန်မာသက္ကရာဇ် |
| --- | --- | --- | --- |
| 1 | 09-Nov-2026 | ၀၉-နိုဝင်ဘာ-၂၀၂၆ | ၁၃၈၈ ခုနှစ် တန်ဆောင်မုန်း လဆန်း ၂ ရက် |
| 2 | 10-Nov-2021 | ၁၀-နိုဝင်ဘာ-၂၀၂၁ | ၁၃၈၃ ခုနှစ် တန်ဆောင်မုန်း လဆန်း ၉ ရက် |
| 3 | 10-Nov-2025 | ၁၀-နိုဝင်ဘာ-၂၀၂၅ | ၁၃၈၇ ခုနှစ် တန်ဆောင်မုန်း လပြည့်ကျော် ၈ ရက် |
| 4 start | 10-Nov-2021 | ၁၀-နိုဝင်ဘာ-၂၀၂၁ | ၁၃၈၃ ခုနှစ် တန်ဆောင်မုန်း လဆန်း ၉ ရက် |
| 4 end | 09-Feb-2026 | ၀၉-ဖေဖော်ဝါရီ-၂၀၂၆ | ၁၃၈၇ ခုနှစ် တပို့တွဲ လပြည့်ကျော် ၈ ရက် |

Reading those cards for this vaccination day:

- Date of birth before 10-Nov-2021: past the age-based window. Recheck age. MMR is also outside the window, because the MMR range starts on 10-Nov-2021.
- Date of birth on 10-Nov-2021: not earlier than the Card 2 day, and it is the first day of the MMR range.
- Date of birth before 10-Nov-2025: do not give BCG. A child in the MMR range can still meet Card 4 while failing Card 3. Example: 01-Jan-2024 is inside 10-Nov-2021 through 09-Feb-2026, and it is earlier than 10-Nov-2025, so MMR is in range and BCG is not given.
- Date of birth on 10-Nov-2025: not earlier than the BCG day.
- Date of birth after 09-Feb-2026: outside the MMR range.

---

## Dates on screen

| Locale | Gregorian shape | Example |
| --- | --- | --- |
| English | `DD-MMM-YYYY` | 09-Nov-2026 |
| Myanmar | Myanmar digits and the full month name | ၀၉-နိုဝင်ဘာ-၂၀၂၆ |

The calendar popover uses the active language for the month and year. Weekday headings stay English (`Mon`, `Tue`, …) in both languages.

**သက္ကရာဇ်** shows the Myanmar era for the Gregorian day already on the card. It does not recalculate the cutoff in lunar months. On the MMR card the dialog lists both ends of the range. English order is “from … until …”. Myanmar order is “‹start› မှ ‹end› နေ့အထိ”.

---

## What stays outside this page

- Vaccines other than BCG and MMR
- Entering, checking, or saving a date of birth
- A single allowed / not-allowed result for the child
- Registries, stock, appointments, and monitoring-and-evaluation reports
- Clinical contraindications, dose, and cold chain
- A cutoff typed in by hand, or a cutoff calculated from a calendar other than the Gregorian month math above

The only date staff change is the vaccination date on Card 1. The Myanmar-era dialog is another way to read the dates the page already calculated.
