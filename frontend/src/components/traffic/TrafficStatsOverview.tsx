import { useMemo } from "react";
import { AnimatedNumber } from "@/components/shared/AnimatedNumber";
import { Sparkline } from "@/components/shared/Sparkline";
import type { TrafficData } from "@/lib/api";

interface TrafficStatsOverviewProps {
  data: TrafficData[];
}

function getCongestionColor(level: number): string {
  if (level >= 80) return "#ff003c";
  if (level >= 60) return "#ff6600";
  if (level >= 40) return "#ffb800";
  if (level >= 20) return "#00d4ff";
  return "#00ff41";
}

function getCongestionLabel(level: number): string {
  if (level >= 80) return "GRIDLOCK";
  if (level >= 60) return "HEAVY";
  if (level >= 40) return "MODERATE";
  if (level >= 20) return "LIGHT";
  return "FREE FLOW";
}

export function TrafficStatsOverview({ data }: TrafficStatsOverviewProps) {
  const stats = useMemo(() => {
    if (!data.length) return null;
    const congestions = data.map((d) => d.congestion_level);
    const speeds = data.map((d) => d.speed);
    const avg = (arr: number[]) => Math.round(arr.reduce((s, v) => s + v, 0) / arr.length);
    const avgCongestion = avg(congestions);
    const maxCongestion = Math.max(...congestions);
    const avgSpeed = avg(speeds);
    const minSpeed = Math.min(...speeds);
    const maxSpeed = Math.max(...speeds);

    // Peak hour analysis
    const hourBuckets: Record<number, { count: number; totalCong: number }> = {};
    data.forEach((d) => {
      const h = new Date(d.timestamp).getHours();
      if (!hourBuckets[h]) hourBuckets[h] = { count: 0, totalCong: 0 };
      hourBuckets[h].count++;
      hourBuckets[h].totalCong += d.congestion_level;
    });
    const peakHour = Object.entries(hourBuckets)
      .map(([h, v]) => ({ hour: parseInt(h), avg: v.totalCong / v.count }))
      .sort((a, b) => b.avg - a.avg)[0];

    return { avgCongestion, maxCongestion, avgSpeed, minSpeed, maxSpeed, peakHour, congestions, speeds };
  }, [data]);

  if (!stats) return null;

  const congColor = getCongestionColor(stats.avgCongestion);
  const congLabel = getCongestionLabel(stats.avgCongestion);

  return (
    <div className="bg-gray-950 border border-info/10 p-5 corner-borders relative">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-info/20 to-transparent" />
      <h3 className="text-[10px] font-mono text-info tracking-wider mb-4">
        {">"} TRAFFIC_OVERVIEW // COMMAND CENTER
      </h3>

      {/* Main gauge + spark */}
      <div className="flex items-center gap-4 mb-4">
        {/* Circular gauge */}
        <div className="relative w-28 h-28 shrink-0">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <circle cx="50" cy="50" r="42" fill="none" stroke="#0a1a0a" strokeWidth="6" />
            <circle cx="50" cy="50" r="42" fill="none"
              stroke={congColor} strokeWidth="6"
              strokeDasharray={`${stats.avgCongestion * 2.64} 264`}
              strokeDashoffset="0" strokeLinecap="round"
              transform="rotate(-90 50 50)"
              style={{ filter: `drop-shadow(0 0 4px ${congColor}60)`, transition: "stroke-dasharray 1s ease-out" }}
            />
            <text x="50" y="44" textAnchor="middle" fill={congColor}
              fontSize="18" fontFamily="Orbitron" fontWeight="bold">
              {stats.avgCongestion}
            </text>
            <text x="50" y="54" textAnchor="middle" fill="#555"
              fontSize="5" fontFamily="JetBrains Mono" letterSpacing="1">
              % CONGESTION
            </text>
            <text x="50" y="65" textAnchor="middle" fill={congColor}
              fontSize="6" fontFamily="JetBrains Mono" letterSpacing="0.5" opacity="0.8">
              {congLabel}
            </text>
          </svg>
        </div>

        {/* Right side stats */}
        <div className="flex-1 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="border border-info/10 bg-info/5 px-2 py-1.5">
              <p className="text-[5.5px] font-mono text-gray-600 tracking-wider">AVG SPEED</p>
              <p className="text-[14px] font-bold font-[Orbitron] text-info">
                <AnimatedNumber value={stats.avgSpeed} /> <span className="text-[8px] text-gray-600">km/h</span>
              </p>
            </div>
            <div className="border border-info/10 bg-info/5 px-2 py-1.5">
              <p className="text-[5.5px] font-mono text-gray-600 tracking-wider">PEAK HOUR</p>
              <p className="text-[14px] font-bold font-[Orbitron] text-warning">
                {stats.peakHour ? `${stats.peakHour.hour}:00` : "--"}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-1">
            <div className="border border-gray-900 px-1.5 py-1 text-center">
              <p className="text-[5px] font-mono text-gray-700 tracking-wider">MAX CONG</p>
              <p className="text-[10px] font-bold font-mono text-danger">{stats.maxCongestion}%</p>
            </div>
            <div className="border border-gray-900 px-1.5 py-1 text-center">
              <p className="text-[5px] font-mono text-gray-700 tracking-wider">MAX SPEED</p>
              <p className="text-[10px] font-bold font-mono text-brand">{stats.maxSpeed}</p>
            </div>
            <div className="border border-gray-900 px-1.5 py-1 text-center">
              <p className="text-[5px] font-mono text-gray-700 tracking-wider">MIN SPEED</p>
              <p className="text-[10px] font-bold font-mono text-warning">{stats.minSpeed}</p>
            </div>
          </div>
          {/* Sparkline trends */}
          <div className="flex items-center gap-2">
            <span className="text-[6px] font-mono text-gray-600 tracking-wider w-8">CONG</span>
            <Sparkline data={stats.congestions.slice(-20)} width={120} height={18} color="#ff003c" fillOpacity={0.15} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[6px] font-mono text-gray-600 tracking-wider w-8">SPEED</span>
            <Sparkline data={stats.speeds.slice(-20)} width={120} height={18} color="#00ff41" fillOpacity={0.15} />
          </div>
        </div>
      </div>

      {/* Hour-by-hour congestion heatstrip */}
      <div>
        <p className="text-[7px] font-mono text-gray-600 tracking-wider mb-1">24H CONGESTION PATTERN</p>
        <div className="flex gap-px">
          {Array.from({ length: 24 }, (_, h) => {
            const bucket = data.filter((d) => new Date(d.timestamp).getHours() === h);
            const avg = bucket.length ? bucket.reduce((s, d) => s + d.congestion_level, 0) / bucket.length : 0;
            const color = getCongestionColor(avg);
            return (
              <div key={h} className="flex-1 flex flex-col items-center gap-0.5">
                <div className="w-full h-3 transition-colors duration-500"
                  style={{
                    backgroundColor: avg > 0 ? color : "#0a0a0a",
                    opacity: avg > 0 ? 0.3 + (avg / 100) * 0.7 : 0.2,
                    boxShadow: avg > 60 ? `0 0 4px ${color}40` : "none",
                  }}
                />
                {h % 4 === 0 && (
                  <span className="text-[4px] font-mono text-gray-700">{h}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
