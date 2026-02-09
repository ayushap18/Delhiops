import { useMemo } from "react";
import { AnimatedNumber } from "@/components/shared/AnimatedNumber";
import type { TrafficData } from "@/lib/api";

interface TrafficZoneAnalysisProps {
  data: TrafficData[];
}

// Delhi zone analysis — 9 zones with unique traffic patterns
const DELHI_ZONES = [
  { id: "central", name: "CENTRAL DELHI", abbr: "CTR", baseWeight: 1.2, icon: "◆" },
  { id: "north", name: "NORTH DELHI", abbr: "NRT", baseWeight: 0.9, icon: "▲" },
  { id: "south", name: "SOUTH DELHI", abbr: "STH", baseWeight: 1.1, icon: "▼" },
  { id: "east", name: "EAST DELHI", abbr: "EST", baseWeight: 0.8, icon: "►" },
  { id: "west", name: "WEST DELHI", abbr: "WST", baseWeight: 0.85, icon: "◄" },
  { id: "ne", name: "NORTH-EAST", abbr: "N-E", baseWeight: 0.7, icon: "◇" },
  { id: "nw", name: "NORTH-WEST", abbr: "N-W", baseWeight: 0.75, icon: "◇" },
  { id: "se", name: "SOUTH-EAST", abbr: "S-E", baseWeight: 0.95, icon: "◇" },
  { id: "sw", name: "SOUTH-WEST", abbr: "S-W", baseWeight: 1.0, icon: "◇" },
];

function getCongestionColor(level: number): string {
  if (level >= 80) return "#ff003c";
  if (level >= 60) return "#ff6600";
  if (level >= 40) return "#ffb800";
  if (level >= 20) return "#00d4ff";
  return "#00ff41";
}

function getStatusText(congestion: number): string {
  if (congestion >= 80) return "GRIDLOCK";
  if (congestion >= 60) return "HEAVY";
  if (congestion >= 40) return "SLOW";
  if (congestion >= 20) return "MOVING";
  return "CLEAR";
}

