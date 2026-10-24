import MenuIcon from '@mui/icons-material/Menu';
import {
  AppBar,
  Box,
  Button,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Toolbar,
} from '@mui/material';
import { useState, type MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../providers/i18n.provider';
import { LOCALE_OPTIONS, type LocaleCode } from '../resources/data/locales';

type AppToolbarProps = {
  onMenuClick: () => void;
};

function LocaleFlag({
  src,
  label,
  size = 20,
}: {
  src: string;
  label: string;
  size?: number;
}) {
  return (
    <Box
      component='img'
      src={src}
      alt=''
      aria-hidden
      title={label}
      sx={{
        width: size,
        height: (size * 2) / 3,
        objectFit: 'cover',
        borderRadius: 0.5,
        display: 'block',
        boxShadow: '0 0 0 1px rgba(0,0,0,0.12)',
      }}
    />
  );
}

function AppToolbar({ onMenuClick }: AppToolbarProps) {
  const { t, locale, setLocale } = useI18n();
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const isMenuOpen = Boolean(menuAnchor);
  const selectedLocale =
    LOCALE_OPTIONS.find((option) => option.code === locale) ??
    LOCALE_OPTIONS[0];

  const openMenu = (event: MouseEvent<HTMLElement>) => {
    setMenuAnchor(event.currentTarget);
  };

  const closeMenu = () => {
    setMenuAnchor(null);
  };

  const selectLocale = (code: LocaleCode) => {
    setLocale(code);
    closeMenu();
  };

  return (
    <AppBar position='sticky' color='inherit' elevation={1}>
      <Toolbar>
        <IconButton
          color='inherit'
          edge='start'
          onClick={onMenuClick}
          aria-label='toggle sidebar'
          sx={{ mr: 1 }}
        >
          <MenuIcon />
        </IconButton>
        <Box
          component={Link}
          to='/'
          sx={{
            typography: 'h6',
            fontWeight: 800,
            color: 'primary.main',
            textDecoration: 'none',
            flexGrow: 1,
          }}
        >
          {t('app.name')}
        </Box>

        {/* Language Switcher */}
        <Button
          color='inherit'
          size='small'
          startIcon={
            <LocaleFlag
              src={selectedLocale.flag}
              label={selectedLocale.label}
            />
          }
          onClick={openMenu}
          aria-label={t('common.language')}
          aria-haspopup='menu'
          aria-expanded={isMenuOpen}
          sx={{ textTransform: 'none', fontWeight: 600 }}
        >
          {selectedLocale.label}
        </Button>
        <Menu
          anchorEl={menuAnchor}
          open={isMenuOpen}
          onClose={closeMenu}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          marginThreshold={8}
        >
          {LOCALE_OPTIONS.map((option) => (
            <MenuItem
              key={option.code}
              selected={option.code === locale}
              onClick={() => selectLocale(option.code)}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                <LocaleFlag src={option.flag} label={option.label} size={22} />
              </ListItemIcon>
              <ListItemText primary={option.label} />
            </MenuItem>
          ))}
        </Menu>
      </Toolbar>
    </AppBar>
  );
}

export default AppToolbar;
