import { StatsGrid } from "@/components/dashboard/StatsGrid";
import { RecentIncidents } from "@/components/dashboard/RecentIncidents";
import { AlertsFeed } from "@/components/dashboard/AlertsFeed";
import { MetricsRadar } from "@/components/dashboard/MetricsRadar";
import { DelhiMap } from "@/components/map/DelhiMap";
import { Crosshair, MapPin, Shield, Activity } from "lucide-react";
import { useState, useEffect } from "react";

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className={`space-y-5 ${mounted ? "animate-fade-up" : "opacity-0"}`}>
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="relative">
              <Crosshair className="h-5 w-5 text-brand drop-shadow-[0_0_6px_rgba(0,255,65,0.5)]" />
            </div>
            <h1 className="text-lg font-bold text-brand font-[Orbitron] tracking-widest text-glow">
              COMMAND CENTER
            </h1>
            <div className="hidden lg:block ml-3 h-px flex-1 max-w-[100px] shimmer-line" />
          </div>
          <p className="text-[10px] text-gray-600 font-mono tracking-[0.2em]">
            {">"} DELHI NCR OPERATIONS OVERVIEW // REAL-TIME MONITORING
          </p>
        </div>
        <div className="hidden md:flex items-center gap-4">
          <div className="flex items-center gap-2 border border-brand/15 bg-brand/5 px-3 py-1.5 card-hover">
            <Activity className="h-3 w-3 text-brand status-dot" />
            <span className="text-[9px] font-mono text-brand tracking-wider">
              LIVE
            </span>
          </div>
          <div className="flex items-center gap-2 border border-warning/15 bg-warning/5 px-3 py-1.5">
            <Shield className="h-3 w-3 text-warning" />
            <span className="text-[9px] font-mono text-warning tracking-wider">
              THREAT LEVEL: MODERATE
            </span>
          </div>
        </div>
      </div>

      {/* STATS */}
      <StatsGrid />

      {/* MAP + RADAR */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 relative">
          <div className="bg-gray-950 border border-brand/10 p-3 corner-borders card-hover relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand/20 to-transparent" />
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="h-3 w-3 text-brand" />
              <span className="text-[9px] font-mono text-brand tracking-wider">
                {">"} GEO_SURVEILLANCE // 28.6139N 77.2090E
              </span>
              <span className="ml-auto text-[8px] font-mono text-gray-700 tracking-wider">
                LAYER: HYBRID
              </span>
            </div>
            <DelhiMap height="380px" />
            <div className="mt-2 h-px shimmer-line" />
          </div>
        </div>
        <MetricsRadar />
      </div>

      {/* ALERTS + RECENT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <RecentIncidents />
        </div>
        <AlertsFeed />
      </div>
    </div>
  );
}
