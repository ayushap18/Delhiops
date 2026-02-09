import { useMemo } from "react";
import { AnimatedNumber } from "@/components/shared/AnimatedNumber";
import type { TrafficData } from "@/lib/api";

interface TrafficSignalMonitorProps {
  data: TrafficData[];
}

// 25 major Delhi intersections with traffic signals
const DELHI_SIGNALS = [
  { id: "SIG-001", name: "ITO Junction", zone: "CENTRAL", lat: 28.6304, lng: 77.2505, priority: "critical" },
  { id: "SIG-002", name: "Kashmere Gate", zone: "NORTH", lat: 28.6667, lng: 77.2273, priority: "critical" },
  { id: "SIG-003", name: "AIIMS Flyover", zone: "S.DELHI", lat: 28.5672, lng: 77.2100, priority: "critical" },
  { id: "SIG-004", name: "Moolchand", zone: "S.DELHI", lat: 28.5713, lng: 77.2378, priority: "high" },
  { id: "SIG-005", name: "Ashram Chowk", zone: "S.DELHI", lat: 28.5697, lng: 77.2586, priority: "critical" },
  { id: "SIG-006", name: "Rajouri Garden", zone: "W.DELHI", lat: 28.6492, lng: 77.1224, priority: "high" },
  { id: "SIG-007", name: "Dhaula Kuan", zone: "SW.DELHI", lat: 28.5921, lng: 77.1562, priority: "critical" },
  { id: "SIG-008", name: "Pragati Maidan", zone: "CENTRAL", lat: 28.6238, lng: 77.2467, priority: "high" },
  { id: "SIG-009", name: "Nehru Place", zone: "SE.DELHI", lat: 28.5491, lng: 77.2533, priority: "high" },
  { id: "SIG-010", name: "Connaught Place", zone: "N.DELHI", lat: 28.6315, lng: 77.2167, priority: "critical" },
  { id: "SIG-011", name: "Lajpat Nagar", zone: "S.DELHI", lat: 28.5700, lng: 77.2400, priority: "medium" },
  { id: "SIG-012", name: "Anand Vihar", zone: "E.DELHI", lat: 28.6469, lng: 77.3161, priority: "high" },
  { id: "SIG-013", name: "Dwarka Sec-21", zone: "SW.DELHI", lat: 28.5535, lng: 77.0588, priority: "medium" },
  { id: "SIG-014", name: "Sarai Kale Khan", zone: "SE.DELHI", lat: 28.5895, lng: 77.2568, priority: "critical" },
  { id: "SIG-015", name: "Peeragarhi", zone: "NW.DELHI", lat: 28.6769, lng: 77.0939, priority: "high" },
  { id: "SIG-016", name: "Mundka", zone: "W.DELHI", lat: 28.6835, lng: 77.0320, priority: "medium" },
  { id: "SIG-017", name: "Ber Sarai", zone: "S.DELHI", lat: 28.5397, lng: 77.1856, priority: "medium" },
  { id: "SIG-018", name: "GTB Nagar", zone: "N.DELHI", lat: 28.6981, lng: 77.2100, priority: "medium" },
  { id: "SIG-019", name: "Saket", zone: "S.DELHI", lat: 28.5244, lng: 77.2090, priority: "high" },
  { id: "SIG-020", name: "Mayur Vihar", zone: "E.DELHI", lat: 28.5921, lng: 77.2963, priority: "medium" },
  { id: "SIG-021", name: "Jahangirpuri", zone: "N.DELHI", lat: 28.7329, lng: 77.1711, priority: "medium" },
  { id: "SIG-022", name: "Naraina", zone: "W.DELHI", lat: 28.6295, lng: 77.1442, priority: "medium" },
  { id: "SIG-023", name: "Badarpur", zone: "SE.DELHI", lat: 28.5072, lng: 77.3029, priority: "high" },
  { id: "SIG-024", name: "Mehrauli", zone: "S.DELHI", lat: 28.5245, lng: 77.1855, priority: "medium" },
  { id: "SIG-025", name: "Wazirabad", zone: "N.DELHI", lat: 28.7146, lng: 77.2299, priority: "high" },
] as const;

type SignalPhase = "green" | "yellow" | "red";
type SignalHealth = "operational" | "fault" | "offline" | "degraded";

function getSignalHealth(seed: number, avgCongestion: number): SignalHealth {
  // Simulate signal health: higher congestion = more faults
  const faultThreshold = 85 - avgCongestion * 0.3;
  const val = ((seed * 37 + 13) % 100);
  if (val > 95) return "offline";
  if (val > faultThreshold) return "fault";
  if (val > faultThreshold - 8) return "degraded";
  return "operational";
}

