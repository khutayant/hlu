import { API_URL } from '../config';
import { apiFetch } from './api.handler';

export type TitleActor = {
  id: string;
  name: string;
};

export type Title = {
  id: string;
  name: string;
  code: string;
  description: string | null;
  active: boolean;
  createdDate: string;
  updatedDate: string;
  createdBy: TitleActor | null;
  updatedBy: TitleActor | null;
};

export type TitleListResult = {
  items: Title[];
  total: number;
  page: number;
  limit: number;
  active: boolean;
};

export type CreateTitleInput = {
  name: string;
  code: string;
  description?: string | null;
};

export type UpdateTitleInput = {
  name?: string;
  code?: string;
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

export async function listTitlesRequest(options?: {
  q?: string;
  page?: number;
  limit?: number;
  active?: boolean;
}): Promise<TitleListResult> {
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
    `${API_URL}v1/title${query ? `?${query}` : ''}`,
  );
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
  return (await response.json()) as TitleListResult;
}

export async function createTitleRequest(
  input: CreateTitleInput,
): Promise<Title> {
  const response = await apiFetch(`${API_URL}v1/title`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
  return (await response.json()) as Title;
}

export async function updateTitleRequest(
  id: string,
  input: UpdateTitleInput,
): Promise<Title> {
  const response = await apiFetch(`${API_URL}v1/title/${id}`, {
    method: 'PATCH',
    headers: jsonHeaders(),
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
  return (await response.json()) as Title;
}

export async function setTitleActiveRequest(
  id: string,
  active: boolean,
): Promise<Title> {
  const response = await apiFetch(`${API_URL}v1/title/${id}/active`, {
    method: 'PATCH',
    headers: jsonHeaders(),
    body: JSON.stringify({ active }),
  });
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
  return (await response.json()) as Title;
}
