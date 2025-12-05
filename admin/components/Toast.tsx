'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, X, AlertCircle } from 'lucide-react';

interface Toast {
  id: string;
  title?: string;
  message: string;
  type: 'success' | 'error' | 'default';
}

let toastId = 0;
let addToastFn: ((message: string, type: 'success' | 'error' | 'default', title?: string) => void) | null = null;

export const showToast = (message: string, type: 'success' | 'error' | 'default' = 'success', title?: string) => {
  if (addToastFn) {
    addToastFn(message, type, title);
  }
};

export default function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    addToastFn = (message: string, type: 'success' | 'error' | 'default', title?: string) => {
      const id = `toast-${++toastId}`;
      setToasts((prev) => [...prev, { id, message, type, title }]);

      // Auto remove after 4 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    };

    return () => {
      addToastFn = null;
    };
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-0 right-0 z-[100] flex flex-col-reverse gap-2 p-4 sm:bottom-4 sm:right-4 sm:flex-col md:max-w-[420px] w-full">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-lg border p-4 pr-8 shadow-lg transition-all animate-in slide-in-from-bottom-full sm:slide-in-from-right-full duration-300 ${
            toast.type === 'success'
              ? 'border-green-200 bg-green-50 text-green-900'
              : toast.type === 'error'
              ? 'border-red-300 bg-red-50 text-red-900'
              : 'border-gray-200 bg-white text-gray-900'
          }`}
        >
          <div className="flex items-start gap-3">
            {toast.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            ) : toast.type === 'error' ? (
              <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 text-gray-600 flex-shrink-0 mt-0.5" />
            )}
            <div className="grid gap-1">
              {toast.title && (
                <p className="text-sm font-semibold leading-none tracking-tight">
                  {toast.title}
                </p>
              )}
              <p className="text-sm opacity-90">{toast.message}</p>
            </div>
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className={`absolute right-2 top-2 rounded-md p-1 opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100 focus:outline-none ${
              toast.type === 'success'
                ? 'text-green-600/50 hover:text-green-600'
                : toast.type === 'error'
                ? 'text-red-600/50 hover:text-red-600'
                : 'text-gray-600/50 hover:text-gray-600'
            }`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
