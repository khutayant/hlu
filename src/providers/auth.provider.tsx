import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  beginLoginRequest,
  clearSession,
  completeLoginRequest,
  displayName as formatDisplayName,
  getAccessToken,
  getRefreshToken,
  getStoredUser,
  logoutRequest,
  meRequest,
  persistSession,
  persistUser,
  refreshRequest,
  type AuthUser,
} from '../handlers/auth.handler';

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isBootstrapping: boolean;
  displayName: string | null;
  /** Redirect browser to Keycloak login (password + MFA screens). */
  signIn: (returnTo?: string) => Promise<void>;
  /** Open Keycloak's update-password screen, then return to Security. */
  changePassword: () => Promise<void>;
  /** Finish login after Keycloak redirects back with code + state. */
  completeSignIn: (code: string, state: string) => Promise<string>;
  signOut: () => Promise<void>;
  /** Replace the in-memory + persisted user (e.g. after profile image update). */
  setUser: (next: AuthUser) => void;
  /** Re-fetch `/auth/me` and refresh session user. */
  refreshUser: () => Promise<AuthUser | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(() => getStoredUser());
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  const applySession = useCallback((nextUser: AuthUser | null) => {
    setUserState(nextUser);
    if (nextUser) {
      persistUser(nextUser);
    }
  }, []);

  const restoreSession = useCallback(async () => {
    const accessToken = getAccessToken();
    const refreshToken = getRefreshToken();

    if (!accessToken && !refreshToken) {
      applySession(null);
      return;
    }

    if (accessToken) {
      try {
        const me = await meRequest(accessToken);
        applySession(me);
        return;
      } catch {
        // try refresh below
      }
    }

    if (!refreshToken) {
      clearSession();
      applySession(null);
      return;
    }

    try {
      const tokens = await refreshRequest(refreshToken);
      persistSession(tokens);
      applySession(tokens.user);
    } catch {
      clearSession();
      applySession(null);
    }
  }, [applySession]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        await restoreSession();
      } finally {
        if (!cancelled) {
          setIsBootstrapping(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [restoreSession]);

  const signIn = useCallback(async (returnTo = '/') => {
    const { authorizeUrl } = await beginLoginRequest(returnTo);
    window.location.assign(authorizeUrl);
  }, []);

  const changePassword = useCallback(async () => {
    const { authorizeUrl } = await beginLoginRequest(
      '/profile/security',
      'UPDATE_PASSWORD',
    );
    window.location.assign(authorizeUrl);
  }, []);

  const completeSignIn = useCallback(
    async (code: string, state: string) => {
      const tokens = await completeLoginRequest(code, state);
      persistSession(tokens);
      applySession(tokens.user);
      return tokens.returnTo || '/';
    },
    [applySession],
  );

  const signOut = useCallback(async () => {
    const refreshToken = getRefreshToken();
    await logoutRequest(refreshToken);
    clearSession();
    applySession(null);
  }, [applySession]);

  const setUser = useCallback(
    (next: AuthUser) => {
      applySession(next);
    },
    [applySession],
  );

  const refreshUser = useCallback(async () => {
    const accessToken = getAccessToken();
    if (!accessToken) {
      applySession(null);
      return null;
    }
    const me = await meRequest(accessToken);
    applySession(me);
    return me;
  }, [applySession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isBootstrapping,
      displayName: user ? formatDisplayName(user) : null,
      signIn,
      changePassword,
      completeSignIn,
      signOut,
      setUser,
      refreshUser,
    }),
    [
      user,
      isBootstrapping,
      signIn,
      changePassword,
      completeSignIn,
      signOut,
      setUser,
      refreshUser,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
