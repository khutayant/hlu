import type {
  CreateEmployeeInput,
  EmployeeGender,
} from '../../../../handlers/employee.handler';
import { parseCsv } from '../../../../tools/parse-csv.tool';

/** Letters A–Z then digits 0–9 only; max 9 (e.g. A91, M003). */
export const FOCAL_NO_PATTERN = /^[A-Z]+[0-9]+$/;
export const FOCAL_NO_MAX_LENGTH = 9;

export const EMPLOYEE_GENDERS = ['MALE', 'FEMALE', 'OTHER'] as const;

export const EMPLOYEE_IMPORT_COLUMNS = [
  'displayName',
  'focalNo',
  'gender',
  'townshipName',
  'position',
  'experience',
  'email',
  'phone',
  'hireDate',
  'endDate',
  'remark',
] as const;

export type EmployeeImportColumn = (typeof EMPLOYEE_IMPORT_COLUMNS)[number];

export type EmployeeImportFieldErrors = Partial<
  Record<EmployeeImportColumn, string>
>;

export type EmployeeImportRow = {
  key: string;
  displayName: string;
  focalNo: string;
  gender: string;
  townshipName: string;
  position: string;
  experience: string;
  email: string;
  phone: string;
  hireDate: string;
  endDate: string;
  remark: string;
  errors: EmployeeImportFieldErrors;
  /** Server / import-time error not tied to a single field. */
  importError?: string | null;
};

export type EmployeeImportValidity = 'valid' | 'invalid';

const HEADER_ALIASES: Record<string, EmployeeImportColumn> = {
  displayname: 'displayName',
  name: 'displayName',
  display_name: 'displayName',
  focalno: 'focalNo',
  focal_no: 'focalNo',
  focal: 'focalNo',
  gender: 'gender',
  sex: 'gender',
  townshipname: 'townshipName',
  township_name: 'townshipName',
  township: 'townshipName',
  position: 'position',
  job: 'position',
  job_title: 'position',
  experience: 'experience',
  exp: 'experience',
  email: 'email',
  phone: 'phone',
  hiredate: 'hireDate',
  hire_date: 'hireDate',
  enddate: 'endDate',
  end_date: 'endDate',
  remark: 'remark',
  remarks: 'remark',
};

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const GENDER_ALIASES: Record<string, EmployeeGender> = {
  MALE: 'MALE',
  M: 'MALE',
  MAN: 'MALE',
  FEMALE: 'FEMALE',
  F: 'FEMALE',
  WOMAN: 'FEMALE',
  OTHER: 'OTHER',
  O: 'OTHER',
  UNKNOWN: 'OTHER',
};

export type EmployeeImportMessages = {
  displayNameRequired: string;
  focalNoRequired: string;
  focalNoPattern: string;
  focalNoMaxLength: string;
  focalNoDuplicateFile: string;
  /** Used only when import-time DB check finds conflicts (cell highlight). */
  focalNoDuplicateDb: string;
  genderRequired: string;
  genderInvalid: string;
  townshipNameRequired: string;
  positionRequired: string;
  experienceRequired: string;
  emailInvalid: string;
  dateInvalid: string;
};

export function normalizeFocalNo(value: string) {
  return value.trim().toUpperCase();
}

export function parseEmployeeGender(value: string): EmployeeGender | null {
  const key = value.trim().toUpperCase().replace(/[\s-]+/g, '_');
  if (!key) {
    return null;
  }
  return GENDER_ALIASES[key] ?? null;
}

export function resolveImportHeader(header: string): EmployeeImportColumn | null {
  const key = header.trim().toLowerCase().replace(/[\s-]+/g, '_');
  return HEADER_ALIASES[key] ?? null;
}

export function parseEmployeeImportCsv(text: string): EmployeeImportRow[] {
  const { headers, rows } = parseCsv(text);
  const columnMap = new Map<number, EmployeeImportColumn>();

  headers.forEach((header, index) => {
    const column = resolveImportHeader(header);
    if (column) {
      columnMap.set(index, column);
    }
  });

  if (columnMap.size === 0) {
    throw new Error('NO_KNOWN_COLUMNS');
  }

  return rows.map((raw, index) => {
    const mapped: Partial<Record<EmployeeImportColumn, string>> = {};
    columnMap.forEach((column, colIndex) => {
      const header = headers[colIndex];
      mapped[column] = (raw[header] ?? '').trim();
    });

    return {
      key: `row-${index + 1}-${Date.now()}`,
      displayName: mapped.displayName ?? '',
      focalNo: mapped.focalNo ?? '',
      gender: mapped.gender ?? '',
      townshipName: mapped.townshipName ?? '',
      position: mapped.position ?? '',
      experience: mapped.experience ?? '',
      email: mapped.email ?? '',
      phone: mapped.phone ?? '',
      hireDate: mapped.hireDate ?? '',
      endDate: mapped.endDate ?? '',
      remark: mapped.remark ?? '',
      errors: {},
      importError: null,
    };
  });
}

