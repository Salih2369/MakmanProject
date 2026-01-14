import React, { createContext, useContext, useMemo, useState, useCallback } from "react";

const ToastCtx = createContext(null);

export const useToast = () => {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
};

const makeId = () => Math.random().toString(16).slice(2);

export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((type, title, message, opts = {}) => {
    const id = makeId();
    const ttl = opts.ttl ?? 3200;

    setToasts((prev) => [...prev, { id, type, title, message }]);
    window.setTimeout(() => remove(id), ttl);

    return id;
  }, [remove]);

  const api = useMemo(() => ({
    success: (title, message, opts) => push("success", title, message, opts),
    error: (title, message, opts) => push("error", title, message, opts),
    info: (title, message, opts) => push("info", title, message, opts),
    warning: (title, message, opts) => push("warning", title, message, opts),
    remove
  }), [push, remove]);

  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div className="toast-stack" aria-live="polite" aria-atomic="true">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            <div className="toast-head">
              <div className="toast-title">{t.title}</div>
              <button className="toast-x" onClick={() => remove(t.id)} aria-label="close">×</button>
            </div>
            <div className="toast-msg">{t.message}</div>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
