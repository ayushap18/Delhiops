import { useMemo } from "react";
import { AnimatedNumber } from "@/components/shared/AnimatedNumber";
import type { CrimeReport } from "@/lib/api";

interface CrimeStatsOverviewProps {
  data: CrimeReport[];
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
    case "reported": return "#00ff41";
    case "investigating": return "#ffb800";
    case "resolved": return "#00d4ff";
    case "closed": return "#3a5a3a";
    default: return "#3a5a3a";
  }
}

export function CrimeStatsOverview({ data }: CrimeStatsOverviewProps) {
  const stats = useMemo(() => {
    const severities: Record<string, number> = {};
    const statuses: Record<string, number> = {};
    const types: Record<string, number> = {};

    data.forEach((c) => {
      severities[c.severity] = (severities[c.severity] || 0) + 1;
      statuses[c.status] = (statuses[c.status] || 0) + 1;
      types[c.type] = (types[c.type] || 0) + 1;
    });

    const topType = Object.entries(types).sort((a, b) => b[1] - a[1])[0];
    const activeCases = (statuses["reported"] || 0) + (statuses["investigating"] || 0);
    const resolvedCases = (statuses["resolved"] || 0) + (statuses["closed"] || 0);
    const criticalCases = (severities["critical"] || 0) + (severities["high"] || 0);

    return { severities, statuses, types, topType, activeCases, resolvedCases, criticalCases };
  }, [data]);

  const statCards = [
    { label: "TOTAL CASES", value: data.length, color: "#ff003c" },
    { label: "ACTIVE", value: stats.activeCases, color: "#ffb800" },
    { label: "RESOLVED", value: stats.resolvedCases, color: "#00d4ff" },
    { label: "HIGH/CRITICAL", value: stats.criticalCases, color: "#ff6600" },
  ];

  return (
    <div className="bg-gray-950 border border-danger/10 p-5 corner-borders relative">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-danger/20 to-transparent" />
      <h3 className="text-[10px] font-mono text-danger tracking-wider mb-4">
        {">"} CRIME_OVERVIEW // LIVE STATISTICS
      </h3>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {statCards.map((card) => (
          <div key={card.label} className="border px-3 py-2.5 relative overflow-hidden"
            style={{ borderColor: card.color + "25", backgroundColor: card.color + "06" }}>
            <div className="absolute top-0 left-0 w-0.5 h-full" style={{ backgroundColor: card.color + "60" }} />
            <p className="text-[7px] font-mono tracking-wider text-gray-600 mb-0.5">{card.label}</p>
            <p className="text-lg font-bold font-[Orbitron] tracking-wider"
              style={{ color: card.color, textShadow: `0 0 10px ${card.color}40` }}>
              <AnimatedNumber value={card.value} />
            </p>
          </div>
        ))}
      </div>

      {/* Severity Distribution */}
      <div className="mb-3">
        <p className="text-[8px] font-mono text-gray-600 tracking-wider mb-1.5">SEVERITY DISTRIBUTION</p>
        <div className="flex gap-0.5 h-2.5 overflow-hidden">
          {["critical", "high", "medium", "low"].map((sev) => {
            const count = stats.severities[sev] || 0;
            const pct = data.length > 0 ? (count / data.length) * 100 : 0;
            return (
              <div key={sev} className="relative transition-all duration-700"
                style={{
                  width: `${Math.max(pct, 2)}%`,
                  backgroundColor: getSeverityHex(sev),
                  boxShadow: `0 0 8px ${getSeverityHex(sev)}40`,
                }}
              />
            );
          })}
        </div>
        <div className="flex justify-between mt-1">
          {["critical", "high", "medium", "low"].map((sev) => (
            <div key={sev} className="flex items-center gap-1">
              <div className="w-1.5 h-1.5" style={{ backgroundColor: getSeverityHex(sev) }} />
              <span className="text-[6px] font-mono" style={{ color: getSeverityHex(sev) + "cc" }}>
                {sev.toUpperCase()} ({stats.severities[sev] || 0})
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Status Pipeline */}
      <div className="mb-3">
        <p className="text-[8px] font-mono text-gray-600 tracking-wider mb-1.5">STATUS PIPELINE</p>
        <div className="flex items-center gap-1">
          {["reported", "investigating", "resolved", "closed"].map((status, i) => {
            const count = stats.statuses[status] || 0;
            const color = getStatusHex(status);
            return (
              <div key={status} className="flex-1 flex flex-col items-center">
                <div className="w-full h-1.5 mb-1" style={{ backgroundColor: color + "30" }}>
                  <div className="h-full transition-all duration-700"
                    style={{
                      width: `${data.length > 0 ? (count / data.length) * 100 : 0}%`,
                      backgroundColor: color,
                    }}
                  />
                </div>
                <span className="text-[7px] font-mono font-bold" style={{ color }}>
                  {count}
                </span>
                <span className="text-[6px] font-mono text-gray-700">
                  {status === "investigating" ? "INVEST." : status.toUpperCase()}
                </span>
                {i < 3 && (
                  <span className="text-[8px] text-gray-800 absolute" style={{ right: "-4px" }}>→</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Top crime type */}
      {stats.topType && (
        <div className="border border-danger/10 px-3 py-2 flex items-center justify-between"
          style={{ backgroundColor: "#ff003c06" }}>
          <span className="text-[8px] font-mono text-gray-600 tracking-wider">MOST COMMON</span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold text-danger tracking-wider">
              {stats.topType[0].toUpperCase()}
            </span>
            <span className="text-[8px] font-mono text-gray-500">
              ({stats.topType[1]} cases)
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
