import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusBadge } from "./StatusBadge";

interface DetailPanelProps {
  open: boolean;
  onClose: () => void;
  title: string;
  entityType: "incident" | "camera" | "aqi" | "crime" | "traffic";
  data: Record<string, unknown> | null;
  onEdit?: () => void;
  onDelete?: () => void;
}

const entityBadgeStyles: Record<DetailPanelProps["entityType"], string> = {
  incident: "text-warning border-warning/20 bg-warning/5",
  camera: "text-brand border-brand/20 bg-brand/5",
  aqi: "text-info border-info/20 bg-info/5",
  crime: "text-danger border-danger/20 bg-danger/5",
  traffic: "text-info border-info/20 bg-info/5",
};

function DetailField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="py-2.5 border-b border-brand/5">
      <span className="text-[9px] text-gray-600 font-mono tracking-[0.2em] uppercase block mb-1">
        {label}
      </span>
      <div className="text-xs text-gray-300 font-mono">{String(value ?? "-")}</div>
    </div>
  );
}

function formatKey(key: string): string {
  return key.replace(/_/g, " ").toUpperCase();
}

function isLatLng(value: unknown): value is { lat: number; lng: number } {
  return (
    typeof value === "object" &&
    value !== null &&
    "lat" in value &&
    "lng" in value &&
    typeof (value as Record<string, unknown>).lat === "number" &&
    typeof (value as Record<string, unknown>).lng === "number"
  );
}

function getSeverityStyle(severity: string): string {
  switch (severity?.toLowerCase()) {
    case "critical":
      return "text-danger font-bold";
    case "high":
      return "text-danger";
    case "medium":
      return "text-warning";
    case "low":
      return "text-brand";
    default:
      return "text-gray-400";
  }
}

function renderValue(key: string, value: unknown): React.ReactNode {
  if (value === null || value === undefined) return "-";

  if (isLatLng(value)) {
    return `${value.lat}, ${value.lng}`;
  }

  if (key === "timestamp") {
    return new Date(value as string | number).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (key === "status") {
    return <StatusBadge status={String(value)} />;
  }

  if (key === "severity") {
    return (
      <span
        className={cn(
          "text-xs font-mono uppercase tracking-wider",
          getSeverityStyle(String(value))
        )}
      >
        {String(value)}
      </span>
    );
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

export function DetailPanel({
  open,
  onClose,
  title,
  entityType,
  data,
  onEdit,
  onDelete,
}: DetailPanelProps) {
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open || !data) return null;

  const hasFooter = Boolean(onEdit || onDelete);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <aside
        className="fixed right-0 top-0 bottom-0 w-[420px] max-w-full z-40 bg-gray-950 border-l border-brand/10 animate-slide-in-right flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-label={`${entityType} details: ${title}`}
      >
        {/* Top accent line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand/20 to-transparent" />

        {/* Header */}
        <div className="flex items-start justify-between gap-3 p-5 border-b border-brand/10">
          <div className="flex flex-col gap-2 min-w-0">
            <span
              className={cn(
                "inline-flex self-start items-center border px-2 py-0.5 text-[9px] font-mono font-bold tracking-wider uppercase",
                entityBadgeStyles[entityType]
              )}
            >
              {entityType}
            </span>
            <h2 className="text-sm font-mono font-bold text-gray-100 tracking-wider truncate">
              {title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 mt-1 text-gray-600 hover:text-gray-400 transition-colors"
            aria-label="Close panel"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {Object.entries(data).map(([key, value]) => {
            const rendered = renderValue(key, value);
            const isReactNode =
              key === "status" || key === "severity";

            return (
              <div key={key} className="py-2.5 border-b border-brand/5">
                <span className="text-[9px] text-gray-600 font-mono tracking-[0.2em] uppercase block mb-1">
                  {formatKey(key)}
                </span>
                {isReactNode ? (
                  <div className="text-xs text-gray-300 font-mono">{rendered}</div>
                ) : (
                  <div className="text-xs text-gray-300 font-mono">
                    {String(rendered ?? "-")}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        {hasFooter && (
          <div className="p-4 border-t border-brand/10 flex justify-end gap-3">
            {onEdit && (
              <button
                onClick={onEdit}
                className="border border-brand/20 bg-brand/5 px-4 py-2 text-[10px] font-mono text-brand hover:bg-brand/10 tracking-wider transition-colors"
              >
                EDIT
              </button>
            )}
            {onDelete && (
              <button
                onClick={onDelete}
                className="border border-danger/20 bg-danger/5 px-4 py-2 text-[10px] font-mono text-danger hover:bg-danger/10 tracking-wider transition-colors"
              >
                DELETE
              </button>
            )}
          </div>
        )}
      </aside>
    </>
  );
}
