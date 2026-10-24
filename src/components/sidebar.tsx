import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Typography,
} from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import { VERSION } from '../config';
import { AppEnv } from '../resources/env/app.env';

const BRAND_LOGO = '/assets/icons/android-chrome-192x192.png';

type AppSidebarProps = {
  open: boolean;
  onClose: () => void;
};

const drawerWidth = 240;
const collapsedWidth = 72;

type NavigationContentProps = Pick<AppSidebarProps, 'onClose'> & {
  collapsed?: boolean;
};

function BrandSection({ collapsed }: { collapsed: boolean }) {
  return (
    <Box
      component={Link}
      to='/'
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: collapsed ? 0 : 1.5,
        justifyContent: collapsed ? 'center' : 'flex-start',
        px: collapsed ? 1 : 2,
        py: 2,
        minHeight: 64,
        textDecoration: 'none',
        color: 'inherit',
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      <Box
        component='img'
        src={BRAND_LOGO}
        alt=''
        sx={{
          width: collapsed ? 36 : 40,
          height: collapsed ? 36 : 40,
          borderRadius: 1,
          flexShrink: 0,
        }}
      />
      <Box
        sx={{
          minWidth: 0,
          display: collapsed ? 'none' : 'block',
          opacity: collapsed ? 0 : 1,
          transition: 'opacity 180ms ease',
        }}
      >
        <Typography
          variant='subtitle1'
          fontWeight={800}
          noWrap
          color='primary.main'
        >
          {AppEnv.APP_NAME}
        </Typography>
      </Box>
    </Box>
  );
}

function NavigationContent({
  onClose,
  collapsed = false,
}: NavigationContentProps) {
  const location = useLocation();

  return (
    <Box
      sx={{
        width: '100%',
        minHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
      role='navigation'
    >
      <BrandSection collapsed={collapsed} />
      <List sx={{ flexGrow: 1 }}>
        {[{ label: 'Home', path: '/', icon: <HomeOutlinedIcon /> }].map(
          ({ label, path, icon }) => (
            <Box key={path} sx={{ display: 'block', width: '100%' }}>
              <Tooltip title={collapsed ? label : ''} placement='right'>
                <ListItemButton
                  component={Link}
                  to={path}
                  selected={location.pathname === path}
                  onClick={onClose}
                  sx={{
                    minHeight: 48,
                    width: '100%',
                    justifyContent: collapsed ? 'center' : 'initial',
                    px: collapsed ? 0 : 2,
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: collapsed ? 0 : 36,
                      width: collapsed ? 24 : 'auto',
                      mr: collapsed ? 0 : 1,
                      ml: 0,
                      justifyContent: 'center',
                    }}
                  >
                    {icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={label}
                    sx={{
                      display: collapsed ? 'none' : 'block',
                      opacity: collapsed ? 0 : 1,
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                      transition: 'opacity 180ms ease',
                    }}
                  />
                </ListItemButton>
              </Tooltip>
            </Box>
          ),
        )}
      </List>
      <Box
        sx={{
          px: collapsed ? 0.5 : 2,
          py: 2,
          textAlign: 'center',
          borderTop: 1,
          borderColor: 'divider',
        }}
      >
        <Typography variant='caption' color='text.secondary' noWrap>
          {collapsed ? `v${VERSION}` : `Version ${VERSION}`}
        </Typography>
      </Box>
    </Box>
  );
}

function AppSidebar({ open, onClose }: AppSidebarProps) {
  return (
    <>
      <Drawer
        variant='temporary'
        open={open}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{ display: { xs: 'block', md: 'none' } }}
      >
        <NavigationContent onClose={onClose} />
      </Drawer>
      <Drawer
        variant='permanent'
        open
        sx={{
          display: { xs: 'none', md: 'block' },
          width: open ? drawerWidth : collapsedWidth,
          flexShrink: 0,
          transition: (theme) => theme.transitions.create('width'),
          '& .MuiDrawer-paper': {
            width: open ? drawerWidth : collapsedWidth,
            boxSizing: 'border-box',
            overflowX: 'hidden',
            transition: (theme) => theme.transitions.create('width'),
          },
        }}
      >
        <NavigationContent onClose={onClose} collapsed={!open} />
      </Drawer>
    </>
  );
}

export default AppSidebar;
