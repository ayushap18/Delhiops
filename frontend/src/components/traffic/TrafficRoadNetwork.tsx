import { useMemo } from "react";
import type { TrafficData } from "@/lib/api";

interface TrafficRoadNetworkProps {
  data: TrafficData[];
}

// Realistic Delhi road segments — curved paths following actual geography
const ROAD_SEGMENTS = [
  // Ring Road (ISBT → Ashram via east)
  { id: "ring-ne", name: "Ring Road NE", d: "M148,88 C170,86 195,92 210,108 C225,124 228,140 225,155", zone: "east", type: "highway" as const },
  { id: "ring-se", name: "Ring Road SE", d: "M225,155 C222,170 218,188 210,200 C200,215 185,225 168,230", zone: "south", type: "highway" as const },
  { id: "ring-sw", name: "Ring Road SW", d: "M168,230 C150,232 130,228 115,218 C100,208 90,195 85,180", zone: "south", type: "highway" as const },
  { id: "ring-nw", name: "Ring Road NW", d: "M85,180 C82,160 84,140 90,122 C96,104 110,92 130,88 L148,88", zone: "north", type: "highway" as const },

  // Outer Ring Road
  { id: "orr-n", name: "ORR North", d: "M55,55 C100,38 160,32 210,38 C240,42 258,52 268,65", zone: "north", type: "highway" as const },
  { id: "orr-e", name: "ORR East", d: "M268,65 C278,85 282,115 280,145 C278,175 270,210 258,240", zone: "east", type: "highway" as const },
  { id: "orr-s", name: "ORR South", d: "M258,240 C240,260 200,275 160,280 C120,282 85,272 60,255", zone: "south", type: "highway" as const },
  { id: "orr-w", name: "ORR West", d: "M60,255 C45,235 35,205 30,170 C28,135 32,100 40,75 L55,55", zone: "west", type: "highway" as const },

  // National Highways
  { id: "nh44-n", name: "NH-44 North", d: "M148,88 C146,65 144,42 140,15", zone: "north", type: "nh" as const },
  { id: "nh44-s", name: "NH-44 South", d: "M168,230 C172,255 175,275 178,300", zone: "south", type: "nh" as const },
  { id: "nh48", name: "NH-48 Jaipur", d: "M85,180 C60,200 40,225 18,258", zone: "southwest", type: "nh" as const },
  { id: "nh24", name: "NH-24 Lucknow", d: "M225,155 C248,148 268,138 290,125", zone: "east", type: "nh" as const },
  { id: "nh2", name: "NH-2 Mathura", d: "M210,200 C235,225 258,250 278,275", zone: "southeast", type: "nh" as const },
  { id: "gt-road", name: "GT Karnal Road", d: "M130,88 C118,65 105,40 92,15", zone: "north", type: "nh" as const },

  // Major arterials
  { id: "vikas", name: "Vikas Marg", d: "M170,140 C195,138 220,132 250,125", zone: "east", type: "arterial" as const },
  { id: "mathura-rd", name: "Mathura Road", d: "M170,155 C178,180 186,210 195,245", zone: "south", type: "arterial" as const },
  { id: "ito-corr", name: "ITO Corridor", d: "M130,148 C145,145 160,142 175,140", zone: "central", type: "arterial" as const },
  { id: "barapulla", name: "Barapulla Elev.", d: "M145,175 C170,178 195,182 218,188", zone: "central", type: "arterial" as const },
  { id: "mb-road", name: "MB Road", d: "M115,218 C108,240 100,260 92,280", zone: "south", type: "arterial" as const },
  { id: "rohtak-rd", name: "Rohtak Road", d: "M115,145 C95,140 72,135 48,128", zone: "west", type: "arterial" as const },
  { id: "dme", name: "DME", d: "M210,108 C232,88 255,68 280,48", zone: "northeast", type: "arterial" as const },
  { id: "aurobindo", name: "Aurobindo Marg", d: "M148,160 C140,185 132,210 125,235", zone: "south", type: "arterial" as const },
];

// Yamuna River path — distinguishing geographic feature
const YAMUNA_RIVER = "M195,10 C198,25 202,45 208,65 C214,85 222,100 228,115 C232,130 230,148 225,165 C220,182 215,198 212,215 C210,232 215,252 222,272 C228,288 235,300 242,315";

