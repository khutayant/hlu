import type { GenderEnum } from '@app/entity/enums/gender.enum';
import { parseFocalNo } from './focal-no.tool';
import { parseGender } from './gender.tool';

export type UpdateEmployeeDto = {
  titleId?: string | null;
  displayName?: string;
  focalNo?: string;
  gender?: GenderEnum;
  townshipId?: string | null;
  /** Import helper — resolved by exact name when set without `townshipId`. */
  townshipName?: string | null;
  positionId?: string | null;
  /** Import helper — resolved by exact name when set without `positionId`. */
  positionName?: string | null;
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

  if ('titleId' in record) {
    dto.titleId = optionalTrimmedString(record, 'titleId') ?? null;
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

  if ('townshipId' in record) {
    dto.townshipId = optionalTrimmedString(record, 'townshipId') ?? null;
  }
  if ('townshipName' in record) {
    dto.townshipName = optionalTrimmedString(record, 'townshipName') ?? null;
  }

  if ('positionId' in record) {
    dto.positionId = optionalTrimmedString(record, 'positionId') ?? null;
  }
  if ('positionName' in record || 'position' in record) {
    dto.positionName =
      optionalTrimmedString(record, 'positionName') ??
      optionalTrimmedString(record, 'position') ??
      null;
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
