import { useState, useMemo, useEffect } from "react";
import { Plus, ShieldAlert, AlertTriangle } from "lucide-react";
import { useApi } from "@/hooks/useApi";
import { useAuth } from "@/hooks/useAuth";
import type { CrimeReport } from "@/lib/api";
import { CrimeHotspotMap } from "@/components/crime/CrimeHotspotMap";
import { CrimeStatsOverview } from "@/components/crime/CrimeStatsOverview";
import { CrimeAreaRanking } from "@/components/crime/CrimeAreaRanking";
import { CrimeLiveFeed } from "@/components/crime/CrimeLiveFeed";
import { CrimeByTypeChart, CrimeBySeverityChart } from "@/components/crime/CrimeChart";
import { CrimeForm } from "@/components/crime/CrimeForm";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

export default function CrimePage() {
  const { canWrite } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const { data, loading, refetch } = useApi<CrimeReport>("/crime", {
    page: 1,
    limit: 50,
    params: { sort_by: "timestamp", sort_order: "desc" },
  });

  const activeCases = useMemo(() => {
    return data.filter((c) => c.status === "reported" || c.status === "investigating").length;
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
            <ShieldAlert className="h-5 w-5 text-danger drop-shadow-[0_0_6px_rgba(255,0,60,0.5)]" />
            <h1 className="text-lg font-bold text-danger font-[Orbitron] tracking-widest text-glow-danger">
              CRIME DASHBOARD
            </h1>
            {activeCases > 0 && (
              <div className="flex items-center gap-1.5 ml-3 px-2 py-0.5 border border-danger/30 bg-danger/5">
                <AlertTriangle className="h-3 w-3 text-danger" />
                <span className="text-[9px] font-mono tracking-wider text-danger">
                  {activeCases} ACTIVE
                </span>
              </div>
            )}
          </div>
          <p className="text-[10px] text-gray-600 font-mono tracking-[0.2em]">
            {">"} CRIME_INTELLIGENCE // DELHI NCR REAL-TIME ANALYSIS
          </p>
        </div>
        {canWrite && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 border border-danger/20 bg-danger/5 px-4 py-2 text-[10px] font-mono text-danger hover:bg-danger/10 tracking-wider transition-colors"
          >
            <Plus className="h-3 w-3" /> REPORT_CRIME
          </button>
        )}
      </div>

      {/* ===== ROW 1: Stats + Hotspot Map ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CrimeStatsOverview data={data} />
        <CrimeHotspotMap data={data} />
      </div>

      {/* ===== ROW 2: Crime Types + Severity ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CrimeByTypeChart data={data} />
        <CrimeBySeverityChart data={data} />
      </div>

      {/* ===== ROW 3: Area Ranking + Live Feed ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CrimeAreaRanking data={data} />
        <CrimeLiveFeed data={data} />
      </div>

      {/* ===== Form Modal ===== */}
      <CrimeForm
        open={showForm}
        onClose={() => setShowForm(false)}
        onSuccess={refetch}
      />
    </div>
  );
}
