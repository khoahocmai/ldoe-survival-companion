import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import type { Tone } from './Badge';

type ToastTone = Extract<Tone, 'ok' | 'info' | 'danger'>;

interface ToastItem {
  id: number;
  tone: ToastTone;
  message: string;
}

interface ToastApi {
  success: (message: string) => void;
  info: (message: string) => void;
  error: (message: string) => void;
}

const noop = () => {};
const ToastContext = createContext<ToastApi>({ success: noop, info: noop, error: noop });

const icons: Record<ToastTone, React.ReactNode> = {
  ok: <CheckCircle2 className="text-ok" />,
  info: <Info className="text-info" />,
  danger: <AlertTriangle className="text-danger" />,
};

const LIFETIME_MS: Record<ToastTone, number> = { ok: 3500, info: 4500, danger: 7000 };

const ToastView: React.FC<{ toast: ToastItem; onDismiss: (id: number) => void }> = ({ toast, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), LIFETIME_MS[toast.tone]);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  return (
    <div className="pointer-events-auto flex animate-slide-in items-start gap-2.5 rounded-card border border-line bg-surface px-3 py-2.5 text-sm shadow-pop sm:w-80">
      <span className="mt-0.5 shrink-0 [&>svg]:h-4 [&>svg]:w-4">{icons[toast.tone]}</span>
      <p className="min-w-0 flex-1">{toast.message}</p>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Đóng thông báo"
        className="-mr-1 shrink-0 rounded p-1 text-faint hover:text-fg"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};

/** Short, self-closing confirmation ("Đã lưu"). Announced politely to screen readers. */
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counter = useRef(0);

  const dismiss = useCallback((id: number) => setToasts((prev) => prev.filter((t) => t.id !== id)), []);
  const push = useCallback(
    (tone: ToastTone, message: string) =>
      setToasts((prev) => [...prev.slice(-3), { id: counter.current++, tone, message }]),
    []
  );

  const api = useMemo<ToastApi>(
    () => ({
      success: (message) => push('ok', message),
      info: (message) => push('info', message),
      error: (message) => push('danger', message),
    }),
    [push]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-3 bottom-20 z-toast flex flex-col items-stretch gap-2 sm:left-auto sm:right-4 sm:items-end lg:bottom-4"
      >
        {toasts.map((t) => (
          <ToastView key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
