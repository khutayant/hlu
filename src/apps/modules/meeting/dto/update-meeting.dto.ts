export type UpdateMeetingDto = {
  name?: string;
  fromDate?: string;
  toDate?: string;
  place?: string | null;
  projectId?: string | null;
  description?: string | null;
};

function optionalDateTime(
  record: Record<string, unknown>,
  key: string,
): string | undefined {
  if (!(key in record)) {
    return undefined;
  }
  if (typeof record[key] !== 'string' || !record[key].trim()) {
    throw new Error(`${key} must be a non-empty datetime string`);
  }
  const parsed = new Date(record[key].trim());
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`${key} must be a valid datetime`);
  }
  return parsed.toISOString();
}

export function parseUpdateMeetingDto(body: unknown): UpdateMeetingDto {
  if (!body || typeof body !== 'object') {
    throw new Error('Request body is required');
  }
  const record = body as Record<string, unknown>;
  const dto: UpdateMeetingDto = {};

  if ('name' in record) {
    if (typeof record.name !== 'string' || !record.name.trim()) {
      throw new Error('name must be a non-empty string');
    }
    dto.name = record.name.trim();
  }

  const fromDate = optionalDateTime(record, 'fromDate');
  if (fromDate !== undefined) {
    dto.fromDate = fromDate;
  }
  const toDate = optionalDateTime(record, 'toDate');
  if (toDate !== undefined) {
    dto.toDate = toDate;
  }

  if ('place' in record) {
    if (record.place === null) {
      dto.place = null;
    } else if (typeof record.place === 'string') {
      dto.place = record.place.trim() || null;
    } else {
      throw new Error('place must be a string or null');
    }
  }

  if ('projectId' in record) {
    if (record.projectId === null) {
      dto.projectId = null;
    } else if (typeof record.projectId === 'string') {
      dto.projectId = record.projectId.trim() || null;
    } else {
      throw new Error('projectId must be a string or null');
    }
  }

  if ('description' in record) {
    if (record.description === null) {
      dto.description = null;
    } else if (typeof record.description === 'string') {
      dto.description = record.description.trim() || null;
    } else {
      throw new Error('description must be a string or null');
    }
  }

  if (Object.keys(dto).length === 0) {
    throw new Error('At least one field is required');
  }
  return dto;
}