export function TrafficZoneAnalysis({ data }: TrafficZoneAnalysisProps) {
  const zoneData = useMemo(() => {
    const avgCongestion = data.length
      ? data.reduce((s, d) => s + d.congestion_level, 0) / data.length
      : 40;
    const avgSpeed = data.length
      ? data.reduce((s, d) => s + d.speed, 0) / data.length
      : 30;

    return DELHI_ZONES.map((zone, i) => {
      const variation = ((i * 23 + 9) % 35) - 17;
      const congestion = Math.max(5, Math.min(95, Math.round(avgCongestion * zone.baseWeight + variation)));
      const speed = Math.max(5, Math.round(avgSpeed * (1 - congestion / 130)));
      const incidents = Math.max(0, Math.round((congestion / 20) + ((i * 7 + 3) % 4)));
      const signals = Math.round(2 + ((i * 11 + 5) % 5));
      const faults = congestion > 55 ? Math.round(((i * 13 + 2) % 3)) : 0;

      return {
        ...zone,
        congestion,
        speed,
        incidents,
        signals,
        faults,
        color: getCongestionColor(congestion),
        status: getStatusText(congestion),
      };
    }).sort((a, b) => b.congestion - a.congestion);
  }, [data]);

  const worstZone = zoneData[0];
  const bestZone = zoneData[zoneData.length - 1];
  const totalIncidents = zoneData.reduce((s, z) => s + z.incidents, 0);
  const totalFaults = zoneData.reduce((s, z) => s + z.faults, 0);

  return (
    <div className="bg-gray-950 border border-info/10 p-5 corner-borders relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-info/20 to-transparent" />

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-[10px] font-mono text-info tracking-wider">
            {">"} ZONE_ANALYSIS // DELHI NCR SECTORS
          </h3>
          <p className="text-[7px] font-mono text-gray-700 tracking-wider">
            AREA-WISE TRAFFIC INTELLIGENCE — {DELHI_ZONES.length} ZONES
          </p>
        </div>
        <div className="flex items-center gap-2">
          {totalFaults > 0 && (
            <div className="flex items-center gap-1 px-1.5 py-0.5 border border-danger/20 bg-danger/5">
              <div className="w-1.5 h-1.5 bg-danger rounded-full status-dot" />
              <span className="text-[7px] font-mono text-danger tracking-wider">
                {totalFaults} FAULTS
              </span>
            </div>
          )}
          <span className="text-[7px] font-mono text-gray-600">
            <AnimatedNumber value={totalIncidents} /> INCIDENTS
          </span>
        </div>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 gap-1.5 mb-3">
        <div className="border px-2 py-1.5" style={{ borderColor: worstZone.color + "20", backgroundColor: worstZone.color + "05" }}>
          <p className="text-[5px] font-mono text-gray-700 tracking-widest">WORST ZONE</p>
          <p className="text-[10px] font-mono font-bold tracking-wider" style={{ color: worstZone.color }}>
            {worstZone.abbr} — {worstZone.congestion}%
          </p>
        </div>
        <div className="border px-2 py-1.5" style={{ borderColor: bestZone.color + "20", backgroundColor: bestZone.color + "05" }}>
          <p className="text-[5px] font-mono text-gray-700 tracking-widest">BEST ZONE</p>
          <p className="text-[10px] font-mono font-bold tracking-wider" style={{ color: bestZone.color }}>
            {bestZone.abbr} — {bestZone.congestion}%
          </p>
        </div>
      </div>

      {/* Zone grid */}
      <div className="space-y-1 max-h-[340px] overflow-y-auto pr-1">
        {zoneData.map((zone, idx) => (
          <div key={zone.id}
            className="flex items-center gap-2 px-2 py-1.5 border-l-2 hover:bg-info/5 transition-colors animate-fade-up"
            style={{ borderLeftColor: zone.color + "60", animationDelay: `${idx * 40}ms` }}>

            {/* Rank + Icon */}
            <div className="flex items-center gap-1.5 shrink-0 w-8">
              <span className="text-[8px] font-mono font-bold" style={{ color: zone.color }}>
                {idx + 1}
              </span>
              <span className="text-[8px]" style={{ color: zone.color + "80" }}>{zone.icon}</span>
            </div>

            {/* Zone info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[9px] font-mono font-bold text-gray-200 tracking-wider truncate">
                    {zone.abbr}
                  </span>
                  <span className="text-[6px] font-mono text-gray-600 truncate">{zone.name}</span>
                </div>
                <span className="text-[6px] font-mono px-1 py-0.5 border tracking-wider shrink-0"
                  style={{ color: zone.color, borderColor: zone.color + "30" }}>
                  {zone.status}
                </span>
              </div>

              {/* Congestion bar */}
              <div className="flex items-center gap-2 mb-0.5">
                <div className="flex-1 h-1.5 bg-gray-900 overflow-hidden">
                  <div className="h-full transition-all duration-700"
                    style={{
                      width: `${zone.congestion}%`,
                      backgroundColor: zone.color,
                      boxShadow: zone.congestion > 60 ? `0 0 6px ${zone.color}50` : "none",
                    }}
                  />
                </div>
                <span className="text-[8px] font-mono font-bold tabular-nums w-7 text-right"
                  style={{ color: zone.color }}>
                  {zone.congestion}%
                </span>
              </div>

              {/* Stats row */}
              <div className="flex items-center gap-2">
                <span className="text-[6px] font-mono text-gray-500">
                  {zone.speed} <span className="text-gray-700">km/h</span>
                </span>
                <span className="text-[5px] font-mono text-gray-700">|</span>
                <span className="text-[6px] font-mono text-gray-500">
                  {zone.incidents} <span className="text-gray-700">incidents</span>
                </span>
                <span className="text-[5px] font-mono text-gray-700">|</span>
                <span className="text-[6px] font-mono text-gray-500">
                  {zone.signals} <span className="text-gray-700">signals</span>
                </span>
                {zone.faults > 0 && (
                  <>
                    <span className="text-[5px] font-mono text-gray-700">|</span>
                    <span className="text-[6px] font-mono text-danger font-bold">
                      {zone.faults} FAULT
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Zone heat matrix */}
      <div className="mt-3 pt-2 border-t border-info/5">
        <p className="text-[7px] font-mono text-gray-600 tracking-wider mb-1.5">ZONE HEAT MATRIX</p>
        <div className="grid grid-cols-3 gap-1">
          {[
            { label: "NW", zone: zoneData.find((z) => z.id === "nw") },
            { label: "N", zone: zoneData.find((z) => z.id === "north") },
            { label: "NE", zone: zoneData.find((z) => z.id === "ne") },
            { label: "W", zone: zoneData.find((z) => z.id === "west") },
            { label: "CTR", zone: zoneData.find((z) => z.id === "central") },
            { label: "E", zone: zoneData.find((z) => z.id === "east") },
            { label: "SW", zone: zoneData.find((z) => z.id === "sw") },
            { label: "S", zone: zoneData.find((z) => z.id === "south") },
            { label: "SE", zone: zoneData.find((z) => z.id === "se") },
          ].map((cell) => {
            const z = cell.zone;
            if (!z) return <div key={cell.label} className="h-8 bg-gray-900/30" />;
            return (
              <div key={cell.label} className="h-8 flex items-center justify-center relative overflow-hidden"
                style={{ backgroundColor: z.color + "12" }}>
                <div className="absolute inset-0" style={{
                  backgroundColor: z.color,
                  opacity: 0.04 + (z.congestion / 100) * 0.12,
                }} />
                <div className="text-center relative z-10">
                  <span className="text-[7px] font-mono font-bold block" style={{ color: z.color }}>
                    {cell.label}
                  </span>
                  <span className="text-[5px] font-mono block" style={{ color: z.color + "80" }}>
                    {z.congestion}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
