import { API_URL } from '../config';
import { apiFetch } from './api.handler';

export type PositionActor = {
  id: string;
  name: string;
};

export type PositionCategory = {
  id: string;
  name: string;
  code: string;
};

export type Position = {
  id: string;
  name: string;
  code: string;
  description: string | null;
  categoryId: string | null;
  category: PositionCategory | null;
  active: boolean;
  createdDate: string;
  updatedDate: string;
  createdBy: PositionActor | null;
  updatedBy: PositionActor | null;
};

export type PositionListResult = {
  items: Position[];
  total: number;
  page: number;
  limit: number;
  active: boolean;
};

export type CreatePositionInput = {
  name: string;
  code: string;
  description?: string | null;
  categoryId?: string | null;
};

export type UpdatePositionInput = {
  name?: string;
  code?: string;
  description?: string | null;
  categoryId?: string | null;
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

export async function listPositionsRequest(options?: {
  q?: string;
  page?: number;
  limit?: number;
  active?: boolean;
}): Promise<PositionListResult> {
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
    `${API_URL}v1/position${query ? `?${query}` : ''}`,
  );
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
  return (await response.json()) as PositionListResult;
}

export async function createPositionRequest(
  input: CreatePositionInput,
): Promise<Position> {
  const response = await apiFetch(`${API_URL}v1/position`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
  return (await response.json()) as Position;
}

export async function updatePositionRequest(
  id: string,
  input: UpdatePositionInput,
): Promise<Position> {
  const response = await apiFetch(`${API_URL}v1/position/${id}`, {
    method: 'PATCH',
    headers: jsonHeaders(),
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
  return (await response.json()) as Position;
}

export async function setPositionActiveRequest(
  id: string,
  active: boolean,
): Promise<Position> {
  const response = await apiFetch(`${API_URL}v1/position/${id}/active`, {
    method: 'PATCH',
    headers: jsonHeaders(),
    body: JSON.stringify({ active }),
  });
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
  return (await response.json()) as Position;
}
