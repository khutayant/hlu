import '@ant-design/v5-patch-for-react-19';
import { ConfigProvider } from 'antd';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './app';
import { BASE_URL } from './config';
import { DialogProvider } from './providers/dialog.provider';
import { I18nProvider } from './providers/i18n.provider';
import { ToastProvider } from './providers/toast.provider';
import './pwa';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={BASE_URL}>
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: '#1565c0',
            colorInfo: '#1565c0',
            colorSuccess: '#00897b',
            borderRadius: 8,
            fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
            colorBgLayout: '#f5f7fa',
          },
        }}
      >
        <I18nProvider>
          <ToastProvider>
            <DialogProvider>
              <App />
            </DialogProvider>
          </ToastProvider>
        </I18nProvider>
      </ConfigProvider>
    </BrowserRouter>
  </StrictMode>,
);