function getSignalPhase(seed: number): SignalPhase {
  const val = ((seed * 53 + 7) % 100);
  if (val < 45) return "green";
  if (val < 60) return "yellow";
  return "red";
}

function getCycleTime(priority: string, congestion: number): number {
  const base = priority === "critical" ? 120 : priority === "high" ? 90 : 60;
  return base + Math.round(congestion * 0.3);
}

function getTrafficImpact(health: SignalHealth, congestion: number): string {
  if (health === "offline") return "SEVERE BACKUP";
  if (health === "fault") return congestion > 60 ? "HEAVY DELAY" : "CAUSING DELAY";
  if (health === "degraded") return "MINOR DELAY";
  return congestion > 70 ? "CONGESTED" : congestion > 40 ? "MODERATE" : "NORMAL FLOW";
}

const HEALTH_COLORS: Record<SignalHealth, string> = {
  operational: "#00ff41",
  degraded: "#ffb800",
  fault: "#ff6600",
  offline: "#ff003c",
};

const HEALTH_LABELS: Record<SignalHealth, string> = {
  operational: "OK",
  degraded: "DEGR",
  fault: "FAULT",
  offline: "DOWN",
};

const PRIORITY_COLORS: Record<string, string> = {
  critical: "#ff003c",
  high: "#ff6600",
  medium: "#ffb800",
};

