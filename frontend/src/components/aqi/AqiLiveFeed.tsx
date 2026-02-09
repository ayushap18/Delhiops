import { getAqiLevel } from "@/lib/utils";
import type { AqiReading } from "@/lib/api";

interface AqiLiveFeedProps {
  data: AqiReading[];
}

function getAqiColor(aqi: number): string {
  if (aqi <= 50) return "#00ff41";
  if (aqi <= 100) return "#ffb800";
  if (aqi <= 200) return "#ff6600";
  if (aqi <= 300) return "#ff003c";
  return "#990000";
}

function formatTime(timestamp: string): string {
  const d = new Date(timestamp);
  return d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatShortDate(timestamp: string): string {
  const d = new Date(timestamp);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
}

export function AqiLiveFeed({ data }: AqiLiveFeedProps) {
  const feedItems = data.slice(0, 15);

  return (
    <div className="bg-gray-950 border border-brand/10 p-5 corner-borders relative flex flex-col">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand/20 to-transparent" />

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[10px] font-mono text-brand tracking-wider">
          {">"} LIVE_FEED
        </h3>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 bg-brand rounded-full status-dot" />
          <span className="text-[8px] font-mono text-brand tracking-widest">
            LIVE
          </span>
        </div>
      </div>

      {/* Feed container */}
      <div className="flex-1 max-h-[340px] overflow-y-auto space-y-0.5 pr-1">
        {feedItems.length === 0 ? (
          <p className="text-[10px] font-mono text-gray-600 tracking-wider text-center py-8">
            AWAITING DATA STREAM...
          </p>
        ) : (
          feedItems.map((item, i) => {
            const color = getAqiColor(item.aqi);
            const level = getAqiLevel(item.aqi);
            const barWidth = Math.min((item.aqi / 500) * 100, 100);

            return (
              <div
                key={item.id}
                className="flex items-center gap-2 px-2 py-1.5 hover:bg-brand/5 transition-colors border-l-2 group"
                style={{
                  borderLeftColor: color + "60",
                  animationDelay: `${i * 50}ms`,
                }}
              >
                {/* Timestamp */}
                <div className="flex flex-col items-end shrink-0">
                  <span className="text-[8px] font-mono text-gray-600">
                    {formatShortDate(item.timestamp)}
                  </span>
                  <span className="text-[9px] font-mono text-gray-500">
                    {formatTime(item.timestamp)}
                  </span>
                </div>

                {/* Divider */}
                <div className="w-px h-6 bg-brand/10 shrink-0" />

                {/* AQI value */}
                <span
                  className="text-[11px] font-mono font-bold tabular-nums w-8 text-right shrink-0"
                  style={{ color }}
                >
                  {item.aqi}
                </span>

                {/* Mini bar */}
                <div className="flex-1 min-w-0">
                  <div className="w-full h-1.5 bg-gray-900 overflow-hidden">
                    <div
                      className="h-full transition-all duration-500"
                      style={{
                        width: `${barWidth}%`,
                        backgroundColor: color,
                        boxShadow: `0 0 4px ${color}60`,
                      }}
                    />
                  </div>
                </div>

                {/* Level label */}
                <span
                  className="text-[7px] font-mono tracking-wider w-14 text-right shrink-0"
                  style={{ color: color + "cc" }}
                >
                  {level.label.toUpperCase().replace(" ", "\u00A0")}
                </span>

                {/* Location */}
                <span className="text-[7px] font-mono text-gray-700 shrink-0 hidden xl:inline">
                  {item.location.lat.toFixed(2)}N
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="mt-2 pt-2 border-t border-brand/5 flex items-center justify-between">
        <span className="text-[8px] font-mono text-gray-700 tracking-wider">
          SHOWING {feedItems.length} / {data.length} READINGS
        </span>
        <span className="text-[8px] font-mono text-gray-700 tracking-wider">
          SORTED: NEWEST FIRST
        </span>
      </div>
    </div>
  );
}
