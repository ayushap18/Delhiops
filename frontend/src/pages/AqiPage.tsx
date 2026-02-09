import { useState, useMemo, useEffect } from "react";
import { Plus, Wind, Activity } from "lucide-react";
import { useApi } from "@/hooks/useApi";
import { useAuth } from "@/hooks/useAuth";
import type { AqiReading } from "@/lib/api";
import { AqiGauge } from "@/components/aqi/AqiGauge";
import { AqiTrendChart } from "@/components/aqi/AqiChart";
import { AqiForm } from "@/components/aqi/AqiForm";
import { AqiHumanIndicator } from "@/components/aqi/AqiHumanIndicator";
import { AqiDetailsCard } from "@/components/aqi/AqiDetailsCard";
import { AqiLiveFeed } from "@/components/aqi/AqiLiveFeed";
import { AqiRadarChart } from "@/components/aqi/AqiRadarChart";
import { getAqiLevel } from "@/lib/utils";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

export default function AqiPage() {
  const { canWrite } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const { data, loading, refetch } = useApi<AqiReading>("/aqi", {
    page: 1,
    limit: 50,
    params: { sort_by: "timestamp", sort_order: "desc" },
  });

  const avgAqi = useMemo(() => {
    if (!data.length) return 0;
    return Math.round(data.reduce((sum, r) => sum + r.aqi, 0) / data.length);
  }, [data]);

  const latestReading = data[0] ?? null;
  const level = getAqiLevel(avgAqi);

  if (loading && !data.length) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${mounted ? "animate-fade-up" : "opacity-0"}`}>
      {/* ===== HEADER ===== */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Wind className="h-5 w-5 text-brand drop-shadow-[0_0_6px_rgba(0,255,65,0.5)]" />
            <h1 className="text-lg font-bold text-brand font-[Orbitron] tracking-widest text-glow">
              AQI DASHBOARD
            </h1>
            <div
              className="flex items-center gap-1.5 ml-3 px-2 py-0.5 border"
              style={{
                borderColor: level.color === "text-aqi-good" ? "#00ff4140" : level.color === "text-aqi-moderate" ? "#ffb80040" : level.color === "text-aqi-unhealthy" ? "#ff660040" : "#ff003c40",
              }}
            >
              <Activity className="h-3 w-3" style={{ color: avgAqi <= 50 ? "#00ff41" : avgAqi <= 100 ? "#ffb800" : avgAqi <= 200 ? "#ff6600" : "#ff003c" }} />
              <span className={`text-[9px] font-mono tracking-wider ${level.color}`}>
                {level.label.toUpperCase()}
              </span>
            </div>
          </div>
          <p className="text-[10px] text-gray-600 font-mono tracking-[0.2em]">
            {">"} ATMOSPHERIC_MONITORING // DELHI NCR REAL-TIME ANALYSIS
          </p>
        </div>
        {canWrite && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 border border-brand/20 bg-brand/5 px-4 py-2 text-[10px] font-mono text-brand hover:bg-brand/10 tracking-wider transition-colors"
          >
            <Plus className="h-3 w-3" /> ADD_READING
          </button>
        )}
      </div>

      {/* ===== ROW 1: Human + Details + Gauge ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <AqiHumanIndicator aqi={avgAqi} />
        <AqiDetailsCard reading={latestReading} />
        <AqiGauge value={avgAqi} />
      </div>

      {/* ===== ROW 2: Radar Chart + Live Feed ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AqiRadarChart data={data} />
        <AqiLiveFeed data={data} />
      </div>

      {/* ===== ROW 3: Full-width Trend Chart ===== */}
      <AqiTrendChart data={data} />

      {/* ===== Form Modal ===== */}
      <AqiForm
        open={showForm}
        onClose={() => setShowForm(false)}
        onSuccess={refetch}
      />
    </div>
  );
}
