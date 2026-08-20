'use client';

import { useState, useEffect, createContext, useContext, useCallback } from 'react';

interface ToastItem { id: string; message: string; type: 'success' | 'error' | 'info'; }

const ToastContext = createContext<{ addToast: (msg: string, type?: 'success' | 'error' | 'info') => void }>({ addToast: () => {} });

export function useToast() { return useContext(ToastContext); }

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] space-y-2 pointer-events-none">
        {toasts.map(toast => (
          <div key={toast.id}
            className={`pointer-events-auto px-4 py-3 rounded-xl shadow-lg border text-sm font-medium animate-in fade-in slide-in-from-top-2 duration-200 ${
              toast.type === 'success' ? 'bg-green-950/90 border-green-800/50 text-green-300' :
              toast.type === 'error' ? 'bg-red-950/90 border-red-800/50 text-red-300' :
              'bg-neutral-900/90 border-neutral-700 text-neutral-200'
            }`}>
            <div className="flex items-center gap-2">
              <span>{toast.type === 'success' ? '✓' : toast.type === 'error' ? '✕' : 'ℹ'}</span>
              {toast.message}
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
