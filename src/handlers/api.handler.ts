import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  persistSession,
  refreshRequest,
  type AuthUser,
} from './auth.handler';

/** Fired after a successful silent refresh (payload = user). */
export const AUTH_REFRESHED_EVENT = 'hlu-auth-refreshed';
/** Fired when refresh fails and the session is cleared. */
export const AUTH_EXPIRED_EVENT = 'hlu-auth-expired';

type AuthRefreshedDetail = { user: AuthUser };

let refreshInFlight: Promise<string | null> | null = null;

function isAuthBootstrapUrl(url: string): boolean {
  return (
    url.includes('/v1/auth/login') ||
    url.includes('/v1/auth/callback') ||
    url.includes('/v1/auth/refresh') ||
    url.includes('/v1/auth/logout')
  );
}

/**
 * Single-flight refresh: concurrent 401s share one `/auth/refresh` call.
 * Returns the new access token, or null if the session is dead.
 */
async function refreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) {
    return refreshInFlight;
  }

  refreshInFlight = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      clearSession();
      window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT));
      return null;
    }

    try {
      const tokens = await refreshRequest(refreshToken);
      persistSession(tokens);
      window.dispatchEvent(
        new CustomEvent<AuthRefreshedDetail>(AUTH_REFRESHED_EVENT, {
          detail: { user: tokens.user },
        }),
      );
      return tokens.accessToken;
    } catch {
      clearSession();
      window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT));
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

function withAccessToken(init: RequestInit | undefined, accessToken: string | null) {
  const headers = new Headers(init?.headers);
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  } else {
    headers.delete('Authorization');
  }
  return { ...init, headers };
}

/**
 * Authenticated `fetch` for HLU Work APIs.
 * On 401: refresh once (shared across callers), then retry the original request.
 * Auth bootstrap endpoints are never auto-retried.
 */
export async function apiFetch(
  input: string,
  init?: RequestInit,
): Promise<Response> {
  const first = await fetch(
    input,
    withAccessToken(init, getAccessToken()),
  );

  if (first.status !== 401 || isAuthBootstrapUrl(input)) {
    return first;
  }

  const nextAccessToken = await refreshAccessToken();
  if (!nextAccessToken) {
    return first;
  }

  return fetch(input, withAccessToken(init, nextAccessToken));
}
