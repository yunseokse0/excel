"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  ReactNode,
} from "react";

type ToastVariant = "default" | "success" | "error";

interface ToastMessage {
  id: number;
  title: string;
  description?: string;
  variant?: ToastVariant;
}

interface ToastContextValue {
  toasts: ToastMessage[];
  showToast: (toast: Omit<ToastMessage, "id">) => void;
  dismissToast: (id: number) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((toast: Omit<ToastMessage, "id">) => {
    setToasts((prev) => [
      ...prev,
      { ...toast, id: Date.now() + Math.random() },
    ]);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const value = useMemo(
    () => ({ toasts, showToast, dismissToast }),
    [toasts, showToast, dismissToast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-4">
        <div className="flex w-full max-w-sm flex-col gap-2">
          {toasts.map((toast) => (
            <button
              key={toast.id}
              type="button"
              onClick={() => dismissToast(toast.id)}
              className={`pointer-events-auto rounded-xl border px-4 py-3 text-left text-sm shadow-lg transition ${
                toast.variant === "success"
                  ? "border-emerald-500/50 bg-emerald-900/70 text-emerald-50"
                  : toast.variant === "error"
                  ? "border-red-500/50 bg-red-900/70 text-red-50"
                  : "border-zinc-700/70 bg-zinc-900/80 text-zinc-50"
              }`}
            >
              <p className="font-semibold">{toast.title}</p>
              {toast.description && (
                <p className="mt-1 text-xs opacity-90">{toast.description}</p>
              )}
              <p className="mt-1 text-[10px] text-zinc-400">
                클릭하면 닫힙니다
              </p>
            </button>
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}

