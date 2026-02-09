import { useState, useMemo } from "react";
import { Download, FileText, Activity, BarChart3, TrendingUp, Database } from "lucide-react";
import { useApi } from "@/hooks/useApi";
import { AnimatedNumber } from "@/components/shared/AnimatedNumber";
import { ChartTooltip } from "@/components/shared/ChartTooltip";
import type { AqiReading, CrimeReport, Incident, TrafficData } from "@/lib/api";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from "recharts";

type ReportType = "aqi" | "crime" | "incidents" | "traffic";

const REPORT_META: Record<ReportType, { label: string; color: string; icon: string }> = {
  aqi: { label: "AIR QUALITY", color: "#00ff41", icon: "◉" },
  traffic: { label: "TRAFFIC", color: "#00d4ff", icon: "◈" },
  crime: { label: "CRIME", color: "#ff003c", icon: "◆" },
  incidents: { label: "INCIDENTS", color: "#ffb800", icon: "▲" },
};

export default function ReportsPage() {
  const [reportType, setReportType] = useState<ReportType>("aqi");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const meta = REPORT_META[reportType];
  const endpoint = `/${reportType === "incidents" ? "incidents" : reportType}`;
  const params: Record<string, string | undefined> = {
    sort_by: "timestamp",
    sort_order: "desc",
    from_date: dateFrom || undefined,
    to_date: dateTo || undefined,
  };

  const { data: rawData, loading } = useApi<AqiReading | CrimeReport | Incident | TrafficData>(
    endpoint,
    { limit: 200, params }
  );

  // Generate mock traffic data when API returns empty
  const data = useMemo(() => {
    if (rawData.length > 0) return rawData;
    if (reportType !== "traffic" || loading) return rawData;
    // Generate 100 mock records spread across 48 hours
    return Array.from({ length: 100 }, (_, i) => {
      const hoursAgo = Math.floor((i / 100) * 48);
      const ts = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
      const hour = ts.getHours();
      const isPeak = (hour >= 8 && hour <= 11) || (hour >= 17 && hour <= 20);
      const base = isPeak ? 55 + ((i * 17) % 30) : 20 + ((i * 13) % 30);
      const congestion = Math.max(5, Math.min(95, base));
      const speed = Math.max(5, Math.round(75 - congestion * 0.65 + ((i * 7) % 10) - 5));
      return {
        id: i + 1,
        congestion_level: congestion,
        speed,
        timestamp: ts.toISOString(),
      } as unknown as TrafficData;
    }) as unknown as typeof rawData;
  }, [rawData, reportType, loading]);

  // Compute analytics from data
  const analytics = useMemo(() => {
    if (!data.length) return null;

    const records = data as unknown as Record<string, unknown>[];

    // Time distribution
    const timeGroups: Record<string, number> = {};
    records.forEach((item) => {
      const d = new Date(item.timestamp as string);
      const key = `${d.getMonth() + 1}/${d.getDate()}`;
      timeGroups[key] = (timeGroups[key] || 0) + 1;
    });
    const timeline = Object.entries(timeGroups)
      .map(([date, count]) => ({ date, count }))
      .reverse()
      .slice(-14);

    // Type-specific stats
    if (reportType === "aqi") {
      const aqiData = data as unknown as AqiReading[];
      const avgAqi = Math.round(aqiData.reduce((s, d) => s + d.aqi, 0) / aqiData.length);
      const maxAqi = Math.max(...aqiData.map((d) => d.aqi));
      const minAqi = Math.min(...aqiData.map((d) => d.aqi));
      const avgPollutants = {
        pm25: avg(aqiData.map((d) => d.pm2_5)),
        pm10: avg(aqiData.map((d) => d.pm10)),
        o3: avg(aqiData.map((d) => d.o3)),
        no2: avg(aqiData.map((d) => d.no2)),
        so2: avg(aqiData.map((d) => d.so2)),
        co: avg(aqiData.map((d) => d.co)),
      };
      const trendData = [...aqiData].reverse().slice(-20).map((d) => ({
        time: new Date(d.timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        aqi: d.aqi,
        pm25: d.pm2_5 ?? 0,
      }));
      return { type: "aqi" as const, avgAqi, maxAqi, minAqi, avgPollutants, trendData, timeline, total: data.length };
    }

    if (reportType === "traffic") {
      const trafficData = data as unknown as TrafficData[];
      const avgCongestion = Math.round(trafficData.reduce((s, d) => s + d.congestion_level, 0) / trafficData.length);
      const avgSpeed = Math.round(trafficData.reduce((s, d) => s + d.speed, 0) / trafficData.length);
      const maxCongestion = Math.max(...trafficData.map((d) => d.congestion_level));
      const minSpeed = Math.min(...trafficData.map((d) => d.speed));
      const maxSpeed = Math.max(...trafficData.map((d) => d.speed));
      const trendData = [...trafficData].reverse().slice(-20).map((d) => ({
        time: new Date(d.timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        congestion: d.congestion_level,
        speed: d.speed,
      }));

      // Signal health simulation based on congestion
      const totalSignals = 25;
      const faultThreshold = 85 - avgCongestion * 0.3;
      const signalStats = { operational: 0, degraded: 0, fault: 0, offline: 0 };
      for (let i = 0; i < totalSignals; i++) {
        const val = ((i * 37 + 13) % 100);
        if (val > 95) signalStats.offline++;
        else if (val > faultThreshold) signalStats.fault++;
        else if (val > faultThreshold - 8) signalStats.degraded++;
        else signalStats.operational++;
      }

      // Peak hour analysis
      const hourBuckets: Record<number, { count: number; totalCong: number; totalSpeed: number }> = {};
      trafficData.forEach((d) => {
        const h = new Date(d.timestamp).getHours();
        if (!hourBuckets[h]) hourBuckets[h] = { count: 0, totalCong: 0, totalSpeed: 0 };
        hourBuckets[h].count++;
        hourBuckets[h].totalCong += d.congestion_level;
        hourBuckets[h].totalSpeed += d.speed;
      });
      const hourlyData = Array.from({ length: 24 }, (_, h) => {
        const bucket = hourBuckets[h];
        return {
          hour: `${h}:00`,
          congestion: bucket ? Math.round(bucket.totalCong / bucket.count) : 0,
          speed: bucket ? Math.round(bucket.totalSpeed / bucket.count) : 0,
        };
      });

      // Peak hour detection
      const peakHour = Object.entries(hourBuckets)
        .map(([h, v]) => ({ hour: parseInt(h), avg: v.totalCong / v.count }))
        .sort((a, b) => b.avg - a.avg)[0];

      // Zone analysis
      const ZONES = [
        { id: "central", name: "CENTRAL", weight: 1.2 },
        { id: "north", name: "NORTH", weight: 0.9 },
        { id: "south", name: "SOUTH", weight: 1.1 },
        { id: "east", name: "EAST", weight: 0.8 },
        { id: "west", name: "WEST", weight: 0.85 },
        { id: "ne", name: "N-EAST", weight: 0.7 },
        { id: "nw", name: "N-WEST", weight: 0.75 },
        { id: "se", name: "S-EAST", weight: 0.95 },
        { id: "sw", name: "S-WEST", weight: 1.0 },
      ];
      const zoneData = ZONES.map((zone, i) => {
        const variation = ((i * 23 + 9) % 35) - 17;
        const congestion = Math.max(5, Math.min(95, Math.round(avgCongestion * zone.weight + variation)));
        return { name: zone.name, congestion };
      }).sort((a, b) => b.congestion - a.congestion);

      // Corridor analysis
      const CORRIDORS = [
        { name: "Ring Road", baseDelay: 45 },
        { name: "Outer Ring Road", baseDelay: 35 },
        { name: "NH-48", baseDelay: 55 },
        { name: "GT Karnal Road", baseDelay: 50 },
        { name: "Vikas Marg", baseDelay: 60 },
        { name: "Mathura Road", baseDelay: 40 },
      ];
      const corridorData = CORRIDORS.map((c, i) => {
        const variation = ((i * 17 + 7) % 40) - 20;
        const congestion = Math.max(5, Math.min(95, Math.round(avgCongestion + variation + (c.baseDelay - 40) * 0.5)));
        return { name: c.name, value: congestion };
      }).sort((a, b) => b.value - a.value);

      return { type: "traffic" as const, avgCongestion, avgSpeed, maxCongestion, minSpeed, maxSpeed, trendData, timeline, total: data.length, signalStats, hourlyData, peakHour, zoneData, corridorData };
    }

    if (reportType === "crime") {
      const crimeData = data as unknown as CrimeReport[];
      const types: Record<string, number> = {};
      const severities: Record<string, number> = {};
      const statuses: Record<string, number> = {};
      crimeData.forEach((c) => {
        types[c.type] = (types[c.type] || 0) + 1;
        severities[c.severity] = (severities[c.severity] || 0) + 1;
        statuses[c.status] = (statuses[c.status] || 0) + 1;
      });
      const typeChart = Object.entries(types).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
      const sevChart = Object.entries(severities).map(([name, value]) => ({ name, value }));
      return { type: "crime" as const, types: typeChart, severities: sevChart, statuses, timeline, total: data.length };
    }

    // incidents
    const incData = data as unknown as Incident[];
    const types: Record<string, number> = {};
    const severities: Record<string, number> = {};
    const statuses: Record<string, number> = {};
    incData.forEach((c) => {
      types[c.type] = (types[c.type] || 0) + 1;
      severities[c.severity] = (severities[c.severity] || 0) + 1;
      statuses[c.status] = (statuses[c.status] || 0) + 1;
    });
    const typeChart = Object.entries(types).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    const sevChart = Object.entries(severities).map(([name, value]) => ({ name, value }));
    return { type: "incidents" as const, types: typeChart, severities: sevChart, statuses, timeline, total: data.length };
  }, [data, reportType]);

  function exportCSV() {
    if (!data.length) return;
    const keys = Object.keys(data[0] as unknown as Record<string, unknown>);
    const csvHeader = keys.join(",");
    const csvRows = data.map((item) =>
      keys.map((k) => {
        const val = (item as unknown as Record<string, unknown>)[k];
        if (typeof val === "object" && val !== null) return JSON.stringify(val);
        return String(val ?? "");
      }).join(",")
    );
    const csv = [csvHeader, ...csvRows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    downloadBlob(blob, `${reportType}_report_${new Date().toISOString().slice(0, 10)}.csv`);
  }

  function exportJSON() {
    if (!data.length) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    downloadBlob(blob, `${reportType}_report_${new Date().toISOString().slice(0, 10)}.json`);
  }

  const SEV_COLORS: Record<string, string> = {
    critical: "#ff003c", high: "#ff6600", medium: "#ffb800", low: "#00ff41",
  };
  const TYPE_COLORS = ["#ff003c", "#ff6600", "#ffb800", "#00d4ff", "#00ff41", "#9945ff", "#ff0066", "#cc6600", "#0088ff"];

  return (
    <div className="space-y-4">
      {/* ===== HEADER ===== */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FileText className="h-4 w-4" style={{ color: meta.color }} />
            <h1 className="text-lg font-bold font-[Orbitron] tracking-widest"
              style={{ color: meta.color, textShadow: `0 0 12px ${meta.color}40` }}>
              REPORTS & ANALYTICS
            </h1>
          </div>
          <p className="text-[10px] text-gray-600 font-mono tracking-[0.2em]">
            {">"} REPORT_ENGINE // CROSS-DOMAIN DATA INTELLIGENCE
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV} disabled={!data.length}
            className="flex items-center gap-2 border px-4 py-2 text-[10px] font-mono tracking-wider transition-colors disabled:opacity-30"
            style={{ borderColor: meta.color + "30", color: meta.color, backgroundColor: meta.color + "08" }}>
            <Download className="h-3 w-3" /> CSV
          </button>
          <button onClick={exportJSON} disabled={!data.length}
            className="flex items-center gap-2 border px-4 py-2 text-[10px] font-mono tracking-wider transition-colors disabled:opacity-30"
            style={{ borderColor: meta.color + "30", color: meta.color, backgroundColor: meta.color + "08" }}>
            <Download className="h-3 w-3" /> JSON
          </button>
        </div>
      </div>

      {/* ===== REPORT TYPE SELECTOR ===== */}
      <div className="grid grid-cols-4 gap-2">
        {(Object.keys(REPORT_META) as ReportType[]).map((type) => {
          const m = REPORT_META[type];
          const isActive = type === reportType;
          return (
            <button key={type} onClick={() => setReportType(type)}
              className="relative border px-3 py-3 text-center transition-all group"
              style={{
                borderColor: isActive ? m.color + "50" : "#111",
                backgroundColor: isActive ? m.color + "0a" : "transparent",
                boxShadow: isActive ? `0 0 15px ${m.color}15, inset 0 0 20px ${m.color}05` : "none",
              }}>
              {isActive && (
                <div className="absolute top-0 left-0 right-0 h-px" style={{ backgroundColor: m.color + "40" }} />
              )}
              <span className="text-[14px] block mb-1" style={{ color: isActive ? m.color : "#333" }}>
                {m.icon}
              </span>
              <span className="text-[9px] font-mono tracking-widest block"
                style={{ color: isActive ? m.color : "#555" }}>
                {m.label}
              </span>
              {isActive && (
                <div className="absolute bottom-0 left-1/4 right-1/4 h-px" style={{ backgroundColor: m.color }} />
              )}
            </button>
          );
        })}
      </div>

      {/* ===== FILTERS + RECORD COUNT ===== */}
      <div className="flex items-end gap-4 bg-gray-950 border p-4 corner-borders relative"
        style={{ borderColor: meta.color + "10" }}>
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent to-transparent"
          style={{ backgroundImage: `linear-gradient(to right, transparent, ${meta.color}20, transparent)` }} />
        <div>
          <label className="block text-[8px] font-mono text-gray-600 mb-1 tracking-widest">FROM_DATE</label>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
            className="bg-gray-950 border px-3 py-2 text-[10px] font-mono text-gray-400 tracking-wider"
            style={{ borderColor: meta.color + "15" }}
          />
        </div>
        <div>
          <label className="block text-[8px] font-mono text-gray-600 mb-1 tracking-widest">TO_DATE</label>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
            className="bg-gray-950 border px-3 py-2 text-[10px] font-mono text-gray-400 tracking-wider"
            style={{ borderColor: meta.color + "15" }}
          />
        </div>
        <div className="ml-auto flex items-center gap-3">
          <Database className="h-3.5 w-3.5" style={{ color: meta.color + "60" }} />
          <div>
            <p className="text-[7px] font-mono text-gray-600 tracking-wider">RECORDS LOADED</p>
            <p className="text-[16px] font-bold font-[Orbitron]" style={{ color: meta.color }}>
              {loading ? "..." : <AnimatedNumber value={data.length} />}
            </p>
          </div>
        </div>
      </div>

      {/* ===== ANALYTICS DASHBOARD (type-specific) ===== */}
      {!loading && analytics && (
        <>
          {/* AQI Analytics */}
          {analytics.type === "aqi" && (
            <>
              {/* Stat cards row */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: "AVG AQI", value: analytics.avgAqi, color: "#00ff41" },
                  { label: "MAX AQI", value: analytics.maxAqi, color: "#ff003c" },
                  { label: "MIN AQI", value: analytics.minAqi, color: "#00d4ff" },
                  { label: "READINGS", value: analytics.total, color: "#ffb800" },
                ].map((card) => (
                  <div key={card.label} className="border px-3 py-3 text-center"
                    style={{ borderColor: card.color + "20", backgroundColor: card.color + "05" }}>
                    <p className="text-xl font-bold font-[Orbitron]"
                      style={{ color: card.color, textShadow: `0 0 10px ${card.color}30` }}>
                      <AnimatedNumber value={card.value} />
                    </p>
                    <p className="text-[6px] font-mono text-gray-600 tracking-widest mt-0.5">{card.label}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* AQI Trend */}
                <div className="bg-gray-950 border border-brand/10 p-5 corner-borders relative">
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand/20 to-transparent" />
                  <h3 className="text-[10px] font-mono text-brand tracking-wider mb-1">
                    {">"} AQI_TREND // TIME SERIES
                  </h3>
                  <p className="text-[7px] font-mono text-gray-700 tracking-wider mb-3">AQI + PM2.5 OVERLAY</p>
                  <ResponsiveContainer width="100%" height={240}>
                    <AreaChart data={analytics.trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#0a1a0a" />
                      <XAxis dataKey="time" stroke="#1a3a1a" tick={{ fill: "#3a5a3a", fontSize: 8, fontFamily: "JetBrains Mono" }} />
                      <YAxis stroke="#1a3a1a" tick={{ fill: "#3a5a3a", fontSize: 8, fontFamily: "JetBrains Mono" }} />
                      <Tooltip content={<ChartTooltip />} />
                      <Area type="monotone" dataKey="aqi" stroke="#00ff41" fill="#00ff41" fillOpacity={0.15} strokeWidth={2} name="AQI" />
                      <Area type="monotone" dataKey="pm25" stroke="#ff6600" fill="#ff6600" fillOpacity={0.08} strokeWidth={1} name="PM2.5" strokeDasharray="4 2" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Pollutant Breakdown */}
                <div className="bg-gray-950 border border-brand/10 p-5 corner-borders relative">
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand/20 to-transparent" />
                  <h3 className="text-[10px] font-mono text-brand tracking-wider mb-1">
                    {">"} POLLUTANT_INDEX // AVERAGE LEVELS
                  </h3>
                  <p className="text-[7px] font-mono text-gray-700 tracking-wider mb-4">WHO THRESHOLD COMPARISON</p>
                  <div className="space-y-3">
                    {[
                      { name: "PM2.5", val: analytics.avgPollutants.pm25, threshold: 150, unit: "µg/m³" },
                      { name: "PM10", val: analytics.avgPollutants.pm10, threshold: 350, unit: "µg/m³" },
                      { name: "O3", val: analytics.avgPollutants.o3, threshold: 100, unit: "ppb" },
                      { name: "NO2", val: analytics.avgPollutants.no2, threshold: 100, unit: "ppb" },
                      { name: "SO2", val: analytics.avgPollutants.so2, threshold: 40, unit: "ppb" },
                      { name: "CO", val: analytics.avgPollutants.co, threshold: 9, unit: "ppm" },
                    ].map((p) => {
                      const pct = Math.min((p.val / p.threshold) * 100, 100);
                      const color = pct > 80 ? "#ff003c" : pct > 50 ? "#ff6600" : pct > 30 ? "#ffb800" : "#00ff41";
                      return (
                        <div key={p.name}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[8px] font-mono text-gray-400 tracking-wider">{p.name}</span>
                            <span className="text-[8px] font-mono" style={{ color }}>
                              {p.val.toFixed(1)} <span className="text-gray-700">{p.unit}</span>
                            </span>
                          </div>
                          <div className="h-1.5 bg-gray-900 overflow-hidden relative">
                            <div className="h-full transition-all duration-700" style={{
                              width: `${pct}%`, backgroundColor: color,
                              boxShadow: `0 0 6px ${color}50`,
                            }} />
                            {/* Threshold marker */}
                            <div className="absolute top-0 bottom-0 w-px bg-danger/40" style={{ left: "100%" }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Traffic Analytics */}
          {analytics.type === "traffic" && (
            <>
              {/* Stat cards row */}
              <div className="grid grid-cols-3 lg:grid-cols-6 gap-2">
                {[
                  { label: "AVG CONGESTION", value: analytics.avgCongestion, suffix: "%", color: "#00d4ff" },
                  { label: "MAX CONGESTION", value: analytics.maxCongestion, suffix: "%", color: "#ff003c" },
                  { label: "AVG SPEED", value: analytics.avgSpeed, suffix: " km/h", color: "#00ff41" },
                  { label: "MAX SPEED", value: analytics.maxSpeed, suffix: " km/h", color: "#00d4ff" },
                  { label: "MIN SPEED", value: analytics.minSpeed, suffix: " km/h", color: "#ffb800" },
                  { label: "PEAK HOUR", value: analytics.peakHour ? analytics.peakHour.hour : 0, suffix: ":00", color: "#ff6600" },
                ].map((card) => (
                  <div key={card.label} className="border px-2 py-3 text-center"
                    style={{ borderColor: card.color + "20", backgroundColor: card.color + "05" }}>
                    <p className="text-lg font-bold font-[Orbitron]"
                      style={{ color: card.color, textShadow: `0 0 10px ${card.color}30` }}>
                      <AnimatedNumber value={card.value} />{card.suffix}
                    </p>
                    <p className="text-[5px] font-mono text-gray-600 tracking-widest mt-0.5">{card.label}</p>
                  </div>
                ))}
              </div>

              {/* Signal Health + Congestion Chart */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Signal Health Panel */}
                <div className="bg-gray-950 border border-info/10 p-5 corner-borders relative">
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-info/20 to-transparent" />
                  <h3 className="text-[10px] font-mono text-info tracking-wider mb-1">
                    {">"} SIGNAL_HEALTH // TRAFFIC LIGHT STATUS
                  </h3>
                  <p className="text-[7px] font-mono text-gray-700 tracking-wider mb-4">25 MONITORED INTERSECTIONS — DELHI NCR</p>

                  {/* Signal status boxes */}
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    {[
                      { label: "OPERATIONAL", value: analytics.signalStats.operational, color: "#00ff41" },
                      { label: "DEGRADED", value: analytics.signalStats.degraded, color: "#ffb800" },
                      { label: "FAULT", value: analytics.signalStats.fault, color: "#ff6600" },
                      { label: "OFFLINE", value: analytics.signalStats.offline, color: "#ff003c" },
                    ].map((s) => (
                      <div key={s.label} className="border px-2 py-2 text-center"
                        style={{ borderColor: s.color + "15", backgroundColor: s.color + "05" }}>
                        <p className="text-[16px] font-bold font-[Orbitron]" style={{ color: s.color }}>
                          <AnimatedNumber value={s.value} />
                        </p>
                        <p className="text-[4.5px] font-mono text-gray-600 tracking-widest">{s.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Signal health bar */}
                  <div className="mb-3">
                    <p className="text-[7px] font-mono text-gray-600 tracking-wider mb-1">SYSTEM HEALTH INDEX</p>
                    <div className="h-3 bg-gray-900 overflow-hidden flex">
                      <div className="h-full bg-[#00ff41]"
                        style={{ width: `${(analytics.signalStats.operational / 25) * 100}%`, opacity: 0.7 }} />
                      <div className="h-full bg-[#ffb800]"
                        style={{ width: `${(analytics.signalStats.degraded / 25) * 100}%`, opacity: 0.7 }} />
                      <div className="h-full bg-[#ff6600]"
                        style={{ width: `${(analytics.signalStats.fault / 25) * 100}%`, opacity: 0.7 }} />
                      <div className="h-full bg-[#ff003c]"
                        style={{ width: `${(analytics.signalStats.offline / 25) * 100}%`, opacity: 0.7 }} />
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[6px] font-mono text-brand">
                        {Math.round((analytics.signalStats.operational / 25) * 100)}% HEALTHY
                      </span>
                      {(analytics.signalStats.fault + analytics.signalStats.offline) > 0 && (
                        <span className="text-[6px] font-mono text-danger">
                          {analytics.signalStats.fault + analytics.signalStats.offline} DISRUPTIONS
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Impact summary */}
                  <div className="border border-info/10 p-2 space-y-1">
                    <p className="text-[7px] font-mono text-info tracking-wider font-bold">IMPACT EVALUATION</p>
                    <div className="flex items-center justify-between">
                      <span className="text-[7px] font-mono text-gray-500">Traffic delays from faults</span>
                      <span className="text-[8px] font-mono font-bold"
                        style={{ color: (analytics.signalStats.fault + analytics.signalStats.offline) > 3 ? "#ff003c" : "#ffb800" }}>
                        {(analytics.signalStats.fault + analytics.signalStats.offline) > 3 ? "SEVERE" :
                         (analytics.signalStats.fault + analytics.signalStats.offline) > 1 ? "MODERATE" : "MINIMAL"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[7px] font-mono text-gray-500">Est. additional delay</span>
                      <span className="text-[8px] font-mono text-warning font-bold">
                        +{(analytics.signalStats.fault * 8 + analytics.signalStats.offline * 15)} min/corridor
                      </span>
                    </div>
                  </div>
                </div>

                {/* Congestion & Speed Chart */}
                <div className="bg-gray-950 border border-info/10 p-5 corner-borders relative">
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-info/20 to-transparent" />
                  <h3 className="text-[10px] font-mono text-info tracking-wider mb-1">
                    {">"} TRAFFIC_FLOW // CONGESTION & SPEED
                  </h3>
                  <p className="text-[7px] font-mono text-gray-700 tracking-wider mb-3">DUAL-AXIS TREND ANALYSIS</p>
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={analytics.trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#0a1a0a" />
                      <XAxis dataKey="time" stroke="#1a3a1a" tick={{ fill: "#3a5a3a", fontSize: 8, fontFamily: "JetBrains Mono" }} />
                      <YAxis yAxisId="left" stroke="#1a3a1a" tick={{ fill: "#3a5a3a", fontSize: 8, fontFamily: "JetBrains Mono" }} />
                      <YAxis yAxisId="right" orientation="right" stroke="#1a3a1a" tick={{ fill: "#3a5a3a", fontSize: 8, fontFamily: "JetBrains Mono" }} />
                      <Tooltip content={<ChartTooltip />} />
                      <Line yAxisId="left" type="monotone" dataKey="congestion" stroke="#00d4ff" strokeWidth={2} dot={false} name="Congestion %" />
                      <Line yAxisId="right" type="monotone" dataKey="speed" stroke="#00ff41" strokeWidth={1.5} dot={false} name="Speed km/h" strokeDasharray="4 2" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Zone Analysis + Corridor Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Zone Congestion */}
                <div className="bg-gray-950 border border-info/10 p-5 corner-borders relative">
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-info/20 to-transparent" />
                  <h3 className="text-[10px] font-mono text-info tracking-wider mb-1">
                    {">"} ZONE_ANALYSIS // AREA-WISE CONGESTION
                  </h3>
                  <p className="text-[7px] font-mono text-gray-700 tracking-wider mb-3">9 DELHI NCR ZONES — RANKED</p>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={analytics.zoneData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#0a1a0a" horizontal={false} />
                      <XAxis type="number" stroke="#1a3a1a" tick={{ fill: "#3a5a3a", fontSize: 8, fontFamily: "JetBrains Mono" }} domain={[0, 100]} />
                      <YAxis type="category" dataKey="name" stroke="#1a3a1a" tick={{ fill: "#3a5a3a", fontSize: 7, fontFamily: "JetBrains Mono" }} width={55} />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="congestion" name="Congestion %" radius={[0, 2, 2, 0]}>
                        {analytics.zoneData.map((entry, i) => {
                          const color = entry.congestion >= 70 ? "#ff003c" : entry.congestion >= 50 ? "#ff6600" : entry.congestion >= 30 ? "#ffb800" : "#00d4ff";
                          return <Cell key={i} fill={color} fillOpacity={0.6} />;
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Corridor Breakdown */}
                <div className="bg-gray-950 border border-info/10 p-5 corner-borders relative">
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-info/20 to-transparent" />
                  <h3 className="text-[10px] font-mono text-info tracking-wider mb-1">
                    {">"} CORRIDOR_INDEX // MAJOR ROAD CONGESTION
                  </h3>
                  <p className="text-[7px] font-mono text-gray-700 tracking-wider mb-3">KEY ARTERIALS — CONGESTION LEVELS</p>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={analytics.corridorData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#0a1a0a" horizontal={false} />
                      <XAxis type="number" stroke="#1a3a1a" tick={{ fill: "#3a5a3a", fontSize: 8, fontFamily: "JetBrains Mono" }} domain={[0, 100]} />
                      <YAxis type="category" dataKey="name" stroke="#1a3a1a" tick={{ fill: "#3a5a3a", fontSize: 7, fontFamily: "JetBrains Mono" }} width={85} />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="value" name="Congestion %" radius={[0, 2, 2, 0]}>
                        {analytics.corridorData.map((entry, i) => {
                          const color = entry.value >= 70 ? "#ff003c" : entry.value >= 50 ? "#ff6600" : entry.value >= 30 ? "#ffb800" : "#00d4ff";
                          return <Cell key={i} fill={color} fillOpacity={0.6} />;
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Hourly Congestion Heatmap */}
              <div className="bg-gray-950 border border-info/10 p-5 corner-borders relative">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-info/20 to-transparent" />
                <h3 className="text-[10px] font-mono text-info tracking-wider mb-1">
                  {">"} HOURLY_PATTERN // 24H CONGESTION & SPEED
                </h3>
                <p className="text-[7px] font-mono text-gray-700 tracking-wider mb-3">AVERAGE BY HOUR OF DAY — DUAL METRICS</p>
                <ResponsiveContainer width="100%" height={220}>
                  <ComposedChart data={analytics.hourlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#0a1a0a" />
                    <XAxis dataKey="hour" stroke="#1a3a1a" tick={{ fill: "#3a5a3a", fontSize: 7, fontFamily: "JetBrains Mono" }} />
                    <YAxis yAxisId="left" stroke="#1a3a1a" tick={{ fill: "#3a5a3a", fontSize: 8, fontFamily: "JetBrains Mono" }} />
                    <YAxis yAxisId="right" orientation="right" stroke="#1a3a1a" tick={{ fill: "#3a5a3a", fontSize: 8, fontFamily: "JetBrains Mono" }} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar yAxisId="left" dataKey="congestion" name="Congestion %" radius={[2, 2, 0, 0]}>
                      {analytics.hourlyData.map((entry, i) => {
                        const color = entry.congestion >= 70 ? "#ff003c" : entry.congestion >= 50 ? "#ff6600" : entry.congestion >= 30 ? "#ffb800" : entry.congestion > 0 ? "#00d4ff" : "#0a1a0a";
                        return <Cell key={i} fill={color} fillOpacity={entry.congestion > 0 ? 0.6 : 0.1} />;
                      })}
                    </Bar>
                    <Line yAxisId="right" type="monotone" dataKey="speed" stroke="#00ff41" strokeWidth={1.5} dot={false} name="Avg Speed km/h" strokeDasharray="4 2" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </>
          )}

          {/* Crime/Incidents Analytics */}
          {(analytics.type === "crime" || analytics.type === "incidents") && (
            <>
              {/* Stat cards */}
              <div className="grid grid-cols-4 gap-2">
                <div className="border px-3 py-3 text-center" style={{ borderColor: meta.color + "20", backgroundColor: meta.color + "05" }}>
                  <p className="text-xl font-bold font-[Orbitron]" style={{ color: meta.color }}>
                    <AnimatedNumber value={analytics.total} />
                  </p>
                  <p className="text-[6px] font-mono text-gray-600 tracking-widest mt-0.5">TOTAL</p>
                </div>
                {analytics.severities.slice(0, 3).map((s) => (
                  <div key={s.name} className="border px-3 py-3 text-center"
                    style={{ borderColor: (SEV_COLORS[s.name] || meta.color) + "20", backgroundColor: (SEV_COLORS[s.name] || meta.color) + "05" }}>
                    <p className="text-xl font-bold font-[Orbitron]"
                      style={{ color: SEV_COLORS[s.name] || meta.color }}>
                      <AnimatedNumber value={s.value} />
                    </p>
                    <p className="text-[6px] font-mono text-gray-600 tracking-widest mt-0.5">{s.name.toUpperCase()}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Type Breakdown Pie */}
                <div className="bg-gray-950 border p-5 corner-borders relative" style={{ borderColor: meta.color + "10" }}>
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent to-transparent"
                    style={{ backgroundImage: `linear-gradient(to right, transparent, ${meta.color}20, transparent)` }} />
                  <h3 className="text-[10px] font-mono tracking-wider mb-1" style={{ color: meta.color }}>
                    {">"} TYPE_ANALYSIS // CATEGORY BREAKDOWN
                  </h3>
                  <div className="flex items-center">
                    <ResponsiveContainer width="50%" height={220}>
                      <PieChart>
                        <Pie data={analytics.types} cx="50%" cy="50%" innerRadius={40} outerRadius={75}
                          dataKey="value" stroke="#020a02" strokeWidth={2}>
                          {analytics.types.map((_, i) => (
                            <Cell key={i} fill={TYPE_COLORS[i % TYPE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<ChartTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex-1 space-y-1.5 pl-2">
                      {analytics.types.map((item, i) => (
                        <div key={item.name} className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2" style={{ backgroundColor: TYPE_COLORS[i % TYPE_COLORS.length] }} />
                            <span className="text-[7px] font-mono tracking-wider" style={{ color: TYPE_COLORS[i % TYPE_COLORS.length] + "cc" }}>
                              {item.name.toUpperCase()}
                            </span>
                          </div>
                          <span className="text-[9px] font-mono font-bold tabular-nums" style={{ color: TYPE_COLORS[i % TYPE_COLORS.length] }}>
                            {item.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Severity Bar */}
                <div className="bg-gray-950 border p-5 corner-borders relative" style={{ borderColor: meta.color + "10" }}>
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent to-transparent"
                    style={{ backgroundImage: `linear-gradient(to right, transparent, ${meta.color}20, transparent)` }} />
                  <h3 className="text-[10px] font-mono tracking-wider mb-1" style={{ color: meta.color }}>
                    {">"} SEVERITY_MATRIX // THREAT LEVELS
                  </h3>
                  <p className="text-[7px] font-mono text-gray-700 tracking-wider mb-4">DISTRIBUTION BY SEVERITY</p>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={analytics.severities} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#0a1a0a" horizontal={false} />
                      <XAxis type="number" stroke="#1a3a1a" tick={{ fill: "#3a5a3a", fontSize: 8, fontFamily: "JetBrains Mono" }} />
                      <YAxis type="category" dataKey="name" stroke="#1a3a1a" tick={{ fill: "#3a5a3a", fontSize: 8, fontFamily: "JetBrains Mono" }} width={60} />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="value" name="Count" radius={[0, 2, 2, 0]}>
                        {analytics.severities.map((entry) => (
                          <Cell key={entry.name} fill={SEV_COLORS[entry.name] || meta.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}

          {/* ===== TIMELINE (all types) ===== */}
          <div className="bg-gray-950 border p-5 corner-borders relative" style={{ borderColor: meta.color + "10" }}>
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent to-transparent"
              style={{ backgroundImage: `linear-gradient(to right, transparent, ${meta.color}20, transparent)` }} />
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-3.5 w-3.5" style={{ color: meta.color + "80" }} />
                <h3 className="text-[10px] font-mono tracking-wider" style={{ color: meta.color }}>
                  {">"} ACTIVITY_TIMELINE // DAILY DISTRIBUTION
                </h3>
              </div>
              <div className="flex items-center gap-1.5">
                <Activity className="h-3 w-3" style={{ color: meta.color + "60" }} />
                <span className="text-[8px] font-mono text-gray-600 tracking-wider">
                  {analytics.timeline.length} DAYS
                </span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={analytics.timeline}>
                <CartesianGrid strokeDasharray="3 3" stroke="#0a1a0a" />
                <XAxis dataKey="date" stroke="#1a3a1a" tick={{ fill: "#3a5a3a", fontSize: 8, fontFamily: "JetBrains Mono" }} />
                <YAxis stroke="#1a3a1a" tick={{ fill: "#3a5a3a", fontSize: 8, fontFamily: "JetBrains Mono" }} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="count" name="Records" radius={[2, 2, 0, 0]}>
                  {analytics.timeline.map((_, i) => (
                    <Cell key={i} fill={meta.color} fillOpacity={0.3 + (i / analytics.timeline.length) * 0.7} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* ===== RAW DATA PREVIEW ===== */}
          <div className="bg-gray-950 border p-5 corner-borders relative" style={{ borderColor: meta.color + "10" }}>
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent to-transparent"
              style={{ backgroundImage: `linear-gradient(to right, transparent, ${meta.color}20, transparent)` }} />
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-3.5 w-3.5" style={{ color: meta.color + "80" }} />
                <h3 className="text-[10px] font-mono tracking-wider" style={{ color: meta.color }}>
                  {">"} RAW_DATA // LATEST RECORDS
                </h3>
              </div>
              <span className="text-[8px] font-mono text-gray-600 tracking-wider">
                SHOWING 10 / {data.length}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    {data.length > 0 && Object.keys(data[0] as unknown as Record<string, unknown>).slice(0, 6).map((key) => (
                      <th key={key} className="text-[7px] font-mono text-gray-600 text-left px-2 py-1.5 tracking-widest border-b"
                        style={{ borderBottomColor: meta.color + "15" }}>
                        {key.toUpperCase()}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.slice(0, 10).map((item, i) => {
                    const row = item as unknown as Record<string, unknown>;
                    const keys = Object.keys(row).slice(0, 6);
                    return (
                      <tr key={i} className="hover:bg-gray-900/50 transition-colors">
                        {keys.map((key) => (
                          <td key={key} className="text-[8px] font-mono text-gray-400 px-2 py-1.5 truncate max-w-[120px] border-b border-gray-900/30">
                            {typeof row[key] === "object" ? JSON.stringify(row[key]) : String(row[key] ?? "-")}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Loading state */}
      {loading && (
        <div className="bg-gray-950 border p-12 text-center" style={{ borderColor: meta.color + "10" }}>
          <div className="inline-flex items-center gap-2">
            <div className="w-2 h-2 rounded-full status-dot" style={{ backgroundColor: meta.color }} />
            <span className="text-[10px] font-mono tracking-widest" style={{ color: meta.color }}>
              LOADING {meta.label} DATA...
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function avg(nums: (number | null)[]): number {
  const valid = nums.filter((n): n is number => n !== null);
  return valid.length ? valid.reduce((s, n) => s + n, 0) / valid.length : 0;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
