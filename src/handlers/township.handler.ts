import { API_URL } from '../config';
import { apiFetch } from './api.handler';

export type TownshipCountryRef = {
  id: string;
  name: string;
  code: string;
};

export type TownshipActor = {
  id: string;
  name: string;
};

export type Township = {
  id: string;
  name: string;
  code: string;
  focalPrefix: string;
  description: string | null;
  countryId: string;
  country: TownshipCountryRef | null;
  active: boolean;
  createdDate: string;
  updatedDate: string;
  createdBy: TownshipActor | null;
  updatedBy: TownshipActor | null;
};

export type TownshipListResult = {
  items: Township[];
  total: number;
  page: number;
  limit: number;
  active: boolean;
};

export type CreateTownshipInput = {
  name: string;
  code: string;
  countryId: string;
  focalPrefix: string;
  description?: string | null;
};

export type UpdateTownshipInput = {
  name?: string;
  countryId?: string;
  focalPrefix?: string;
  description?: string | null;
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

export async function listTownshipsRequest(options?: {
  q?: string;
  page?: number;
  limit?: number;
  active?: boolean;
  countryId?: string;
}): Promise<TownshipListResult> {
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
  if (options?.countryId) {
    params.set('countryId', options.countryId);
  }
  const query = params.toString();
  const response = await apiFetch(
    `${API_URL}v1/township${query ? `?${query}` : ''}`,
  );
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
  return (await response.json()) as TownshipListResult;
}

export async function createTownshipRequest(
  input: CreateTownshipInput,
): Promise<Township> {
  const response = await apiFetch(`${API_URL}v1/township`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
  return (await response.json()) as Township;
}

export async function updateTownshipRequest(
  id: string,
  input: UpdateTownshipInput,
): Promise<Township> {
  const response = await apiFetch(`${API_URL}v1/township/${id}`, {
    method: 'PUT',
    headers: jsonHeaders(),
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
  return (await response.json()) as Township;
}

export async function setTownshipActiveRequest(
  id: string,
  active: boolean,
): Promise<Township> {
  const response = await apiFetch(`${API_URL}v1/township/${id}/active`, {
    method: 'PATCH',
    headers: jsonHeaders(),
    body: JSON.stringify({ active }),
  });
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
  return (await response.json()) as Township;
}
