import { useMemo } from "react";
import type { Camera as CameraType } from "@/lib/api";
import { StatusBadge } from "@/components/shared/StatusBadge";

interface TrafficCameraGridProps {
  cameras: CameraType[];
}

function getAreaName(lat: number, lng: number): string {
  if (lat >= 28.68 && lng < 77.18) return "NW DELHI";
  if (lat >= 28.68 && lng >= 77.26) return "NE DELHI";
  if (lat >= 28.68) return "N DELHI";
  if (lat >= 28.62 && lat < 28.68 && lng >= 77.18 && lng < 77.28) return "CENTRAL";
  if (lat >= 28.60 && lng < 77.14) return "W DELHI";
  if (lat >= 28.60 && lng >= 77.28) return "E DELHI";
  if (lat >= 28.58 && lat < 28.64 && lng >= 77.18 && lng < 77.26) return "NEW DELHI";
  if (lat < 28.58 && lng < 77.16) return "SW DELHI";
  if (lat < 28.58 && lng >= 77.26) return "SE DELHI";
  if (lat < 28.58) return "S DELHI";
  return "DELHI NCR";
}

export function TrafficCameraGrid({ cameras }: TrafficCameraGridProps) {
  const stats = useMemo(() => {
    const online = cameras.filter((c) => c.status === "online").length;
    const offline = cameras.filter((c) => c.status === "offline").length;
    const maintenance = cameras.filter((c) => c.status === "maintenance").length;
    return { online, offline, maintenance };
  }, [cameras]);

  const displayCameras = cameras.slice(0, 8);

  return (
    <div className="bg-black border border-info/10 p-5 corner-borders relative overflow-hidden">
      {/* Scanline effect */}
      <div className="absolute inset-0 pointer-events-none opacity-15"
        style={{
          background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,212,255,0.02) 2px, rgba(0,212,255,0.02) 4px)",
        }}
      />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-info/30 to-transparent" />

      {/* Header */}
      <div className="flex items-center justify-between mb-3 relative z-10">
        <div>
          <h3 className="text-[10px] font-mono text-info tracking-wider">
            {">"} CCTV_GRID // SURVEILLANCE NETWORK
          </h3>
          <p className="text-[7px] font-mono text-gray-700 tracking-wider">
            LIVE CAMERA FEEDS — DELHI TRAFFIC MONITORING
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-1.5 py-0.5 border border-brand/20 bg-brand/5">
            <div className="w-1.5 h-1.5 bg-brand rounded-full status-dot" />
            <span className="text-[7px] font-mono text-brand tracking-wider">{stats.online} ONLINE</span>
          </div>
          {stats.offline > 0 && (
            <div className="flex items-center gap-1 px-1.5 py-0.5 border border-danger/20 bg-danger/5">
              <span className="text-[7px] font-mono text-danger tracking-wider">{stats.offline} DOWN</span>
            </div>
          )}
        </div>
      </div>

      {/* Camera grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 relative z-10">
        {displayCameras.map((camera, i) => {
          const isOnline = camera.status === "online";
          const area = camera.location ? getAreaName(camera.location.lat, camera.location.lng) : "UNKNOWN";
          const statusColor = isOnline ? "#00ff41" : camera.status === "maintenance" ? "#ffb800" : "#ff003c";

          return (
            <div key={camera.id}
              className="border relative overflow-hidden group animate-fade-up"
              style={{
                borderColor: statusColor + "15",
                backgroundColor: isOnline ? "#00ff4103" : "#ff003c03",
                animationDelay: `${i * 50}ms`,
              }}>
              {/* Top bar */}
              <div className="absolute top-0 left-0 right-0 h-px" style={{ backgroundColor: statusColor + "30" }} />

              {/* Feed area */}
              <div className="aspect-video flex items-center justify-center relative"
                style={{ backgroundColor: "#020502" }}>
                {isOnline ? (
                  <>
                    {/* Simulated feed with scan lines */}
                    <div className="absolute inset-0 opacity-20"
                      style={{
                        background: `
                          radial-gradient(ellipse at 50% 40%, rgba(0,255,65,0.06) 0%, transparent 60%),
                          repeating-linear-gradient(0deg, transparent 0px, transparent 3px, rgba(0,255,65,0.01) 3px, rgba(0,255,65,0.01) 6px)
                        `,
                      }}
                    />
                    <div className="text-center relative z-10">
                      <div className="flex items-center justify-center gap-1 mb-0.5">
                        <div className="w-1 h-1 bg-brand rounded-full status-dot" />
                        <span className="text-[6px] font-mono text-brand/60 tracking-widest">REC</span>
                      </div>
                      <p className="text-[7px] font-mono text-brand/40 tracking-wider">FEED ACTIVE</p>
                    </div>
                    {/* Timestamp overlay */}
                    <div className="absolute bottom-1 right-1.5">
                      <span className="text-[5px] font-mono text-brand/30">
                        {new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="text-center">
                    <div className="w-4 h-4 mx-auto mb-1 border border-gray-800 flex items-center justify-center">
                      <span className="text-[8px] text-gray-700">X</span>
                    </div>
                    <p className="text-[6px] font-mono text-gray-700 tracking-wider">
                      {camera.status === "maintenance" ? "MAINT" : "OFFLINE"}
                    </p>
                  </div>
                )}
              </div>

              {/* Camera info bar */}
              <div className="px-1.5 py-1 flex items-center justify-between"
                style={{ backgroundColor: statusColor + "06" }}>
                <div className="flex items-center gap-1">
                  <span className="text-[7px] font-mono text-gray-300 tracking-wider">
                    CAM_{String(camera.id).padStart(3, "0")}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[5.5px] font-mono text-gray-600">{area}</span>
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusColor }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      {cameras.length > 8 && (
        <div className="mt-2 pt-2 border-t border-info/5 relative z-10 flex items-center justify-between">
          <span className="text-[7px] font-mono text-gray-700 tracking-wider">
            SHOWING 8 / {cameras.length} CAMERAS
          </span>
          <StatusBadge status="online" />
        </div>
      )}
    </div>
  );
}
