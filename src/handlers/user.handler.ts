import { API_URL } from '../config';
import { apiFetch } from './api.handler';

export type AppUserImage = {
  id: string;
  uuidName: string;
  mimeType: string;
};

export type AppUser = {
  id: string;
  username: string;
  email: string | null;
  displayName: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  emailVerified: boolean;
  active: boolean;
  lastLoginAt: string | null;
  createdDate: string;
  updatedDate: string;
  profileImage: AppUserImage | null;
};

export type AppUserListResult = {
  items: AppUser[];
  total: number;
  page: number;
  limit: number;
  active: boolean;
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

export async function listUsersRequest(options?: {
  q?: string;
  page?: number;
  limit?: number;
  active?: boolean;
}): Promise<AppUserListResult> {
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
  const query = params.toString();
  const response = await apiFetch(
    `${API_URL}v1/user${query ? `?${query}` : ''}`,
    {
          },
  );
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
  return (await response.json()) as AppUserListResult;
}

export async function setUserActiveRequest(
  id: string,
  active: boolean,
): Promise<AppUser> {
  const response = await apiFetch(`${API_URL}v1/user/${id}/active`, {
    method: 'PATCH',
    headers: jsonHeaders(),
    body: JSON.stringify({ active }),
  });
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
  return (await response.json()) as AppUser;
}
