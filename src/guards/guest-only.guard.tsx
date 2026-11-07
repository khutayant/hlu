import { Flex, Spin } from 'antd';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../providers/auth.provider';

function GuestOnlyGuard() {
  const { isAuthenticated, isBootstrapping } = useAuth();

  if (isBootstrapping) {
    return (
      <Flex align='center' justify='center' style={{ minHeight: '100vh' }}>
        <Spin size='large' />
      </Flex>
    );
  }

  if (isAuthenticated) {
    return <Navigate to='/' replace />;
  }

  return <Outlet />;
}

export default GuestOnlyGuard;
