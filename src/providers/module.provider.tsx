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
  listGrantedModulesRequest,
  type GrantedModule,
} from '../handlers/user-role.handler';
import { useAuth } from './auth.provider';

/** System code required to open user role. */
export const ADMIN_SYSTEM_CODE = 'ADMIN_SYSTEM';

type ModuleContextValue = {
  modules: GrantedModule[];
  /** False while the one granted-module request is in flight. */
  ready: boolean;
  /** True when `code` is present on the loaded module response. */
  hasModule: (code: string) => boolean;
};

const ModuleContext = createContext<ModuleContextValue | null>(null);

/**
 * Loads granted modules once per signed-in user and reuses that list
 * for every system/module check in the app.
 */
export function ModuleProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const [modules, setModules] = useState<GrantedModule[] | null>(null);
  const userId = user?.id ?? null;

  useEffect(() => {
    if (!isAuthenticated || !userId) {
      setModules(null);
      return;
    }

    let cancelled = false;
    setModules(null);

    void listGrantedModulesRequest()
      .then((items) => {
        if (!cancelled) {
          setModules(items);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setModules([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, userId]);

  const ready = !isAuthenticated || modules !== null;

  const codes = useMemo(
    () => new Set((modules ?? []).map((item) => item.code)),
    [modules],
  );

  const hasModule = useCallback(
    (code: string) => codes.has(code.trim()),
    [codes],
  );

  const value = useMemo<ModuleContextValue>(
    () => ({
      modules: modules ?? [],
      ready,
      hasModule,
    }),
    [modules, ready, hasModule],
  );

  return (
    <ModuleContext.Provider value={value}>{children}</ModuleContext.Provider>
  );
}

export function useModule() {
  const context = useContext(ModuleContext);
  if (!context) {
    throw new Error('useModule must be used inside ModuleProvider');
  }
  return context;
}
