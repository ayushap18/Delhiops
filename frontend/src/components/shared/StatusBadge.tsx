import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  open: "bg-brand/10 text-brand border-brand/20",
  reported: "bg-brand/10 text-brand border-brand/20",
  online: "bg-brand/10 text-brand border-brand/20",
  in_progress: "bg-warning/10 text-warning border-warning/20",
  investigating: "bg-warning/10 text-warning border-warning/20",
  maintenance: "bg-warning/10 text-warning border-warning/20",
  resolved: "bg-info/10 text-info border-info/20",
  closed: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  offline: "bg-danger/10 text-danger border-danger/20",
};

function getDotColor(status: string): string {
  const s = status?.toLowerCase().replace(/\s+/g, "_");
  if (["open", "reported", "online"].includes(s)) return "bg-brand";
  if (["in_progress", "investigating", "maintenance"].includes(s)) return "bg-warning";
  if (s === "resolved") return "bg-info";
  if (s === "offline") return "bg-danger";
  return "bg-gray-500";
}

export function StatusBadge({ status }: { status: string }) {
  const normalizedStatus = status?.toLowerCase().replace(/\s+/g, "_");
  const style = statusStyles[normalizedStatus] || statusStyles.closed;
  return (
    <span
      className={cn(
        "inline-flex items-center border px-2 py-0.5 text-[9px] font-mono font-bold tracking-wider uppercase",
        style
      )}
    >
      <span className={cn("mr-1.5 h-1 w-1 rounded-full", getDotColor(status))} />
      {status?.replace(/_/g, " ")}
    </span>
  );
}
