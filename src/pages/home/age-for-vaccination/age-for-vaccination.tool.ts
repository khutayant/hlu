import dayjs, { type Dayjs } from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import 'dayjs/locale/my';
import { Mycal } from 'mycal';

dayjs.extend(customParseFormat);

export const DISPLAY_DATE_FORMAT = 'DD-MMM-YYYY';
export const INPUT_DATE_FORMAT = 'YYYY-MM-DD';

export type DateInput = Dayjs | Date | string;
export type DateDisplayLocale = 'en' | 'mm';

const MYANMAR_DIGITS = '၀၁၂၃၄၅၆၇၈၉';

export function toDayjs(value: DateInput): Dayjs {
  return dayjs(value).startOf('day');
}

/** Convert Western digits to Myanmar digits (၀–၉). */
export function toMyanmarDigits(value: string): string {
  return value.replace(/\d/g, (digit) => MYANMAR_DIGITS[Number(digit)] ?? digit);
}

/**
 * Format date for display.
 * - en: 24-Oct-2026 (short month)
 * - mm: ၂၄-အောက်တိုဘာ-၂၀၂၆ (full month name + Myanmar digits)
 */
export function formatDdMmmYyyy(
  value: DateInput,
  locale: DateDisplayLocale = 'en',
): string {
  const dayjsLocale = locale === 'mm' ? 'my' : 'en';
  const format = locale === 'mm' ? 'DD-MMMM-YYYY' : DISPLAY_DATE_FORMAT;
  const formatted = toDayjs(value).locale(dayjsLocale).format(format);

  return locale === 'mm' ? toMyanmarDigits(formatted) : formatted;
}

/** Parse YYYY-MM-DD from `<input type="date">`. */
export function parseIsoDate(value: string): Dayjs | null {
  const parsed = dayjs(value, INPUT_DATE_FORMAT, true);
  return parsed.isValid() ? parsed.startOf('day') : null;
}

export function toIsoDate(value: DateInput = dayjs()): string {
  return toDayjs(value).format(INPUT_DATE_FORMAT);
}

/** Myanmar calendar date string (မြန်မာသက္ကရာဇ်) for a Gregorian day. */
export function formatMyanmarCalendarDate(value: DateInput): string {
  const cal = new Mycal(toIsoDate(value));
  return `${cal.year.my} ခုနှစ် ${cal.month.my} ${cal.day.mp.my} ${cal.day.fd.my} ရက်`;
}

export type EligibilitySummaryKey =
  | 'ageForVaccination.summaryNone'
  | 'ageForVaccination.summaryNoBcg'
  | 'ageForVaccination.summaryAllowed';

export type VaccinationEligibility = {
  allowVaccination: boolean;
  allowBcg: boolean;
  noVaccineCutoff: Dayjs;
  noBcgCutoff: Dayjs;
  summaryKey: EligibilitySummaryKey;
};

/**
 * - DOB on/before (asOf − 60 months) → no vaccination at all
 * - DOB on/before (asOf − 12 months) → no BCG (other vaccination still allowed)
 */
export function getVaccinationEligibility(
  dob: DateInput,
  asOf: DateInput = dayjs(),
): VaccinationEligibility {
  const asOfDay = toDayjs(asOf);
  const dobDay = toDayjs(dob);
  const noVaccineCutoff = asOfDay.subtract(60, 'month');
  const noBcgCutoff = asOfDay.subtract(12, 'month').add(1, 'day');

  if (dobDay.isSame(noVaccineCutoff) || dobDay.isBefore(noVaccineCutoff)) {
    return {
      allowVaccination: false,
      allowBcg: false,
      noVaccineCutoff,
      noBcgCutoff,
      summaryKey: 'ageForVaccination.summaryNone',
    };
  }

  if (dobDay.isSame(noBcgCutoff) || dobDay.isBefore(noBcgCutoff)) {
    return {
      allowVaccination: true,
      allowBcg: false,
      noVaccineCutoff,
      noBcgCutoff,
      summaryKey: 'ageForVaccination.summaryNoBcg',
    };
  }

  return {
    allowVaccination: true,
    allowBcg: true,
    noVaccineCutoff,
    noBcgCutoff,
    summaryKey: 'ageForVaccination.summaryAllowed',
  };
}
