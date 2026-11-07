import { Alert } from 'antd';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

export type ToastSeverity = 'success' | 'info' | 'warning' | 'error';

export type ToastOptions = {
  message: string;
  severity?: ToastSeverity;
  /** Auto-hide duration in ms. Default 2000. */
  duration?: number;
};

type ToastContextValue = {
  showToast: (options: ToastOptions) => void;
  closeToast: () => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATION_MS = 2000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastOptions | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const closeToast = useCallback(() => {
    clearTimer();
    setToast(null);
  }, [clearTimer]);

  const showToast = useCallback(
    (options: ToastOptions) => {
      clearTimer();
      setToast(options);
      const duration = options.duration ?? DEFAULT_DURATION_MS;
      if (duration > 0) {
        timerRef.current = setTimeout(() => {
          setToast(null);
          timerRef.current = null;
        }, duration);
      }
    },
    [clearTimer],
  );

  useEffect(() => () => clearTimer(), [clearTimer]);

  const value = useMemo(
    () => ({ showToast, closeToast }),
    [showToast, closeToast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? (
        <div
          style={{
            position: 'fixed',
            insetInline: 0,
            insetBlockStart: 24,
            zIndex: 1100,
            display: 'flex',
            justifyContent: 'center',
            pointerEvents: 'none',
            paddingInline: 16,
          }}
        >
          <Alert
            type={toast.severity ?? 'info'}
            message={toast.message}
            showIcon
            closable
            onClose={closeToast}
            style={{
              pointerEvents: 'auto',
              maxWidth: 480,
              width: '100%',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
            }}
          />
        </div>
      ) : null}
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
