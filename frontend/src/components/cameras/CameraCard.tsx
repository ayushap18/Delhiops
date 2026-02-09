import { Camera, ExternalLink } from "lucide-react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import type { Camera as CameraType } from "@/lib/api";
import { cn } from "@/lib/utils";

export function CameraCard({ camera }: { camera: CameraType }) {
  const isOnline = camera.status === "online";

  return (
    <div className="card-3d bg-gray-950 border border-brand/10 p-4 relative overflow-hidden corner-borders group hover:border-brand/20 transition-colors">
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background: `linear-gradient(90deg, transparent, ${
            isOnline ? "rgba(0,255,65,0.2)" : "rgba(255,0,60,0.2)"
          }, transparent)`,
        }}
      />
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Camera className={cn("h-3.5 w-3.5", isOnline ? "text-brand" : "text-gray-600")} />
          <span className="text-[10px] font-mono font-medium text-gray-400 tracking-wider">
            CAM_{String(camera.id).padStart(3, "0")}
          </span>
        </div>
        <StatusBadge status={camera.status} />
      </div>
      <div className="aspect-video bg-gray-950 border border-brand/5 flex items-center justify-center mb-3">
        {isOnline ? (
          <div className="text-center">
            <Camera className="h-6 w-6 text-brand/30 mx-auto mb-1" />
            <p className="text-[9px] text-brand/50 font-mono tracking-wider">FEED ACTIVE</p>
            <div className="flex items-center justify-center gap-1 mt-1">
              <span className="h-1.5 w-1.5 bg-brand status-dot" />
              <span className="text-[8px] text-brand/40 font-mono">STREAMING</span>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <Camera className="h-6 w-6 text-gray-800 mx-auto mb-1" />
            <p className="text-[9px] text-gray-700 font-mono tracking-wider">
              {camera.status === "maintenance"
                ? "MAINTENANCE MODE"
                : "SIGNAL LOST"}
            </p>
          </div>
        )}
      </div>
      <div className="text-[9px] text-gray-600 font-mono space-y-1 tracking-wider">
        {camera.location && (
          <p>
            LOC: {camera.location.lat.toFixed(4)}, {camera.location.lng.toFixed(4)}
          </p>
        )}
        {camera.feed_url && (
          <a
            href={camera.feed_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-brand/60 hover:text-brand transition-colors"
          >
            <ExternalLink className="h-2.5 w-2.5" /> FEED_URL
          </a>
        )}
      </div>
    </div>
  );
}
