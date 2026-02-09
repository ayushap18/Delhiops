import { useEffect, useState } from "react";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";
import { Activity } from "lucide-react";
import api from "@/lib/api";

interface MetricPoint {
  metric: string;
  score: number;
  fullMark: number;
}

export function MetricsRadar() {
  const [data, setData] = useState<MetricPoint[]>([]);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const [incidents, aqi, cameras, crime, traffic] = await Promise.all([
          api.get("/incidents", { params: { limit: 1 } }),
          api.get("/aqi", { params: { limit: 50 } }),
          api.get("/cameras", { params: { limit: 1, status: "online" } }),
          api.get("/crime", { params: { limit: 1 } }),
          api.get("/traffic", { params: { limit: 50 } }),
        ]);

        const totalIncidents = incidents.data.pagination?.total || 0;
        const totalCameras = cameras.data.pagination?.total || 0;
        const totalCrime = crime.data.pagination?.total || 0;

        const aqiData = aqi.data.data || [];
        const avgAqi = aqiData.length > 0
          ? aqiData.reduce((s: number, r: { aqi: number }) => s + r.aqi, 0) / aqiData.length
          : 0;

        const trafficData = traffic.data.data || [];
        const avgCongestion = trafficData.length > 0
          ? trafficData.reduce((s: number, r: { congestion_level: number }) => s + r.congestion_level, 0) / trafficData.length
          : 0;

        setData([
          { metric: "CAMERAS", score: Math.min(totalCameras, 100), fullMark: 100 },
          { metric: "AQI", score: Math.max(0, 100 - avgAqi / 5), fullMark: 100 },
          { metric: "RESPONSE", score: totalIncidents > 0 ? Math.max(0, 100 - totalIncidents) : 100, fullMark: 100 },
          { metric: "SAFETY", score: totalCrime > 0 ? Math.max(0, 100 - totalCrime / 2) : 100, fullMark: 100 },
          { metric: "TRAFFIC", score: Math.max(0, 100 - avgCongestion), fullMark: 100 },
        ]);
      } catch (err) {
        console.error("Failed to fetch radar metrics:", err);
      }
    }
    fetchMetrics();
  }, []);

  if (!data.length) return null;

  const avgScore = Math.round(data.reduce((s, d) => s + d.score, 0) / data.length);

  return (
    <div className="bg-gray-950 border border-brand/10 p-5 corner-borders relative card-hover overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand/20 to-transparent" />
      <div className="flex items-center gap-2 mb-2">
        <Activity className="h-3.5 w-3.5 text-brand" />
        <h3 className="text-xs font-mono text-brand tracking-wider">
          {">"} SYSTEM_HEALTH // MULTI-METRIC
        </h3>
      </div>
      {/* Score summary */}
      <div className="flex items-center gap-3 mb-3">
        <div className="text-[10px] font-mono text-gray-500 tracking-wider">
          COMPOSITE SCORE:
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold font-[Orbitron] text-brand text-glow tabular-nums">
            {avgScore}
          </span>
          <span className="text-[9px] text-gray-600 font-mono">/100</span>
        </div>
        <div className="flex-1 h-1 bg-gray-800 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand/40 to-brand threat-bar-fill"
            style={{ ["--bar-width" as string]: `${avgScore}%` }}
          />
        </div>
      </div>
      <ResponsiveContainer width="100%" height={250}>
        <RadarChart data={data} cx="50%" cy="50%" outerRadius="70%">
          <PolarGrid stroke="#0a1a0a" strokeWidth={1} />
          <PolarAngleAxis
            dataKey="metric"
            tick={{ fill: "#3a5a3a", fontSize: 9, fontFamily: "JetBrains Mono" }}
          />
          <Radar
            dataKey="score"
            stroke="#00ff41"
            fill="url(#radarGrad)"
            strokeWidth={2}
            animationDuration={1500}
            animationEasing="ease-out"
            dot={{ r: 3, fill: "#00ff41", stroke: "#020a02", strokeWidth: 2 }}
          />
          <defs>
            <radialGradient id="radarGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#00ff41" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#00ff41" stopOpacity={0.05} />
            </radialGradient>
          </defs>
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
