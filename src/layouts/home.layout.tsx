import { useState } from 'react'
import { Box, Container } from '@mui/material'
import { Outlet } from 'react-router-dom'
import AppSidebar from '../components/sidebar'
import AppToolbar from '../components/toolbar'

function HomeLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const toggleSidebar = () => {
    setSidebarOpen((isOpen) => !isOpen)
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <AppToolbar onMenuClick={toggleSidebar} />
        <Box component="main">
          <Container maxWidth="lg" sx={{ py: { xs: 5, md: 8 } }}>
            <Outlet />
          </Container>
        </Box>
      </Box>
    </Box>
  )
}

export default HomeLayout
