import { getAqiLevel, formatDate } from "@/lib/utils";
import type { AqiReading } from "@/lib/api";

interface AqiDetailsCardProps {
  reading: AqiReading | null;
}

function getAqiColor(aqi: number): string {
  if (aqi <= 50) return "#00ff41";
  if (aqi <= 100) return "#ffb800";
  if (aqi <= 200) return "#ff6600";
  if (aqi <= 300) return "#ff003c";
  return "#990000";
}

interface FieldRowProps {
  label: string;
  value: string | number;
  unit?: string;
  color?: string;
  barPercent?: number;
  barColor?: string;
}

function FieldRow({ label, value, unit, color, barPercent, barColor }: FieldRowProps) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-brand/5 last:border-0 group">
      <span className="text-[9px] font-mono text-gray-600 tracking-wider">
        {label}
      </span>
      <div className="flex items-center gap-2">
        {barPercent !== undefined && (
          <div className="w-16 h-1 bg-gray-900 overflow-hidden">
            <div
              className="h-full threat-bar-fill"
              style={{
                ["--bar-width" as string]: `${Math.min(barPercent, 100)}%`,
                backgroundColor: barColor || "#00ff41",
              }}
            />
          </div>
        )}
        <span
          className="text-[10px] font-mono font-semibold tracking-wider tabular-nums"
          style={{ color: color || "#c0f0c0" }}
        >
          {value}
          {unit && (
            <span className="text-[7px] text-gray-600 ml-0.5">{unit}</span>
          )}
        </span>
      </div>
    </div>
  );
}

export function AqiDetailsCard({ reading }: AqiDetailsCardProps) {
  if (!reading) {
    return (
      <div className="bg-gray-950 border border-brand/10 p-5 corner-borders relative flex items-center justify-center min-h-[280px]">
        <p className="text-[10px] font-mono text-gray-600 tracking-wider">
          NO DATA AVAILABLE
        </p>
      </div>
    );
  }

  const level = getAqiLevel(reading.aqi);
  const color = getAqiColor(reading.aqi);

  return (
    <div className="bg-gray-950 border border-brand/10 p-5 corner-borders relative">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand/20 to-transparent" />
      <h3 className="text-[10px] font-mono text-brand tracking-wider mb-4">
        {">"} CURRENT_READING // LATEST SENSOR DATA
      </h3>

      <div className="space-y-0">
        <FieldRow label="ID" value={`#${reading.id}`} />
        <FieldRow label="TIMESTAMP" value={formatDate(reading.timestamp)} />
        <FieldRow
          label="AQI"
          value={reading.aqi}
          color={color}
          barPercent={(reading.aqi / 500) * 100}
          barColor={color}
        />
        <FieldRow
          label="PM2.5"
          value={reading.pm2_5 ?? "-"}
          unit={reading.pm2_5 != null ? "ug/m3" : undefined}
          barPercent={reading.pm2_5 != null ? (reading.pm2_5 / 150) * 100 : undefined}
          barColor={reading.pm2_5 != null && reading.pm2_5 > 150 ? "#ff003c" : "#00ff41"}
        />
        <FieldRow
          label="PM10"
          value={reading.pm10 ?? "-"}
          unit={reading.pm10 != null ? "ug/m3" : undefined}
          barPercent={reading.pm10 != null ? (reading.pm10 / 350) * 100 : undefined}
          barColor={reading.pm10 != null && reading.pm10 > 350 ? "#ff003c" : "#00ff41"}
        />
        <FieldRow
          label="O3"
          value={reading.o3 ?? "-"}
          unit={reading.o3 != null ? "ppb" : undefined}
          barPercent={reading.o3 != null ? (reading.o3 / 100) * 100 : undefined}
          barColor={reading.o3 != null && reading.o3 > 100 ? "#ff003c" : "#00ff41"}
        />
        <FieldRow
          label="NO2"
          value={reading.no2 ?? "-"}
          unit={reading.no2 != null ? "ppb" : undefined}
          barPercent={reading.no2 != null ? (reading.no2 / 100) * 100 : undefined}
          barColor={reading.no2 != null && reading.no2 > 100 ? "#ff003c" : "#00ff41"}
        />
        <FieldRow
          label="SO2"
          value={reading.so2 ?? "-"}
          unit={reading.so2 != null ? "ppb" : undefined}
          barPercent={reading.so2 != null ? (reading.so2 / 40) * 100 : undefined}
          barColor={reading.so2 != null && reading.so2 > 40 ? "#ff003c" : "#00ff41"}
        />
        <FieldRow
          label="CO"
          value={reading.co ?? "-"}
          unit={reading.co != null ? "ppm" : undefined}
          barPercent={reading.co != null ? (reading.co / 9) * 100 : undefined}
          barColor={reading.co != null && reading.co > 9 ? "#ff003c" : "#00ff41"}
        />
        <FieldRow
          label="LOCATION"
          value={`${reading.location.lat.toFixed(4)}N, ${reading.location.lng.toFixed(4)}E`}
        />
      </div>

      {/* Status badge */}
      <div
        className="mt-3 flex items-center gap-2 px-2 py-1.5 border"
        style={{
          borderColor: color + "30",
          backgroundColor: color + "08",
        }}
      >
        <div
          className="w-2 h-2 status-dot"
          style={{ backgroundColor: color }}
        />
        <span
          className="text-[9px] font-mono tracking-widest"
          style={{ color }}
        >
          STATUS: {level.label.toUpperCase()}
        </span>
      </div>
    </div>
  );
}
