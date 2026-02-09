import { useMemo } from "react";
import type { CrimeReport } from "@/lib/api";

interface CrimeAreaRankingProps {
  data: CrimeReport[];
}

// Map coordinates to Delhi area names
function getAreaName(lat: number, lng: number): string {
  if (lat >= 28.68 && lng < 77.18) return "North West Delhi";
  if (lat >= 28.68 && lng >= 77.26) return "North East Delhi";
  if (lat >= 28.68) return "North Delhi";
  if (lat >= 28.62 && lat < 28.68 && lng >= 77.18 && lng < 77.28) return "Central Delhi";
  if (lat >= 28.60 && lng < 77.14) return "West Delhi";
  if (lat >= 28.60 && lng >= 77.28) return "East Delhi";
  if (lat >= 28.58 && lat < 28.64 && lng >= 77.18 && lng < 77.26) return "New Delhi";
  if (lat < 28.58 && lng < 77.16) return "South West Delhi";
  if (lat < 28.58 && lng >= 77.26) return "South East Delhi";
  if (lat < 28.58) return "South Delhi";
  return "Delhi NCR";
}

function getRankColor(rank: number): string {
  if (rank === 0) return "#ff003c";
  if (rank === 1) return "#ff6600";
  if (rank === 2) return "#ffb800";
  if (rank === 3) return "#00d4ff";
  return "#00ff41";
}

export function CrimeAreaRanking({ data }: CrimeAreaRankingProps) {
  const rankings = useMemo(() => {
    const areaMap: Record<string, { total: number; types: Record<string, number>; severities: Record<string, number> }> = {};

    data.forEach((crime) => {
      const area = getAreaName(crime.location.lat, crime.location.lng);
      if (!areaMap[area]) {
        areaMap[area] = { total: 0, types: {}, severities: {} };
      }
      areaMap[area].total++;
      areaMap[area].types[crime.type] = (areaMap[area].types[crime.type] || 0) + 1;
      areaMap[area].severities[crime.severity] = (areaMap[area].severities[crime.severity] || 0) + 1;
    });

    return Object.entries(areaMap)
      .map(([name, stats]) => {
        const topCrime = Object.entries(stats.types).sort((a, b) => b[1] - a[1])[0];
        return {
          name,
          total: stats.total,
          topCrime: topCrime ? topCrime[0] : "N/A",
          critical: (stats.severities["critical"] || 0) + (stats.severities["high"] || 0),
        };
      })
      .sort((a, b) => b.total - a.total);
  }, [data]);

  const maxCount = rankings[0]?.total || 1;

  return (
    <div className="bg-gray-950 border border-danger/10 p-5 corner-borders relative">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-danger/20 to-transparent" />
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[10px] font-mono text-danger tracking-wider">
          {">"} AREA_RANKING // CRIME DENSITY INDEX
        </h3>
        <span className="text-[8px] font-mono text-gray-600">
          {rankings.length} ZONES
        </span>
      </div>

      <div className="space-y-1.5 max-h-[320px] overflow-y-auto pr-1">
        {rankings.map((area, idx) => {
          const barWidth = (area.total / maxCount) * 100;
          const color = getRankColor(idx);
          return (
            <div key={area.name} className="group">
              <div className="flex items-center gap-2 px-2 py-1.5 border-l-2 hover:bg-danger/5 transition-colors"
                style={{ borderLeftColor: color + "60" }}>
                {/* Rank */}
                <span className="text-[10px] font-mono font-bold w-5 text-right"
                  style={{ color }}>
                  #{idx + 1}
                </span>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[9px] font-mono text-gray-300 tracking-wider truncate">
                      {area.name.toUpperCase()}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[7px] font-mono text-gray-600">
                        TOP: {area.topCrime.toUpperCase()}
                      </span>
                      <span className="text-[10px] font-mono font-bold tabular-nums"
                        style={{ color }}>
                        {area.total}
                      </span>
                    </div>
                  </div>

                  {/* Bar */}
                  <div className="w-full h-1 bg-gray-900 overflow-hidden">
                    <div className="h-full transition-all duration-700 ease-out"
                      style={{
                        width: `${barWidth}%`,
                        backgroundColor: color,
                        boxShadow: `0 0 6px ${color}50`,
                      }}
                    />
                  </div>

                  {/* Sub-stats */}
                  <div className="flex items-center gap-2 mt-0.5">
                    {area.critical > 0 && (
                      <span className="text-[6px] font-mono text-danger tracking-wider">
                        {area.critical} HIGH/CRIT
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
