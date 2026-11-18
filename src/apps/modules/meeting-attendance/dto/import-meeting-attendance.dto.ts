import { parseFocalNo } from '../../employee/dto/focal-no.tool';

export type ImportMeetingAttendanceRowDto = {
  focalNo: string;
  remark?: string | null;
};

export type ImportMeetingAttendanceDto = {
  meetingId: string;
  rows: ImportMeetingAttendanceRowDto[];
};

export type ResolveMeetingAttendanceImportDto = {
  meetingId: string;
  focalNos: string[];
};

function requiredUuid(record: Record<string, unknown>, key: string): string {
  const value = typeof record[key] === 'string' ? record[key].trim() : '';
  if (!value) {
    throw new Error(`${key} is required`);
  }
  return value;
}

export function parseImportMeetingAttendanceDto(
  body: unknown,
): ImportMeetingAttendanceDto {
  if (!body || typeof body !== 'object') {
    throw new Error('Request body is required');
  }
  const record = body as Record<string, unknown>;
  const meetingId = requiredUuid(record, 'meetingId');

  if (!Array.isArray(record.rows)) {
    throw new Error('rows must be an array');
  }
  if (record.rows.length === 0) {
    throw new Error('rows must not be empty');
  }
  if (record.rows.length > 500) {
    throw new Error('rows must contain at most 500 items');
  }

  const rows: ImportMeetingAttendanceRowDto[] = record.rows.map(
    (row, index) => {
      if (!row || typeof row !== 'object') {
        throw new Error(`rows[${index}] must be an object`);
      }
      const item = row as Record<string, unknown>;
      const focalNo = parseFocalNo(item.focalNo);
      if (!focalNo) {
        throw new Error(`rows[${index}].focalNo is required`);
      }

      let remark: string | null | undefined;
      if ('remark' in item) {
        if (item.remark === null) {
          remark = null;
        } else if (typeof item.remark === 'string') {
          remark = item.remark.trim() || null;
        } else {
          throw new Error(`rows[${index}].remark must be a string or null`);
        }
      }

      return { focalNo, remark };
    },
  );

  return { meetingId, rows };
}

export function parseResolveMeetingAttendanceImportDto(
  body: unknown,
): ResolveMeetingAttendanceImportDto {
  if (!body || typeof body !== 'object') {
    throw new Error('Request body is required');
  }
  const record = body as Record<string, unknown>;
  const meetingId = requiredUuid(record, 'meetingId');

  if (!Array.isArray(record.focalNos)) {
    throw new Error('focalNos must be an array');
  }

  const focalNos = [
    ...new Set(
      record.focalNos
        .map((value) =>
          typeof value === 'string' ? value.trim().toUpperCase() : '',
        )
        .filter(Boolean),
    ),
  ];

  return { meetingId, focalNos };
}
