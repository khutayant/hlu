import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './app';
import { BASE_URL } from './config';
import { DialogProvider, I18nProvider, ToastProvider } from './providers';
import './pwa';
import './styles.css';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#1565c0' },
    secondary: { main: '#00897b' },
    background: { default: '#f5f7fa' },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
  shape: { borderRadius: 8 },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={BASE_URL}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <I18nProvider>
          <ToastProvider>
            <DialogProvider>
              <App />
            </DialogProvider>
          </ToastProvider>
        </I18nProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
);

// Test push UI
