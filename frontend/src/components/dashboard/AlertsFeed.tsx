import { useState, useCallback } from "react";
import { Terminal, X, Zap } from "lucide-react";
import { useSocketEvent } from "@/hooks/useSocket";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Alert {
  id: string;
  type: string;
  message: string;
  severity: "info" | "warning" | "critical";
  timestamp: string;
}

export function AlertsFeed() {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  const handleAqiAlert = useCallback((data: unknown) => {
    const d = data as Record<string, unknown>;
    setAlerts((prev) =>
      [
        {
          id: `aqi-${Date.now()}`,
          type: "AQI_ALERT",
          message: `AQI level reached ${d.aqi} at location`,
          severity: "critical" as const,
          timestamp: new Date().toISOString(),
        },
        ...prev,
      ].slice(0, 20)
    );
  }, []);

  const handleIncident = useCallback((data: unknown) => {
    const d = data as Record<string, unknown>;
    setAlerts((prev) =>
      [
        {
          id: `inc-${Date.now()}`,
          type: "INCIDENT",
          message: `${d.type}: ${d.description || "No description"}`,
          severity: (d.severity === "critical" ? "critical" : "warning") as "critical" | "warning",
          timestamp: new Date().toISOString(),
        },
        ...prev,
      ].slice(0, 20)
    );
  }, []);

  const handleCrime = useCallback((data: unknown) => {
    const d = data as Record<string, unknown>;
    setAlerts((prev) =>
      [
        {
          id: `crime-${Date.now()}`,
          type: "CRIME_RPT",
          message: `${d.type} reported - severity: ${d.severity}`,
          severity: "warning" as const,
          timestamp: new Date().toISOString(),
        },
        ...prev,
      ].slice(0, 20)
    );
  }, []);

  useSocketEvent("aqi:alert", handleAqiAlert);
  useSocketEvent("incident:new", handleIncident);
  useSocketEvent("crime:report", handleCrime);

  const dismiss = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div className="bg-gray-950 border border-brand/10 p-4 relative overflow-hidden corner-borders card-hover">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand/20 to-transparent" />

      <h2 className="flex items-center gap-2 text-xs font-mono text-brand tracking-wider mb-4">
        <Zap className="h-3.5 w-3.5" />
        {">"} LIVE_FEED
        {alerts.length > 0 && (
          <span className="ml-auto rounded bg-danger/20 border border-danger/30 px-1.5 py-0.5 text-[9px] font-mono text-danger">
            {alerts.length} ACTIVE
          </span>
        )}
      </h2>

      <div
        className="space-y-1.5 max-h-80 overflow-y-auto"
        role="log"
        aria-live="polite"
        aria-label="Live alerts feed"
      >
        {alerts.length === 0 ? (
          <div className="py-8 text-center">
            <Terminal className="h-6 w-6 text-gray-700 mx-auto mb-2" />
            <p className="text-[10px] text-gray-600 font-mono tracking-wider">
              AWAITING INCOMING SIGNALS...
            </p>
            <p className="text-[9px] text-gray-700 font-mono mt-1 typing-cursor">
              Monitoring active channels
            </p>
          </div>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.id}
              className={cn(
                "flex items-start gap-2 p-2.5 border font-mono text-[10px] animate-fade-up",
                alert.severity === "critical"
                  ? "bg-danger/5 border-danger/20"
                  : alert.severity === "warning"
                  ? "bg-warning/5 border-warning/20"
                  : "bg-brand/5 border-brand/20"
              )}
            >
              <span
                className={cn(
                  "shrink-0 mt-0.5 h-1.5 w-1.5 rounded-full status-dot",
                  alert.severity === "critical"
                    ? "bg-danger text-danger"
                    : alert.severity === "warning"
                    ? "bg-warning text-warning"
                    : "bg-brand text-brand"
                )}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "tracking-wider font-bold",
                      alert.severity === "critical"
                        ? "text-danger"
                        : alert.severity === "warning"
                        ? "text-warning"
                        : "text-brand"
                    )}
                  >
                    [{alert.type}]
                  </span>
                  <span className="text-gray-600 text-[9px]">
                    {formatDate(alert.timestamp)}
                  </span>
                </div>
                <p className="text-gray-400 truncate mt-0.5">
                  {alert.message}
                </p>
              </div>
              <button
                onClick={() => dismiss(alert.id)}
                className="text-gray-700 hover:text-gray-400 shrink-0"
                aria-label={`Dismiss ${alert.type} alert`}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
