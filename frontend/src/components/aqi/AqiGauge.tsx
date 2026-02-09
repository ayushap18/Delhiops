import { cn, getAqiLevel } from "@/lib/utils";

export function AqiGauge({ value }: { value: number }) {
  const level = getAqiLevel(value);
  const percentage = Math.min((value / 500) * 100, 100);
  const color = value <= 50 ? "#00ff41" : value <= 100 ? "#ffb800" : value <= 200 ? "#ff6600" : "#ff003c";

  return (
    <div className="flex flex-col items-center p-6 bg-gray-950 border border-brand/10 corner-borders relative card-hover overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand/20 to-transparent" />
      <p className="text-[9px] text-gray-600 font-mono tracking-[0.2em] mb-3">CURRENT AVG AQI</p>
      <div className="relative w-40 h-40">
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
          {/* Background tick marks */}
          {Array.from({ length: 24 }, (_, i) => {
            const angle = (i / 24) * 360;
            const rad = (angle * Math.PI) / 180;
            const x1 = 60 + 42 * Math.cos(rad);
            const y1 = 60 + 42 * Math.sin(rad);
            const x2 = 60 + 46 * Math.cos(rad);
            const y2 = 60 + 46 * Math.sin(rad);
            return (
              <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#162016" strokeWidth="1" />
            );
          })}
          {/* Background circle */}
          <circle cx="60" cy="60" r="50" fill="none" stroke="#0a1a0a" strokeWidth="8" />
          {/* Value arc */}
          <circle
            cx="60"
            cy="60"
            r="50"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="butt"
            strokeDasharray={`${percentage * 3.14} 314`}
            style={{
              filter: `drop-shadow(0 0 8px ${color}80)`,
              transition: "stroke-dasharray 1s ease-out",
            }}
          />
          {/* Glow effect circle */}
          <circle
            cx="60"
            cy="60"
            r="50"
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="butt"
            strokeDasharray={`${percentage * 3.14} 314`}
            opacity="0.3"
            style={{ filter: `blur(4px)` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="text-3xl font-bold font-[Orbitron] tracking-wider tabular-nums"
            style={{ color, textShadow: `0 0 20px ${color}60` }}
          >
            {value}
          </span>
          <span className={cn("text-[10px] font-mono tracking-wider mt-0.5", level.color)}>
            {level.label.toUpperCase()}
          </span>
        </div>
      </div>
      {/* Legend */}
      <div className="flex gap-3 mt-4 text-[9px] font-mono text-gray-600 tracking-wider">
        <span className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 bg-brand" style={{ boxShadow: "0 0 3px #00ff41" }} />
          GOOD
        </span>
        <span className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 bg-warning" style={{ boxShadow: "0 0 3px #ffb800" }} />
          MOD
        </span>
        <span className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 bg-aqi-unhealthy" style={{ boxShadow: "0 0 3px #ff6600" }} />
          BAD
        </span>
        <span className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 bg-danger" style={{ boxShadow: "0 0 3px #ff003c" }} />
          HAZ
        </span>
      </div>
      <div className="mt-3 w-full h-px shimmer-line" />
    </div>
  );
}
