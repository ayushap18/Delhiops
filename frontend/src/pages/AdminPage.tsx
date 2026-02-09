import { useState, useEffect } from "react";
import {
  Activity,
  Database,
  HardDrive,
  RefreshCw,
  Trash2,
  Zap,
  Terminal,
} from "lucide-react";
import api from "@/lib/api";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

export default function AdminPage() {
  const [metrics, setMetrics] = useState<Record<string, unknown> | null>(null);
  const [cacheMetrics, setCacheMetrics] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    setLoading(true);
    try {
      const [m, c] = await Promise.all([
        api.get("/system/metrics"),
        api.get("/system/cache/metrics"),
      ]);
      setMetrics(m.data.data);
      setCacheMetrics(c.data.data);
    } catch (err) {
      console.error("Failed to fetch system metrics:", err);
    } finally {
      setLoading(false);
    }
  }

  async function doAction(action: string, endpoint: string, method = "post") {
    setActionLoading(action);
    try {
      if (method === "post") {
        await api.post(endpoint);
      }
      await fetchAll();
    } catch (err) {
      console.error(`Action ${action} failed:`, err);
    } finally {
      setActionLoading("");
    }
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Terminal className="h-4 w-4 text-brand" />
            <h1 className="text-lg font-bold text-brand font-[Orbitron] tracking-widest text-glow">
              SYSTEM ADMIN
            </h1>
          </div>
          <p className="text-[10px] text-gray-600 font-mono tracking-[0.2em]">
            {">"} SYS_CONTROL // METRICS & CACHE MANAGEMENT
          </p>
        </div>
        <button
          onClick={fetchAll}
          className="flex items-center gap-2 border border-brand/20 bg-brand/5 px-4 py-2 text-[10px] font-mono text-brand hover:bg-brand/10 tracking-wider transition-colors"
        >
          <RefreshCw className="h-3 w-3" /> REFRESH
        </button>
      </div>

      {/* System Metrics */}
      <div className="bg-gray-950 border border-brand/10 p-5 corner-borders relative">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand/20 to-transparent" />
        <h2 className="flex items-center gap-2 text-xs font-mono text-brand tracking-wider mb-4">
          <Activity className="h-3.5 w-3.5" />
          {">"} SYSTEM_METRICS
        </h2>
        <pre className="text-[10px] text-brand/70 font-mono bg-gray-950 border border-brand/5 p-4 overflow-auto max-h-64">
          {JSON.stringify(metrics, null, 2)}
        </pre>
      </div>

      {/* Cache Management */}
      <div className="bg-gray-950 border border-brand/10 p-5 corner-borders relative">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand/20 to-transparent" />
        <h2 className="flex items-center gap-2 text-xs font-mono text-brand tracking-wider mb-4">
          <HardDrive className="h-3.5 w-3.5" />
          {">"} CACHE_MANAGEMENT
        </h2>
        <div className="flex gap-3 mb-4">
          <button
            onClick={() => doAction("warm", "/system/cache/warm")}
            disabled={actionLoading === "warm"}
            className="flex items-center gap-2 border border-brand/20 bg-brand/5 px-4 py-2 text-[10px] font-mono text-brand hover:bg-brand/10 disabled:opacity-50 tracking-wider transition-colors"
          >
            <Zap className="h-3 w-3" />
            {actionLoading === "warm" ? "WARMING..." : "WARM_CACHE"}
          </button>
          <button
            onClick={() => doAction("bust", "/system/cache/bust", "post")}
            disabled={actionLoading === "bust"}
            className="flex items-center gap-2 border border-danger/20 bg-danger/5 px-4 py-2 text-[10px] font-mono text-danger hover:bg-danger/10 disabled:opacity-50 tracking-wider transition-colors"
          >
            <Trash2 className="h-3 w-3" />
            {actionLoading === "bust" ? "BUSTING..." : "BUST_ALL"}
          </button>
        </div>
        <pre className="text-[10px] text-brand/70 font-mono bg-gray-950 border border-brand/5 p-4 overflow-auto max-h-64">
          {JSON.stringify(cacheMetrics, null, 2)}
        </pre>
      </div>

      {/* Database Admin */}
      <div className="bg-gray-950 border border-brand/10 p-5 corner-borders relative">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand/20 to-transparent" />
        <h2 className="flex items-center gap-2 text-xs font-mono text-info tracking-wider mb-4">
          <Database className="h-3.5 w-3.5" />
          {">"} DATABASE_OPS
        </h2>
        <div className="flex gap-3">
          <button
            onClick={() => doAction("refresh-views", "/system/db/views/refresh")}
            disabled={!!actionLoading}
            className="flex items-center gap-2 border border-info/20 bg-info/5 px-4 py-2 text-[10px] font-mono text-info hover:bg-info/10 disabled:opacity-50 tracking-wider transition-colors"
          >
            <RefreshCw className="h-3 w-3" />
            {actionLoading === "refresh-views"
              ? "REFRESHING..."
              : "REFRESH_VIEWS"}
          </button>
          <button
            onClick={() => doAction("retention", "/system/db/retention/run")}
            disabled={!!actionLoading}
            className="flex items-center gap-2 border border-warning/20 bg-warning/5 px-4 py-2 text-[10px] font-mono text-warning hover:bg-warning/10 disabled:opacity-50 tracking-wider transition-colors"
          >
            <Trash2 className="h-3 w-3" />
            {actionLoading === "retention"
              ? "RUNNING..."
              : "RUN_RETENTION"}
          </button>
        </div>
      </div>
    </div>
  );
}