// Metro lines (simplified)
const METRO_LINES = [
  { id: "blue", d: "M55,145 C80,140 110,138 140,140 C165,142 190,145 220,150 C240,155 256,162 270,172", color: "#0066cc" },
  { id: "yellow", d: "M135,15 C136,40 138,70 142,100 C146,130 150,160 155,190 C160,220 165,250 170,285", color: "#ffcc00" },
  { id: "red", d: "M18,120 C40,118 65,115 95,118 C125,122 148,132 168,145 C188,158 205,172 225,185", color: "#cc0000" },
];

// Key intersections with more detail
const INTERSECTIONS = [
  { name: "ISBT", x: 148, y: 88, major: true },
  { name: "ITO", x: 170, y: 140, major: true },
  { name: "CP", x: 145, y: 148, major: true },
  { name: "AIIMS", x: 142, y: 178, major: true },
  { name: "DHAULA KUAN", x: 80, y: 172, major: true },
  { name: "SAKET", x: 130, y: 228, major: false },
  { name: "ASHRAM", x: 212, y: 195, major: true },
  { name: "ANAND VIHAR", x: 252, y: 132, major: false },
  { name: "KASHMERE G.", x: 142, y: 98, major: false },
  { name: "DWARKA", x: 42, y: 210, major: false },
  { name: "NEHRU PL.", x: 195, y: 215, major: false },
  { name: "PEERAGARHI", x: 52, y: 120, major: false },
  { name: "LAJPAT NGR", x: 192, y: 192, major: false },
  { name: "MOOLCHAND", x: 185, y: 175, major: false },
];

// District labels
const DISTRICTS = [
  { name: "NORTH", x: 130, y: 55 },
  { name: "CENTRAL", x: 155, y: 150 },
  { name: "SOUTH", x: 150, y: 250 },
  { name: "EAST", x: 248, y: 155 },
  { name: "WEST", x: 55, y: 165 },
  { name: "NE", x: 240, y: 72 },
  { name: "NW", x: 65, y: 72 },
  { name: "SW", x: 58, y: 242 },
  { name: "SE", x: 238, y: 248 },
];

function getCongestionColor(level: number): string {
  if (level >= 80) return "#cc0025";
  if (level >= 65) return "#cc4400";
  if (level >= 45) return "#cc8800";
  if (level >= 25) return "#2299aa";
  return "#118833";
}

