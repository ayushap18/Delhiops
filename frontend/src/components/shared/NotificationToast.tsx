import { useEffect, useState } from "react";
import { AlertTriangle, AlertCircle, Info, CheckCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Toast } from "@/hooks/useToast";

const ICON_MAP = {
  critical: AlertTriangle,
  warning: AlertCircle,
  info: Info,
  success: CheckCircle,
} as const;

const BORDER_COLOR_MAP = {
  critical: "border-l-danger",
  warning: "border-l-warning",
  info: "border-l-brand",
  success: "border-l-brand",
} as const;

const ICON_COLOR_MAP = {
  critical: "text-danger",
  warning: "text-warning",
  info: "text-brand",
  success: "text-brand",
} as const;

interface ToastItemProps {
  toast: Toast;
  onDismiss: (id: string) => void;
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const [progress, setProgress] = useState(100);
  const autoDismissMs = toast.autoDismiss ?? 5000;
  const Icon = ICON_MAP[toast.type];

  useEffect(() => {
    // Start the progress bar shrinking after mount
    const raf = requestAnimationFrame(() => {
      setProgress(0);
    });

    const timeout = setTimeout(() => {
      onDismiss(toast.id);
    }, autoDismissMs);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timeout);
    };
  }, [toast.id, autoDismissMs, onDismiss]);

  return (
    <div
      className={cn(
        "animate-toast-in glass border border-l-4 p-3 relative overflow-hidden",
        BORDER_COLOR_MAP[toast.type]
      )}
      style={{
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        borderColor: undefined,
      }}
    >
      <div className="flex items-start gap-2.5">
        <Icon className={cn("h-4 w-4 mt-0.5 shrink-0", ICON_COLOR_MAP[toast.type])} />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-gray-100 font-mono">{toast.title}</p>
          <p className="text-[10px] text-gray-400 font-mono mt-0.5 leading-relaxed">
            {toast.message}
          </p>
        </div>
        <button
          onClick={() => onDismiss(toast.id)}
          className="text-gray-500 hover:text-gray-300 transition-colors shrink-0"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gray-800">
        <div
          className="h-full bg-brand/40"
          style={{
            width: `${progress}%`,
            transition: `width ${autoDismissMs}ms linear`,
          }}
        />
      </div>
    </div>
  );
}

interface ToastContainerProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (!toasts.length) return null;

  return (
    <div className="fixed top-16 right-4 z-40 space-y-2 max-w-sm">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
