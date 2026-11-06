import { Layout } from 'antd';
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AppLocator from '../components/locator';
import AppSidebar from '../components/sidebar';
import AppToolbar from '../components/toolbar';

const { Content } = Layout;

function HomeLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen((isOpen) => !isOpen);
  };

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f7fa' }}>
      <AppSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <Layout style={{ background: '#f5f7fa' }}>
        <AppToolbar onMenuClick={toggleSidebar} />
        <AppLocator />
        <Content
          style={{
            maxWidth: 960,
            width: '100%',
            marginInline: 'auto',
            paddingBlock: 40,
            paddingInline: 24,
            paddingBottom: 128,
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}

export default HomeLayout;
