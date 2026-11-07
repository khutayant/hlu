import { API_URL, BASE_URL } from '../config';

export type AuthUserImage = {
  id: string;
  uuidName: string;
  mimeType: string;
};

export type AuthUser = {
  id: string;
  keycloakId: string;
  username: string;
  email?: string | null;
  emailVerified?: boolean;
  firstName?: string | null;
  lastName?: string | null;
  role: string;
  lastLoginAt?: string | null;
  profileImage?: AuthUserImage | null;
  coverImage?: AuthUserImage | null;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  refreshExpiresIn: number;
  tokenType: string;
  user: AuthUser;
  returnTo?: string;
};

const ACCESS_TOKEN_KEY = 'hlu-work-access-token';
const REFRESH_TOKEN_KEY = 'hlu-work-refresh-token';
const USER_KEY = 'hlu-work-user';

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

/** SPA callback URL registered with Keycloak (must match server allowlist). */
export function getAuthRedirectUri() {
  const path =
    BASE_URL === '/'
      ? '/auth/callback'
      : `${BASE_URL}/auth/callback`;
  return `${window.location.origin}${path}`;
}

export async function beginLoginRequest(
  returnTo = '/',
  kcAction?: 'UPDATE_PASSWORD',
): Promise<{ authorizeUrl: string; state: string }> {
  const params = new URLSearchParams({
    redirectUri: getAuthRedirectUri(),
    returnTo,
  });
  if (kcAction) {
    params.set('kcAction', kcAction);
  }
  const response = await fetch(`${API_URL}v1/auth/login?${params.toString()}`);

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return (await response.json()) as { authorizeUrl: string; state: string };
}

export async function completeLoginRequest(
  code: string,
  state: string,
): Promise<AuthTokens> {
  const response = await fetch(`${API_URL}v1/auth/callback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, state }),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return (await response.json()) as AuthTokens;
}

export async function refreshRequest(refreshToken: string): Promise<AuthTokens> {
  const response = await fetch(`${API_URL}v1/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return (await response.json()) as AuthTokens;
}

export async function logoutRequest(refreshToken?: string | null) {
  await fetch(`${API_URL}v1/auth/logout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(refreshToken ? { refreshToken } : {}),
  }).catch(() => undefined);
}

export async function meRequest(accessToken: string): Promise<AuthUser> {
  const response = await fetch(`${API_URL}v1/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return (await response.json()) as AuthUser;
}

export function persistSession(tokens: AuthTokens) {
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
  localStorage.setItem(USER_KEY, JSON.stringify(tokens.user));
}

export function persistUser(user: AuthUser) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function getStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function displayName(user: AuthUser) {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ');
  return fullName || user.username;
}