export function validateEmployeeImportRows(
  rows: EmployeeImportRow[],
  messages: EmployeeImportMessages,
  /** Optional: set only after import-time DB check finds conflicts. */
  existingFocalNos: Set<string> = new Set(),
): EmployeeImportRow[] {
  const focalCounts = new Map<string, number>();
  for (const row of rows) {
    const focalNo = normalizeFocalNo(row.focalNo);
    if (!focalNo) {
      continue;
    }
    focalCounts.set(focalNo, (focalCounts.get(focalNo) ?? 0) + 1);
  }

  return rows.map((row) => {
    const errors: EmployeeImportFieldErrors = {};
    const displayName = row.displayName.trim();
    const focalNo = normalizeFocalNo(row.focalNo);
    const genderRaw = row.gender.trim();
    const gender = parseEmployeeGender(genderRaw);
    const townshipName = row.townshipName.trim();
    const position = row.position.trim();
    const experience = row.experience.trim();
    const email = row.email.trim();
    const hireDate = row.hireDate.trim();
    const endDate = row.endDate.trim();

    if (!displayName) {
      errors.displayName = messages.displayNameRequired;
    }

    // Focal: required/format → local file duplicates. DB duplicates only when
    // `existingFocalNos` is passed (import-time check).
    if (!focalNo) {
      errors.focalNo = messages.focalNoRequired;
    } else if (focalNo.length > FOCAL_NO_MAX_LENGTH) {
      errors.focalNo = messages.focalNoMaxLength;
    } else if (!FOCAL_NO_PATTERN.test(focalNo)) {
      errors.focalNo = messages.focalNoPattern;
    } else if ((focalCounts.get(focalNo) ?? 0) > 1) {
      errors.focalNo = messages.focalNoDuplicateFile;
    } else if (existingFocalNos.has(focalNo)) {
      errors.focalNo = messages.focalNoDuplicateDb;
    }

    if (!genderRaw) {
      errors.gender = messages.genderRequired;
    } else if (!gender) {
      errors.gender = messages.genderInvalid;
    }

    if (!townshipName) {
      errors.townshipName = messages.townshipNameRequired;
    }
    if (!position) {
      errors.position = messages.positionRequired;
    }
    if (!experience) {
      errors.experience = messages.experienceRequired;
    }

    if (email && !EMAIL_PATTERN.test(email)) {
      errors.email = messages.emailInvalid;
    }
    if (hireDate && !DATE_PATTERN.test(hireDate)) {
      errors.hireDate = messages.dateInvalid;
    }
    if (endDate && !DATE_PATTERN.test(endDate)) {
      errors.endDate = messages.dateInvalid;
    }

    return {
      ...row,
      displayName,
      focalNo,
      gender: gender ?? genderRaw.toUpperCase(),
      townshipName,
      position,
      experience,
      email,
      phone: row.phone.trim(),
      hireDate,
      endDate,
      remark: row.remark.trim(),
      errors,
    };
  });
}

export function isEmployeeImportRowValid(row: EmployeeImportRow) {
  return Object.keys(row.errors).length === 0 && !row.importError;
}

export function toCreateEmployeeInput(row: EmployeeImportRow): CreateEmployeeInput {
  const gender = parseEmployeeGender(row.gender);
  if (!gender) {
    throw new Error('gender is required');
  }
  return {
    displayName: row.displayName.trim(),
    focalNo: normalizeFocalNo(row.focalNo),
    gender,
    townshipName: row.townshipName.trim(),
    positionName: row.position.trim(),
    experience: row.experience.trim(),
    email: row.email.trim() || null,
    phone: row.phone.trim() || null,
    hireDate: row.hireDate.trim() || null,
    endDate: row.endDate.trim() || null,
    remark: row.remark.trim() || null,
  };
}

export const EMPLOYEE_IMPORT_TEMPLATE_CSV = [
  'displayName,focalNo,gender,townshipName,position,experience,email,phone,hireDate,endDate,remark',
  'Example Name,A91,MALE,Yangon,Coordinator,3 years,name@example.com,0912345678,2024-01-15,,',
].join('\n');
