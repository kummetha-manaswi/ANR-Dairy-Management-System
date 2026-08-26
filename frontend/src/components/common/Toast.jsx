import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react';
import { useUI } from '../../context/UIContext';

export default function ToastContainer() {
  const { toasts, removeToast } = useUI();

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95, transition: { duration: 0.2 } }}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-lg border shadow-lg bg-white dark:bg-dark-surface ${
              toast.type === 'success'
                ? 'border-emerald-200 dark:border-emerald-950/30 text-slate-800 dark:text-slate-100'
                : toast.type === 'error'
                ? 'border-red-200 dark:border-red-950/30 text-slate-800 dark:text-slate-100'
                : toast.type === 'warning'
                ? 'border-amber-200 dark:border-amber-950/30 text-slate-800 dark:text-slate-100'
                : 'border-slate-200 dark:border-dark-border text-slate-800 dark:text-slate-100'
            }`}
          >
            {/* Icon */}
            <div className="flex-shrink-0 mt-0.5">
              {toast.type === 'success' && (
                <CheckCircle className="w-5 h-5 text-emerald-500" />
              )}
              {toast.type === 'error' && (
                <XCircle className="w-5 h-5 text-red-500" />
              )}
              {toast.type === 'warning' && (
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              )}
              {toast.type === 'info' && (
                <Info className="w-5 h-5 text-blue-500" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 text-sm font-medium pr-2">
              {toast.message}
            </div>

            {/* Close Button */}
            <button
              onClick={() => removeToast(toast.id)}
              className="flex-shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
