import dayjs from 'dayjs';

/**
 * `YYYYMMDD-Report-[Meeting Name]-[HH_mm_ss].ext`
 */
export function buildMeetingReportFilename(
  meetingName: string | null | undefined,
  extension: string,
  now: Date = new Date(),
) {
  const stamp = dayjs(now);
  const datePart = stamp.format('YYYYMMDD');
  const timePart = stamp.format('HH_mm_ss');
  const safeName = (meetingName?.trim() || 'Meeting')
    .replace(/[\\/:*?"<>|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80);
  const ext = extension.startsWith('.') ? extension : `.${extension}`;
  return `${datePart}-Report-${safeName}-${timePart}${ext}`;
}
