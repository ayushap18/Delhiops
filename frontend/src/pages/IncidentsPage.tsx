import { useState, useMemo, useEffect } from "react";
import { Plus, AlertTriangle } from "lucide-react";
import { useApi } from "@/hooks/useApi";
import { useAuth } from "@/hooks/useAuth";
import type { Incident } from "@/lib/api";
import { IncidentStatsOverview } from "@/components/incidents/IncidentStatsOverview";
import { IncidentTimeline } from "@/components/incidents/IncidentTimeline";
import { IncidentTypeChart, IncidentSeverityTrend } from "@/components/incidents/IncidentCharts";
import { IncidentSeverityGrid } from "@/components/incidents/IncidentSeverityGrid";
import { IncidentForm } from "@/components/incidents/IncidentForm";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

export default function IncidentsPage() {
  const { canWrite } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const { data, loading, refetch } = useApi<Incident>("/incidents", {
    page: 1,
    limit: 50,
    params: { sort_by: "timestamp", sort_order: "desc" },
  });

  const activeCount = useMemo(() => {
    return data.filter((d) => d.status === "open" || d.status === "in_progress").length;
  }, [data]);

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
            <AlertTriangle className="h-5 w-5 text-warning drop-shadow-[0_0_6px_rgba(255,184,0,0.5)]" />
            <h1 className="text-lg font-bold text-warning font-[Orbitron] tracking-widest text-glow-warning">
              INCIDENT DASHBOARD
            </h1>
            {activeCount > 0 && (
              <div className="flex items-center gap-1.5 ml-3 px-2 py-0.5 border border-warning/30 bg-warning/5">
                <AlertTriangle className="h-3 w-3 text-warning" />
                <span className="text-[9px] font-mono tracking-wider text-warning">
                  {activeCount} ACTIVE
                </span>
              </div>
            )}
          </div>
          <p className="text-[10px] text-gray-600 font-mono tracking-[0.2em]">
            {">"} INCIDENT_COMMAND // REAL-TIME EVENT MANAGEMENT
          </p>
        </div>
        {canWrite && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 border border-warning/20 bg-warning/5 px-4 py-2 text-[10px] font-mono text-warning hover:bg-warning/10 tracking-wider transition-colors"
          >
            <Plus className="h-3 w-3" /> CREATE_INCIDENT
          </button>
        )}
      </div>

      {/* ===== ROW 1: Stats Overview + Severity Grid ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <IncidentStatsOverview data={data} />
        <IncidentSeverityGrid data={data} />
      </div>

      {/* ===== ROW 2: Type Chart + Severity Trend ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <IncidentTypeChart data={data} />
        <IncidentSeverityTrend data={data} />
      </div>

      {/* ===== ROW 3: Timeline (full width) ===== */}
      <IncidentTimeline data={data} />

      {/* ===== Form Modal ===== */}
      <IncidentForm
        open={showForm}
        onClose={() => setShowForm(false)}
        onSuccess={refetch}
      />
    </div>
  );
}
