import type { GenderEnum } from '../../../../../libs/entity/src/index.js';
import { parseFocalNo } from './focal-no.tool.js';
import { parseGender } from './gender.tool.js';

export type CreateEmployeeDto = {
  employeeNo?: string | null;
  displayName: string;
  focalNo: string;
  gender: GenderEnum;
  townshipName: string;
  position: string;
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

  const townshipName =
    typeof record.townshipName === 'string' ? record.townshipName.trim() : '';
  if (!townshipName) {
    throw new Error('townshipName is required');
  }

  const position =
    typeof record.position === 'string' ? record.position.trim() : '';
  if (!position) {
    throw new Error('position is required');
  }

  const experience =
    typeof record.experience === 'string' ? record.experience.trim() : '';
  if (!experience) {
    throw new Error('experience is required');
  }

  return {
    employeeNo: optionalTrimmedString(record, 'employeeNo'),
    displayName,
    focalNo,
    gender,
    townshipName,
    position,
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
