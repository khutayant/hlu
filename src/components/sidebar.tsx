import VaccinesOutlinedIcon from '@mui/icons-material/VaccinesOutlined';
import {
  Box,
  Chip,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { publicUrl, VERSION } from '../config';
import { useI18n } from '../providers/i18n.provider';

const NAV_ITEMS: {
  code?: string;
  labelKey: string;
  path: string;
  icon: ReactNode;
}[] = [
  {
    code: 'C001',
    labelKey: 'nav.ageForVaccination',
    path: '/',
    icon: <VaccinesOutlinedIcon />,
  },
];


const BRAND_LOGO = publicUrl(
  'assets/icons/epi-logo/android-chrome-192x192.png',
);

type AppSidebarProps = {
  open: boolean;
  onClose: () => void;
};

const drawerWidth = 350;
const collapsedWidth = 72;

type NavigationContentProps = Pick<AppSidebarProps, 'onClose'> & {
  collapsed?: boolean;
};

function BrandSection({ collapsed }: { collapsed: boolean }) {
  const { t } = useI18n();

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
          noWrap
          color='primary.main'
          sx={{ fontWeight: 800 }}
        >
          {t('app.name')}
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
  const { t } = useI18n();

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
        {NAV_ITEMS.map(({ code, labelKey, path, icon }) => {
          const label = t(labelKey);
          const tooltip = code ? `${code} ${label}` : label;
          return (
            <Box key={path} sx={{ display: 'block', width: '100%' }}>
              <Tooltip title={collapsed ? tooltip : ''} placement='right'>
                <ListItemButton
                  component={Link}
                  to={path}
                  selected={location.pathname === path}
                  onClick={onClose}
                  sx={{
                    minHeight: 48,
                    width: '100%',
                    justifyContent: collapsed ? 'center' : 'initial',
                    alignItems: { xs: 'flex-start', md: 'center' },
                    px: collapsed ? 0 : 2,
                    py: { xs: 1.25, md: 1 },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: collapsed ? 0 : 36,
                      width: collapsed ? 24 : 'auto',
                      mr: collapsed ? 0 : 1,
                      ml: 0,
                      mt: { xs: 0.25, md: 0 },
                      justifyContent: 'center',
                    }}
                  >
                    {icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: { xs: 'column', md: 'row' },
                          alignItems: { xs: 'flex-start', md: 'center' },
                          gap: { xs: 0.5, md: 1 },
                          minWidth: 0,
                        }}
                      >
                        <Typography
                          component='span'
                          noWrap
                          variant='body2'
                          sx={{ order: { xs: 0, md: 1 } }}
                        >
                          {label}
                        </Typography>
                        {code ? (
                          <Chip
                            label={code}
                            size='small'
                            color={code.startsWith('C') ? 'success' : 'default'}
                            variant='outlined'
                            sx={{
                              order: { xs: 1, md: 0 },
                              height: 22,
                              flexShrink: 0,
                              fontWeight: 700,
                              fontSize: '0.7rem',
                              letterSpacing: 0.4,
                            }}
                          />
                        ) : null}
                      </Box>
                    }
                    sx={{
                      display: collapsed ? 'none' : 'block',
                      opacity: collapsed ? 0 : 1,
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                      transition: 'opacity 180ms ease',
                      my: 0,
                    }}
                  />
                </ListItemButton>
              </Tooltip>
            </Box>
          );
        })}
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
          {collapsed
            ? t('app.versionShort', { version: VERSION })
            : t('app.version', { version: VERSION })}
        </Typography>
      </Box>
    </Box>
  );
}

function AppSidebar({ open, onClose }: AppSidebarProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <>
      <Drawer
        variant='temporary'
        open={isMobile && open}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            width: '80vw',
            boxSizing: 'border-box',
          },
        }}
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
