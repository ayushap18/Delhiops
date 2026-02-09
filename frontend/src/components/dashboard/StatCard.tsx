import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import { AnimatedNumber } from "@/components/shared/AnimatedNumber";
import { Sparkline } from "@/components/shared/Sparkline";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: { value: number; label: string };
  color?: string;
  accentColor?: string;
  sparklineData?: number[];
}

export function StatCard({
  title,
  value,
  icon,
  trend,
  color = "text-brand",
  accentColor = "rgba(0,255,65,0.15)",
  sparklineData,
}: StatCardProps) {
  return (
    <div className="card-hover bg-gray-950 border border-brand/10 p-4 relative overflow-hidden corner-borders group">
      {/* Top accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
        }}
      />

      {/* Background ambient glow */}
      <div
        className="absolute -top-10 -right-10 w-28 h-28 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-3xl"
        style={{ background: accentColor }}
      />
      <div
        className="absolute -bottom-8 -left-8 w-20 h-20 rounded-full opacity-0 group-hover:opacity-60 transition-opacity duration-700 blur-2xl"
        style={{ background: accentColor }}
      />

      <div className="flex items-center justify-between mb-3 relative z-10">
        <p className="text-[9px] font-mono text-gray-500 tracking-[0.2em] uppercase">
          {title}
        </p>
        <div
          className={cn("p-1.5 border bg-brand/5 transition-all duration-300 group-hover:shadow-lg", color)}
          style={{
            borderColor: accentColor.replace(/[\d.]+\)$/, "0.2)"),
          }}
        >
          {icon}
        </div>
      </div>

      <p
        className={cn("text-2xl font-bold font-[Orbitron] tracking-wider relative z-10", color)}
        style={{ textShadow: `0 0 20px ${accentColor}` }}
      >
        {typeof value === "number" ? (
          <AnimatedNumber value={value} />
        ) : typeof value === "string" && value.endsWith("%") ? (
          <AnimatedNumber value={parseFloat(value)} suffix="%" />
        ) : (
          value
        )}
      </p>

      {trend && (
        <div
          className={cn(
            "mt-2 text-[10px] font-mono tracking-wider flex items-center gap-1",
            trend.value >= 0 ? "text-brand" : "text-danger"
          )}
        >
          <span>{trend.value >= 0 ? "+" : ""}{trend.value}%</span>
          <span className="text-gray-600">{trend.label}</span>
        </div>
      )}

      {sparklineData && sparklineData.length > 1 && (
        <div className="mt-2 relative z-10">
          <Sparkline data={sparklineData} height={20} color={accentColor.replace(/[\d.]+\)$/, '0.8)')} />
        </div>
      )}

      {/* Bottom mini bar */}
      <div className="mt-3 h-px bg-gray-800 relative overflow-hidden">
        <div
          className="h-full threat-bar-fill"
          style={{
            ["--bar-width" as string]: "70%",
            background: `linear-gradient(90deg, transparent, ${accentColor})`,
          }}
        />
      </div>
    </div>
  );
}
