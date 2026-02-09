import { useMemo } from "react";
import { AnimatedNumber } from "@/components/shared/AnimatedNumber";
import type { CrimeReport } from "@/lib/api";

interface CrimeHotspotMapProps {
  data: CrimeReport[];
}

const DELHI_ZONES = [
  { name: "NORTH DELHI", shortName: "NORTH", lat: [28.68, 28.76], lng: [77.18, 77.26], cx: 150, cy: 52 },
  { name: "NORTH WEST", shortName: "NW", lat: [28.68, 28.76], lng: [77.04, 77.18], cx: 75, cy: 60 },
  { name: "NORTH EAST", shortName: "NE", lat: [28.68, 28.76], lng: [77.26, 77.34], cx: 228, cy: 55 },
  { name: "CENTRAL", shortName: "CTR", lat: [28.62, 28.68], lng: [77.18, 77.28], cx: 155, cy: 128 },
  { name: "WEST DELHI", shortName: "WEST", lat: [28.60, 28.70], lng: [77.02, 77.14], cx: 55, cy: 132 },
  { name: "EAST DELHI", shortName: "EAST", lat: [28.60, 28.68], lng: [77.28, 77.38], cx: 245, cy: 122 },
  { name: "NEW DELHI", shortName: "N.DLI", lat: [28.58, 28.64], lng: [77.18, 77.26], cx: 148, cy: 188 },
  { name: "SOUTH WEST", shortName: "SW", lat: [28.48, 28.58], lng: [77.02, 77.16], cx: 68, cy: 258 },
  { name: "SOUTH DELHI", shortName: "SOUTH", lat: [28.48, 28.58], lng: [77.16, 77.26], cx: 155, cy: 260 },
  { name: "SOUTH EAST", shortName: "SE", lat: [28.48, 28.60], lng: [77.26, 77.36], cx: 240, cy: 248 },
  { name: "SHAHDARA", shortName: "SHD", lat: [28.66, 28.72], lng: [77.28, 77.34], cx: 235, cy: 85 },
  { name: "DWARKA", shortName: "DWK", lat: [28.56, 28.62], lng: [77.02, 77.10], cx: 42, cy: 192 },
] as const;

// Adjacent zone connections for network lines
const ZONE_LINKS: [number, number][] = [
  [0, 1], [0, 2], [0, 3], [1, 4], [2, 5], [2, 10],
  [3, 4], [3, 5], [3, 6], [4, 11], [4, 7],
  [5, 9], [6, 7], [6, 8], [6, 9],
  [7, 8], [8, 9], [10, 5],
];

function getHeatColor(count: number, max: number): string {
  if (max === 0) return "#0a1a0a";
  const ratio = count / max;
  if (ratio === 0) return "#0a1a0a";
  if (ratio < 0.15) return "#002200";
  if (ratio < 0.3) return "#004400";
  if (ratio < 0.5) return "#886600";
  if (ratio < 0.7) return "#bb4400";
  if (ratio < 0.85) return "#dd2200";
  return "#ff003c";
}

function getThreatLevel(ratio: number): string {
  if (ratio === 0) return "CLEAR";
  if (ratio < 0.2) return "LOW";
  if (ratio < 0.4) return "MODERATE";
  if (ratio < 0.6) return "ELEVATED";
  if (ratio < 0.8) return "HIGH";
  return "CRITICAL";
}

