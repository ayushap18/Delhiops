import { AlertTriangle, X } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "DELETE",
  onConfirm,
  onCancel,
  loading,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      aria-describedby="confirm-desc"
    >
      <div className="fixed inset-0 bg-black/80" onClick={onCancel} />
      <div className="relative z-10 w-full max-w-md bg-gray-950 border border-danger/20 p-6 shadow-[0_0_30px_rgba(255,0,60,0.1)] corner-borders">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-danger/30 to-transparent" />
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-gray-600 hover:text-gray-400"
          aria-label="Close dialog"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="flex gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-danger/20 bg-danger/5">
            <AlertTriangle className="h-5 w-5 text-danger" />
          </div>
          <div>
            <h3
              id="confirm-title"
              className="text-xs font-mono font-bold text-danger tracking-wider"
            >
              [WARNING] {title.toUpperCase()}
            </h3>
            <p id="confirm-desc" className="mt-2 text-[10px] font-mono text-gray-500">
              {description}
            </p>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="border border-brand/10 bg-gray-950 px-4 py-2 text-[10px] font-mono text-gray-400 hover:text-brand hover:border-brand/30 tracking-wider transition-colors"
          >
            CANCEL
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="border border-danger/30 bg-danger/10 px-4 py-2 text-[10px] font-mono text-danger hover:bg-danger/20 disabled:opacity-50 tracking-wider transition-colors"
          >
            {loading ? "PROCESSING..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
