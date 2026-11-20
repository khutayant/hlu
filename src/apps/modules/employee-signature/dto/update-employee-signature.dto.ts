import type { EmployeeSignatureStyles } from '@app/entity/entities/master/employee-signature-master.entity';

export type UpdateEmployeeSignatureDto = {
  name?: string;
  signatureImageId?: string;
  signatureName?: string;
  signaturePosition?: string;
  primary?: boolean;
  description?: string | null;
  signatureStyles?: EmployeeSignatureStyles | null;
};

function optionalTrimmed(
  record: Record<string, unknown>,
  key: string,
): string | undefined {
  if (!(key in record)) {
    return undefined;
  }
  if (typeof record[key] !== 'string' || !record[key].trim()) {
    throw new Error(`${key} must be a non-empty string`);
  }
  return record[key].trim();
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

function optionalDescription(
  record: Record<string, unknown>,
): string | null | undefined {
  if (!('description' in record)) {
    return undefined;
  }
  if (record.description === null) {
    return null;
  }
  if (typeof record.description !== 'string') {
    throw new Error('description must be a string or null');
  }
  return record.description.trim() || null;
}

function optionalNumberField(
  record: Record<string, unknown>,
  key: string,
): number | undefined {
  if (!(key in record)) {
    return undefined;
  }
  const value = record[key];
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`${key} must be a finite number`);
  }
  return value;
}

function optionalSignatureStyles(
  record: Record<string, unknown>,
): EmployeeSignatureStyles | null | undefined {
  if (!('signatureStyles' in record)) {
    return undefined;
  }
  if (record.signatureStyles === null) {
    return null;
  }
  if (!record.signatureStyles || typeof record.signatureStyles !== 'object') {
    throw new Error('signatureStyles must be an object or null');
  }
  const styles = record.signatureStyles as Record<string, unknown>;
  const nameFontSize = optionalNumberField(styles, 'nameFontSize');
  const positionFontSize = optionalNumberField(styles, 'positionFontSize');
  const imageScale = optionalNumberField(styles, 'imageScale');
  const textAndImageGap = optionalNumberField(styles, 'textAndImageGap');
  if (
    nameFontSize === undefined ||
    positionFontSize === undefined ||
    imageScale === undefined ||
    textAndImageGap === undefined
  ) {
    throw new Error(
      'signatureStyles requires nameFontSize, positionFontSize, imageScale, textAndImageGap',
    );
  }
  return {
    nameFontSize,
    positionFontSize,
    imageScale,
    textAndImageGap,
  };
}

export function parseUpdateEmployeeSignatureDto(
  body: unknown,
): UpdateEmployeeSignatureDto {
  if (!body || typeof body !== 'object') {
    throw new Error('Request body is required');
  }
  const record = body as Record<string, unknown>;
  const dto: UpdateEmployeeSignatureDto = {
    name: optionalTrimmed(record, 'name'),
    signatureImageId: optionalTrimmed(record, 'signatureImageId'),
    signatureName: optionalTrimmed(record, 'signatureName'),
    signaturePosition: optionalTrimmed(record, 'signaturePosition'),
    primary: optionalBoolean(record, 'primary'),
    description: optionalDescription(record),
    signatureStyles: optionalSignatureStyles(record),
  };
  if (
    dto.name === undefined &&
    dto.signatureImageId === undefined &&
    dto.signatureName === undefined &&
    dto.signaturePosition === undefined &&
    dto.primary === undefined &&
    dto.description === undefined &&
    dto.signatureStyles === undefined
  ) {
    throw new Error('At least one field is required');
  }
  return dto;
}
