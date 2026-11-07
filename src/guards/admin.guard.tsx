import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../providers/auth.provider';

/**
 * Gate for admin-only areas.
 * Currently allows every authenticated user; tighten with role checks later.
 */
export function isAdminUser(role: string | null | undefined) {
  // TODO: require ADMIN (or equivalent) once role enforcement is enabled.
  // return role?.toUpperCase() === 'ADMIN';
  void role;
  return true;
}

function AdminGuard() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return <Navigate to='/auth/login' replace />;
  }

  if (!isAdminUser(user.role)) {
    return <Navigate to='/' replace />;
  }

  return <Outlet />;
}

export default AdminGuard;
