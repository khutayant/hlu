import { AppEnv } from '../resources/env/app.env';

type ApiFetchOptions = RequestInit & {
  params?: Record<string, string>;
};

function appendParams(url: string, params?: Record<string, string>) {
  if (!params) {
    return url;
  }

  const urlObject = new URL(url, window.location.origin);

  for (const [key, value] of Object.entries(params)) {
    urlObject.searchParams.set(key, value);
  }

  return urlObject.toString();
}

export function sanitizeUrl(url: string) {
  const match = url.match(/^([^?#]*)(.*)$/);

  if (!match) {
    return url;
  }

  const [, path, suffix] = match;
  const sanitizedPath = path
    .replace(/^(https?:)\/\//, '$1__PROTOCOL__')
    .replace(/\/{2,}/g, '/')
    .replace(/^(https?:)__PROTOCOL__/, '$1//');

  return sanitizedPath + suffix;
}

export function resolveApiUrl(url: string) {
  const resolvedUrl = /^https?:\/\//i.test(url)
    ? url
    : `${AppEnv.API_URL.replace(/\/+$/, '')}/${url.replace(/^\/+/, '')}`;

  return sanitizeUrl(resolvedUrl);
}

function fetchWithHeaders(url: string, options?: RequestInit) {
  const params = new URLSearchParams(window.location.search);
  const organizationId = params.get('organizationId');
  const facilityId = params.get('facilityId');

  return fetch(url, {
    ...options,
    headers: {
      ...(options?.headers ?? {}),
      'X-Organization-Id': organizationId ?? '',
      'X-Facility-Id': facilityId ?? '',
    },
  });
}

function apiFetch(url: string, options: ApiFetchOptions = {}) {
  const { params, ...fetchOptions } = options;
  const webUrl = appendParams(resolveApiUrl(url), params);

  return fetchWithHeaders(webUrl, {
    ...fetchOptions,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(fetchOptions.headers ?? {}),
    },
  });
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorData: unknown;

    try {
      errorData = await response.json();
    } catch {
      throw new Error(`Request failed with status ${response.status}`);
    }

    throw errorData;
  }

  return response.json() as Promise<T>;
}

export const httpTool = {
  get: async <T>(url: string, options: ApiFetchOptions = {}) => {
    const response = await apiFetch(url, { ...options, method: 'GET' });
    return handleResponse<T>(response);
  },
  upload: async <T>(url: string, formData: FormData) => {
    const response = await fetchWithHeaders(resolveApiUrl(url), {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });
    return handleResponse<T>(response);
  },
  post: async <D, T>(url: string, body: D, options: ApiFetchOptions = {}) => {
    const response = await apiFetch(url, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body),
    });
    return handleResponse<T>(response);
  },
  patch: async <D, T>(url: string, body: D, options: ApiFetchOptions = {}) => {
    const response = await apiFetch(url, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(body),
    });
    return handleResponse<T>(response);
  },
  delete: async <D, T>(
    url: string,
    body?: D,
    options: ApiFetchOptions = {},
  ) => {
    const response = await apiFetch(url, {
      ...options,
      method: 'DELETE',
      body: body ? JSON.stringify(body) : undefined,
    });
    return handleResponse<T>(response);
  },
};
