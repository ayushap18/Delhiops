import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { ChartTooltip } from "@/components/shared/ChartTooltip";
import type { AqiReading } from "@/lib/api";

interface AqiRadarChartProps {
  data: AqiReading[];
}

// WHO/EPA danger thresholds for normalization
const THRESHOLDS: Record<string, { max: number; unit: string }> = {
  "PM2.5": { max: 150, unit: "ug/m3" },
  PM10: { max: 350, unit: "ug/m3" },
  O3: { max: 100, unit: "ppb" },
  NO2: { max: 100, unit: "ppb" },
  SO2: { max: 40, unit: "ppb" },
  CO: { max: 9, unit: "ppm" },
};

export function AqiRadarChart({ data }: AqiRadarChartProps) {
  const latest = data[0];
  if (!latest) return null;

  const chartData = [
    {
      pollutant: "PM2.5",
      value: Math.round(((latest.pm2_5 || 0) / THRESHOLDS["PM2.5"].max) * 100),
      raw: latest.pm2_5 || 0,
      threshold: 100,
    },
    {
      pollutant: "PM10",
      value: Math.round(((latest.pm10 || 0) / THRESHOLDS.PM10.max) * 100),
      raw: latest.pm10 || 0,
      threshold: 100,
    },
    {
      pollutant: "O3",
      value: Math.round(((latest.o3 || 0) / THRESHOLDS.O3.max) * 100),
      raw: latest.o3 || 0,
      threshold: 100,
    },
    {
      pollutant: "NO2",
      value: Math.round(((latest.no2 || 0) / THRESHOLDS.NO2.max) * 100),
      raw: latest.no2 || 0,
      threshold: 100,
    },
    {
      pollutant: "SO2",
      value: Math.round(((latest.so2 || 0) / THRESHOLDS.SO2.max) * 100),
      raw: latest.so2 || 0,
      threshold: 100,
    },
    {
      pollutant: "CO",
      value: Math.round(((latest.co || 0) / THRESHOLDS.CO.max) * 100),
      raw: latest.co || 0,
      threshold: 100,
    },
  ];

  return (
    <div className="bg-gray-950 border border-brand/10 p-5 corner-borders relative">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand/20 to-transparent" />
      <h3 className="text-[10px] font-mono text-brand tracking-wider mb-2">
        {">"} POLLUTANT_ANALYSIS // THREAT RADAR
      </h3>
      <p className="text-[8px] font-mono text-gray-700 tracking-wider mb-4">
        VALUES NORMALIZED TO WHO DANGER THRESHOLDS (100% = DANGER LIMIT)
      </p>

      <ResponsiveContainer width="100%" height={340}>
        <RadarChart data={chartData} cx="50%" cy="50%" outerRadius="75%">
          <PolarGrid stroke="#0a1a0a" gridType="polygon" />
          <PolarAngleAxis
            dataKey="pollutant"
            tick={{
              fill: "#3a5a3a",
              fontSize: 10,
              fontFamily: "JetBrains Mono",
            }}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 150]}
            tick={{
              fill: "#1a3a1a",
              fontSize: 8,
              fontFamily: "JetBrains Mono",
            }}
            tickCount={4}
          />

          {/* Danger threshold line at 100% */}
          <Radar
            name="Danger Threshold"
            dataKey="threshold"
            stroke="#ff003c"
            strokeWidth={1}
            strokeDasharray="4 4"
            fill="none"
            dot={false}
          />

          {/* Current values */}
          <Radar
            name="Current Level"
            dataKey="value"
            stroke="#00ff41"
            strokeWidth={2}
            fill="#00ff41"
            fillOpacity={0.15}
            dot={{ r: 3, fill: "#00ff41" }}
            animationDuration={1500}
            animationEasing="ease-out"
          />

          <Tooltip
            content={<ChartTooltip />}
            formatter={(value: number, _name: string, props: { payload: { pollutant: string; raw: number } }) => {
              const pollutant = props.payload.pollutant;
              const threshold = THRESHOLDS[pollutant];
              return [
                `${props.payload.raw} ${threshold.unit} (${value}% of limit)`,
                pollutant,
              ];
            }}
          />

          <Legend
            wrapperStyle={{
              fontFamily: "JetBrains Mono",
              fontSize: "9px",
              color: "#3a5a3a",
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
