import type { GenderEnum } from '@app/entity/enums/gender.enum';
import { parseFocalNo } from './focal-no.tool';
import { parseGender } from './gender.tool';

export type CreateEmployeeDto = {
  employeeNo?: string | null;
  titleId?: string | null;
  displayName: string;
  focalNo: string;
  gender: GenderEnum;
  /** Preferred FK. */
  townshipId?: string | null;
  /** Import helper — resolved to township by exact name when `townshipId` omitted. */
  townshipName?: string | null;
  /** Preferred FK. */
  positionId?: string | null;
  /** Import helper — resolved by exact name when `positionId` omitted. */
  positionName?: string | null;
  experience: string;
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

export function parseCreateEmployeeDto(body: unknown): CreateEmployeeDto {
  if (!body || typeof body !== 'object') {
    throw new Error('Request body is required');
  }

  const record = body as Record<string, unknown>;
  const displayName =
    typeof record.displayName === 'string' ? record.displayName.trim() : '';
  if (!displayName) {
    throw new Error('displayName is required');
  }

  const focalNo = parseFocalNo(record.focalNo);
  if (!focalNo) {
    throw new Error('focalNo is required');
  }

  const gender = parseGender(record.gender);
  if (!gender) {
    throw new Error('gender is required');
  }

  const townshipId = optionalTrimmedString(record, 'townshipId');
  const townshipName = optionalTrimmedString(record, 'townshipName');

  const positionId = optionalTrimmedString(record, 'positionId');
  // CSV / import still sends `position` as the name.
  const positionName =
    optionalTrimmedString(record, 'positionName') ??
    optionalTrimmedString(record, 'position');
  if (!positionId && !positionName) {
    throw new Error('positionId or positionName is required');
  }

  const experience =
    typeof record.experience === 'string' ? record.experience.trim() : '';
  if (!experience) {
    throw new Error('experience is required');
  }

  return {
    employeeNo: optionalTrimmedString(record, 'employeeNo'),
    titleId: optionalTrimmedString(record, 'titleId'),
    displayName,
    focalNo,
    gender,
    townshipId: townshipId ?? null,
    townshipName: townshipName ?? null,
    positionId: positionId ?? null,
    positionName: positionName ?? null,
    experience,
    email: optionalTrimmedString(record, 'email'),
    phone: optionalTrimmedString(record, 'phone'),
    hireDate: optionalDateString(record, 'hireDate'),
    endDate: optionalDateString(record, 'endDate'),
    remark: optionalTrimmedString(record, 'remark'),
    userId: optionalTrimmedString(record, 'userId'),
    profileImageId: optionalTrimmedString(record, 'profileImageId'),
  };
}
