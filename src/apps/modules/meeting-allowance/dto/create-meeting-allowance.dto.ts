export type CreateMeetingAllowanceDto = {
  meetingId: string;
  name: string;
  /** Optional; when omitted, server assigns next sequence for the meeting. */
  sequenceNo?: number;
  unitPriceLabel?: string | null;
  unitPrice?: string;
  quantityLabel?: string | null;
  quantity?: string;
  totalAmountLabel?: string | null;
  totalAmount?: string;
  showTotalOnly?: boolean;
  excludeHeadOffice?: boolean;
};

function optionalLabel(
  record: Record<string, unknown>,
  key: string,
): string | null | undefined {
  if (!(key in record)) {
    return undefined;
  }
  if (record[key] === null) {
    return null;
  }
  if (typeof record[key] !== 'string') {
    throw new Error(`${key} must be a string or null`);
  }
  return record[key].trim() || null;
}

function optionalNumeric(
  record: Record<string, unknown>,
  key: string,
): string | undefined {
  if (!(key in record)) {
    return undefined;
  }
  if (typeof record[key] === 'number' && Number.isFinite(record[key])) {
    return record[key].toFixed(2);
  }
  if (typeof record[key] !== 'string' || !record[key].trim()) {
    throw new Error(`${key} must be a number string`);
  }
  const raw = record[key].trim();
  if (!/^-?\d+(\.\d+)?$/.test(raw)) {
    throw new Error(`${key} must be a valid number`);
  }
  return raw;
}

function optionalBoolean(
  record: Record<string, unknown>,
  key: string,
): boolean | undefined {
  if (!(key in record)) {
    return undefined;
  }
  if (typeof record[key] !== 'boolean') {
    throw new Error(`${key} must be a boolean`);
  }
  return record[key];
}

function optionalSequenceNo(
  record: Record<string, unknown>,
): number | undefined {
  if (!('sequenceNo' in record)) {
    return undefined;
  }
  const value = record.sequenceNo;
  if (typeof value === 'number' && Number.isInteger(value) && value >= 1) {
    return value;
  }
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value.trim());
    if (Number.isInteger(parsed) && parsed >= 1) {
      return parsed;
    }
  }
  throw new Error('sequenceNo must be an integer >= 1');
}

export function parseCreateMeetingAllowanceDto(
  body: unknown,
): CreateMeetingAllowanceDto {
  if (!body || typeof body !== 'object') {
    throw new Error('Request body is required');
  }
  const record = body as Record<string, unknown>;
  const meetingId =
    typeof record.meetingId === 'string' ? record.meetingId.trim() : '';
  if (!meetingId) {
    throw new Error('meetingId is required');
  }
  const name = typeof record.name === 'string' ? record.name.trim() : '';
  if (!name) {
    throw new Error('name is required');
  }

  return {
    meetingId,
    name,
    sequenceNo: optionalSequenceNo(record),
    unitPriceLabel: optionalLabel(record, 'unitPriceLabel'),
    unitPrice: optionalNumeric(record, 'unitPrice'),
    quantityLabel: optionalLabel(record, 'quantityLabel'),
    quantity: optionalNumeric(record, 'quantity'),
    totalAmountLabel: optionalLabel(record, 'totalAmountLabel'),
    totalAmount: optionalNumeric(record, 'totalAmount'),
    showTotalOnly: optionalBoolean(record, 'showTotalOnly'),
    excludeHeadOffice: optionalBoolean(record, 'excludeHeadOffice'),
  };
}
