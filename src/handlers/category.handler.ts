import { API_URL } from '../config';
import { apiFetch } from './api.handler';

export type CategoryActor = {
  id: string;
  name: string;
};

export type CategoryParent = {
  id: string;
  name: string;
  code: string;
};

export type Category = {
  id: string;
  name: string;
  code: string;
  description: string | null;
  isPosting: boolean;
  parentCategoryId: string | null;
  parentCategory: CategoryParent | null;
  active: boolean;
  createdDate: string;
  updatedDate: string;
  createdBy: CategoryActor | null;
  updatedBy: CategoryActor | null;
};

export type CategoryListResult = {
  items: Category[];
  total: number;
  page: number;
  limit: number;
  active: boolean;
};

export type CreateCategoryInput = {
  name: string;
  code: string;
  description?: string | null;
  parentCategoryId?: string | null;
  isPosting?: boolean;
};

export type UpdateCategoryInput = {
  name?: string;
  code?: string;
  description?: string | null;
  parentCategoryId?: string | null;
  isPosting?: boolean;
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

export async function listCategoriesRequest(options?: {
  q?: string;
  page?: number;
  limit?: number;
  active?: boolean;
}): Promise<CategoryListResult> {
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
    `${API_URL}v1/category${query ? `?${query}` : ''}`,
  );
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
  return (await response.json()) as CategoryListResult;
}

export async function createCategoryRequest(
  input: CreateCategoryInput,
): Promise<Category> {
  const response = await apiFetch(`${API_URL}v1/category`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
  return (await response.json()) as Category;
}

export async function updateCategoryRequest(
  id: string,
  input: UpdateCategoryInput,
): Promise<Category> {
  const response = await apiFetch(`${API_URL}v1/category/${id}`, {
    method: 'PATCH',
    headers: jsonHeaders(),
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
  return (await response.json()) as Category;
}

export async function setCategoryActiveRequest(
  id: string,
  active: boolean,
): Promise<Category> {
  const response = await apiFetch(`${API_URL}v1/category/${id}/active`, {
    method: 'PATCH',
    headers: jsonHeaders(),
    body: JSON.stringify({ active }),
  });
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
  return (await response.json()) as Category;
}
