import { API_URL } from '../config';
import { apiFetch } from './api.handler';

export type CountryActor = {
  id: string;
  name: string;
};

export type Country = {
  id: string;
  name: string;
  code: string;
  description: string | null;
  active: boolean;
  createdDate: string;
  updatedDate: string;
  createdBy: CountryActor | null;
  updatedBy: CountryActor | null;
};

export type CountryListResult = {
  items: Country[];
  total: number;
  page: number;
  limit: number;
  active: boolean;
};

export type CreateCountryInput = {
  name: string;
  code: string;
  description?: string | null;
};

export type UpdateCountryInput = {
  name?: string;
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

export async function listCountriesRequest(options?: {
  q?: string;
  page?: number;
  limit?: number;
  active?: boolean;
}): Promise<CountryListResult> {
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
    `${API_URL}v1/country${query ? `?${query}` : ''}`,
  );
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
  return (await response.json()) as CountryListResult;
}

export async function createCountryRequest(
  input: CreateCountryInput,
): Promise<Country> {
  const response = await apiFetch(`${API_URL}v1/country`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
  return (await response.json()) as Country;
}

export async function updateCountryRequest(
  id: string,
  input: UpdateCountryInput,
): Promise<Country> {
  const response = await apiFetch(`${API_URL}v1/country/${id}`, {
    method: 'PUT',
    headers: jsonHeaders(),
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
  return (await response.json()) as Country;
}

export async function setCountryActiveRequest(
  id: string,
  active: boolean,
): Promise<Country> {
  const response = await apiFetch(`${API_URL}v1/country/${id}/active`, {
    method: 'PATCH',
    headers: jsonHeaders(),
    body: JSON.stringify({ active }),
  });
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
  return (await response.json()) as Country;
}
