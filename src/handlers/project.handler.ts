import { API_URL } from '../config';
import { apiFetch } from './api.handler';

export type ProjectActor = {
  id: string;
  name: string;
};

export type Project = {
  id: string;
  name: string;
  projectNo: string;
  description: string | null;
  active: boolean;
  createdDate: string;
  updatedDate: string;
  createdBy: ProjectActor | null;
  updatedBy: ProjectActor | null;
};

export type ProjectListResult = {
  items: Project[];
  total: number;
  page: number;
  limit: number;
  active: boolean;
};

export type CreateProjectInput = {
  name: string;
  description?: string | null;
};

export type UpdateProjectInput = {
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

export async function listProjectsRequest(options?: {
  q?: string;
  page?: number;
  limit?: number;
  active?: boolean;
}): Promise<ProjectListResult> {
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
    `${API_URL}v1/project${query ? `?${query}` : ''}`,
  );
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
  return (await response.json()) as ProjectListResult;
}

export async function createProjectRequest(
  input: CreateProjectInput,
): Promise<Project> {
  const response = await apiFetch(`${API_URL}v1/project`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
  return (await response.json()) as Project;
}

export async function updateProjectRequest(
  id: string,
  input: UpdateProjectInput,
): Promise<Project> {
  const response = await apiFetch(`${API_URL}v1/project/${id}`, {
    method: 'PUT',
    headers: jsonHeaders(),
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
  return (await response.json()) as Project;
}

export async function setProjectActiveRequest(
  id: string,
  active: boolean,
): Promise<Project> {
  const response = await apiFetch(`${API_URL}v1/project/${id}/active`, {
    method: 'PATCH',
    headers: jsonHeaders(),
    body: JSON.stringify({ active }),
  });
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
  return (await response.json()) as Project;
}
