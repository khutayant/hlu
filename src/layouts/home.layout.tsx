import { Layout } from 'antd';
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AppSidebar from '../components/sidebar';
import AppToolbar from '../components/toolbar';
import {
  AppRibbon,
  RibbonProvider,
} from '../providers/ribbon.provider';

const { Content } = Layout;

function HomeLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen((isOpen) => !isOpen);
  };

  return (
    <RibbonProvider>
      <Layout
        style={{
          height: '100%',
          minHeight: 0,
          overflow: 'hidden',
          background: '#f5f7fa',
        }}
      >
        <AppSidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <Layout
          style={{
            height: '100%',
            minHeight: 0,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            background: '#f5f7fa',
          }}
        >
          <AppToolbar onMenuClick={toggleSidebar} />
          <AppRibbon />
          <Content
            style={{
              width: '100%',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0,
              overflow: 'auto',
              paddingBlock: 20,
              paddingInline: 20,
              paddingBottom: 32,
            }}
          >
            <Outlet />
          </Content>
        </Layout>
      </Layout>
    </RibbonProvider>
  );
}

export default HomeLayout;
