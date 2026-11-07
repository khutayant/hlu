import { lazy } from 'react';
import { Navigate, Route } from 'react-router-dom';
import GuestOnlyGuard from '../guards/guest-only.guard';
import AuthLayout from '../layouts/auth.layout';

const LoginPage = lazy(() => import('../pages/auth/login/login-page'));
const CallbackPage = lazy(
  () => import('../pages/auth/callback/callback-page'),
);

/** Guest-only auth routes (login / OAuth callback). */
export function AuthRoutes() {
  return (
    <Route element={<GuestOnlyGuard />}>
      <Route element={<AuthLayout />}>
        <Route path='/auth' element={<Navigate to='/auth/login' replace />} />
        <Route path='/auth/login' element={<LoginPage />} />
        <Route path='/auth/callback' element={<CallbackPage />} />
      </Route>
    </Route>
  );
}
