import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

type ToastVariant = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  showToast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let nextToastId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, variant: ToastVariant = 'success') => {
      const id = nextToastId++;
      setToasts((prev) => [...prev, { id, message, variant }]);
      setTimeout(() => {
        dismiss(id);
      }, 3600);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        aria-live="polite"
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-[calc(100%-2.5rem)] pointer-events-none"
      >
        {toasts.map((toast) => {
          const styles =
            toast.variant === 'error'
              ? 'border-rose-500/40 bg-slate-900/95 text-rose-200'
              : toast.variant === 'info'
                ? 'border-cyan-500/40 bg-slate-900/95 text-cyan-200'
                : 'border-emerald-500/40 bg-slate-900/95 text-emerald-200';

          const Icon =
            toast.variant === 'error'
              ? AlertCircle
              : toast.variant === 'info'
                ? Info
                : CheckCircle2;

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-center gap-3 rounded-xl border px-4 py-3 text-sm shadow-2xl backdrop-blur ${styles}`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1 text-slate-100">{toast.message}</span>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                aria-label="Fechar notificação"
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast deve ser usado dentro de ToastProvider');
  }
  return ctx;
}
