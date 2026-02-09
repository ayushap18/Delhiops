import { useState, useMemo, useEffect } from "react";
import { Plus, Car, AlertTriangle } from "lucide-react";
import { useApi } from "@/hooks/useApi";
import { useAuth } from "@/hooks/useAuth";
import type { TrafficData, Camera as CameraType } from "@/lib/api";
import { TrafficStatsOverview } from "@/components/traffic/TrafficStatsOverview";
import { TrafficBusyLanes } from "@/components/traffic/TrafficBusyLanes";
import { TrafficRoadNetwork } from "@/components/traffic/TrafficRoadNetwork";
import { TrafficGoogleMap } from "@/components/traffic/TrafficGoogleMap";
import { TrafficZoneAnalysis } from "@/components/traffic/TrafficZoneAnalysis";
import { TrafficSignalMonitor } from "@/components/traffic/TrafficSignalMonitor";
import { TrafficCameraGrid } from "@/components/traffic/TrafficCameraGrid";
import { CongestionChart } from "@/components/traffic/TrafficChart";
import { TrafficForm } from "@/components/traffic/TrafficForm";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

export default function TrafficPage() {
  const { canWrite } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const { data: rawData, loading, refetch } = useApi<TrafficData>("/traffic", {
    page: 1,
    limit: 50,
    params: { sort_by: "timestamp", sort_order: "desc" },
  });

  // Generate mock traffic data when API returns empty
  const data = useMemo(() => {
    if (rawData.length > 0) return rawData;
    if (loading) return rawData;
    return Array.from({ length: 50 }, (_, i) => {
      const hoursAgo = Math.floor((i / 50) * 48);
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
      } as TrafficData;
    });
  }, [rawData, loading]);

  const { data: cameras } = useApi<CameraType>("/cameras", {
    page: 1,
    limit: 50,
  });

  const avgCongestion = useMemo(() => {
    if (!data.length) return 0;
    return Math.round(data.reduce((s, d) => s + d.congestion_level, 0) / data.length);
  }, [data]);

  if (loading && !rawData.length) {
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
            <Car className="h-5 w-5 text-info drop-shadow-[0_0_6px_rgba(0,212,255,0.5)]" />
            <h1 className="text-lg font-bold text-info font-[Orbitron] tracking-widest text-glow-cyan">
              TRAFFIC COMMAND
            </h1>
            {avgCongestion > 60 && (
              <div className="flex items-center gap-1.5 ml-3 px-2 py-0.5 border border-danger/30 bg-danger/5">
                <AlertTriangle className="h-3 w-3 text-danger" />
                <span className="text-[9px] font-mono tracking-wider text-danger">
                  HIGH CONGESTION
                </span>
              </div>
            )}
          </div>
          <p className="text-[10px] text-gray-600 font-mono tracking-[0.2em]">
            {">"} TRAFFIC_OPS // DELHI NCR REAL-TIME FLOW ANALYSIS
          </p>
        </div>
        {canWrite && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 border border-info/20 bg-info/5 px-4 py-2 text-[10px] font-mono text-info hover:bg-info/10 tracking-wider transition-colors"
          >
            <Plus className="h-3 w-3" /> ADD_DATA
          </button>
        )}
      </div>

      {/* ===== ROW 1: Google Maps Live Traffic (full width) ===== */}
      <TrafficGoogleMap data={data} />

      {/* ===== ROW 2: Stats Overview + Zone Analysis ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TrafficStatsOverview data={data} />
        <TrafficZoneAnalysis data={data} />
      </div>

      {/* ===== ROW 3: Busy Corridors + Congestion Chart ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TrafficBusyLanes data={data} />
        <CongestionChart data={data} />
      </div>

      {/* ===== ROW 4: Signal Monitor + Road Network Map ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TrafficSignalMonitor data={data} />
        <TrafficRoadNetwork data={data} />
      </div>

      {/* ===== ROW 5: Camera Grid (full width) ===== */}
      <TrafficCameraGrid cameras={cameras} />

      {/* ===== Form Modal ===== */}
      <TrafficForm
        open={showForm}
        onClose={() => setShowForm(false)}
        onSuccess={refetch}
      />
    </div>
  );
}