export function TrafficRoadNetwork({ data }: TrafficRoadNetworkProps) {
  const roadData = useMemo(() => {
    const avgCongestion = data.length
      ? data.reduce((s, d) => s + d.congestion_level, 0) / data.length
      : 40;

    return ROAD_SEGMENTS.map((road, i) => {
      const variation = ((i * 13 + 5) % 50) - 25;
      const congestion = Math.max(5, Math.min(95, Math.round(avgCongestion + variation)));
      const baseWidth = road.type === "highway" ? 2.5 : road.type === "nh" ? 2.0 : 1.2;
      return {
        ...road,
        congestion,
        color: getCongestionColor(congestion),
        strokeWidth: baseWidth + (congestion / 100) * 1.2,
      };
    });
  }, [data]);

  const avgCongestion = useMemo(() => {
    if (!data.length) return 0;
    return Math.round(data.reduce((s, d) => s + d.congestion_level, 0) / data.length);
  }, [data]);

  return (
    <div className="bg-[#050808] border border-info/10 p-4 corner-borders relative overflow-hidden">
      {/* Subtle overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-5"
        style={{
          background: "radial-gradient(ellipse at 55% 45%, rgba(0,150,180,0.08) 0%, transparent 65%)",
        }}
      />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-info/20 to-transparent" />

      <div className="flex items-center justify-between mb-2 relative z-10">
        <div>
          <h3 className="text-[10px] font-mono text-info tracking-wider">
            {">"} DELHI_NCR // LIVE TRAFFIC MAP
          </h3>
          <p className="text-[7px] font-mono text-gray-700 tracking-wider">
            ROAD NETWORK + METRO OVERLAY + YAMUNA
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 bg-info rounded-full status-dot" />
            <span className="text-[7px] font-mono text-info tracking-widest">LIVE</span>
          </div>
          <span className="text-[8px] font-mono tabular-nums"
            style={{ color: getCongestionColor(avgCongestion) }}>
            {avgCongestion}%
          </span>
        </div>
      </div>

      <svg viewBox="0 0 310 320" className="w-full h-auto relative z-10" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="rn-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="g" />
            <feMerge><feMergeNode in="g" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="river-glow" x="-30%" y="-10%" width="160%" height="120%">
            <feGaussianBlur stdDeviation="4" result="g" />
            <feMerge><feMergeNode in="g" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <linearGradient id="rn-scan" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00d4ff" stopOpacity="0" />
            <stop offset="50%" stopColor="#00d4ff" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#00d4ff" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="yamuna-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0a3355" />
            <stop offset="50%" stopColor="#0d4466" />
            <stop offset="100%" stopColor="#0a3355" />
          </linearGradient>
        </defs>

        {/* Subtle grid - very faint */}
        <g stroke="#0a0f10" strokeWidth="0.2" opacity="0.5">
          {Array.from({ length: 16 }, (_, i) => (
            <line key={`v${i}`} x1={i * 20} y1="0" x2={i * 20} y2="320" />
          ))}
          {Array.from({ length: 17 }, (_, i) => (
            <line key={`h${i}`} x1="0" y1={i * 20} x2="310" y2={i * 20} />
          ))}
        </g>

        {/* Coordinate markers */}
        <text x="4" y="10" fill="#0d1a1a" fontSize="4.5" fontFamily="JetBrains Mono">28.76°N</text>
        <text x="4" y="315" fill="#0d1a1a" fontSize="4.5" fontFamily="JetBrains Mono">28.48°N</text>
        <text x="262" y="315" fill="#0d1a1a" fontSize="4.5" fontFamily="JetBrains Mono">77.36°E</text>

        {/* Delhi NCT boundary — realistic shape */}
        <path
          d="M78,18 C90,12 110,8 135,8 C165,9 190,12 210,18 C230,25 248,38 260,55 C272,72 278,95 280,120 C282,148 278,178 270,205 C262,228 248,248 232,262 C215,276 195,286 172,292 C150,296 128,294 108,286 C88,278 72,264 60,248 C48,230 38,208 34,185 C30,162 30,138 34,115 C38,92 48,72 62,55 C72,42 78,18 78,18 Z"
          fill="none" stroke="#1a2a2a" strokeWidth="0.8"
          strokeDasharray="4 3"
        />

        {/* District boundaries — very subtle */}
        {/* Horizontal divider ~ central */}
        <line x1="40" y1="135" x2="275" y2="135" stroke="#0d1515" strokeWidth="0.3" strokeDasharray="8 6" />
        {/* Vertical divider */}
        <line x1="155" y1="15" x2="155" y2="295" stroke="#0d1515" strokeWidth="0.3" strokeDasharray="8 6" />
        {/* Diagonal — river side */}
        <line x1="200" y1="15" x2="230" y2="295" stroke="#0d1515" strokeWidth="0.3" strokeDasharray="8 6" />

        {/* District labels — very faint */}
        {DISTRICTS.map((d) => (
          <text key={d.name} x={d.x} y={d.y}
            fill="#0f1a1a" fontSize="6" fontFamily="JetBrains Mono"
            textAnchor="middle" letterSpacing="2" fontWeight="bold">
            {d.name}
          </text>
        ))}

        {/* Yamuna River */}
        <path d={YAMUNA_RIVER} fill="none" stroke="#0a3355"
          strokeWidth="12" strokeOpacity="0.3" strokeLinecap="round"
          filter="url(#river-glow)"
        />
        <path d={YAMUNA_RIVER} fill="none" stroke="#0d4466"
          strokeWidth="5" strokeOpacity="0.5" strokeLinecap="round"
        />
        <path d={YAMUNA_RIVER} fill="none" stroke="#1a5577"
          strokeWidth="2" strokeOpacity="0.6" strokeLinecap="round"
        />
        {/* River label */}
        <text x="232" y="165" fill="#0d4466" fontSize="5" fontFamily="JetBrains Mono"
          textAnchor="middle" letterSpacing="3" opacity="0.5"
          transform="rotate(78, 232, 165)">
          YAMUNA
        </text>

        {/* Metro lines — underneath roads */}
        {METRO_LINES.map((metro) => (
          <g key={metro.id}>
            <path d={metro.d} fill="none" stroke={metro.color}
              strokeWidth="1" strokeOpacity="0.12" strokeDasharray="4 3"
            />
          </g>
        ))}

        {/* Road segments — main layer */}
        {roadData.map((road) => (
          <g key={road.id}>
            {/* Road casing (dark outline) */}
            <path d={road.d} fill="none" stroke="#080a0a"
              strokeWidth={road.strokeWidth + 1.5}
              strokeLinecap="round" strokeLinejoin="round"
            />
            {/* Congestion glow for busy roads */}
            {road.congestion > 50 && (
              <path d={road.d} fill="none" stroke={road.color}
                strokeWidth={road.strokeWidth + 4} strokeOpacity="0.06"
                filter="url(#rn-glow)" strokeLinecap="round"
              />
            )}
            {/* Main road surface */}
            <path d={road.d} fill="none" stroke={road.color}
              strokeWidth={road.strokeWidth}
              strokeOpacity={0.35 + (road.congestion / 100) * 0.55}
              strokeLinecap="round" strokeLinejoin="round"
            />
            {/* Center line for highways */}
            {road.type === "highway" && (
              <path d={road.d} fill="none" stroke={road.color}
                strokeWidth="0.3" strokeOpacity="0.3"
                strokeDasharray="3 4" strokeLinecap="round"
              />
            )}
            {/* Animated vehicle dot for congested roads */}
            {road.congestion > 45 && (
              <circle r={road.type === "highway" ? "1.5" : "1"} fill={road.color} opacity="0.7">
                <animateMotion dur={`${7 - road.congestion / 20}s`} repeatCount="indefinite"
                  path={road.d} />
              </circle>
            )}
          </g>
        ))}

        {/* Intersections */}
        {INTERSECTIONS.map((node) => (
          <g key={node.name}>
            {/* Outer ring for major */}
            {node.major && (
              <circle cx={node.x} cy={node.y} r="5"
                fill="none" stroke="#00d4ff" strokeWidth="0.3" strokeOpacity="0.2"
              />
            )}
            {/* Junction marker */}
            <circle cx={node.x} cy={node.y} r={node.major ? "3" : "2"}
              fill="#080a0a" stroke="#11aabb" strokeWidth={node.major ? "0.8" : "0.5"}
              strokeOpacity={node.major ? "0.5" : "0.3"}
            />
            <circle cx={node.x} cy={node.y} r={node.major ? "1.2" : "0.8"}
              fill="#11aabb" opacity={node.major ? "0.5" : "0.3"}
            />
            {/* Label */}
            <text x={node.x} y={node.y + (node.major ? 10 : 8)}
              fill="#11aabb" fontSize={node.major ? "4.5" : "3.8"} fontFamily="JetBrains Mono"
              textAnchor="middle" opacity={node.major ? "0.5" : "0.3"}
              letterSpacing="0.3">
              {node.name}
            </text>
          </g>
        ))}

        {/* Scan line */}
        <rect x="0" y="0" width="310" height="2" fill="url(#rn-scan)" opacity="0.2">
          <animateTransform attributeName="transform" type="translate"
            values="0,0;0,320;0,0" dur="10s" repeatCount="indefinite" />
        </rect>

        {/* Corner brackets */}
        <g stroke="#11aabb" strokeWidth="0.4" opacity="0.15">
          <polyline points="5,12 5,5 12,5" fill="none" />
          <polyline points="298,5 305,5 305,12" fill="none" />
          <polyline points="5,308 5,315 12,315" fill="none" />
          <polyline points="298,315 305,315 305,308" fill="none" />
        </g>

        {/* North arrow */}
        <g transform="translate(285,25)" opacity="0.3">
          <line x1="0" y1="12" x2="0" y2="0" stroke="#11aabb" strokeWidth="0.6" />
          <polygon points="0,0 -3,5 3,5" fill="#11aabb" />
          <text x="0" y="18" fill="#11aabb" fontSize="4" fontFamily="JetBrains Mono"
            textAnchor="middle" letterSpacing="0.5">N</text>
        </g>
      </svg>

      {/* Legend */}
      <div className="relative z-10 mt-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {[
            { c: "#118833", l: "FREE" },
            { c: "#2299aa", l: "LIGHT" },
            { c: "#cc8800", l: "MODERATE" },
            { c: "#cc4400", l: "HEAVY" },
            { c: "#cc0025", l: "GRIDLOCK" },
          ].map((item) => (
            <div key={item.l} className="flex items-center gap-0.5">
              <div className="w-3 h-[2px]" style={{ backgroundColor: item.c, opacity: 0.8 }} />
              <span className="text-[4.5px] font-mono text-gray-700 tracking-wider">{item.l}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5">
            <div className="w-3 h-[1px]" style={{ borderTop: "1px dashed #0d4466" }} />
            <span className="text-[4.5px] font-mono text-gray-700 tracking-wider">YAMUNA</span>
          </div>
          <div className="flex items-center gap-0.5">
            <div className="w-3 h-[1px]" style={{ borderTop: "1px dashed #ffcc00", opacity: 0.3 }} />
            <span className="text-[4.5px] font-mono text-gray-700 tracking-wider">METRO</span>
          </div>
        </div>
      </div>
    </div>
  );
}
