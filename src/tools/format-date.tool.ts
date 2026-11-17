import dayjs from 'dayjs';

/** Display datetime: 09-Nov-2026 10:30:00 AM */
export const DISPLAY_DATE_TIME_FORMAT = 'DD-MMM-YYYY hh:mm:ss A';

export function formatDisplayDateTime(
  value: string | Date | null | undefined,
): string {
  if (value === null || value === undefined || value === '') {
    return '—';
  }
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format(DISPLAY_DATE_TIME_FORMAT) : '—';
}
