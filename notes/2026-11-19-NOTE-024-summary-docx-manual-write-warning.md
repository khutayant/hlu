# Discussion: Summary DOCX manual-write warning

- **Id:** NOTE-024
- **Date:** 2026-11-19
- **Meeting:** **MEET-020**
- **Status:** tracked; **TICK-054** done
- **Tickets:** **TICK-054**
- **Context:** After **MEET-019** / **NOTE-023**.

## Notes

- **Confirm:** Title/message keep download ask; add `Alert` type `warning`.
- **EN:** The system can only fill in the correct data. Writing the report must be done by you manually.
- **MM:** စနစ်သည် မှန်ကန်သော အချက်အလက်ကိုသာ ထည့်သွင်းပေးနိုင်သည်။ အစီရင်ခံစာ ရေးသားခြင်းကို အသုံးပြုသူက ကိုယ်တိုင် ပြုလုပ်ရမည်။
- **Dialog:** `confirmDialog` message as ReactNode uses a `div` wrapper (strings stay in `Typography.Paragraph`).

## Decisions

| # | Decision |
| --- | --- |
| D66 | Summary Word download confirm warns that the system only supplies correct data; writing the report is manual (EN + MM). |

## Action items

| Item | Owner | Ticket |
| --- | --- | --- |
| Manual-write warning on DOCX confirm | draungminoo | **TICK-054** |
