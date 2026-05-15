import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Toast, ToastConfig, ToastType } from '../components/Toast';

interface ToastContextValue {
  showToast: (config: ToastConfig) => void;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showWarning: (message: string) => void;
  showInfo: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue>({
  showToast: () => {},
  showSuccess: () => {},
  showError: () => {},
  showWarning: () => {},
  showInfo: () => {},
});

export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as ToastType });

  const showToast = useCallback((config: ToastConfig) => {
    setToast({ visible: false, message: '', type: config.type ?? 'success' });
    requestAnimationFrame(() => {
      setToast({
        visible: true,
        message: config.message,
        type: config.type ?? 'success',
      });
    });
  }, []);

  const dismiss = useCallback(() => setToast((t) => ({ ...t, visible: false })), []);

  return (
    <ToastContext.Provider
      value={{
        showToast,
        showSuccess: (m) => showToast({ message: m, type: 'success' }),
        showError: (m) => showToast({ message: m, type: 'error' }),
        showWarning: (m) => showToast({ message: m, type: 'warning' }),
        showInfo: (m) => showToast({ message: m, type: 'info' }),
      }}
    >
      {children}
      <Toast toast={toast} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}