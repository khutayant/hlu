import { API_URL } from '../config';
import { getAccessToken } from './auth.handler';
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

export type Employee = {
  id: string;
  employeeNo: string;
  displayName: string;
  focalNo: string;
  gender: EmployeeGender;
  townshipName: string;
  position: string;
  experience: string;
  email: string | null;
  phone: string | null;
  hireDate: string | null;
  endDate: string | null;
  remark: string | null;
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
  displayName: string;
  focalNo: string;
  gender: EmployeeGender;
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

export type UpdateEmployeeInput = {
  displayName?: string;
  focalNo?: string;
  gender?: EmployeeGender;
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

function authHeaders(json = false): HeadersInit {
  const accessToken = getAccessToken();
  return {
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    ...(json ? { 'Content-Type': 'application/json' } : {}),
  };
}

export type EmployeeFilterOptions = {
  townships: string[];
  positions: string[];
};

export async function listEmployeeFilterOptionsRequest(): Promise<EmployeeFilterOptions> {
  const response = await fetch(`${API_URL}v1/employee/filter-options`, {
    headers: authHeaders(),
  });
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
  const data = (await response.json()) as Partial<EmployeeFilterOptions>;
  return {
    townships: Array.isArray(data.townships)
      ? data.townships.filter((value): value is string => typeof value === 'string')
      : [],
    positions: Array.isArray(data.positions)
      ? data.positions.filter((value): value is string => typeof value === 'string')
      : [],
  };
}

/**
 * Which of the given focal numbers already exist in DB (uppercased).
 * Import duplicate check — by focalNo only.
 */
export async function findExistingEmployeeFocalNosRequest(
  focalNos: string[],
): Promise<string[]> {
  const response = await fetch(`${API_URL}v1/employee/import/focal-nos`, {
    method: 'POST',
    headers: authHeaders(true),
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
  const response = await fetch(
    `${API_URL}v1/employee${query ? `?${query}` : ''}`,
    {
      headers: authHeaders(),
    },
  );
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
  return (await response.json()) as EmployeeListResult;
}

export async function getEmployeeByIdRequest(id: string): Promise<Employee> {
  const response = await fetch(`${API_URL}v1/employee/${id}`, {
    headers: authHeaders(),
  });
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
  return (await response.json()) as Employee;
}

export async function createEmployeeRequest(
  input: CreateEmployeeInput,
): Promise<Employee> {
  const response = await fetch(`${API_URL}v1/employee`, {
    method: 'POST',
    headers: authHeaders(true),
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
  const response = await fetch(`${API_URL}v1/employee/${id}`, {
    method: 'PUT',
    headers: authHeaders(true),
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
  const response = await fetch(`${API_URL}v1/employee/${id}/active`, {
    method: 'PATCH',
    headers: authHeaders(true),
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
