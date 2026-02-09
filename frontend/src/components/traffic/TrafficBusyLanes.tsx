import { useMemo } from "react";
import type { TrafficData } from "@/lib/api";
import { AnimatedNumber } from "@/components/shared/AnimatedNumber";

interface TrafficBusyLanesProps {
  data: TrafficData[];
}

// Major Delhi arterial corridors with realistic characteristics
const DELHI_CORRIDORS = [
  { name: "Ring Road (NH-44)", shortName: "RING ROAD", length: 51, avgSpeed: 35, peakDelay: 45, zones: "Multi-Zone" },
  { name: "Outer Ring Road", shortName: "ORR", length: 64, avgSpeed: 40, peakDelay: 35, zones: "Peripheral" },
  { name: "Delhi-Meerut Expy", shortName: "DME", length: 82, avgSpeed: 60, peakDelay: 20, zones: "NE Corridor" },
  { name: "NH-48 (Delhi-Jaipur)", shortName: "NH-48", length: 28, avgSpeed: 30, peakDelay: 55, zones: "SW Corridor" },
  { name: "GT Karnal Road", shortName: "GT ROAD", length: 35, avgSpeed: 25, peakDelay: 50, zones: "N Corridor" },
  { name: "Mathura Road (NH-2)", shortName: "MATHURA RD", length: 18, avgSpeed: 28, peakDelay: 40, zones: "SE Corridor" },
  { name: "Vikas Marg", shortName: "VIKAS MARG", length: 12, avgSpeed: 20, peakDelay: 60, zones: "E Delhi" },
  { name: "ITO-Ashram Flyover", shortName: "ITO-ASHRAM", length: 8, avgSpeed: 18, peakDelay: 65, zones: "Central" },
  { name: "Barapulla Elevated", shortName: "BARAPULLA", length: 14, avgSpeed: 45, peakDelay: 15, zones: "Central-SE" },
  { name: "Mehrauli-Badarpur", shortName: "MB ROAD", length: 22, avgSpeed: 22, peakDelay: 55, zones: "S Delhi" },
];

function getCongestionColor(level: number): string {
  if (level >= 80) return "#ff003c";
  if (level >= 60) return "#ff6600";
  if (level >= 40) return "#ffb800";
  if (level >= 20) return "#00d4ff";
  return "#00ff41";
}

function getStatusLabel(congestion: number): string {
  if (congestion >= 80) return "GRIDLOCK";
  if (congestion >= 60) return "HEAVY";
  if (congestion >= 40) return "SLOW";
  if (congestion >= 20) return "MOVING";
  return "CLEAR";
}