export function CrimeHotspotMap({ data }: CrimeHotspotMapProps) {
  const zoneData = useMemo(() => {
    const counts: Record<string, number> = {};
    const typeCounts: Record<string, Record<string, number>> = {};
    DELHI_ZONES.forEach((z) => {
      counts[z.name] = 0;
      typeCounts[z.name] = {};
    });

    data.forEach((crime) => {
      const { lat, lng } = crime.location;
      for (const zone of DELHI_ZONES) {
        if (lat >= zone.lat[0] && lat < zone.lat[1] && lng >= zone.lng[0] && lng < zone.lng[1]) {
          counts[zone.name]++;
          typeCounts[zone.name][crime.type] = (typeCounts[zone.name][crime.type] || 0) + 1;
          break;
        }
      }
    });

    const maxCount = Math.max(...Object.values(counts), 1);
    return DELHI_ZONES.map((z) => {
      const count = counts[z.name];
      const ratio = count / maxCount;
      const topCrime = Object.entries(typeCounts[z.name]).sort((a, b) => b[1] - a[1])[0];
      return {
        ...z,
        count,
        ratio,
        color: getHeatColor(count, maxCount),
        threat: getThreatLevel(ratio),
        topCrime: topCrime ? topCrime[0] : null,
        radius: 16 + count * 1.2,
        glowRadius: 22 + count * 1.8,
      };
    });
  }, [data]);

  const totalCrimes = data.length;
  const hottestZone = zoneData.reduce((a, b) => (a.count > b.count ? a : b), zoneData[0]);
  const activeZones = zoneData.filter((z) => z.count > 0).length;

  return (
    <div className="bg-black border border-danger/10 p-5 corner-borders relative overflow-hidden">
      {/* Scanline effect */}
      <div className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          background: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,0,60,0.02) 3px, rgba(255,0,60,0.02) 6px)",
        }}
      />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-danger/30 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-danger/15 to-transparent" />

      {/* Header */}
      <div className="flex items-center justify-between mb-2 relative z-10">
        <div>
          <h3 className="text-[10px] font-mono text-danger tracking-wider">
            {">"} THREAT_MAP // DELHI NCR
          </h3>
          <p className="text-[7px] font-mono text-gray-700 tracking-wider">
            GEOSPATIAL CRIME DENSITY NETWORK
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 bg-danger rounded-full status-dot" />
            <span className="text-[7px] font-mono text-danger tracking-widest">SCANNING</span>
          </div>
          <span className="text-[9px] font-mono text-gray-500">
            <AnimatedNumber value={totalCrimes} /> <span className="text-[7px] text-gray-700">CASES</span>
          </span>
        </div>
      </div>

      {/* SVG Map */}
      <svg viewBox="0 0 300 320" className="w-full h-auto relative z-10" xmlns="http://www.w3.org/2000/svg">
        <defs>
          {/* Glow filters */}
          <filter id="hm-glow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="8" result="g1" />
            <feGaussianBlur stdDeviation="3" result="g2" />
            <feMerge>
              <feMergeNode in="g1" />
              <feMergeNode in="g2" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="hm-soft" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="12" />
          </filter>
          <filter id="hm-text" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1" result="g" />
            <feMerge><feMergeNode in="g" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>

          {/* Radar sweep gradient */}
          <linearGradient id="radar-line" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#ff003c" stopOpacity="0" />
            <stop offset="50%" stopColor="#ff003c" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#ff003c" stopOpacity="0" />
          </linearGradient>

          {/* Hexagonal clip for main boundary */}
          <radialGradient id="map-vignette" cx="50%" cy="50%" r="55%">
            <stop offset="60%" stopColor="#ff003c" stopOpacity="0.03" />
            <stop offset="100%" stopColor="#000" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Background grid - perspective feel */}
        <g stroke="#0d0d0d" strokeWidth="0.3" opacity="0.6">
          {Array.from({ length: 16 }, (_, i) => (
            <line key={`vg${i}`} x1={i * 20} y1="0" x2={i * 20} y2="320" />
          ))}
          {Array.from({ length: 17 }, (_, i) => (
            <line key={`hg${i}`} x1="0" y1={i * 20} x2="300" y2={i * 20} />
          ))}
        </g>

        {/* Coordinate markers */}
        <text x="4" y="10" fill="#1a1a1a" fontSize="5" fontFamily="JetBrains Mono">28.76°N</text>
        <text x="4" y="310" fill="#1a1a1a" fontSize="5" fontFamily="JetBrains Mono">28.48°N</text>
        <text x="256" y="318" fill="#1a1a1a" fontSize="5" fontFamily="JetBrains Mono">77.36°E</text>
        <text x="4" y="318" fill="#1a1a1a" fontSize="5" fontFamily="JetBrains Mono">77.02°E</text>

        {/* Delhi boundary - detailed polygon with double stroke */}
        <path
          d="M78,18 L105,10 L135,8 L170,9 L200,12 L230,18 L252,30 L268,55 L275,85 L278,110 L275,140 L270,168 L262,195 L252,222 L240,248 L225,268 L205,282 L180,292 L158,296 L135,294 L112,288 L90,276 L72,260 L56,240 L44,215 L36,190 L32,165 L30,138 L32,112 L36,88 L44,68 L55,48 L68,32 Z"
          fill="none" stroke="#ff003c" strokeWidth="0.8" strokeOpacity="0.12"
        />
        <path
          d="M78,18 L105,10 L135,8 L170,9 L200,12 L230,18 L252,30 L268,55 L275,85 L278,110 L275,140 L270,168 L262,195 L252,222 L240,248 L225,268 L205,282 L180,292 L158,296 L135,294 L112,288 L90,276 L72,260 L56,240 L44,215 L36,190 L32,165 L30,138 L32,112 L36,88 L44,68 L55,48 L68,32 Z"
          fill="url(#map-vignette)" stroke="#ff003c" strokeWidth="0.4" strokeOpacity="0.25"
          strokeDasharray="8 4 2 4"
        />

        {/* Network connection lines between zones - color intensity based on combined crime */}
        {ZONE_LINKS.map(([a, b]) => {
          const zA = zoneData[a], zB = zoneData[b];
          const combined = zA.count + zB.count;
          const maxCombined = Math.max(...ZONE_LINKS.map(([x, y]) => zoneData[x].count + zoneData[y].count), 1);
          const intensity = combined / maxCombined;
          const color = intensity > 0.6 ? "#ff003c" : intensity > 0.3 ? "#ff660066" : "#1a2a1a";
          return (
            <line key={`link-${a}-${b}`}
              x1={zA.cx} y1={zA.cy} x2={zB.cx} y2={zB.cy}
              stroke={color} strokeWidth={0.4 + intensity * 1.2}
              strokeOpacity={0.15 + intensity * 0.4}
              strokeDasharray={combined > 0 ? "none" : "3 6"}
            />
          );
        })}

        {/* Data flow particles along high-traffic links */}
        {ZONE_LINKS.filter(([a, b]) => zoneData[a].count + zoneData[b].count > 3).map(([a, b], i) => {
          const zA = zoneData[a], zB = zoneData[b];
          return (
            <circle key={`particle-${a}-${b}`} r="1.2" fill="#ff003c" opacity="0.7">
              <animateMotion
                dur={`${2.5 + i * 0.3}s`}
                repeatCount="indefinite"
                path={`M${zA.cx},${zA.cy} L${zB.cx},${zB.cy}`}
              />
            </circle>
          );
        })}

        {/* Zone hotspots */}
        {zoneData.map((zone) => (
          <g key={zone.name}>
            {/* Outer threat aura */}
            {zone.count > 0 && (
              <circle cx={zone.cx} cy={zone.cy} r={zone.glowRadius}
                fill={zone.color} opacity={0.06 + zone.ratio * 0.12}
                filter="url(#hm-soft)"
              />
            )}

            {/* Pulsing ring for high-threat zones */}
            {zone.count > 3 && (
              <>
                <circle cx={zone.cx} cy={zone.cy} r={zone.radius + 4}
                  fill="none" stroke={zone.color} strokeWidth="0.6"
                  opacity="0.4"
                  style={{
                    animation: `danger-aura ${Math.max(1.8 - zone.ratio * 0.8, 0.6)}s ease-in-out infinite`,
                    transformOrigin: `${zone.cx}px ${zone.cy}px`,
                  }}
                />
                <circle cx={zone.cx} cy={zone.cy} r={zone.radius + 8}
                  fill="none" stroke={zone.color} strokeWidth="0.3"
                  opacity="0.2"
                  style={{
                    animation: `danger-aura ${Math.max(2.2 - zone.ratio * 0.6, 0.8)}s ease-in-out infinite`,
                    animationDelay: "0.4s",
                    transformOrigin: `${zone.cx}px ${zone.cy}px`,
                  }}
                />
              </>
            )}

            {/* Hexagonal zone marker */}
            {zone.count > 0 ? (
              <polygon
                points={hexPoints(zone.cx, zone.cy, zone.radius * 0.75)}
                fill={zone.color} fillOpacity={0.08 + zone.ratio * 0.15}
                stroke={zone.color} strokeWidth={0.6 + zone.ratio}
                strokeOpacity={0.4 + zone.ratio * 0.5}
                filter="url(#hm-glow)"
              />
            ) : (
              <polygon
                points={hexPoints(zone.cx, zone.cy, 10)}
                fill="none" stroke="#111" strokeWidth="0.4"
                strokeDasharray="2 3"
              />
            )}

            {/* Inner diamond for count > 2 */}
            {zone.count > 2 && (
              <polygon
                points={diamondPoints(zone.cx, zone.cy, zone.radius * 0.35)}
                fill={zone.color} fillOpacity="0.15"
                stroke={zone.color} strokeWidth="0.4" strokeOpacity="0.6"
              />
            )}

            {/* Count text */}
            <text x={zone.cx} y={zone.cy + 1}
              fill={zone.count > 0 ? "#fff" : "#222"}
              fontSize={zone.count > 5 ? "11" : "9"}
              fontFamily="Orbitron" textAnchor="middle" dominantBaseline="middle"
              fontWeight="bold"
              filter={zone.count > 0 ? "url(#hm-text)" : undefined}
            >
              {zone.count}
            </text>

            {/* Zone label */}
            <text x={zone.cx} y={zone.cy + zone.radius * 0.75 + 10}
              fill={zone.count > 0 ? zone.color : "#1a1a1a"}
              fontSize="5.5" fontFamily="JetBrains Mono"
              textAnchor="middle" opacity={zone.count > 0 ? 0.8 : 0.3}
              letterSpacing="0.5"
            >
              {zone.shortName}
            </text>

            {/* Threat level micro-label */}
            {zone.count > 0 && (
              <text x={zone.cx} y={zone.cy - zone.radius * 0.75 - 5}
                fill={zone.color} fontSize="4" fontFamily="JetBrains Mono"
                textAnchor="middle" opacity="0.5" letterSpacing="1"
              >
                {zone.threat}
              </text>
            )}

            {/* Top crime type indicator */}
            {zone.topCrime && zone.count > 1 && (
              <text x={zone.cx} y={zone.cy + zone.radius * 0.75 + 17}
                fill="#333" fontSize="4" fontFamily="JetBrains Mono"
                textAnchor="middle" letterSpacing="0.3"
              >
                {zone.topCrime.toUpperCase()}
              </text>
            )}

            {/* Crosshair for hottest zone */}
            {zone.name === hottestZone.name && zone.count > 0 && (
              <g stroke="#ff003c" strokeWidth="0.4" opacity="0.5">
                <line x1={zone.cx - zone.radius - 6} y1={zone.cy} x2={zone.cx - zone.radius + 2} y2={zone.cy} />
                <line x1={zone.cx + zone.radius - 2} y1={zone.cy} x2={zone.cx + zone.radius + 6} y2={zone.cy} />
                <line x1={zone.cx} y1={zone.cy - zone.radius - 6} x2={zone.cx} y2={zone.cy - zone.radius + 2} />
                <line x1={zone.cx} y1={zone.cy + zone.radius - 2} x2={zone.cx} y2={zone.cy + zone.radius + 6} />
              </g>
            )}
          </g>
        ))}

        {/* Scan line animation */}
        <rect x="0" y="0" width="300" height="2" fill="url(#radar-line)" opacity="0.4">
          <animateTransform attributeName="transform" type="translate"
            values="0,0;0,320;0,0" dur="6s" repeatCount="indefinite" />
        </rect>

        {/* Corner brackets */}
        <g stroke="#ff003c" strokeWidth="0.6" opacity="0.3">
          <polyline points="5,15 5,5 15,5" fill="none" />
          <polyline points="285,5 295,5 295,15" fill="none" />
          <polyline points="5,305 5,315 15,315" fill="none" />
          <polyline points="285,315 295,315 295,305" fill="none" />
        </g>
      </svg>

      {/* Bottom HUD */}
      <div className="relative z-10 mt-2 space-y-2">
        {/* Hottest zone + active zones */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-danger status-dot" />
            <span className="text-[8px] font-mono text-gray-500 tracking-wider">
              HOTSPOT: <span className="text-danger font-bold">{hottestZone.name}</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[7px] font-mono text-gray-600">
              {activeZones}/{DELHI_ZONES.length} ZONES ACTIVE
            </span>
            <span className="text-[8px] font-mono text-danger font-bold">
              {hottestZone.count} CASES
            </span>
          </div>
        </div>

        {/* Threat level bar */}
        <div className="flex items-center gap-1 px-1">
          <span className="text-[6px] font-mono text-gray-700 w-10 tracking-wider">THREAT</span>
          <div className="flex-1 flex gap-px h-1.5">
            {zoneData
              .slice()
              .sort((a, b) => b.count - a.count)
              .map((z) => (
                <div key={z.name} className="flex-1 transition-colors duration-700"
                  style={{
                    backgroundColor: z.count > 0 ? z.color : "#0a0a0a",
                    boxShadow: z.count > 3 ? `0 0 4px ${z.color}50` : "none",
                  }}
                />
              ))}
          </div>
          <span className="text-[6px] font-mono text-gray-700 w-8 text-right tracking-wider">INDEX</span>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-2">
          {[
            { c: "#002200", l: "CLEAR" },
            { c: "#004400", l: "LOW" },
            { c: "#886600", l: "ELEV" },
            { c: "#bb4400", l: "HIGH" },
            { c: "#ff003c", l: "CRIT" },
          ].map((item) => (
            <div key={item.l} className="flex items-center gap-1">
              <svg width="8" height="8" viewBox="0 0 8 8">
                <polygon points="4,0.5 7.5,4 4,7.5 0.5,4" fill={item.c} stroke={item.c} strokeWidth="0.5" opacity="0.8" />
              </svg>
              <span className="text-[5.5px] font-mono text-gray-600 tracking-wider">{item.l}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function hexPoints(cx: number, cy: number, r: number): string {
  return Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
  }).join(" ");
}

function diamondPoints(cx: number, cy: number, r: number): string {
  return `${cx},${cy - r} ${cx + r},${cy} ${cx},${cy + r} ${cx - r},${cy}`;
}
