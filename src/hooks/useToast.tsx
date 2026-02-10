import { useState, useCallback, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { ToastItem, type ToastType } from '../components/ui/Toast';
import { AnimatePresence } from 'framer-motion';

interface ToastOptions {
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Global state using a simple event emitter pattern would be better for a hook,
// but for simplicity in this React context, we'll export a provider-less singleton-ish pattern or Context.
// Actually, let's use a simpler Context approach.

import { createContext, useContext, type ReactNode } from 'react';

interface ToastContextType {
  toast: (options: { type: ToastType; title: string; message: string } & ToastOptions) => void;
  success: (title: string, message: string, options?: ToastOptions) => void;
  error: (title: string, message: string, options?: ToastOptions) => void;
  info: (title: string, message: string, options?: ToastOptions) => void;
  warning: (title: string, message: string, options?: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((options: { type: ToastType; title: string; message: string } & ToastOptions) => {
    const id = Math.random().toString(36).substring(7);
    setToasts((prev) => [...prev, { id, ...options }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((options: { type: ToastType; title: string; message: string } & ToastOptions) => {
    addToast(options);
  }, [addToast]);

  const success = useCallback((title: string, message: string, options?: ToastOptions) => {
    addToast({ type: 'success', title, message, ...options });
  }, [addToast]);

  const error = useCallback((title: string, message: string, options?: ToastOptions) => {
    addToast({ type: 'error', title, message, ...options });
  }, [addToast]);

  const info = useCallback((title: string, message: string, options?: ToastOptions) => {
    addToast({ type: 'info', title, message, ...options });
  }, [addToast]);

  const warning = useCallback((title: string, message: string, options?: ToastOptions) => {
    addToast({ type: 'warning', title, message, ...options });
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ toast, success, error, info, warning }}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col items-end pointer-events-none p-4">
        <AnimatePresence mode='sync'>
          {toasts.map((t) => (
            <ToastItem key={t.id} {...t} onClose={removeToast} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