export function TrafficBusyLanes({ data }: TrafficBusyLanesProps) {
  const corridorData = useMemo(() => {
    const avgCongestion = data.length
      ? data.reduce((s, d) => s + d.congestion_level, 0) / data.length
      : 40;
    const avgSpeed = data.length
      ? data.reduce((s, d) => s + d.speed, 0) / data.length
      : 30;

    // Simulate corridor-specific congestion based on overall data
    return DELHI_CORRIDORS.map((corridor, i) => {
      // Create variation per corridor using index-based seed
      const variation = ((i * 17 + 7) % 40) - 20; // -20 to +20 variation
      const congestion = Math.max(5, Math.min(95, Math.round(avgCongestion + variation + (corridor.peakDelay - 40) * 0.5)));
      const currentSpeed = Math.max(5, Math.round(corridor.avgSpeed * (1 - congestion / 120) + (avgSpeed - 30) * 0.3));
      const eta = Math.round((corridor.length / currentSpeed) * 60); // minutes

      return {
        ...corridor,
        congestion,
        currentSpeed,
        eta,
        color: getCongestionColor(congestion),
        status: getStatusLabel(congestion),
      };
    }).sort((a, b) => b.congestion - a.congestion);
  }, [data]);

  const totalKm = DELHI_CORRIDORS.reduce((s, c) => s + c.length, 0);
  const gridlockedCount = corridorData.filter((c) => c.congestion >= 60).length;

  return (
    <div className="bg-gray-950 border border-info/10 p-5 corner-borders relative">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-info/20 to-transparent" />

      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-[10px] font-mono text-info tracking-wider">
            {">"} BUSY_CORRIDORS // DELHI ARTERIALS
          </h3>
          <p className="text-[7px] font-mono text-gray-700 tracking-wider">
            MAJOR ROAD NETWORK — LIVE STATUS & ETA
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[8px] font-mono text-gray-500">
            <AnimatedNumber value={totalKm} /> <span className="text-[6px] text-gray-700">KM NETWORK</span>
          </span>
          {gridlockedCount > 0 && (
            <div className="flex items-center gap-1 px-1.5 py-0.5 border border-danger/20 bg-danger/5">
              <div className="w-1.5 h-1.5 bg-danger rounded-full status-dot" />
              <span className="text-[7px] font-mono text-danger tracking-wider">
                {gridlockedCount} CONGESTED
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-1 max-h-[380px] overflow-y-auto pr-1">
        {corridorData.map((corridor, idx) => (
          <div key={corridor.shortName}
            className="flex items-center gap-2 px-2 py-2 border-l-2 hover:bg-info/5 transition-colors animate-fade-up"
            style={{ borderLeftColor: corridor.color + "60", animationDelay: `${idx * 40}ms` }}>

            {/* Rank */}
            <span className="text-[9px] font-mono font-bold w-4 text-right shrink-0"
              style={{ color: corridor.color }}>
              {idx + 1}
            </span>

            {/* Road info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[9px] font-mono font-bold text-gray-200 tracking-wider truncate">
                    {corridor.shortName}
                  </span>
                  <span className="text-[6px] font-mono text-gray-600">{corridor.zones}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {/* Status badge */}
                  <span className="text-[6px] font-mono px-1 py-0.5 border tracking-wider"
                    style={{ color: corridor.color, borderColor: corridor.color + "30" }}>
                    {corridor.status}
                  </span>
                </div>
              </div>

              {/* Congestion bar */}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-gray-900 overflow-hidden">
                  <div className="h-full transition-all duration-700"
                    style={{
                      width: `${corridor.congestion}%`,
                      backgroundColor: corridor.color,
                      boxShadow: corridor.congestion > 60 ? `0 0 6px ${corridor.color}50` : "none",
                    }}
                  />
                </div>
                <span className="text-[8px] font-mono font-bold tabular-nums w-7 text-right"
                  style={{ color: corridor.color }}>
                  {corridor.congestion}%
                </span>
              </div>

              {/* Bottom row: speed, length, ETA */}
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-[6px] font-mono text-gray-500">
                  {corridor.currentSpeed} <span className="text-gray-700">km/h</span>
                </span>
                <span className="text-[6px] font-mono text-gray-700">|</span>
                <span className="text-[6px] font-mono text-gray-500">
                  {corridor.length} <span className="text-gray-700">km</span>
                </span>
                <span className="text-[6px] font-mono text-gray-700">|</span>
                <span className="text-[6px] font-mono font-bold"
                  style={{ color: corridor.eta > 40 ? "#ff003c" : corridor.eta > 20 ? "#ffb800" : "#00ff41" }}>
                  ETA {corridor.eta} min
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-2 pt-2 border-t border-info/5 flex items-center justify-center gap-3">
        {[
          { c: "#00ff41", l: "FREE" },
          { c: "#00d4ff", l: "LIGHT" },
          { c: "#ffb800", l: "SLOW" },
          { c: "#ff6600", l: "HEAVY" },
          { c: "#ff003c", l: "GRIDLOCK" },
        ].map((item) => (
          <div key={item.l} className="flex items-center gap-1">
            <div className="w-4 h-1" style={{ backgroundColor: item.c, boxShadow: `0 0 3px ${item.c}40` }} />
            <span className="text-[5px] font-mono text-gray-600 tracking-wider">{item.l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
