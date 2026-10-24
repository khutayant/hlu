import MenuIcon from '@mui/icons-material/Menu';
import { AppBar, Box, IconButton, Toolbar } from '@mui/material';
import { Link } from 'react-router-dom';
import { AppEnv } from '../resources/env/app.env';

type AppToolbarProps = {
  onMenuClick: () => void;
};

function AppToolbar({ onMenuClick }: AppToolbarProps) {
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
          {AppEnv.APP_NAME}
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default AppToolbar;
