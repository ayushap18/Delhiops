import {
  Treemap,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
  Legend,
} from "recharts";
import { ChartTooltip } from "@/components/shared/ChartTooltip";
import type { CrimeReport } from "@/lib/api";

const CRIME_COLORS: Record<string, string> = {
  Theft: "#00ff41",
  Robbery: "#ff003c",
  Assault: "#ff6600",
  Burglary: "#ffb800",
  Fraud: "#00d4ff",
  Vandalism: "#9945ff",
  Murder: "#ff0066",
  Kidnapping: "#ff4488",
  "Cyber Crime": "#00ffcc",
  Arson: "#ff3300",
};

function getCrimeColor(type: string): string {
  return CRIME_COLORS[type] || "#3a5a3a";
}

interface TreemapContentProps {
  x: number;
  y: number;
  width: number;
  height: number;
  name: string;
  value: number;
  color: string;
}

function CustomTreemapContent({ x, y, width, height, name, value, color }: TreemapContentProps) {
  if (width < 30 || height < 25) return null;
  return (
    <g>
      <rect x={x} y={y} width={width} height={height}
        fill={color} fillOpacity="0.15"
        stroke={color} strokeWidth="1" strokeOpacity="0.6"
      />
      {width > 50 && height > 35 && (
        <>
          <text x={x + width / 2} y={y + height / 2 - 4} fill={color}
            fontSize="9" fontFamily="JetBrains Mono" textAnchor="middle" fontWeight="bold">
            {name}
          </text>
          <text x={x + width / 2} y={y + height / 2 + 10} fill={color}
            fontSize="14" fontFamily="Orbitron" textAnchor="middle" fontWeight="bold" opacity="0.9">
            {value}
          </text>
        </>
      )}
    </g>
  );
}

export function CrimeByTypeChart({ data }: { data: CrimeReport[] }) {
  const typeCounts: Record<string, number> = {};
  data.forEach((c) => {
    typeCounts[c.type] = (typeCounts[c.type] || 0) + 1;
  });
  const chartData = Object.entries(typeCounts)
    .map(([name, value]) => ({
      name,
      value,
      color: getCrimeColor(name),
    }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="bg-gray-950 border border-danger/10 p-5 corner-borders relative">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-danger/20 to-transparent" />
      <h3 className="text-[10px] font-mono text-danger tracking-wider mb-1">
        {">"} CRIME_TYPES // DISTRIBUTION MATRIX
      </h3>
      <p className="text-[7px] font-mono text-gray-700 tracking-wider mb-3">
        SIZE PROPORTIONAL TO CASE COUNT
      </p>
      <ResponsiveContainer width="100%" height={280}>
        <Treemap
          data={chartData}
          dataKey="value"
          stroke="#020a02"
          animationDuration={1200}
          animationEasing="ease-out"
          content={<CustomTreemapContent x={0} y={0} width={0} height={0} name="" value={0} color="" />}
        />
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-2 mt-2">
        {chartData.map((item) => (
          <div key={item.name} className="flex items-center gap-1">
            <div className="w-2 h-2" style={{ backgroundColor: item.color }} />
            <span className="text-[7px] font-mono" style={{ color: item.color + "cc" }}>
              {item.name.toUpperCase()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CrimeBySeverityChart({ data }: { data: CrimeReport[] }) {
  const sevCounts: Record<string, number> = {};
  data.forEach((c) => {
    const s = c.severity || "unknown";
    sevCounts[s] = (sevCounts[s] || 0) + 1;
  });

  const sevOrder = ["low", "medium", "high", "critical"];
  const sevColors: Record<string, string> = {
    low: "#00ff41",
    medium: "#ffb800",
    high: "#ff6600",
    critical: "#ff003c",
    unknown: "#3a5a3a",
  };

  const chartData = sevOrder
    .filter((s) => sevCounts[s])
    .map((name) => ({
      name: name.toUpperCase(),
      value: sevCounts[name],
      fill: sevColors[name] || "#3a5a3a",
    }));

  return (
    <div className="bg-gray-950 border border-danger/10 p-5 corner-borders relative">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-danger/20 to-transparent" />
      <h3 className="text-[10px] font-mono text-danger tracking-wider mb-1">
        {">"} SEVERITY_ANALYSIS // THREAT LEVELS
      </h3>
      <p className="text-[7px] font-mono text-gray-700 tracking-wider mb-3">
        CRIME SEVERITY DISTRIBUTION
      </p>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData} barCategoryGap="20%">
          <CartesianGrid strokeDasharray="3 3" stroke="#0a1a0a" />
          <XAxis dataKey="name" stroke="#1a3a1a"
            tick={{ fill: "#3a5a3a", fontSize: 9, fontFamily: "JetBrains Mono" }} />
          <YAxis stroke="#1a3a1a"
            tick={{ fill: "#3a5a3a", fontSize: 9, fontFamily: "JetBrains Mono" }} />
          <Tooltip content={<ChartTooltip />} />
          <Legend wrapperStyle={{ fontFamily: "JetBrains Mono", fontSize: "9px" }} />
          <Bar dataKey="value" name="Cases" radius={[2, 2, 0, 0]}
            animationDuration={1500} animationEasing="ease-out">
            {chartData.map((entry, idx) => (
              <Cell key={idx} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
