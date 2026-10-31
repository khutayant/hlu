import { Box, Container } from '@mui/material';
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AppSidebar from '../components/sidebar';
import AppToolbar from '../components/toolbar';

function HomeLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen((isOpen) => !isOpen);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <AppToolbar onMenuClick={toggleSidebar} />
        <Box component='main'>
          <Container
            maxWidth='lg'
            sx={{ pt: { xs: 5, md: 8 }, pb: { xs: 16, md: 24 } }}
          >
            <Outlet />
          </Container>
        </Box>
      </Box>
    </Box>
  );
}

// Test push UI
export default HomeLayout;
