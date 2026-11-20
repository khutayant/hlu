import { API_URL } from '../config';
import { apiFetch } from './api.handler';
import {
  getFileCategoryByCodeRequest,
  uploadFileRequest,
} from './file.handler';

export type EmployeeImage = {
  id: string;
  uuidName: string;
  mimeType: string;
};

export type EmployeeLinkedUser = {
  id: string;
  username: string;
  displayName: string;
  email: string | null;
  profileImage: EmployeeImage | null;
};

export type EmployeeActor = {
  id: string;
  name: string;
};

export type EmployeeGender = 'MALE' | 'FEMALE' | 'OTHER';

export type EmployeeTitleRef = {
  id: string;
  name: string;
};

export type EmployeeTownshipRef = {
  id: string;
  name: string;
  code: string;
  focalPrefix: string;
};

export type EmployeePositionRef = {
  id: string;
  name: string;
  code: string;
};

export type Employee = {
  id: string;
  employeeNo: string;
  title: EmployeeTitleRef | null;
  displayName: string;
  focalNo: string;
  gender: EmployeeGender;
  township: EmployeeTownshipRef | null;
  /** Derived from `township.name` for import/export compatibility. */
  townshipName: string;
  position: EmployeePositionRef | null;
  /** Derived from `position.name` for import/export compatibility. */
  positionName: string;
  experience: string;
  email: string | null;
  phone: string | null;
  hireDate: string | null;
  endDate: string | null;
  remark: string | null;
  /** True when the employee has at least one active e-signature. */
  hasSignature: boolean;
  active: boolean;
  createdDate: string;
  updatedDate: string;
  createdBy: EmployeeActor | null;
  updatedBy: EmployeeActor | null;
  profileImage: EmployeeImage | null;
  user: EmployeeLinkedUser | null;
};

export type EmployeeListResult = {
  items: Employee[];
  total: number;
  page: number;
  limit: number;
  active: boolean;
};

export type CreateEmployeeInput = {
  employeeNo?: string | null;
  titleId?: string | null;
  displayName: string;
  focalNo: string;
  gender: EmployeeGender;
  townshipId?: string | null;
  townshipName?: string | null;
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

export type UpdateEmployeeInput = {
  titleId?: string | null;
  displayName?: string;
  focalNo?: string;
  gender?: EmployeeGender;
  townshipId?: string | null;
  townshipName?: string | null;
  positionId?: string | null;
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

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { message?: string | string[] };
    if (Array.isArray(data.message)) {
      return data.message.join(', ');
    }
    if (typeof data.message === 'string' && data.message) {
      return data.message;
    }
  } catch {
    // ignore
  }
  return `Request failed (${response.status})`;
}

function jsonHeaders(): HeadersInit {
  return { 'Content-Type': 'application/json' };
}

export type EmployeeFilterTownship = {
  id: string;
  name: string;
  code: string;
};

export type EmployeeFilterPosition = {
  id: string;
  name: string;
  code: string;
};

export type EmployeeFilterOptions = {
  townships: EmployeeFilterTownship[];
  positions: EmployeeFilterPosition[];
};

export type EmployeeOverviewGenderRow = {
  gender: EmployeeGender | string;
  count: number;
};

export type EmployeeOverviewGroupRow = {
  id: string;
  name: string;
  code: string;
  count: number;
  activeCount: number;
  inactiveCount: number;
};

export type EmployeeOverviewMatrixColumn = {
  id: string;
  name: string;
  code: string;
};

export type EmployeeOverviewMatrixRow = {
  id: string;
  name: string;
  code: string;
  counts: Record<string, number>;
  total: number;
};

export type EmployeeOverviewMatrix = {
  columns: EmployeeOverviewMatrixColumn[];
  rows: EmployeeOverviewMatrixRow[];
  columnTotals: Record<string, number>;
  grandTotal: number;
};

export type EmployeeOverview = {
  total: number;
  active: number;
  inactive: number;
  byGender: EmployeeOverviewGenderRow[];
  byTownship: EmployeeOverviewGroupRow[];
  byPosition: EmployeeOverviewGroupRow[];
  matrix: EmployeeOverviewMatrix;
};

export async function getEmployeeOverviewRequest(options?: {
  townshipId?: string;
  positionId?: string;
}): Promise<EmployeeOverview> {
  const params = new URLSearchParams();
  if (options?.townshipId) {
    params.set('townshipId', options.townshipId);
  }
  if (options?.positionId) {
    params.set('positionId', options.positionId);
  }
  const query = params.toString();
  const response = await apiFetch(
    `${API_URL}v1/employee/overview${query ? `?${query}` : ''}`,
  );
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
  const data = (await response.json()) as Partial<EmployeeOverview>;
  const matrix = data.matrix;
  return {
    total: Number(data.total) || 0,
    active: Number(data.active) || 0,
    inactive: Number(data.inactive) || 0,
    byGender: Array.isArray(data.byGender)
      ? data.byGender.map((row) => ({
          gender: row.gender,
          count: Number(row.count) || 0,
        }))
      : [],
    byTownship: Array.isArray(data.byTownship)
      ? data.byTownship.map((row) => ({
          id: row.id,
          name: row.name,
          code: row.code,
          count: Number(row.count) || 0,
          activeCount: Number(row.activeCount) || 0,
          inactiveCount: Number(row.inactiveCount) || 0,
        }))
      : [],
    byPosition: Array.isArray(data.byPosition)
      ? data.byPosition.map((row) => ({
          id: row.id,
          name: row.name,
          code: row.code,
          count: Number(row.count) || 0,
          activeCount: Number(row.activeCount) || 0,
          inactiveCount: Number(row.inactiveCount) || 0,
        }))
      : [],
    matrix: {
      columns: Array.isArray(matrix?.columns)
        ? matrix.columns.map((column) => ({
            id: column.id,
            name: column.name,
            code: column.code,
          }))
        : [],
      rows: Array.isArray(matrix?.rows)
        ? matrix.rows.map((row) => ({
            id: row.id,
            name: row.name,
            code: row.code,
            counts:
              row.counts && typeof row.counts === 'object' ? row.counts : {},
            total: Number(row.total) || 0,
          }))
        : [],
      columnTotals:
        matrix?.columnTotals && typeof matrix.columnTotals === 'object'
          ? matrix.columnTotals
          : {},
      grandTotal: Number(matrix?.grandTotal) || 0,
    },
  };
}

