import { API_URL } from '../config';
import { apiFetch } from './api.handler';

export type FileCategory = {
  id: string;
  code: string;
  name: string;
  description: string | null;
};

export type PublicFile = {
  id: string;
  fileNo: string;
  name: string;
  mimeType: string;
  size: number;
  uuidName: string;
  checksum: string;
  folder: string;
  description: string | null;
  category: {
    id: string;
    name: string;
    code: string;
  } | null;
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

const categoryCache = new Map<string, FileCategory>();

/** Resolve a known category (`PROFILE_IMAGE` / `COVER_IMAGE`). Cached in-memory. */
export async function getFileCategoryByCodeRequest(
  code: string,
): Promise<FileCategory> {
  const cached = categoryCache.get(code);
  if (cached) {
    return cached;
  }

  const response = await apiFetch(
    `${API_URL}v1/file/category/by-code/${encodeURIComponent(code)}`,
  );

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  const category = (await response.json()) as FileCategory;
  categoryCache.set(code, category);
  return category;
}

/** Upload via File API (`POST /file/upload`). Multipart field: `file`. */
export async function uploadFileRequest(
  file: File,
  options: { categoryId: string; name?: string; description?: string },
): Promise<PublicFile> {
  const body = new FormData();
  body.append('file', file);
  body.append('categoryId', options.categoryId);
  if (options.name) {
    body.append('name', options.name);
  }
  if (options.description) {
    body.append('description', options.description);
  }

  const response = await apiFetch(`${API_URL}v1/file/upload`, {
    method: 'POST',
    body,
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return (await response.json()) as PublicFile;
}

/** Fetch a stored file with bearer auth and return a blob: URL for `<img>`. */
export async function fetchAuthorizedFileUrl(
  uuidName: string,
): Promise<string> {
  const response = await apiFetch(`${API_URL}v1/file/${uuidName}`);

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  const blob = await response.blob();
  return URL.createObjectURL(blob);
}
