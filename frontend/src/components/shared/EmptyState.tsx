import { Terminal } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
}

export function EmptyState({
  title = "NO DATA FOUND",
  description = "No records match the current query.",
  icon,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 border border-brand/5 bg-gray-950">
      {icon || <Terminal className="h-8 w-8 mb-3 text-gray-700" />}
      <h3 className="text-xs font-mono font-medium text-gray-500 tracking-[0.2em]">{title}</h3>
      <p className="mt-1 text-[10px] font-mono text-gray-700">{description}</p>
    </div>
  );
}