export async function listEmployeeFilterOptionsRequest(): Promise<EmployeeFilterOptions> {
  const response = await apiFetch(`${API_URL}v1/employee/filter-options`);
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
  const data = (await response.json()) as Partial<EmployeeFilterOptions>;
  const townships = Array.isArray(data.townships)
    ? data.townships.filter(
        (row): row is EmployeeFilterTownship =>
          Boolean(row) &&
          typeof row === 'object' &&
          typeof (row as EmployeeFilterTownship).id === 'string' &&
          typeof (row as EmployeeFilterTownship).name === 'string',
      )
    : [];
  const positions = Array.isArray(data.positions)
    ? data.positions.filter(
        (row): row is EmployeeFilterPosition =>
          Boolean(row) &&
          typeof row === 'object' &&
          typeof (row as EmployeeFilterPosition).id === 'string' &&
          typeof (row as EmployeeFilterPosition).name === 'string',
      )
    : [];
  return {
    townships,
    positions,
  };
}

/**
 * Which of the given focal numbers already exist in DB (uppercased).
 * Import duplicate check — by focalNo only.
 */
export async function findExistingEmployeeFocalNosRequest(
  focalNos: string[],
): Promise<string[]> {
  const response = await apiFetch(`${API_URL}v1/employee/import/focal-nos`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({ focalNos }),
  });
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
  const data = (await response.json()) as unknown;
  if (!Array.isArray(data)) {
    return [];
  }
  return data
    .filter((value): value is string => typeof value === 'string')
    .map((value) => value.trim().toUpperCase())
    .filter(Boolean);
}

export async function listEmployeesRequest(options?: {
  q?: string;
  page?: number;
  limit?: number;
  active?: boolean;
  gender?: EmployeeGender;
  townshipName?: string;
  position?: string;
}): Promise<EmployeeListResult> {
  const params = new URLSearchParams();
  if (options?.q) {
    params.set('q', options.q);
  }
  if (options?.page) {
    params.set('page', String(options.page));
  }
  if (options?.limit) {
    params.set('limit', String(options.limit));
  }
  if (options?.active !== undefined) {
    params.set('active', String(options.active));
  }
  if (options?.gender) {
    params.set('gender', options.gender);
  }
  if (options?.townshipName) {
    params.set('townshipName', options.townshipName);
  }
  if (options?.position) {
    params.set('position', options.position);
  }
  const query = params.toString();
  const response = await apiFetch(
    `${API_URL}v1/employee${query ? `?${query}` : ''}`,
    {
          },
  );
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
  return (await response.json()) as EmployeeListResult;
}

export async function getEmployeeByIdRequest(id: string): Promise<Employee> {
  const response = await apiFetch(`${API_URL}v1/employee/${id}`);
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
  return (await response.json()) as Employee;
}

export async function createEmployeeRequest(
  input: CreateEmployeeInput,
): Promise<Employee> {
  const response = await apiFetch(`${API_URL}v1/employee`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
  return (await response.json()) as Employee;
}

export async function updateEmployeeRequest(
  id: string,
  input: UpdateEmployeeInput,
): Promise<Employee> {
  const response = await apiFetch(`${API_URL}v1/employee/${id}`, {
    method: 'PATCH',
    headers: jsonHeaders(),
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
  return (await response.json()) as Employee;
}

export async function setEmployeeActiveRequest(
  id: string,
  active: boolean,
): Promise<Employee> {
  const response = await apiFetch(`${API_URL}v1/employee/${id}/active`, {
    method: 'PATCH',
    headers: jsonHeaders(),
    body: JSON.stringify({ active }),
  });
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
  return (await response.json()) as Employee;
}

/** Upload image as `PROFILE_IMAGE`; caller links via create/update `profileImageId`. */
export async function uploadEmployeeProfileImageRequest(
  file: File,
): Promise<EmployeeImage> {
  const category = await getFileCategoryByCodeRequest('PROFILE_IMAGE');
  const uploaded = await uploadFileRequest(file, {
    categoryId: category.id,
    name: file.name || 'employee-profile.jpg',
    description: 'Employee profile image',
  });
  return {
    id: uploaded.id,
    uuidName: uploaded.uuidName,
    mimeType: uploaded.mimeType,
  };
}
