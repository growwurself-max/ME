import { createContext, useCallback, useContext, useState } from 'react';

const ToastContext = createContext({ toast: () => {} });

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);

  const toast = useCallback((message, type = 'success') => {
    const id = Math.random().toString(36).slice(2);
    setItems((current) => [...current, { id, message, type }]);
    setTimeout(() => setItems((current) => current.filter((i) => i.id !== id)), 4200);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="no-print pointer-events-none fixed bottom-5 right-5 z-[100] flex w-80 flex-col gap-2">
        {items.map((item) => (
          <div
            key={item.id}
            className={`pointer-events-auto rounded-xl px-4 py-3 text-sm font-medium text-white shadow-lg ${
              item.type === 'error'
                ? 'bg-rose-600'
                : item.type === 'info'
                  ? 'bg-slate-700'
                  : 'bg-brand-600'
            }`}
          >
            {item.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext).toast;
