import { useMemo } from "react";
import { AnimatedNumber } from "@/components/shared/AnimatedNumber";
import type { Incident } from "@/lib/api";

interface IncidentStatsOverviewProps {
  data: Incident[];
}

function getSeverityHex(severity: string): string {
  switch (severity?.toLowerCase()) {
    case "critical": return "#ff003c";
    case "high": return "#ff6600";
    case "medium": return "#ffb800";
    case "low": return "#00ff41";
    default: return "#3a5a3a";
  }
}

function getStatusHex(status: string): string {
  switch (status) {
    case "open": return "#ff003c";
    case "in_progress": return "#ffb800";
    case "resolved": return "#00ff41";
    case "closed": return "#3a5a3a";
    default: return "#3a5a3a";
  }
}

export function IncidentStatsOverview({ data }: IncidentStatsOverviewProps) {
  const stats = useMemo(() => {
    const types: Record<string, number> = {};
    const severities: Record<string, number> = {};
    const statuses: Record<string, number> = {};

    data.forEach((inc) => {
      types[inc.type] = (types[inc.type] || 0) + 1;
      severities[inc.severity] = (severities[inc.severity] || 0) + 1;
      statuses[inc.status] = (statuses[inc.status] || 0) + 1;
    });

    return { types, severities, statuses };
  }, [data]);

  const openCount = stats.statuses["open"] || 0;
  const inProgressCount = stats.statuses["in_progress"] || 0;
  const resolvedCount = stats.statuses["resolved"] || 0;
  const closedCount = stats.statuses["closed"] || 0;
  const criticalCount = (stats.severities["critical"] || 0) + (stats.severities["high"] || 0);

  const cards = [
    { label: "TOTAL", value: data.length, color: "#ffb800", icon: "▣" },
    { label: "OPEN", value: openCount, color: "#ff003c", icon: "◉" },
    { label: "IN PROGRESS", value: inProgressCount, color: "#ffb800", icon: "⟳" },
    { label: "RESOLVED", value: resolvedCount + closedCount, color: "#00ff41", icon: "✓" },
  ];

  return (
    <div className="bg-gray-950 border border-warning/10 p-5 corner-borders relative">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-warning/20 to-transparent" />
      <h3 className="text-[10px] font-mono text-warning tracking-wider mb-4">
        {">"} INCIDENT_OVERVIEW // COMMAND CENTER
      </h3>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {cards.map((card) => (
          <div key={card.label} className="border px-2 py-3 text-center relative overflow-hidden"
            style={{ borderColor: card.color + "20", backgroundColor: card.color + "05" }}>
            <span className="text-[14px] block mb-1" style={{ color: card.color + "60" }}>{card.icon}</span>
            <p className="text-xl font-bold font-[Orbitron]"
              style={{ color: card.color, textShadow: `0 0 12px ${card.color}30` }}>
              <AnimatedNumber value={card.value} />
            </p>
            <p className="text-[6px] font-mono tracking-wider text-gray-600 mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Severity breakdown */}
      <div className="mb-3">
        <p className="text-[8px] font-mono text-gray-600 tracking-wider mb-2">SEVERITY MATRIX</p>
        <div className="grid grid-cols-4 gap-1.5">
          {["critical", "high", "medium", "low"].map((sev) => {
            const count = stats.severities[sev] || 0;
            const color = getSeverityHex(sev);
            const pct = data.length ? Math.round((count / data.length) * 100) : 0;
            return (
              <div key={sev} className="border px-2 py-1.5"
                style={{ borderColor: color + "20", backgroundColor: color + "05" }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[7px] font-mono tracking-wider" style={{ color: color + "aa" }}>
                    {sev.toUpperCase()}
                  </span>
                  <span className="text-[10px] font-mono font-bold" style={{ color }}>
                    {count}
                  </span>
                </div>
                <div className="h-1 bg-gray-900 overflow-hidden">
                  <div className="h-full transition-all duration-700"
                    style={{ width: `${pct}%`, backgroundColor: color, boxShadow: `0 0 4px ${color}60` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Status pipeline visual */}
      <div>
        <p className="text-[8px] font-mono text-gray-600 tracking-wider mb-2">RESOLUTION PIPELINE</p>
        <div className="flex items-center gap-0.5">
          {[
            { status: "open", label: "OPEN", count: openCount },
            { status: "in_progress", label: "ACTIVE", count: inProgressCount },
            { status: "resolved", label: "RESOLVED", count: resolvedCount },
            { status: "closed", label: "CLOSED", count: closedCount },
          ].map((item, idx) => {
            const color = getStatusHex(item.status);
            return (
              <div key={item.status} className="flex items-center flex-1">
                <div className="flex-1 text-center py-1.5 border relative"
                  style={{ borderColor: color + "30", backgroundColor: color + "08" }}>
                  <p className="text-[12px] font-bold font-[Orbitron]" style={{ color }}>{item.count}</p>
                  <p className="text-[6px] font-mono text-gray-600">{item.label}</p>
                </div>
                {idx < 3 && (
                  <span className="text-[10px] text-gray-700 px-0.5">→</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Critical alert */}
      {criticalCount > 0 && (
        <div className="mt-3 flex items-center gap-2 px-2 py-1.5 border border-danger/20 bg-danger/5">
          <div className="w-2 h-2 bg-danger status-dot rounded-full" />
          <span className="text-[8px] font-mono text-danger tracking-wider">
            {criticalCount} HIGH/CRITICAL INCIDENTS REQUIRE ATTENTION
          </span>
        </div>
      )}
    </div>
  );
}
