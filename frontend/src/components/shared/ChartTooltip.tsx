import type { TooltipContentProps } from "recharts";

export function ChartTooltip({ active, payload, label }: Partial<TooltipContentProps<number, string>>) {
  if (!active || !payload?.length) return null;

  return (
    <div
      className="glass border border-brand/20 p-3 min-w-[160px] relative"
      style={{
        borderRadius: 0,
        boxShadow: "0 8px 32px rgba(0,0,0,0.5), 0 0 1px rgba(0,255,65,0.3)",
      }}
    >
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand/30 to-transparent" />
      <p className="text-[8px] font-mono text-gray-500 tracking-[0.2em] mb-2 uppercase border-b border-brand/10 pb-1.5">
        {label}
      </p>
      <div className="space-y-1">
        {payload.map((entry, i: number) => (
          <div key={i} className="flex items-center justify-between gap-4 text-[10px] font-mono">
            <div className="flex items-center gap-1.5">
              <span
                className="h-2 w-2 inline-block"
                style={{
                  backgroundColor: entry.color,
                  boxShadow: `0 0 4px ${entry.color}80`,
                }}
              />
              <span className="text-gray-400">{entry.name}</span>
            </div>
            <span className="font-bold tabular-nums" style={{ color: entry.color }}>
              {typeof entry.value === "number" ? entry.value.toLocaleString() : entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
