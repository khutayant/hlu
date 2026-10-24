import { Alert, Snackbar, type AlertColor } from '@mui/material';
import { createContext, useContext, useState, type ReactNode } from 'react';

type ToastOptions = {
  message: string;
  severity?: AlertColor;
};

type ToastContextValue = {
  showToast: (options: ToastOptions) => void;
  closeToast: () => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastOptions | null>(null);

  return (
    <ToastContext.Provider
      value={{
        showToast: setToast,
        closeToast: () => setToast(null),
      }}
    >
      {children}
      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={3500}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {toast ? (
          <Alert
            onClose={() => setToast(null)}
            severity={toast.severity ?? 'info'}
            variant='filled'
          >
            {toast.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast must be used inside ToastProvider');
  }

  return context;
}
