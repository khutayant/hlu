import { createContext } from 'react';
import type { AuthUser } from '../handlers/auth.handler';

export type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isBootstrapping: boolean;
  displayName: string | null;
  /** Redirect browser to Keycloak login (password + MFA screens). */
  signIn: (returnTo?: string) => Promise<void>;
  /** Finish login after Keycloak redirects back with code + state. */
  completeSignIn: (code: string, state: string) => Promise<string>;
  signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);
