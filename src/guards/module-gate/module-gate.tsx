import { Flex, Spin } from 'antd';
import { Navigate, Outlet } from 'react-router-dom';
import { useModule } from '../../providers/module.provider';

/**
 * Opens the matched routes only when `code` is granted
 * (or the user has `ALL_SYSTEM` wildcard).
 * Child routes stay behind the same check.
 */
function ModuleGate({ code }: { code: string }) {
  const { ready, hasModule } = useModule();

  if (!ready) {
    return (
      <Flex align='center' justify='center' style={{ minHeight: '40vh' }}>
        <Spin size='large' />
      </Flex>
    );
  }

  if (!hasModule(code)) {
    return <Navigate to='/' replace />;
  }

  return <Outlet />;
}

export default ModuleGate;
