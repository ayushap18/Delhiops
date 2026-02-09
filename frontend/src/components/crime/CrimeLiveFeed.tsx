import { useMemo } from "react";
import type { CrimeReport } from "@/lib/api";
import { formatDate, getSeverityColor } from "@/lib/utils";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { AnimatedNumber } from "@/components/shared/AnimatedNumber";

interface CrimeLiveFeedProps {
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

function getAreaName(lat: number, lng: number): string {
  if (lat >= 28.68 && lng < 77.18) return "NW DELHI";
  if (lat >= 28.68 && lng >= 77.26) return "NE DELHI";
  if (lat >= 28.68) return "N DELHI";
  if (lat >= 28.62 && lat < 28.68 && lng >= 77.18 && lng < 77.28) return "CENTRAL";
  if (lat >= 28.60 && lng < 77.14) return "W DELHI";
  if (lat >= 28.60 && lng >= 77.28) return "E DELHI";
  if (lat >= 28.58 && lat < 28.64 && lng >= 77.18 && lng < 77.26) return "NEW DELHI";
  if (lat < 28.58 && lng < 77.16) return "SW DELHI";
  if (lat < 28.58 && lng >= 77.26) return "SE DELHI";
  if (lat < 28.58) return "S DELHI";
  return "DELHI NCR";
}

function getTimeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m AGO`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h AGO`;
  const days = Math.floor(hrs / 24);
  return `${days}d AGO`;
}

export function CrimeLiveFeed({ data }: CrimeLiveFeedProps) {
  const feedItems = useMemo(() => data.slice(0, 15), [data]);

  const quickStats = useMemo(() => {
    const last24h = data.filter((d) => Date.now() - new Date(d.timestamp).getTime() < 86400000);
    const criticalNow = data.filter((d) =>
      (d.severity === "critical" || d.severity === "high") &&
      (d.status === "reported" || d.status === "investigating")
    );
    const typeFreq: Record<string, number> = {};
    data.forEach((d) => { typeFreq[d.type] = (typeFreq[d.type] || 0) + 1; });
    const trending = Object.entries(typeFreq).sort((a, b) => b[1] - a[1])[0];
    return { last24h: last24h.length, critical: criticalNow.length, trending };
  }, [data]);

  return (
    <div className="bg-gray-950 border border-danger/10 p-5 corner-borders relative flex flex-col">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-danger/20 to-transparent" />

      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-[10px] font-mono text-danger tracking-wider">
            {">"} CRIME_LOG // LIVE DISPATCH
          </h3>
          <p className="text-[7px] font-mono text-gray-700 tracking-wider">
            REAL-TIME INCIDENT STREAM
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 bg-danger rounded-full status-dot" />
          <span className="text-[8px] font-mono text-danger tracking-widest">LIVE</span>
        </div>
      </div>

      {/* Quick stat strip */}
      <div className="flex gap-1 mb-3">
        <div className="flex-1 border border-danger/10 bg-danger/5 px-2 py-1.5 text-center">
          <p className="text-[12px] font-bold font-[Orbitron] text-danger">
            <AnimatedNumber value={quickStats.last24h} />
          </p>
          <p className="text-[5.5px] font-mono text-gray-600 tracking-wider">24H REPORTS</p>
        </div>
        <div className="flex-1 border border-danger/10 bg-danger/5 px-2 py-1.5 text-center">
          <p className="text-[12px] font-bold font-[Orbitron]"
            style={{ color: quickStats.critical > 0 ? "#ff003c" : "#00ff41" }}>
            <AnimatedNumber value={quickStats.critical} />
          </p>
          <p className="text-[5.5px] font-mono text-gray-600 tracking-wider">CRIT ACTIVE</p>
        </div>
        <div className="flex-1 border border-danger/10 bg-danger/5 px-2 py-1.5 text-center">
          <p className="text-[9px] font-bold font-mono text-warning truncate">
            {quickStats.trending ? quickStats.trending[0].toUpperCase() : "N/A"}
          </p>
          <p className="text-[5.5px] font-mono text-gray-600 tracking-wider">TRENDING</p>
        </div>
      </div>

      {/* Feed list */}
      <div className="flex-1 max-h-[300px] overflow-y-auto space-y-0.5 pr-1">
        {feedItems.length === 0 ? (
          <p className="text-[10px] font-mono text-gray-600 text-center py-8 tracking-wider">
            NO CRIME DATA...
          </p>
        ) : (
          feedItems.map((item, i) => {
            const sevColor = getSeverityHex(item.severity);
            const area = getAreaName(item.location.lat, item.location.lng);
            return (
              <div key={item.id}
                className="flex items-start gap-2 px-2 py-1.5 hover:bg-danger/5 transition-colors border-l-2 group animate-fade-up"
                style={{ borderLeftColor: sevColor + "60", animationDelay: `${i * 30}ms` }}>
                {/* Severity indicator */}
                <div className="flex flex-col items-center gap-0.5 mt-0.5 shrink-0">
                  <div className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: sevColor, boxShadow: `0 0 6px ${sevColor}60` }} />
                  <span className="text-[5px] font-mono tracking-wider"
                    style={{ color: sevColor + "99" }}>
                    {item.severity?.charAt(0).toUpperCase()}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[8px] font-mono text-danger/40">#{item.id}</span>
                      <span className="text-[9px] font-mono font-bold text-gray-200 tracking-wider truncate">
                        {item.type.toUpperCase()}
                      </span>
                    </div>
                    <StatusBadge status={item.status} />
                  </div>

                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`text-[6.5px] font-mono tracking-wider ${getSeverityColor(item.severity)}`}>
                      [{item.severity?.toUpperCase()}]
                    </span>
                    <span className="text-[6px] font-mono text-gray-700">|</span>
                    <span className="text-[6.5px] font-mono text-gray-500">{area}</span>
                    <span className="text-[6px] font-mono text-gray-700">|</span>
                    <span className="text-[6.5px] font-mono text-gray-600">
                      {formatDate(item.timestamp)}
                    </span>
                    <span className="text-[6px] font-mono text-danger/50 ml-auto">
                      {getTimeAgo(item.timestamp)}
                    </span>
                  </div>

                  {/* Threat level micro-bar */}
                  <div className="w-full h-px mt-1 bg-gray-900 overflow-hidden">
                    <div className="h-full transition-all duration-500"
                      style={{
                        width: item.severity === "critical" ? "100%" : item.severity === "high" ? "75%" : item.severity === "medium" ? "50%" : "25%",
                        backgroundColor: sevColor,
                        boxShadow: `0 0 3px ${sevColor}`,
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="mt-2 pt-2 border-t border-danger/5 flex items-center justify-between">
        <span className="text-[8px] font-mono text-gray-700 tracking-wider">
          STREAM {feedItems.length} / {data.length}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-[7px] font-mono text-gray-700 tracking-wider">
            SORTED: NEWEST
          </span>
          <div className="flex gap-px">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-0.5 bg-danger/30 transition-all"
                style={{ height: `${4 + i * 2}px` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
