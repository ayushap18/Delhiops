import { useMemo } from "react";
import type { Incident } from "@/lib/api";

interface IncidentSeverityGridProps {
  data: Incident[];
}

function getSeverityHex(severity: string): string {
  switch (severity?.toLowerCase()) {
    case "critical": return "#ff003c";
    case "high": return "#ff6600";
    case "medium": return "#ffb800";
    case "low": return "#00ff41";
    default: return "#3a5a3a";
  }
}

function getStatusHex(status: string): string {
  switch (status) {
    case "open": return "#ff003c";
    case "in_progress": return "#ffb800";
    case "resolved": return "#00ff41";
    case "closed": return "#3a5a3a";
    default: return "#3a5a3a";
  }
}

export function IncidentSeverityGrid({ data }: IncidentSeverityGridProps) {
  const matrix = useMemo(() => {
    const types = [...new Set(data.map((d) => d.type))].sort();
    const sevLevels = ["critical", "high", "medium", "low"];

    const grid: Record<string, Record<string, number>> = {};
    types.forEach((type) => {
      grid[type] = {};
      sevLevels.forEach((sev) => { grid[type][sev] = 0; });
    });

    data.forEach((inc) => {
      if (grid[inc.type]) {
        grid[inc.type][inc.severity] = (grid[inc.type][inc.severity] || 0) + 1;
      }
    });

    const maxVal = Math.max(...Object.values(grid).flatMap((row) => Object.values(row)), 1);

    return { types, sevLevels, grid, maxVal };
  }, [data]);

  // High-priority incidents (open + critical/high)
  const highPriorityItems = useMemo(() => {
    return data
      .filter((d) => (d.status === "open" || d.status === "in_progress") && (d.severity === "critical" || d.severity === "high"))
      .slice(0, 5);
  }, [data]);

  return (
    <div className="bg-gray-950 border border-warning/10 p-5 corner-borders relative">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-warning/20 to-transparent" />
      <h3 className="text-[10px] font-mono text-warning tracking-wider mb-1">
        {">"} TYPE × SEVERITY // CROSS MATRIX
      </h3>
      <p className="text-[7px] font-mono text-gray-700 tracking-wider mb-3">
        INCIDENT DISTRIBUTION HEATMAP
      </p>

      {/* Matrix */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="text-[7px] font-mono text-gray-600 text-left pr-2 pb-1 tracking-wider">TYPE</th>
              {matrix.sevLevels.map((sev) => (
                <th key={sev} className="text-[7px] font-mono text-center pb-1 px-1 tracking-wider"
                  style={{ color: getSeverityHex(sev) + "cc" }}>
                  {sev.toUpperCase().slice(0, 4)}
                </th>
              ))}
              <th className="text-[7px] font-mono text-gray-600 text-center pb-1 pl-2 tracking-wider">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {matrix.types.map((type) => {
              const rowTotal = matrix.sevLevels.reduce((sum, sev) => sum + (matrix.grid[type]?.[sev] || 0), 0);
              return (
                <tr key={type} className="hover:bg-warning/5 transition-colors">
                  <td className="text-[8px] font-mono text-gray-400 pr-2 py-1 tracking-wider">
                    {type.toUpperCase()}
                  </td>
                  {matrix.sevLevels.map((sev) => {
                    const val = matrix.grid[type]?.[sev] || 0;
                    const intensity = val / matrix.maxVal;
                    const color = getSeverityHex(sev);
                    return (
                      <td key={sev} className="text-center py-1 px-1">
                        <div className="mx-auto w-8 h-6 flex items-center justify-center border transition-all"
                          style={{
                            borderColor: val > 0 ? color + "30" : "#0a1a0a",
                            backgroundColor: val > 0 ? color + Math.round(intensity * 25).toString(16).padStart(2, "0") : "transparent",
                            boxShadow: val > 2 ? `0 0 8px ${color}30` : "none",
                          }}>
                          <span className="text-[9px] font-mono font-bold tabular-nums"
                            style={{ color: val > 0 ? color : "#1a1a1a" }}>
                            {val || "·"}
                          </span>
                        </div>
                      </td>
                    );
                  })}
                  <td className="text-center py-1 pl-2">
                    <span className="text-[9px] font-mono font-bold text-gray-400 tabular-nums">
                      {rowTotal}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Priority alerts */}
      {highPriorityItems.length > 0 && (
        <div className="mt-3 pt-3 border-t border-warning/10">
          <p className="text-[8px] font-mono text-danger tracking-wider mb-2">
            ⚠ PRIORITY ALERTS ({highPriorityItems.length})
          </p>
          <div className="space-y-1">
            {highPriorityItems.map((item) => (
              <div key={item.id} className="flex items-center gap-2 px-2 py-1 border-l-2"
                style={{ borderLeftColor: getSeverityHex(item.severity) + "80" }}>
                <div className="w-1.5 h-1.5 rounded-full"
                  style={{
                    backgroundColor: getSeverityHex(item.severity),
                    boxShadow: `0 0 4px ${getSeverityHex(item.severity)}60`,
                  }} />
                <span className="text-[8px] font-mono text-gray-300 flex-1 truncate">
                  {item.type.toUpperCase()} — {item.description ? item.description.slice(0, 40) + "..." : "No description"}
                </span>
                <span className="text-[7px] font-mono px-1 py-0.5 border"
                  style={{
                    color: getStatusHex(item.status),
                    borderColor: getStatusHex(item.status) + "30",
                  }}>
                  {item.status.toUpperCase().replace("_", " ")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
