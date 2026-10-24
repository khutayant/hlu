import dayjs, { type Dayjs } from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat);

export const DISPLAY_DATE_FORMAT = 'DD-MMM-YYYY';
export const INPUT_DATE_FORMAT = 'YYYY-MM-DD';

export type DateInput = Dayjs | Date | string;

export function toDayjs(value: DateInput): Dayjs {
  return dayjs(value).startOf('day');
}

/** Format as DD-MMM-YYYY (e.g. 24-Oct-2026). */
export function formatDdMmmYyyy(value: DateInput): string {
  return toDayjs(value).format(DISPLAY_DATE_FORMAT);
}

/** Parse YYYY-MM-DD from `<input type="date">`. */
export function parseIsoDate(value: string): Dayjs | null {
  const parsed = dayjs(value, INPUT_DATE_FORMAT, true);
  return parsed.isValid() ? parsed.startOf('day') : null;
}

export function toIsoDate(value: DateInput = dayjs()): string {
  return toDayjs(value).format(INPUT_DATE_FORMAT);
}

export type VaccinationEligibility = {
  allowVaccination: boolean;
  allowBcg: boolean;
  noVaccineCutoff: Dayjs;
  noBcgCutoff: Dayjs;
  summary: string;
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
  const noBcgCutoff = asOfDay.subtract(12, 'month');

  if (dobDay.isSame(noVaccineCutoff) || dobDay.isBefore(noVaccineCutoff)) {
    return {
      allowVaccination: false,
      allowBcg: false,
      noVaccineCutoff,
      noBcgCutoff,
      summary: 'No vaccination — DOB is on or before today minus 60 months.',
    };
  }

  if (dobDay.isSame(noBcgCutoff) || dobDay.isBefore(noBcgCutoff)) {
    return {
      allowVaccination: true,
      allowBcg: false,
      noVaccineCutoff,
      noBcgCutoff,
      summary: 'No BCG — DOB is on or before today minus 12 months.',
    };
  }

  return {
    allowVaccination: true,
    allowBcg: true,
    noVaccineCutoff,
    noBcgCutoff,
    summary: 'Vaccination allowed, including BCG.',
  };
}
