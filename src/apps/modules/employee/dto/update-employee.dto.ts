import type { GenderEnum } from '../../../../../libs/entity/src/index.js';
import { parseFocalNo } from './focal-no.tool.js';
import { parseGender } from './gender.tool.js';

export type UpdateEmployeeDto = {
  displayName?: string;
  focalNo?: string;
  gender?: GenderEnum;
  townshipName?: string;
  position?: string;
  experience?: string;
  email?: string | null;
  phone?: string | null;
  hireDate?: string | null;
  endDate?: string | null;
  remark?: string | null;
  userId?: string | null;
  profileImageId?: string | null;
};

function optionalTrimmedString(
  record: Record<string, unknown>,
  key: string,
): string | null | undefined {
  if (!(key in record)) {
    return undefined;
  }
  const value = record[key];
  if (value === null) {
    return null;
  }
  if (typeof value !== 'string') {
    throw new Error(`${key} must be a string or null`);
  }
  return value.trim() || null;
}

function optionalDateString(
  record: Record<string, unknown>,
  key: string,
): string | null | undefined {
  const value = optionalTrimmedString(record, key);
  if (value === undefined || value === null) {
    return value;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`${key} must be YYYY-MM-DD`);
  }
  return value;
}

export function parseUpdateEmployeeDto(body: unknown): UpdateEmployeeDto {
  if (!body || typeof body !== 'object') {
    throw new Error('Request body is required');
  }

  const record = body as Record<string, unknown>;
  const dto: UpdateEmployeeDto = {};

  if ('employeeNo' in record) {
    throw new Error('employeeNo cannot be changed');
  }

  if ('displayName' in record) {
    const displayName = optionalTrimmedString(record, 'displayName');
    if (!displayName) {
      throw new Error('displayName is required when provided');
    }
    dto.displayName = displayName;
  }

  if ('focalNo' in record) {
    const focalNo = parseFocalNo(record.focalNo);
    if (!focalNo) {
      throw new Error('focalNo is required when provided');
    }
    dto.focalNo = focalNo;
  }

  if ('gender' in record) {
    const gender = parseGender(record.gender);
    if (!gender) {
      throw new Error('gender is required when provided');
    }
    dto.gender = gender;
  }

  if ('townshipName' in record) {
    const townshipName = optionalTrimmedString(record, 'townshipName');
    if (!townshipName) {
      throw new Error('townshipName is required when provided');
    }
    dto.townshipName = townshipName;
  }

  if ('position' in record) {
    const position = optionalTrimmedString(record, 'position');
    if (!position) {
      throw new Error('position is required when provided');
    }
    dto.position = position;
  }

  if ('experience' in record) {
    const experience = optionalTrimmedString(record, 'experience');
    if (!experience) {
      throw new Error('experience is required when provided');
    }
    dto.experience = experience;
  }

  if ('email' in record) {
    dto.email = optionalTrimmedString(record, 'email') ?? null;
  }
  if ('phone' in record) {
    dto.phone = optionalTrimmedString(record, 'phone') ?? null;
  }
  if ('hireDate' in record) {
    dto.hireDate = optionalDateString(record, 'hireDate') ?? null;
  }
  if ('endDate' in record) {
    dto.endDate = optionalDateString(record, 'endDate') ?? null;
  }
  if ('remark' in record) {
    dto.remark = optionalTrimmedString(record, 'remark') ?? null;
  }
  if ('userId' in record) {
    dto.userId = optionalTrimmedString(record, 'userId') ?? null;
  }
  if ('profileImageId' in record) {
    dto.profileImageId =
      optionalTrimmedString(record, 'profileImageId') ?? null;
  }

  if (Object.keys(dto).length === 0) {
    throw new Error('At least one field is required');
  }

  return dto;
}
