import { API_URL } from '../config';
import { getAccessToken } from './auth.handler';

export type UserRoleActor = {
  id: string;
  name: string;
};

export type UserRole = {
  id: string;
  name: string;
  code: string;
  description: string | null;
  createdDate: string;
  updatedDate: string;
  createdBy: UserRoleActor | null;
  updatedBy: UserRoleActor | null;
};

export type UserRolePermission = {
  id: string;
  name: string;
  code: string;
  subject: string;
  action: string;
  description: string | null;
};

export type UserRoleDetail = UserRole & {
  permissions: UserRolePermission[];
};

export type UserRoleListResult = {
  items: UserRole[];
  total: number;
  page: number;
  limit: number;
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

function authHeaders(): HeadersInit {
  const accessToken = getAccessToken();
  return {
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  };
}

export async function listUserRolesRequest(options?: {
  q?: string;
  page?: number;
  limit?: number;
}): Promise<UserRoleListResult> {
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

  const query = params.toString();
  const response = await fetch(
    `${API_URL}v1/user-role${query ? `?${query}` : ''}`,
    { headers: authHeaders() },
  );

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return (await response.json()) as UserRoleListResult;
}

export async function getUserRoleRequest(id: string): Promise<UserRoleDetail> {
  const response = await fetch(`${API_URL}v1/user-role/${id}`, {
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return (await response.json()) as UserRoleDetail;
}

export type CreateUserRoleInput = {
  name: string;
  code: string;
  description?: string | null;
};

export async function createUserRoleRequest(
  input: CreateUserRoleInput,
): Promise<UserRole> {
  const response = await fetch(`${API_URL}v1/user-role`, {
    method: 'POST',
    headers: {
      ...authHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return (await response.json()) as UserRole;
}

export type UpdateUserRoleInput = {
  name?: string;
  description?: string | null;
};

export async function updateUserRoleRequest(
  id: string,
  input: UpdateUserRoleInput,
): Promise<UserRole> {
  const response = await fetch(`${API_URL}v1/user-role/${id}`, {
    method: 'PUT',
    headers: {
      ...authHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return (await response.json()) as UserRole;
}

export type UserRoleUser = {
  id: string;
  username: string;
  email: string | null;
  displayName: string;
  role: string;
  mappingId: string;
  assignedDate: string;
};

export type UserRoleUserCandidate = {
  id: string;
  username: string;
  email: string | null;
  displayName: string;
  role: string;
};

export type UserRoleUserListResult = {
  items: UserRoleUser[];
  total: number;
  page: number;
  limit: number;
};

export type UserRoleUserCandidateListResult = {
  items: UserRoleUserCandidate[];
  total: number;
  page: number;
  limit: number;
};

export async function listUserRoleUsersRequest(
  roleId: string,
  options?: { q?: string; page?: number; limit?: number },
): Promise<UserRoleUserListResult> {
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

  const query = params.toString();
  const response = await fetch(
    `${API_URL}v1/user-role/${roleId}/users${query ? `?${query}` : ''}`,
    { headers: authHeaders() },
  );

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return (await response.json()) as UserRoleUserListResult;
}

export async function listUserRoleUserCandidatesRequest(
  roleId: string,
  options?: { q?: string; page?: number; limit?: number },
): Promise<UserRoleUserCandidateListResult> {
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

  const query = params.toString();
  const response = await fetch(
    `${API_URL}v1/user-role/${roleId}/users/candidates${query ? `?${query}` : ''}`,
    { headers: authHeaders() },
  );

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return (await response.json()) as UserRoleUserCandidateListResult;
}

export type AddUserRoleUsersResult = {
  items: UserRoleUser[];
  added: number;
};

export async function addUserRoleUsersRequest(
  roleId: string,
  userIds: string[],
): Promise<AddUserRoleUsersResult> {
  const response = await fetch(`${API_URL}v1/user-role/${roleId}/users`, {
    method: 'POST',
    headers: {
      ...authHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userIds }),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return (await response.json()) as AddUserRoleUsersResult;
}

export async function removeUserRoleUserRequest(
  roleId: string,
  userId: string,
): Promise<{ roleId: string; userId: string; removed: boolean }> {
  const response = await fetch(
    `${API_URL}v1/user-role/${roleId}/users/${userId}`,
    {
      method: 'DELETE',
      headers: authHeaders(),
    },
  );

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return (await response.json()) as {
    roleId: string;
    userId: string;
    removed: boolean;
  };
}

export type UserRoleAssignedPermission = UserRolePermission & {
  mappingId: string;
  assignedDate: string;
};

export type UserRolePermissionListResult = {
  items: UserRoleAssignedPermission[];
  total: number;
  page: number;
  limit: number;
};

export type UserRolePermissionCandidateListResult = {
  items: UserRolePermission[];
  total: number;
  page: number;
  limit: number;
};

export async function listUserRolePermissionsRequest(
  roleId: string,
  options?: { q?: string; page?: number; limit?: number },
): Promise<UserRolePermissionListResult> {
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

  const query = params.toString();
  const response = await fetch(
    `${API_URL}v1/user-role/${roleId}/permissions${query ? `?${query}` : ''}`,
    { headers: authHeaders() },
  );

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return (await response.json()) as UserRolePermissionListResult;
}

export async function listUserRolePermissionCandidatesRequest(
  roleId: string,
  options?: { q?: string; page?: number; limit?: number },
): Promise<UserRolePermissionCandidateListResult> {
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

  const query = params.toString();
  const response = await fetch(
    `${API_URL}v1/user-role/${roleId}/permissions/candidates${query ? `?${query}` : ''}`,
    { headers: authHeaders() },
  );

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return (await response.json()) as UserRolePermissionCandidateListResult;
}

export type AddUserRolePermissionsResult = {
  items: UserRoleAssignedPermission[];
  added: number;
};

export async function addUserRolePermissionsRequest(
  roleId: string,
  permissionIds: string[],
): Promise<AddUserRolePermissionsResult> {
  const response = await fetch(
    `${API_URL}v1/user-role/${roleId}/permissions`,
    {
      method: 'POST',
      headers: {
        ...authHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ permissionIds }),
    },
  );

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return (await response.json()) as AddUserRolePermissionsResult;
}

export async function removeUserRolePermissionRequest(
  roleId: string,
  permissionId: string,
): Promise<{ roleId: string; permissionId: string; removed: boolean }> {
  const response = await fetch(
    `${API_URL}v1/user-role/${roleId}/permissions/${permissionId}`,
    {
      method: 'DELETE',
      headers: authHeaders(),
    },
  );

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return (await response.json()) as {
    roleId: string;
    permissionId: string;
    removed: boolean;
  };
}

export type UserRoleModule = {
  id: string;
  name: string;
  code: string;
  description: string | null;
  sequenceNo: number | null;
  isGroup: boolean;
};

/** Module the signed-in user may open. `isGroup` with no parent is a system. */
export type GrantedModule = UserRoleModule & {
  parentModuleId: string | null;
  parentModuleCode: string | null;
};

export type UserRoleAssignedModule = UserRoleModule & {
  mappingId: string;
  assignedDate: string;
};

export type UserRoleModuleListResult = {
  items: UserRoleAssignedModule[];
  total: number;
  page: number;
  limit: number;
};

export type UserRoleModuleCandidateListResult = {
  items: UserRoleModule[];
  total: number;
  page: number;
  limit: number;
};

export async function listGrantedModulesRequest(): Promise<GrantedModule[]> {
  const response = await fetch(`${API_URL}v1/user-role/me/modules`, {
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  const data = (await response.json()) as { items: GrantedModule[] };
  return data.items;
}

export async function listUserRoleModulesRequest(
  roleId: string,
  options?: { q?: string; page?: number; limit?: number },
): Promise<UserRoleModuleListResult> {
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

  const query = params.toString();
  const response = await fetch(
    `${API_URL}v1/user-role/${roleId}/modules${query ? `?${query}` : ''}`,
    { headers: authHeaders() },
  );

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return (await response.json()) as UserRoleModuleListResult;
}

export async function listUserRoleModuleCandidatesRequest(
  roleId: string,
  options?: { q?: string; page?: number; limit?: number },
): Promise<UserRoleModuleCandidateListResult> {
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

  const query = params.toString();
  const response = await fetch(
    `${API_URL}v1/user-role/${roleId}/modules/candidates${query ? `?${query}` : ''}`,
    { headers: authHeaders() },
  );

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return (await response.json()) as UserRoleModuleCandidateListResult;
}

export type AddUserRoleModulesResult = {
  items: UserRoleAssignedModule[];
  added: number;
};

export async function addUserRoleModulesRequest(
  roleId: string,
  moduleIds: string[],
): Promise<AddUserRoleModulesResult> {
  const response = await fetch(`${API_URL}v1/user-role/${roleId}/modules`, {
    method: 'POST',
    headers: {
      ...authHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ moduleIds }),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return (await response.json()) as AddUserRoleModulesResult;
}

export async function removeUserRoleModuleRequest(
  roleId: string,
  moduleId: string,
): Promise<{ roleId: string; moduleId: string; removed: boolean }> {
  const response = await fetch(
    `${API_URL}v1/user-role/${roleId}/modules/${moduleId}`,
    {
      method: 'DELETE',
      headers: authHeaders(),
    },
  );

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return (await response.json()) as {
    roleId: string;
    moduleId: string;
    removed: boolean;
  };
}
