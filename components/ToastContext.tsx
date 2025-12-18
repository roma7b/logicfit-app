import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto remove after 3 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border animate-slideIn ${
              toast.type === 'success' 
                ? 'bg-slate-900/90 border-primary/50 text-white' 
                : toast.type === 'error'
                ? 'bg-slate-900/90 border-red-500/50 text-white'
                : toast.type === 'warning'
                ? 'bg-slate-900/90 border-yellow-500/50 text-white'
                : 'bg-slate-900/90 border-blue-500/50 text-white'
            }`}
          >
            {toast.type === 'success' && <CheckCircle className="text-primary" size={20} />}
            {toast.type === 'error' && <AlertCircle className="text-red-500" size={20} />}
            {toast.type === 'warning' && <AlertTriangle className="text-yellow-500" size={20} />}
            {toast.type === 'info' && <Info className="text-blue-500" size={20} />}
            
            <p className="text-sm font-medium">{toast.message}</p>
            
            <button onClick={() => removeToast(toast.id)} className="text-slate-500 hover:text-white ml-2">
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};