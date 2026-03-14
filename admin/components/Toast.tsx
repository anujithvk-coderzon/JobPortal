'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, X, Info, AlertTriangle } from 'lucide-react';

interface Toast {
  id: string;
  title?: string;
  message: string;
  type: 'success' | 'error' | 'default' | 'warning';
  removing?: boolean;
}

let toastId = 0;
let addToastFn: ((message: string, type: 'success' | 'error' | 'default' | 'warning', title?: string) => void) | null = null;

export const showToast = (message: string, type: 'success' | 'error' | 'default' | 'warning' = 'success', title?: string) => {
  if (addToastFn) {
    addToastFn(message, type, title);
  }
};

const iconMap = {
  success: <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />,
  error: <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />,
  warning: <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />,
  default: <Info className="h-5 w-5 text-slate-400 flex-shrink-0" />,
};

const accentMap = {
  success: 'border-emerald-200',
  error: 'border-red-200',
  warning: 'border-amber-200',
  default: 'border-slate-200',
};

const barMap = {
  success: 'bg-emerald-500',
  error: 'bg-red-500',
  warning: 'bg-amber-500',
  default: 'bg-slate-400',
};

const ToastContainer = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    addToastFn = (message: string, type: 'success' | 'error' | 'default' | 'warning', title?: string) => {
      const id = `toast-${++toastId}`;
      setToasts((prev) => [...prev, { id, message, type, title }]);

      // Auto remove after 3 seconds
      setTimeout(() => {
        removeToast(id);
      }, 3000);
    };

    return () => {
      addToastFn = null;
    };
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, removing: true } : t)));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 200);
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-14 sm:top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-full max-w-[400px] px-4">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`relative flex items-center gap-3 bg-white border ${accentMap[toast.type]} rounded-lg shadow-xl py-3 pl-4 pr-8 overflow-hidden transition-all duration-200 ${
            toast.removing
              ? 'opacity-0 -translate-y-2'
              : 'opacity-100 translate-y-0 animate-[slideDown_0.2s_ease-out]'
          }`}
        >
          {/* Left accent bar */}
          <div className={`absolute left-0 top-0 bottom-0 w-1 ${barMap[toast.type]}`} />

          {/* Icon */}
          {iconMap[toast.type]}

          {/* Content */}
          <div className="flex-1 min-w-0">
            {toast.title && (
              <p className="text-sm font-semibold text-gray-900 leading-tight">
                {toast.title}
              </p>
            )}
            <p className="text-xs text-gray-500 leading-snug">{toast.message}</p>
          </div>

          {/* Close button - always visible */}
          <button
            onClick={() => removeToast(toast.id)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}

      <style jsx global>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default ToastContainer;
