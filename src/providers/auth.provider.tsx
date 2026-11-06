import {
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
import { AuthContext, type AuthContextValue } from './auth.context';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser());
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  const applySession = useCallback((nextUser: AuthUser | null) => {
    setUser(nextUser);
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

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isBootstrapping,
      displayName: user ? formatDisplayName(user) : null,
      signIn,
      completeSignIn,
      signOut,
    }),
    [user, isBootstrapping, signIn, completeSignIn, signOut],
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
