import { useState, useCallback } from "react";

export interface Toast {
  id: string;
  type: "info" | "warning" | "critical" | "success";
  title: string;
  message: string;
  timestamp: Date;
  autoDismiss?: number;
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, "id" | "timestamp">) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [
      { ...toast, id, timestamp: new Date() },
      ...prev,
    ].slice(0, 10));
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, addToast, dismissToast };
}
