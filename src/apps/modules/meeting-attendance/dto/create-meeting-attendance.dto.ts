import { parseFocalNo } from '../../employee/dto/focal-no.tool';

export type CreateMeetingAttendanceDto = {
  meetingId: string;
  focalNo: string;
  remark?: string | null;
};

function requiredUuid(record: Record<string, unknown>, key: string): string {
  const value = typeof record[key] === 'string' ? record[key].trim() : '';
  if (!value) {
    throw new Error(`${key} is required`);
  }
  return value;
}

export function parseCreateMeetingAttendanceDto(
  body: unknown,
): CreateMeetingAttendanceDto {
  if (!body || typeof body !== 'object') {
    throw new Error('Request body is required');
  }
  const record = body as Record<string, unknown>;
  const meetingId = requiredUuid(record, 'meetingId');
  const focalNo = parseFocalNo(record.focalNo);
  if (!focalNo) {
    throw new Error('focalNo is required');
  }

  let remark: string | null | undefined;
  if ('remark' in record) {
    if (record.remark === null) {
      remark = null;
    } else if (typeof record.remark === 'string') {
      remark = record.remark.trim() || null;
    } else {
      throw new Error('remark must be a string or null');
    }
  }

  return { meetingId, focalNo, remark };
}
