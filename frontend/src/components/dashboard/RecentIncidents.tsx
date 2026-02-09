import { useEffect, useState } from "react";
import { Clock, Target } from "lucide-react";
import api, { type Incident } from "@/lib/api";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatDate, getSeverityColor, cn } from "@/lib/utils";

export function RecentIncidents() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/incidents", {
        params: { limit: 5, sort_by: "timestamp", sort_order: "desc" },
      })
      .then((res) => setIncidents(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-gray-950 border border-brand/10 p-4 relative corner-borders card-hover overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand/20 to-transparent" />

      <h2 className="flex items-center gap-2 text-xs font-mono text-brand tracking-wider mb-4">
        <Target className="h-3.5 w-3.5" />
        {">"} RECENT_INCIDENTS
        <span className="ml-auto text-[9px] text-gray-600 tabular-nums">
          {incidents.length} RECORDS
        </span>
      </h2>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 skeleton border border-brand/5" />
          ))}
        </div>
      ) : incidents.length === 0 ? (
        <p className="text-[10px] text-gray-600 py-4 font-mono text-center tracking-wider">
          NO INCIDENTS DETECTED
        </p>
      ) : (
        <ul className="space-y-1.5" role="list" aria-label="Recent incidents">
          {incidents.map((inc, i) => (
            <li
              key={inc.id}
              className="flex items-start gap-3 p-3 bg-gray-900/30 border border-brand/5 hover:border-brand/15 hover:bg-gray-900/50 transition-all duration-200 animate-fade-up group row-glow"
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <div
                className={cn(
                  "mt-1 h-2.5 w-2.5 rounded-full shrink-0 transition-transform group-hover:scale-125",
                  inc.severity === "critical"
                    ? "bg-danger status-dot text-danger"
                    : inc.severity === "high"
                    ? "bg-warning status-dot text-warning"
                    : "bg-brand"
                )}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-mono font-medium text-gray-200 truncate tracking-wide">
                    {inc.type?.toUpperCase()}
                  </p>
                  <StatusBadge status={inc.status} />
                </div>
                <p className="mt-0.5 text-[10px] text-gray-600 truncate font-mono">
                  {inc.description}
                </p>
                <div className="mt-1 flex items-center gap-2 text-[9px] font-mono">
                  <span className={cn("tracking-wider", getSeverityColor(inc.severity))}>
                    [{inc.severity?.toUpperCase()}]
                  </span>
                  <span className="text-gray-700">|</span>
                  <span className="flex items-center gap-1 text-gray-600">
                    <Clock className="h-2.5 w-2.5" />
                    {formatDate(inc.timestamp)}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 h-px shimmer-line" />
    </div>
  );
}
