import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { ChartTooltip } from "@/components/shared/ChartTooltip";
import type { AqiReading } from "@/lib/api";

interface AqiChartProps {
  data: AqiReading[];
}

export function AqiTrendChart({ data }: AqiChartProps) {
  const chartData = [...data].reverse().map((r) => ({
    time: new Date(r.timestamp).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
    }),
    aqi: r.aqi,
  }));

  return (
    <div className="bg-gray-950 border border-brand/10 p-5 corner-borders relative">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand/20 to-transparent" />
      <h3 className="text-xs font-mono text-brand tracking-wider mb-4">
        {">"} AQI_TREND
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
            stroke="#1a3a1a"
            tick={{ fill: "#3a5a3a", fontSize: 10, fontFamily: "JetBrains Mono" }}
          />
          <Tooltip content={<ChartTooltip />} />
          <Line
            type="monotone"
            dataKey="aqi"
            stroke="#00ff41"
            strokeWidth={2}
            dot={false}
            animationDuration={1500}
            animationEasing="ease-out"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function PollutantChart({ data }: AqiChartProps) {
  const latest = data[0];
  if (!latest) return null;

  const chartData = [
    { name: "PM2.5", value: latest.pm2_5 || 0 },
    { name: "PM10", value: latest.pm10 || 0 },
    { name: "O3", value: latest.o3 || 0 },
    { name: "NO2", value: latest.no2 || 0 },
    { name: "SO2", value: latest.so2 || 0 },
    { name: "CO", value: latest.co || 0 },
  ];

  return (
    <div className="bg-gray-950 border border-brand/10 p-5 corner-borders relative">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand/20 to-transparent" />
      <h3 className="text-xs font-mono text-brand tracking-wider mb-4">
        {">"} POLLUTANT_BREAKDOWN // LATEST READING
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#0a1a0a" />
          <XAxis
            dataKey="name"
            stroke="#1a3a1a"
            tick={{ fill: "#3a5a3a", fontSize: 10, fontFamily: "JetBrains Mono" }}
          />
          <YAxis
            stroke="#1a3a1a"
            tick={{ fill: "#3a5a3a", fontSize: 10, fontFamily: "JetBrains Mono" }}
          />
          <Tooltip content={<ChartTooltip />} />
          <Legend
            wrapperStyle={{ fontFamily: "JetBrains Mono", fontSize: "10px", color: "#3a5a3a" }}
          />
          <Bar
            dataKey="value"
            fill="#00ff41"
            radius={[0, 0, 0, 0]}
            name="Concentration"
            animationDuration={1500}
            animationEasing="ease-out"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
