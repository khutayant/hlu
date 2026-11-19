import dayjs from 'dayjs';

/** Display datetime: 09-Nov-2026 10:30:00 AM */
export const DISPLAY_DATE_TIME_FORMAT = 'DD-MMM-YYYY hh:mm:ss A';
/** Display date only: 09-Nov-2026 */
export const DISPLAY_DATE_FORMAT = 'DD-MMM-YYYY';
/** Display time only: 10:30 AM */
export const DISPLAY_TIME_FORMAT = 'hh:mm A';

export function formatDisplayDateTime(
  value: string | Date | null | undefined,
): string {
  if (value === null || value === undefined || value === '') {
    return '—';
  }
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format(DISPLAY_DATE_TIME_FORMAT) : '—';
}

/**
 * Meeting report range:
 * - same calendar day → `19-Nov-2026 (10:00 AM – 04:00 PM)`
 * - different days → `19-Nov-2026 10:00 AM – 20-Nov-2026 04:00 PM`
 */
export function formatMeetingDateTimeRange(
  fromDate: string | Date | null | undefined,
  toDate: string | Date | null | undefined,
): string {
  const from = fromDate ? dayjs(fromDate) : null;
  const to = toDate ? dayjs(toDate) : null;
  if (!from?.isValid() && !to?.isValid()) {
    return '—';
  }
  if (from?.isValid() && !to?.isValid()) {
    return from.format(DISPLAY_DATE_TIME_FORMAT);
  }
  if (!from?.isValid() && to?.isValid()) {
    return to.format(DISPLAY_DATE_TIME_FORMAT);
  }
  if (from!.isSame(to!, 'day')) {
    return `${from!.format(DISPLAY_DATE_FORMAT)} (${from!.format(DISPLAY_TIME_FORMAT)} – ${to!.format(DISPLAY_TIME_FORMAT)})`;
  }
  return `${from!.format(DISPLAY_DATE_TIME_FORMAT)} – ${to!.format(DISPLAY_DATE_TIME_FORMAT)}`;
}
