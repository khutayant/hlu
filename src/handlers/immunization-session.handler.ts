import { API_URL } from '../config';
import { apiFetch } from './api.handler';

export type ImmunizationSessionActor = {
  id: string;
  name: string;
};

export type ImmunizationSessionProject = {
  id: string;
  name: string;
  projectNo: string;
};

export type ImmunizationSessionTownship = {
  id: string;
  name: string;
  code: string;
};

export type ImmunizationSession = {
  id: string;
  name: string;
  sessionNo: string;
  description: string | null;
  projectId: string;
  project: ImmunizationSessionProject | null;
  townshipId: string;
  township: ImmunizationSessionTownship | null;
  active: boolean;
  createdDate: string;
  updatedDate: string;
  createdBy: ImmunizationSessionActor | null;
  updatedBy: ImmunizationSessionActor | null;
};

export type ImmunizationSessionListResult = {
  items: ImmunizationSession[];
  total: number;
  page: number;
  limit: number;
  active: boolean;
};

export type CreateImmunizationSessionInput = {
  name: string;
  projectId: string;
  townshipId: string;
  description?: string | null;
};

export type UpdateImmunizationSessionInput = {
  name?: string;
  projectId?: string;
  townshipId?: string;
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

export async function listImmunizationSessionsRequest(options?: {
  q?: string;
  page?: number;
  limit?: number;
  active?: boolean;
  projectId?: string;
  townshipId?: string;
}): Promise<ImmunizationSessionListResult> {
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
  if (options?.projectId) {
    params.set('projectId', options.projectId);
  }
  if (options?.townshipId) {
    params.set('townshipId', options.townshipId);
  }
  const query = params.toString();
  const response = await apiFetch(
    `${API_URL}v1/immunization-session${query ? `?${query}` : ''}`,
  );
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
  return (await response.json()) as ImmunizationSessionListResult;
}

export async function createImmunizationSessionRequest(
  input: CreateImmunizationSessionInput,
): Promise<ImmunizationSession> {
  const response = await apiFetch(`${API_URL}v1/immunization-session`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
  return (await response.json()) as ImmunizationSession;
}

export async function updateImmunizationSessionRequest(
  id: string,
  input: UpdateImmunizationSessionInput,
): Promise<ImmunizationSession> {
  const response = await apiFetch(`${API_URL}v1/immunization-session/${id}`, {
    method: 'PUT',
    headers: jsonHeaders(),
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
  return (await response.json()) as ImmunizationSession;
}

export async function setImmunizationSessionActiveRequest(
  id: string,
  active: boolean,
): Promise<ImmunizationSession> {
  const response = await apiFetch(
    `${API_URL}v1/immunization-session/${id}/active`,
    {
      method: 'PATCH',
      headers: jsonHeaders(),
      body: JSON.stringify({ active }),
    },
  );
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
  return (await response.json()) as ImmunizationSession;
}
