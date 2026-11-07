import { API_URL } from '../config';
import {
  getAccessToken,
  type AuthUser,
} from './auth.handler';
import {
  getFileCategoryByCodeRequest,
  uploadFileRequest,
} from './file.handler';

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

function authHeaders(json = false): HeadersInit {
  const accessToken = getAccessToken();
  return {
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    ...(json ? { 'Content-Type': 'application/json' } : {}),
  };
}

async function linkImage(
  path: 'profile-image' | 'cover-image',
  fileId: string,
): Promise<AuthUser> {
  const response = await fetch(`${API_URL}v1/user/me/${path}`, {
    method: 'PATCH',
    headers: authHeaders(true),
    body: JSON.stringify({ fileId }),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return (await response.json()) as AuthUser;
}

async function clearImage(
  path: 'profile-image' | 'cover-image',
): Promise<AuthUser> {
  const response = await fetch(`${API_URL}v1/user/me/${path}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return (await response.json()) as AuthUser;
}

/**
 * Upload via File API, then link as the account owner's profile image.
 */
export async function uploadProfileImageRequest(file: File): Promise<AuthUser> {
  const category = await getFileCategoryByCodeRequest('PROFILE_IMAGE');
  const uploaded = await uploadFileRequest(file, {
    categoryId: category.id,
    name: 'profile.jpg',
    description: 'Profile image',
  });
  return linkImage('profile-image', uploaded.id);
}

/**
 * Upload via File API, then link as the account owner's cover image.
 */
export async function uploadCoverImageRequest(file: File): Promise<AuthUser> {
  const category = await getFileCategoryByCodeRequest('COVER_IMAGE');
  const uploaded = await uploadFileRequest(file, {
    categoryId: category.id,
    name: 'cover.jpg',
    description: 'Cover image',
  });
  return linkImage('cover-image', uploaded.id);
}

export function clearProfileImageRequest() {
  return clearImage('profile-image');
}

export function clearCoverImageRequest() {
  return clearImage('cover-image');
}
