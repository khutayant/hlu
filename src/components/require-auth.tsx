import { Flex, Spin } from 'antd';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../providers/auth.provider';

function RequireAuth() {
  const { isAuthenticated, isBootstrapping } = useAuth();
  const location = useLocation();

  if (isBootstrapping) {
    return (
      <Flex align='center' justify='center' style={{ minHeight: '100vh' }}>
        <Spin size='large' />
      </Flex>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate to='/auth/login' replace state={{ from: location.pathname }} />
    );
  }

  return <Outlet />;
}

export default RequireAuth;