export function TrafficSignalMonitor({ data }: TrafficSignalMonitorProps) {
  const signalData = useMemo(() => {
    const avgCongestion = data.length
      ? data.reduce((s, d) => s + d.congestion_level, 0) / data.length
      : 40;

    return DELHI_SIGNALS.map((signal, i) => {
      const health = getSignalHealth(i, avgCongestion);
      const phase = health === "offline" ? "red" : health === "fault" ? "red" : getSignalPhase(i);
      const localCongestion = Math.max(5, Math.min(95, Math.round(
        avgCongestion + ((i * 19 + 11) % 40) - 20
      )));
      const cycleTime = getCycleTime(signal.priority, localCongestion);
      const greenTime = Math.round(cycleTime * (health === "fault" ? 0.25 : 0.45));
      const impact = getTrafficImpact(health, localCongestion);

      return {
        ...signal,
        health,
        phase,
        congestion: localCongestion,
        cycleTime,
        greenTime,
        impact,
        healthColor: HEALTH_COLORS[health],
      };
    });
  }, [data]);

  const stats = useMemo(() => {
    const operational = signalData.filter((s) => s.health === "operational").length;
    const faulted = signalData.filter((s) => s.health === "fault").length;
    const offline = signalData.filter((s) => s.health === "offline").length;
    const degraded = signalData.filter((s) => s.health === "degraded").length;
    const causingDelay = signalData.filter((s) =>
      s.health === "fault" || s.health === "offline"
    );
    return { operational, faulted, offline, degraded, causingDelay, total: DELHI_SIGNALS.length };
  }, [signalData]);

  return (
    <div className="bg-black border border-info/10 p-5 corner-borders relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          background: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,212,255,0.01) 3px, rgba(0,212,255,0.01) 6px)",
        }}
      />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-info/30 to-transparent" />

      {/* Header */}
      <div className="flex items-center justify-between mb-3 relative z-10">
        <div>
          <h3 className="text-[10px] font-mono text-info tracking-wider">
            {">"} SIGNAL_CONTROL // TRAFFIC LIGHT MONITOR
          </h3>
          <p className="text-[7px] font-mono text-gray-700 tracking-wider">
            DELHI NCR — {DELHI_SIGNALS.length} SIGNAL INTERSECTIONS
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-1.5 py-0.5 border border-brand/20 bg-brand/5">
            <div className="w-1.5 h-1.5 bg-brand rounded-full status-dot" />
            <span className="text-[7px] font-mono text-brand tracking-wider">
              {stats.operational} ACTIVE
            </span>
          </div>
          {(stats.faulted + stats.offline) > 0 && (
            <div className="flex items-center gap-1 px-1.5 py-0.5 border border-danger/20 bg-danger/5">
              <div className="w-1.5 h-1.5 bg-danger rounded-full status-dot" />
              <span className="text-[7px] font-mono text-danger tracking-wider">
                {stats.faulted + stats.offline} ALERT
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Signal health summary strip */}
      <div className="grid grid-cols-4 gap-1.5 mb-3 relative z-10">
        {[
          { label: "OPERATIONAL", value: stats.operational, color: "#00ff41" },
          { label: "DEGRADED", value: stats.degraded, color: "#ffb800" },
          { label: "FAULT", value: stats.faulted, color: "#ff6600" },
          { label: "OFFLINE", value: stats.offline, color: "#ff003c" },
        ].map((s) => (
          <div key={s.label} className="border px-2 py-2 text-center"
            style={{ borderColor: s.color + "20", backgroundColor: s.color + "05" }}>
            <p className="text-[14px] font-bold font-[Orbitron]"
              style={{ color: s.color, textShadow: `0 0 8px ${s.color}30` }}>
              <AnimatedNumber value={s.value} />
            </p>
            <p className="text-[5px] font-mono text-gray-600 tracking-widest">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Fault alert banner */}
      {stats.causingDelay.length > 0 && (
        <div className="relative z-10 mb-3 border border-danger/15 bg-danger/5 px-3 py-2">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-2 h-2 bg-danger rounded-full status-dot" />
            <span className="text-[8px] font-mono text-danger tracking-widest font-bold">
              SIGNAL DISRUPTION — TRAFFIC IMPACT DETECTED
            </span>
          </div>
          <div className="space-y-1">
            {stats.causingDelay.slice(0, 4).map((sig) => (
              <div key={sig.id} className="flex items-center gap-2 pl-4">
                <span className="text-[7px] font-mono text-danger/60">{sig.id}</span>
                <span className="text-[7px] font-mono text-gray-300 tracking-wider">{sig.name.toUpperCase()}</span>
                <span className="text-[6px] font-mono text-gray-700">|</span>
                <span className="text-[7px] font-mono tracking-wider"
                  style={{ color: sig.health === "offline" ? "#ff003c" : "#ff6600" }}>
                  {sig.health === "offline" ? "SIGNAL DOWN" : "SIGNAL FAULT"}
                </span>
                <span className="text-[6px] font-mono text-gray-700">→</span>
                <span className="text-[7px] font-mono text-danger tracking-wider">{sig.impact}</span>
              </div>
            ))}
            {stats.causingDelay.length > 4 && (
              <span className="text-[6px] font-mono text-gray-600 pl-4">
                +{stats.causingDelay.length - 4} MORE DISRUPTIONS
              </span>
            )}
          </div>
        </div>
      )}

      {/* Signal grid */}
      <div className="relative z-10 max-h-[420px] overflow-y-auto pr-1 space-y-0.5">
        {signalData.map((signal, idx) => (
          <div key={signal.id}
            className="flex items-center gap-2.5 px-2 py-1.5 hover:bg-info/5 transition-colors animate-fade-up group"
            style={{ animationDelay: `${idx * 25}ms` }}>

            {/* Traffic light icon */}
            <div className="shrink-0 flex flex-col items-center gap-px">
              <svg width="14" height="34" viewBox="0 0 14 34">
                {/* Housing */}
                <rect x="1" y="0" width="12" height="30" rx="2" fill="#0a0a0a" stroke="#222" strokeWidth="0.5" />
                {/* Pole */}
                <rect x="5.5" y="30" width="3" height="4" fill="#111" />
                {/* Red light */}
                <circle cx="7" cy="6" r="3.2"
                  fill={signal.phase === "red" ? "#ff003c" : "#1a0008"}
                  style={{
                    filter: signal.phase === "red" ? "drop-shadow(0 0 3px #ff003c)" : "none",
                    transition: "fill 0.3s ease",
                  }}
                />
                {/* Yellow light */}
                <circle cx="7" cy="15" r="3.2"
                  fill={signal.phase === "yellow" ? "#ffb800" : "#1a1400"}
                  style={{
                    filter: signal.phase === "yellow" ? "drop-shadow(0 0 3px #ffb800)" : "none",
                    transition: "fill 0.3s ease",
                  }}
                />
                {/* Green light */}
                <circle cx="7" cy="24" r="3.2"
                  fill={signal.phase === "green" ? "#00ff41" : "#001a08"}
                  style={{
                    filter: signal.phase === "green" ? "drop-shadow(0 0 3px #00ff41)" : "none",
                    transition: "fill 0.3s ease",
                  }}
                />
                {/* Fault X overlay */}
                {(signal.health === "fault" || signal.health === "offline") && (
                  <g stroke="#ff003c" strokeWidth="1.5" opacity="0.8">
                    <line x1="2" y1="2" x2="12" y2="28" />
                    <line x1="12" y1="2" x2="2" y2="28" />
                  </g>
                )}
              </svg>
            </div>

            {/* Signal info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[7px] font-mono text-info/40">{signal.id}</span>
                  <span className="text-[9px] font-mono font-bold text-gray-200 tracking-wider truncate">
                    {signal.name.toUpperCase()}
                  </span>
                  <span className="text-[6px] font-mono text-gray-600">{signal.zone}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Priority tag */}
                  <span className="text-[5px] font-mono px-1 py-px border tracking-widest"
                    style={{ color: PRIORITY_COLORS[signal.priority], borderColor: PRIORITY_COLORS[signal.priority] + "30" }}>
                    {signal.priority.toUpperCase()}
                  </span>
                  {/* Health badge */}
                  <span className="text-[6px] font-mono px-1.5 py-0.5 border tracking-wider font-bold"
                    style={{
                      color: signal.healthColor,
                      borderColor: signal.healthColor + "30",
                      backgroundColor: signal.healthColor + "08",
                    }}>
                    {HEALTH_LABELS[signal.health]}
                  </span>
                </div>
              </div>

              {/* Signal timing bar */}
              <div className="flex items-center gap-2 mb-0.5">
                <div className="flex-1 h-1 bg-gray-900 overflow-hidden flex">
                  {/* Green phase */}
                  <div className="h-full bg-[#00ff41]"
                    style={{
                      width: `${(signal.greenTime / signal.cycleTime) * 100}%`,
                      opacity: signal.health === "offline" ? 0.1 : 0.7,
                      boxShadow: signal.health === "operational" ? "0 0 3px #00ff4140" : "none",
                    }}
                  />
                  {/* Yellow phase */}
                  <div className="h-full bg-[#ffb800]"
                    style={{
                      width: "8%",
                      opacity: signal.health === "offline" ? 0.1 : 0.6,
                    }}
                  />
                  {/* Red phase */}
                  <div className="h-full bg-[#ff003c]"
                    style={{
                      width: `${100 - (signal.greenTime / signal.cycleTime) * 100 - 8}%`,
                      opacity: signal.health === "offline" ? 0.1 : 0.5,
                    }}
                  />
                </div>
                <span className="text-[7px] font-mono text-gray-500 tabular-nums w-10 text-right">
                  {signal.cycleTime}s
                </span>
              </div>

              {/* Bottom info */}
              <div className="flex items-center gap-2">
                <span className="text-[6px] font-mono text-gray-500">
                  GREEN {signal.greenTime}s
                </span>
                <span className="text-[5px] font-mono text-gray-700">|</span>
                <span className="text-[6px] font-mono text-gray-500">
                  CONG {signal.congestion}%
                </span>
                <span className="text-[5px] font-mono text-gray-700">|</span>
                <span className="text-[6px] font-mono tracking-wider font-bold"
                  style={{
                    color: signal.impact.includes("SEVERE") || signal.impact.includes("HEAVY")
                      ? "#ff003c"
                      : signal.impact.includes("DELAY") || signal.impact.includes("CONGESTED")
                        ? "#ff6600"
                        : signal.impact === "MODERATE"
                          ? "#ffb800"
                          : "#00ff41",
                  }}>
                  {signal.impact}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="relative z-10 mt-2 pt-2 border-t border-info/5 flex items-center justify-between">
        <span className="text-[7px] font-mono text-gray-700 tracking-wider">
          {stats.total} SIGNALS MONITORED
        </span>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <svg width="6" height="6"><circle cx="3" cy="3" r="2.5" fill="#00ff41" /></svg>
            <span className="text-[5px] font-mono text-gray-600 tracking-wider">GREEN</span>
          </div>
          <div className="flex items-center gap-1">
            <svg width="6" height="6"><circle cx="3" cy="3" r="2.5" fill="#ffb800" /></svg>
            <span className="text-[5px] font-mono text-gray-600 tracking-wider">YELLOW</span>
          </div>
          <div className="flex items-center gap-1">
            <svg width="6" height="6"><circle cx="3" cy="3" r="2.5" fill="#ff003c" /></svg>
            <span className="text-[5px] font-mono text-gray-600 tracking-wider">RED</span>
          </div>
          <span className="text-[5px] font-mono text-gray-700">|</span>
          <div className="flex items-center gap-1">
            <span className="text-[5px] font-mono text-gray-600 tracking-wider">
              UPD {new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
