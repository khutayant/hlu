export type UpdateMeetingAllowanceDto = {
  name?: string;
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

export function parseUpdateMeetingAllowanceDto(
  body: unknown,
): UpdateMeetingAllowanceDto {
  if (!body || typeof body !== 'object') {
    throw new Error('Request body is required');
  }
  const record = body as Record<string, unknown>;
  const dto: UpdateMeetingAllowanceDto = {};

  if ('name' in record) {
    if (typeof record.name !== 'string' || !record.name.trim()) {
      throw new Error('name must be a non-empty string');
    }
    dto.name = record.name.trim();
  }

  if ('sequenceNo' in record) {
    const value = record.sequenceNo;
    let sequenceNo: number | undefined;
    if (typeof value === 'number' && Number.isInteger(value) && value >= 1) {
      sequenceNo = value;
    } else if (typeof value === 'string' && value.trim()) {
      const parsed = Number(value.trim());
      if (Number.isInteger(parsed) && parsed >= 1) {
        sequenceNo = parsed;
      }
    }
    if (sequenceNo === undefined) {
      throw new Error('sequenceNo must be an integer >= 1');
    }
    dto.sequenceNo = sequenceNo;
  }

  const unitPriceLabel = optionalLabel(record, 'unitPriceLabel');
  if (unitPriceLabel !== undefined) {
    dto.unitPriceLabel = unitPriceLabel;
  }
  const unitPrice = optionalNumeric(record, 'unitPrice');
  if (unitPrice !== undefined) {
    dto.unitPrice = unitPrice;
  }

  const quantityLabel = optionalLabel(record, 'quantityLabel');
  if (quantityLabel !== undefined) {
    dto.quantityLabel = quantityLabel;
  }
  const quantity = optionalNumeric(record, 'quantity');
  if (quantity !== undefined) {
    dto.quantity = quantity;
  }

  const totalAmountLabel = optionalLabel(record, 'totalAmountLabel');
  if (totalAmountLabel !== undefined) {
    dto.totalAmountLabel = totalAmountLabel;
  }
  const totalAmount = optionalNumeric(record, 'totalAmount');
  if (totalAmount !== undefined) {
    dto.totalAmount = totalAmount;
  }
  const showTotalOnly = optionalBoolean(record, 'showTotalOnly');
  if (showTotalOnly !== undefined) {
    dto.showTotalOnly = showTotalOnly;
  }
  const excludeHeadOffice = optionalBoolean(record, 'excludeHeadOffice');
  if (excludeHeadOffice !== undefined) {
    dto.excludeHeadOffice = excludeHeadOffice;
  }

  if (Object.keys(dto).length === 0) {
    throw new Error('At least one field is required');
  }
  return dto;
}
