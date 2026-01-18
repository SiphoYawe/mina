'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { create } from 'zustand';

/**
 * Toast Types
 */
export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Toast Store
 */
interface ToastStore {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  updateToast: (id: string, updates: Partial<Toast>) => void;
  clearAll: () => void;
}

export const useToastStore = create<ToastStore>((set, get) => ({
  toasts: [],

  addToast: (toast) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newToast: Toast = {
      ...toast,
      id,
      duration: toast.duration ?? (toast.type === 'loading' ? Infinity : 5000),
    };

    set((state) => ({
      toasts: [...state.toasts, newToast],
    }));

    // Auto-remove after duration (unless loading or Infinity)
    if (newToast.duration !== Infinity) {
      setTimeout(() => {
        get().removeToast(id);
      }, newToast.duration);
    }

    return id;
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  updateToast: (id, updates) => {
    set((state) => ({
      toasts: state.toasts.map((t) =>
        t.id === id ? { ...t, ...updates } : t
      ),
    }));

    // If updating to a non-loading type and no custom duration, set auto-remove
    if (updates.type && updates.type !== 'loading' && !updates.duration) {
      setTimeout(() => {
        get().removeToast(id);
      }, 5000);
    }
  },

  clearAll: () => set({ toasts: [] }),
}));

/**
 * Toast hook for easy usage
 */
export function useToast() {
  const { addToast, removeToast, updateToast } = useToastStore();

  return {
    toast: addToast,
    dismiss: removeToast,
    update: updateToast,
    success: (title: string, description?: string) =>
      addToast({ type: 'success', title, description }),
    error: (title: string, description?: string) =>
      addToast({ type: 'error', title, description }),
    warning: (title: string, description?: string) =>
      addToast({ type: 'warning', title, description }),
    info: (title: string, description?: string) =>
      addToast({ type: 'info', title, description }),
    loading: (title: string, description?: string) =>
      addToast({ type: 'loading', title, description }),
    promise: async <T,>(
      promise: Promise<T>,
      options: {
        loading: string;
        success: string | ((data: T) => string);
        error: string | ((err: unknown) => string);
      }
    ): Promise<T> => {
      const id = addToast({ type: 'loading', title: options.loading });
      try {
        const result = await promise;
        updateToast(id, {
          type: 'success',
          title: typeof options.success === 'function'
            ? options.success(result)
            : options.success,
        });
        return result;
      } catch (err) {
        updateToast(id, {
          type: 'error',
          title: typeof options.error === 'function'
            ? options.error(err)
            : options.error,
        });
        throw err;
      }
    },
  };
}

/**
 * Toast Icon Component
 */
function ToastIcon({ type }: { type: ToastType }) {
  const iconProps = { className: 'w-5 h-5 flex-shrink-0' };

  switch (type) {
    case 'success':
      return <CheckCircle2 {...iconProps} className={cn(iconProps.className, 'text-success')} />;
    case 'error':
      return <XCircle {...iconProps} className={cn(iconProps.className, 'text-error')} />;
    case 'warning':
      return <AlertTriangle {...iconProps} className={cn(iconProps.className, 'text-warning')} />;
    case 'info':
      return <Info {...iconProps} className={cn(iconProps.className, 'text-info')} />;
    case 'loading':
      return <Loader2 {...iconProps} className={cn(iconProps.className, 'text-accent-primary animate-spin')} />;
  }
}

/**
 * Single Toast Item Component
 */
function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const borderColors = {
    success: 'border-l-success',
    error: 'border-l-error',
    warning: 'border-l-warning',
    info: 'border-l-info',
    loading: 'border-l-accent-primary',
  };

  const bgColors = {
    success: 'bg-success/5',
    error: 'bg-error/5',
    warning: 'bg-warning/5',
    info: 'bg-info/5',
    loading: 'bg-accent-primary/5',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={cn(
        'relative overflow-hidden rounded-xl border border-border-default/60',
        'backdrop-blur-xl shadow-2xl shadow-black/20',
        'min-w-[320px] max-w-[420px]',
        bgColors[toast.type],
        'border-l-4',
        borderColors[toast.type]
      )}
    >
      {/* Shimmer effect for loading state */}
      {toast.type === 'loading' && (
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
        </div>
      )}

      <div className="relative flex items-start gap-3 p-4 bg-bg-elevated/90">
        <ToastIcon type={toast.type} />

        <div className="flex-1 min-w-0">
          <p className="text-small font-semibold text-text-primary leading-tight">
            {toast.title}
          </p>
          {toast.description && (
            <p className="mt-1 text-caption text-text-muted leading-relaxed">
              {toast.description}
            </p>
          )}
          {toast.action && (
            <button
              onClick={toast.action.onClick}
              className="mt-2 text-caption font-medium text-accent-primary hover:text-accent-hover transition-colors"
            >
              {toast.action.label}
            </button>
          )}
        </div>

        {toast.type !== 'loading' && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-surface/50 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Progress bar for auto-dismiss */}
      {toast.duration && toast.duration !== Infinity && toast.type !== 'loading' && (
        <motion.div
          initial={{ scaleX: 1 }}
          animate={{ scaleX: 0 }}
          transition={{ duration: toast.duration / 1000, ease: 'linear' }}
          className={cn(
            'absolute bottom-0 left-0 right-0 h-0.5 origin-left',
            toast.type === 'success' && 'bg-success/50',
            toast.type === 'error' && 'bg-error/50',
            toast.type === 'warning' && 'bg-warning/50',
            toast.type === 'info' && 'bg-info/50'
          )}
        />
      )}
    </motion.div>
  );
}

/**
 * Toast Container Component
 *
 * Add this to your layout to enable toasts globally:
 * ```tsx
 * <ToastContainer />
 * ```
 */
export function ToastContainer() {
  const toasts = useToastStore((state) => state.toasts);
  const removeToast = useToastStore((state) => state.removeToast);

  return (
    <div
      className="fixed bottom-4 right-4 z-[100] flex flex-col gap-3 pointer-events-none"
      aria-live="polite"
      aria-label="Notifications"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem
              toast={toast}
              onDismiss={() => removeToast(toast.id)}
            />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export default ToastContainer;
