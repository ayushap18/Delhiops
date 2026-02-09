import { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import { ChartTooltip } from "@/components/shared/ChartTooltip";
import type { Incident } from "@/lib/api";

const TYPE_COLORS: Record<string, string> = {
  Fire: "#ff3300",
  Flooding: "#0088ff",
  Accident: "#ff6600",
  Medical: "#00ff41",
  "Power Outage": "#ffb800",
  Protest: "#ff003c",
  "Gas Leak": "#9945ff",
  Earthquake: "#cc6600",
  Stampede: "#ff0066",
};

function getTypeColor(type: string): string {
  return TYPE_COLORS[type] || "#00d4ff";
}

export function IncidentTypeChart({ data }: { data: Incident[] }) {
  const chartData = useMemo(() => {
    const types: Record<string, number> = {};
    data.forEach((inc) => {
      types[inc.type] = (types[inc.type] || 0) + 1;
    });
    return Object.entries(types)
      .map(([name, value]) => ({ name, value, color: getTypeColor(name) }))
      .sort((a, b) => b.value - a.value);
  }, [data]);

  return (
    <div className="bg-gray-950 border border-warning/10 p-5 corner-borders relative">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-warning/20 to-transparent" />
      <h3 className="text-[10px] font-mono text-warning tracking-wider mb-1">
        {">"} INCIDENT_TYPES // CATEGORY BREAKDOWN
      </h3>
      <p className="text-[7px] font-mono text-gray-700 tracking-wider mb-3">
        DISTRIBUTION BY EVENT CATEGORY
      </p>

      <div className="flex items-center">
        <ResponsiveContainer width="55%" height={260}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%" cy="50%"
              innerRadius={50} outerRadius={85}
              dataKey="value"
              stroke="#020a02" strokeWidth={2}
              animationDuration={1500}
              animationEasing="ease-out"
            >
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Legend */}
        <div className="flex-1 space-y-1.5 pl-2">
          {chartData.map((item) => (
            <div key={item.name} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2" style={{ backgroundColor: item.color }} />
                <span className="text-[8px] font-mono tracking-wider" style={{ color: item.color + "cc" }}>
                  {item.name.toUpperCase()}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-10 h-1 bg-gray-900 overflow-hidden">
                  <div className="h-full" style={{
                    width: `${(item.value / (chartData[0]?.value || 1)) * 100}%`,
                    backgroundColor: item.color,
                  }} />
                </div>
                <span className="text-[9px] font-mono font-bold tabular-nums" style={{ color: item.color }}>
                  {item.value}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function IncidentSeverityTrend({ data }: { data: Incident[] }) {
  const chartData = useMemo(() => {
    // Group by hour for last 24h trend
    const groups: Record<string, { critical: number; high: number; medium: number; low: number }> = {};

    data.forEach((inc) => {
      const d = new Date(inc.timestamp);
      const key = `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:00`;
      if (!groups[key]) groups[key] = { critical: 0, high: 0, medium: 0, low: 0 };
      const sev = inc.severity?.toLowerCase() as keyof typeof groups[string];
      if (sev in groups[key]) groups[key][sev]++;
    });

    return Object.entries(groups)
      .map(([time, counts]) => ({ time, ...counts }))
      .slice(-12);
  }, [data]);

  return (
    <div className="bg-gray-950 border border-warning/10 p-5 corner-borders relative">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-warning/20 to-transparent" />
      <h3 className="text-[10px] font-mono text-warning tracking-wider mb-1">
        {">"} SEVERITY_TREND // TIME ANALYSIS
      </h3>
      <p className="text-[7px] font-mono text-gray-700 tracking-wider mb-3">
        INCIDENT SEVERITY OVER TIME
      </p>

      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#0a1a0a" />
          <XAxis dataKey="time" stroke="#1a3a1a"
            tick={{ fill: "#3a5a3a", fontSize: 8, fontFamily: "JetBrains Mono" }} />
          <YAxis stroke="#1a3a1a"
            tick={{ fill: "#3a5a3a", fontSize: 8, fontFamily: "JetBrains Mono" }} />
          <Tooltip content={<ChartTooltip />} />
          <Legend wrapperStyle={{ fontFamily: "JetBrains Mono", fontSize: "8px" }} />
          <Area type="monotone" dataKey="critical" stackId="1"
            stroke="#ff003c" fill="#ff003c" fillOpacity={0.3}
            animationDuration={1500} name="Critical" />
          <Area type="monotone" dataKey="high" stackId="1"
            stroke="#ff6600" fill="#ff6600" fillOpacity={0.25}
            animationDuration={1500} name="High" />
          <Area type="monotone" dataKey="medium" stackId="1"
            stroke="#ffb800" fill="#ffb800" fillOpacity={0.2}
            animationDuration={1500} name="Medium" />
          <Area type="monotone" dataKey="low" stackId="1"
            stroke="#00ff41" fill="#00ff41" fillOpacity={0.15}
            animationDuration={1500} name="Low" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
