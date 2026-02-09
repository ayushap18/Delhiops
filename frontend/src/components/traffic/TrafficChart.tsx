import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { ChartTooltip } from "@/components/shared/ChartTooltip";
import type { TrafficData } from "@/lib/api";

export function CongestionChart({ data }: { data: TrafficData[] }) {
  const chartData = [...data].reverse().map((r) => ({
    time: new Date(r.timestamp).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
    }),
    congestion: r.congestion_level,
    speed: r.speed,
  }));

  return (
    <div className="bg-gray-950 border border-brand/10 p-5 corner-borders relative">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand/20 to-transparent" />
      <h3 className="text-xs font-mono text-brand tracking-wider mb-4">
        {">"} CONGESTION_&_SPEED // TREND ANALYSIS
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#0a1a0a" />
          <XAxis
            dataKey="time"
            stroke="#1a3a1a"
            tick={{ fill: "#3a5a3a", fontSize: 10, fontFamily: "JetBrains Mono" }}
          />
          <YAxis
            yAxisId="left"
            stroke="#1a3a1a"
            tick={{ fill: "#3a5a3a", fontSize: 10, fontFamily: "JetBrains Mono" }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            stroke="#1a3a1a"
            tick={{ fill: "#3a5a3a", fontSize: 10, fontFamily: "JetBrains Mono" }}
          />
          <Tooltip content={<ChartTooltip />} />
          <Legend
            wrapperStyle={{ fontFamily: "JetBrains Mono", fontSize: "10px", color: "#3a5a3a" }}
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="congestion"
            stroke="#ff003c"
            strokeWidth={2}
            dot={false}
            name="Congestion %"
            animationDuration={1500}
            animationEasing="ease-out"
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="speed"
            stroke="#00ff41"
            strokeWidth={2}
            dot={false}
            name="Speed (km/h)"
            animationDuration={1500}
            animationEasing="ease-out"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
