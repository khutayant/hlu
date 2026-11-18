export type CreateMeetingDto = {
  name: string;
  fromDate: string;
  toDate: string;
  description?: string | null;
};

function requiredDateTime(record: Record<string, unknown>, key: string): string {
  const value = typeof record[key] === 'string' ? record[key].trim() : '';
  if (!value) {
    throw new Error(`${key} is required`);
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`${key} must be a valid datetime`);
  }
  return parsed.toISOString();
}

export function parseCreateMeetingDto(body: unknown): CreateMeetingDto {
  if (!body || typeof body !== 'object') {
    throw new Error('Request body is required');
  }
  const record = body as Record<string, unknown>;
  const name = typeof record.name === 'string' ? record.name.trim() : '';
  if (!name) {
    throw new Error('name is required');
  }

  const fromDate = requiredDateTime(record, 'fromDate');
  const toDate = requiredDateTime(record, 'toDate');
  if (new Date(toDate).getTime() < new Date(fromDate).getTime()) {
    throw new Error('toDate must be on or after fromDate');
  }

  let description: string | null | undefined;
  if ('description' in record) {
    if (record.description === null) {
      description = null;
    } else if (typeof record.description === 'string') {
      description = record.description.trim() || null;
    } else {
      throw new Error('description must be a string or null');
    }
  }

  return { name, fromDate, toDate, description };
}
