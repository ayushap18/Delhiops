import { useMemo } from "react";
import type { Incident } from "@/lib/api";
import { formatDate, getSeverityColor } from "@/lib/utils";
import { StatusBadge } from "@/components/shared/StatusBadge";

interface IncidentTimelineProps {
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

export function IncidentTimeline({ data }: IncidentTimelineProps) {
  const items = useMemo(() => data.slice(0, 15), [data]);

  return (
    <div className="bg-gray-950 border border-warning/10 p-5 corner-borders relative">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-warning/20 to-transparent" />
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[10px] font-mono text-warning tracking-wider">
          {">"} INCIDENT_TIMELINE // EVENT LOG
        </h3>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 bg-warning rounded-full status-dot" />
          <span className="text-[8px] font-mono text-warning tracking-widest">LIVE</span>
        </div>
      </div>

      <div className="max-h-[400px] overflow-y-auto pr-1">
        {items.length === 0 ? (
          <p className="text-[10px] font-mono text-gray-600 text-center py-8 tracking-wider">
            NO INCIDENTS RECORDED...
          </p>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-3 top-0 bottom-0 w-px bg-warning/10" />

            {items.map((item, i) => {
              const sevColor = getSeverityHex(item.severity);
              const area = getAreaName(item.location.lat, item.location.lng);
              const isActive = item.status === "open" || item.status === "in_progress";

              return (
                <div key={item.id}
                  className="relative pl-8 pb-3 animate-fade-up"
                  style={{ animationDelay: `${i * 50}ms` }}>
                  {/* Timeline node */}
                  <div className="absolute left-1.5 top-1 w-3 h-3 rounded-full border-2"
                    style={{
                      borderColor: sevColor,
                      backgroundColor: isActive ? sevColor : "transparent",
                      boxShadow: isActive ? `0 0 8px ${sevColor}60` : "none",
                    }}
                  />

                  <div className="border px-3 py-2 hover:bg-warning/5 transition-colors"
                    style={{ borderColor: sevColor + "15" }}>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold text-gray-200 tracking-wider">
                          {item.type.toUpperCase()}
                        </span>
                        <span className={`text-[7px] font-mono tracking-wider ${getSeverityColor(item.severity)}`}>
                          [{item.severity?.toUpperCase()}]
                        </span>
                      </div>
                      <StatusBadge status={item.status} />
                    </div>

                    {item.description && (
                      <p className="text-[8px] font-mono text-gray-500 truncate mb-1">
                        {item.description}
                      </p>
                    )}

                    <div className="flex items-center gap-2 text-[7px] font-mono text-gray-600">
                      <span className="text-warning/60">#{item.id}</span>
                      <span className="text-gray-800">|</span>
                      <span>{area}</span>
                      <span className="text-gray-800">|</span>
                      <span>{formatDate(item.timestamp)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-2 pt-2 border-t border-warning/5 flex items-center justify-between">
        <span className="text-[8px] font-mono text-gray-700 tracking-wider">
          SHOWING {items.length} / {data.length}
        </span>
        <span className="text-[8px] font-mono text-gray-700 tracking-wider">
          NEWEST FIRST
        </span>
      </div>
    </div>
  );
}
