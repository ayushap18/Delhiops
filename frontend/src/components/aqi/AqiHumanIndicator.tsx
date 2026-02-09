import { useMemo } from "react";
import { getAqiLevel } from "@/lib/utils";
import { AnimatedNumber } from "@/components/shared/AnimatedNumber";

interface AqiHumanIndicatorProps {
  aqi: number;
}

function getAqiColor(aqi: number): string {
  if (aqi <= 50) return "#00ff41";
  if (aqi <= 100) return "#ffb800";
  if (aqi <= 200) return "#ff6600";
  if (aqi <= 300) return "#ff003c";
  return "#990000";
}

function getStatusMessage(aqi: number): string {
  if (aqi <= 50) return "AIR QUALITY: OPTIMAL";
  if (aqi <= 100) return "CAUTION: MODERATE RISK";
  if (aqi <= 200) return "WARNING: MASK ADVISED";
  if (aqi <= 300) return "ALERT: STAY INDOORS";
  return "CRITICAL: HAZARDOUS";
}

function getBreathDuration(aqi: number): number {
  if (aqi <= 50) return 3;
  if (aqi <= 100) return 2.2;
  if (aqi <= 200) return 1.4;
  if (aqi <= 300) return 0.9;
  return 0.6;
}

const PARTICLES = [
  { cx: 30, cy: 60, d: 0, i: 0 },
  { cx: 270, cy: 75, d: 0.3, i: 1 },
  { cx: 45, cy: 180, d: 0.7, i: 2 },
  { cx: 258, cy: 200, d: 1.1, i: 3 },
  { cx: 25, cy: 320, d: 0.5, i: 4 },
  { cx: 278, cy: 340, d: 1.4, i: 5 },
  { cx: 70, cy: 35, d: 1.8, i: 6 },
  { cx: 235, cy: 42, d: 0.9, i: 7 },
  { cx: 35, cy: 140, d: 2.1, i: 8 },
  { cx: 265, cy: 150, d: 1.6, i: 9 },
  { cx: 55, cy: 270, d: 0.2, i: 10 },
  { cx: 250, cy: 280, d: 1.3, i: 11 },
  { cx: 150, cy: 15, d: 0.6, i: 12 },
  { cx: 150, cy: 470, d: 1.0, i: 13 },
  { cx: 40, cy: 420, d: 0.8, i: 14 },
  { cx: 265, cy: 440, d: 1.7, i: 15 },
];

export function AqiHumanIndicator({ aqi }: AqiHumanIndicatorProps) {
  const color = useMemo(() => getAqiColor(aqi), [aqi]);
  const level = getAqiLevel(aqi);
  const statusMsg = getStatusMessage(aqi);
  const breathDuration = getBreathDuration(aqi);
  const particleCount = aqi <= 50 ? 4 : aqi <= 100 ? 7 : aqi <= 200 ? 11 : 16;
  const auraOpacity = Math.min(0.06 + (aqi / 500) * 0.24, 0.3);
  const auraPulse = Math.max(3 - (aqi / 500) * 2, 0.8);

  const CW = 1.2;   // contour width
  const MW = 0.5;    // mesh width
  const DW = 0.3;    // detail width
  const MO = 0.55;   // mesh opacity

  return (
    <div className="flex flex-col items-center p-4 bg-black border border-brand/10 corner-borders relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand/20 to-transparent" />
      <p className="text-[9px] text-gray-600 font-mono tracking-[0.2em] mb-2 relative z-10">
        BIOMETRIC WIREFRAME MODEL
      </p>

      <div className="relative" style={{ perspective: "1200px", transformStyle: "preserve-3d" }}>
        <div style={{ transform: "rotateY(-4deg) rotateX(2deg)", transformStyle: "preserve-3d" }}>
          <svg viewBox="0 0 300 500" className="w-56 h-[300px] lg:w-64 lg:h-[340px]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              {/* Wireframe glow — sharp line + soft bloom */}
              <filter id="wire-glow" x="-25%" y="-25%" width="150%" height="150%">
                <feGaussianBlur stdDeviation="1.5" result="g1" />
                <feGaussianBlur stdDeviation="4" result="g2" in="SourceGraphic" />
                <feMerge>
                  <feMergeNode in="g2" />
                  <feMergeNode in="g1" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              {/* Bloom for ambient aura */}
              <filter id="bloom" x="-60%" y="-60%" width="220%" height="220%">
                <feGaussianBlur stdDeviation="12" />
              </filter>
              {/* Particle glow */}
              <filter id="pg" x="-200%" y="-200%" width="500%" height="500%">
                <feGaussianBlur stdDeviation="4" />
              </filter>
              {/* Vertex dot glow */}
              <filter id="vg" x="-150%" y="-150%" width="400%" height="400%">
                <feGaussianBlur stdDeviation="1.5" result="vglow" />
                <feMerge>
                  <feMergeNode in="vglow" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* ===== AMBIENT BODY AURA ===== */}
            <ellipse cx="150" cy="260" rx="80" ry="200" fill={color} opacity={auraOpacity}
              filter="url(#bloom)"
              style={{ animation: `danger-aura ${auraPulse}s ease-in-out infinite`, transformOrigin: "150px 260px" }}
            />

            {/* ===== POLLUTION PARTICLES ===== */}
            {PARTICLES.slice(0, particleCount).map((p) => (
              <circle key={p.i} cx={p.cx} cy={p.cy} r={aqi > 200 ? 3 : 2} fill={color}
                opacity={0.25 + (aqi / 500) * 0.45} filter="url(#pg)"
                style={{ animation: `float-particle-${(p.i % 3) + 1} ${2.5 + (p.i % 3) * 0.7}s ease-in-out ${p.d}s infinite alternate` }}
              />
            ))}

            {/* ================================================================ */}
            {/*    WIREFRAME POLYGON MESH HUMAN — ANATOMICAL POSITION           */}
            {/*    All stroke-only, no fills — cyberpunk hologram aesthetic     */}
            {/* ================================================================ */}

            <g filter="url(#wire-glow)">

              {/* ===== HEAD — Sphere wireframe ===== */}
              <g stroke={color} fill="none">
                {/* Main cranium contour */}
                <ellipse cx="150" cy="50" rx="24" ry="30" strokeWidth={CW} />

                {/* Horizontal latitude rings */}
                <ellipse cx="150" cy="26" rx="12" ry="2.5" strokeWidth={MW} opacity={MO} />
                <ellipse cx="150" cy="33" rx="18" ry="3" strokeWidth={MW} opacity={MO} />
                <ellipse cx="150" cy="40" rx="22" ry="3.5" strokeWidth={MW} opacity={MO} />
                <ellipse cx="150" cy="48" rx="24" ry="3.5" strokeWidth={MW} opacity={MO} />
                <ellipse cx="150" cy="56" rx="23" ry="3.5" strokeWidth={MW} opacity={MO} />
                <ellipse cx="150" cy="63" rx="20" ry="3" strokeWidth={MW} opacity={MO * 0.9} />
                <ellipse cx="150" cy="70" rx="16" ry="2.5" strokeWidth={MW} opacity={MO * 0.8} />
                <ellipse cx="150" cy="76" rx="8" ry="1.5" strokeWidth={MW} opacity={MO * 0.7} />

                {/* Vertical meridians */}
                <path d="M150,20 L150,80" strokeWidth={MW} opacity={MO} />
                <path d="M138,22 C136,35 134,48 134,52 C134,60 136,68 140,78" strokeWidth={DW} opacity={MO * 0.7} />
                <path d="M162,22 C164,35 166,48 166,52 C166,60 164,68 160,78" strokeWidth={DW} opacity={MO * 0.7} />
                <path d="M128,28 C127,40 126,48 126,52 C126,58 128,65 133,74" strokeWidth={DW} opacity={MO * 0.6} />
                <path d="M172,28 C173,40 174,48 174,52 C174,58 172,65 167,74" strokeWidth={DW} opacity={MO * 0.6} />

                {/* Cranium mesh triangulation */}
                <path d="M138,22 L150,20 L162,22" strokeWidth={DW} opacity={MO * 0.5} />
                <path d="M128,28 L138,22" strokeWidth={DW} opacity={MO * 0.4} />
                <path d="M172,28 L162,22" strokeWidth={DW} opacity={MO * 0.4} />
                <path d="M128,28 L138,33 L126,40" strokeWidth={DW} opacity={MO * 0.4} />
                <path d="M172,28 L162,33 L174,40" strokeWidth={DW} opacity={MO * 0.4} />
                <path d="M138,22 L150,26 L162,22" strokeWidth={DW} opacity={MO * 0.35} />
                <path d="M128,33 L138,33" strokeWidth={DW} opacity={MO * 0.3} />
                <path d="M172,33 L162,33" strokeWidth={DW} opacity={MO * 0.3} />

                {/* Eye sockets — hexagonal wireframe */}
                <path d="M136,44 L140,41 L145,41 L148,44 L145,47 L140,47 Z" strokeWidth={MW} opacity="0.75" />
                <path d="M152,44 L155,41 L160,41 L164,44 L160,47 L155,47 Z" strokeWidth={MW} opacity="0.75" />
                {/* Pupil dots */}
                <circle cx="142" cy="44" r="1.5" strokeWidth={DW} opacity="0.65" />
                <circle cx="158" cy="44" r="1.5" strokeWidth={DW} opacity="0.65" />

                {/* Nose wireframe — polygon */}
                <path d="M150,44 L148,51 L145,56 L148,57 L150,58 L152,57 L155,56 L152,51 Z" strokeWidth={DW} opacity="0.55" />

                {/* Mouth wireframe */}
                <path d="M143,63 L146,61 L150,62 L154,61 L157,63 L154,65 L150,66 L146,65 Z" strokeWidth={DW} opacity="0.45" />

                {/* Jaw structure */}
                <path d="M126,52 L130,63 L138,72 L150,78 L162,72 L170,63 L174,52" strokeWidth={MW} opacity={MO * 0.7} />
                <path d="M130,58 L138,68 L144,74" strokeWidth={DW} opacity={MO * 0.4} />
                <path d="M170,58 L162,68 L156,74" strokeWidth={DW} opacity={MO * 0.4} />

                {/* Ears — polygon wireframe */}
                <path d="M126,40 L121,38 L118,42 L117,48 L118,53 L121,55 L125,53 L126,48" strokeWidth={MW} opacity="0.45" />
                <path d="M119,42 L121,48 L119,52" strokeWidth={DW} opacity="0.3" />
                <path d="M174,40 L179,38 L182,42 L183,48 L182,53 L179,55 L175,53 L174,48" strokeWidth={MW} opacity="0.45" />
                <path d="M181,42 L179,48 L181,52" strokeWidth={DW} opacity="0.3" />
              </g>

              {/* ===== NECK — Cylindrical wireframe ===== */}
              <g stroke={color} fill="none">
                <line x1="140" y1="78" x2="136" y2="100" strokeWidth={CW} opacity="0.8" />
                <line x1="160" y1="78" x2="164" y2="100" strokeWidth={CW} opacity="0.8" />
                {/* Cross-section rings */}
                <ellipse cx="150" cy="84" rx="12" ry="3" strokeWidth={MW} opacity={MO * 0.6} />
                <ellipse cx="150" cy="90" rx="13" ry="3" strokeWidth={MW} opacity={MO * 0.6} />
                <ellipse cx="150" cy="96" rx="14" ry="3" strokeWidth={MW} opacity={MO * 0.6} />
                {/* Vertical mesh */}
                <line x1="150" y1="78" x2="150" y2="100" strokeWidth={DW} opacity={MO * 0.5} />
                <line x1="145" y1="78" x2="143" y2="100" strokeWidth={DW} opacity={MO * 0.4} />
                <line x1="155" y1="78" x2="157" y2="100" strokeWidth={DW} opacity={MO * 0.4} />
                {/* SCM muscle lines */}
                <path d="M142,80 L134,96" strokeWidth={DW} opacity={MO * 0.3} />
                <path d="M158,80 L166,96" strokeWidth={DW} opacity={MO * 0.3} />
                {/* Mesh triangulation */}
                <path d="M140,84 L150,90 L140,90" strokeWidth={DW} opacity={MO * 0.25} />
                <path d="M160,84 L150,90 L160,90" strokeWidth={DW} opacity={MO * 0.25} />
              </g>

              {/* ===== TORSO — Breathing wireframe mesh ===== */}
              <g style={{ animation: `human-breathe ${breathDuration}s ease-in-out infinite`, transformOrigin: "150px 180px" }}>
                <g stroke={color} fill="none">

                  {/* Outer body contour — shoulders to waist */}
                  <path d="M136,100 L128,102 L112,104 L98,108 L88,114 L83,122 L82,132 L84,145
                    L88,158 L92,172 L97,185 L102,198 L106,210 L110,220 L115,232 L120,244 L126,254 L130,260"
                    strokeWidth={CW} />
                  <path d="M164,100 L172,102 L188,104 L202,108 L212,114 L217,122 L218,132 L216,145
                    L212,158 L208,172 L203,185 L198,198 L194,210 L190,220 L185,232 L180,244 L174,254 L170,260"
                    strokeWidth={CW} />
                  {/* Waist to hips */}
                  <path d="M130,260 L128,268 L130,274 L136,280" strokeWidth={CW} />
                  <path d="M170,260 L172,268 L170,274 L164,280" strokeWidth={CW} />

                  {/* Clavicle line */}
                  <path d="M88,114 L100,108 L118,104 L135,102 L150,101 L165,102 L182,104 L200,108 L212,114"
                    strokeWidth={MW} opacity="0.65" />

                  {/* === RIBCAGE wireframe arcs === */}
                  {[118, 126, 134, 142, 150, 158, 166, 174, 182].map((y, idx) => {
                    const spread = Math.max(32 - idx * 1.5, 18);
                    const curve = 3.5 + idx * 0.4;
                    return (
                      <path key={`rib-${y}`}
                        d={`M${150 - spread},${y} C${150 - spread + 6},${y + curve} ${150 - 10},${y + curve + 1} 150,${y + curve + 1.5} C${150 + 10},${y + curve + 1} ${150 + spread - 6},${y + curve} ${150 + spread},${y}`}
                        strokeWidth={MW} opacity={MO * (0.6 - idx * 0.04)} />
                    );
                  })}

                  {/* === SPINE — centerline with vertebrae === */}
                  <line x1="150" y1="100" x2="150" y2="278" strokeWidth={MW} opacity={MO * 0.55} />
                  {/* Vertebrae dots */}
                  {[105, 112, 119, 126, 133, 140, 147, 154, 161, 168, 175, 182, 189, 196, 203, 210, 218, 226, 234, 242, 250, 258, 266, 274].map((y) => (
                    <circle key={`v-${y}`} cx="150" cy={y} r="0.9" fill={color} fillOpacity="0.35" strokeWidth="0" />
                  ))}

                  {/* === PECTORAL mesh === */}
                  {/* Left pec outline */}
                  <path d="M120,114 C124,110 134,108 148,110 L148,120 C146,128 140,134 132,134 C124,132 120,126 118,120 Z"
                    strokeWidth={MW} opacity={MO * 0.5} />
                  {/* Right pec outline */}
                  <path d="M180,114 C176,110 166,108 152,110 L152,120 C154,128 160,134 168,134 C176,132 180,126 182,120 Z"
                    strokeWidth={MW} opacity={MO * 0.5} />
                  {/* Pec mesh lines */}
                  <path d="M122,116 L145,111" strokeWidth={DW} opacity={MO * 0.35} />
                  <path d="M120,122 L146,114" strokeWidth={DW} opacity={MO * 0.35} />
                  <path d="M122,128 L142,120" strokeWidth={DW} opacity={MO * 0.35} />
                  <path d="M178,116 L155,111" strokeWidth={DW} opacity={MO * 0.35} />
                  <path d="M180,122 L154,114" strokeWidth={DW} opacity={MO * 0.35} />
                  <path d="M178,128 L158,120" strokeWidth={DW} opacity={MO * 0.35} />
                  {/* Sternum */}
                  <line x1="150" y1="105" x2="150" y2="142" strokeWidth={MW} opacity={MO * 0.45} />

                  {/* === ABDOMINAL mesh grid === */}
                  {/* Rectus abdominis borders */}
                  <path d="M140,140 L138,255" strokeWidth={DW} opacity={MO * 0.4} />
                  <path d="M160,140 L162,255" strokeWidth={DW} opacity={MO * 0.4} />
                  {/* Tendinous intersections (abs) */}
                  {[148, 160, 172, 184, 196, 208, 220, 232, 244].map((y) => (
                    <line key={`abs-${y}`} x1="138" y1={y} x2="162" y2={y} strokeWidth={DW} opacity={MO * 0.3} />
                  ))}
                  {/* External oblique mesh */}
                  <path d="M118,140 L132,158 L138,172" strokeWidth={DW} opacity={MO * 0.25} />
                  <path d="M115,158 L128,175 L136,190" strokeWidth={DW} opacity={MO * 0.25} />
                  <path d="M112,175 L126,195 L134,208" strokeWidth={DW} opacity={MO * 0.25} />
                  <path d="M110,195 L124,215 L132,225" strokeWidth={DW} opacity={MO * 0.25} />
                  <path d="M182,140 L168,158 L162,172" strokeWidth={DW} opacity={MO * 0.25} />
                  <path d="M185,158 L172,175 L164,190" strokeWidth={DW} opacity={MO * 0.25} />
                  <path d="M188,175 L174,195 L166,208" strokeWidth={DW} opacity={MO * 0.25} />
                  <path d="M190,195 L176,215 L168,225" strokeWidth={DW} opacity={MO * 0.25} />
                  {/* Navel */}
                  <circle cx="150" cy="212" r="3" strokeWidth={MW} opacity="0.4" />
                  {/* V-cut inguinal lines */}
                  <path d="M116,235 L126,255 L136,272 L146,280" strokeWidth={MW} opacity={MO * 0.45} />
                  <path d="M184,235 L174,255 L164,272 L154,280" strokeWidth={MW} opacity={MO * 0.45} />

                  {/* === Body cross-section rings === */}
                  {[112, 128, 144, 160, 176, 192, 208, 224, 240, 256].map((y, idx) => {
                    const hw = y < 120 ? 62 : y < 180 ? 58 - (y - 120) * 0.12 : y < 240 ? 50 - (y - 180) * 0.08 : 44;
                    return (
                      <ellipse key={`ring-${y}`} cx="150" cy={y} rx={hw} ry="4"
                        strokeWidth={DW} opacity={MO * 0.25} />
                    );
                  })}

                  {/* === Torso mesh triangulation (diagonal connections) === */}
                  {/* Left side diagonals */}
                  <path d="M88,114 L84,132" strokeWidth={DW} opacity={MO * 0.2} />
                  <path d="M84,132 L88,145" strokeWidth={DW} opacity={MO * 0.2} />
                  <path d="M88,145 L92,158" strokeWidth={DW} opacity={MO * 0.2} />
                  <path d="M92,158 L97,172" strokeWidth={DW} opacity={MO * 0.2} />
                  <path d="M97,172 L102,185" strokeWidth={DW} opacity={MO * 0.2} />
                  <path d="M102,185 L106,198" strokeWidth={DW} opacity={MO * 0.2} />
                  <path d="M106,198 L110,210" strokeWidth={DW} opacity={MO * 0.2} />
                  <path d="M110,210 L115,220" strokeWidth={DW} opacity={MO * 0.2} />
                  {/* Right side diagonals */}
                  <path d="M212,114 L216,132" strokeWidth={DW} opacity={MO * 0.2} />
                  <path d="M216,132 L212,145" strokeWidth={DW} opacity={MO * 0.2} />
                  <path d="M212,145 L208,158" strokeWidth={DW} opacity={MO * 0.2} />
                  <path d="M208,158 L203,172" strokeWidth={DW} opacity={MO * 0.2} />
                  <path d="M203,172 L198,185" strokeWidth={DW} opacity={MO * 0.2} />
                  <path d="M198,185 L194,198" strokeWidth={DW} opacity={MO * 0.2} />
                  <path d="M194,198 L190,210" strokeWidth={DW} opacity={MO * 0.2} />
                  <path d="M190,210 L185,220" strokeWidth={DW} opacity={MO * 0.2} />
                  {/* Cross triangulation — connecting contour to spine */}
                  <path d="M88,114 L150,112" strokeWidth={DW} opacity={MO * 0.15} />
                  <path d="M84,145 L150,144" strokeWidth={DW} opacity={MO * 0.15} />
                  <path d="M92,172 L150,176" strokeWidth={DW} opacity={MO * 0.15} />
                  <path d="M106,210 L150,208" strokeWidth={DW} opacity={MO * 0.15} />
                  <path d="M212,114 L150,112" strokeWidth={DW} opacity={MO * 0.15} />
                  <path d="M216,145 L150,144" strokeWidth={DW} opacity={MO * 0.15} />
                  <path d="M208,172 L150,176" strokeWidth={DW} opacity={MO * 0.15} />
                  <path d="M194,210 L150,208" strokeWidth={DW} opacity={MO * 0.15} />

                  {/* === LUNGS (glowing inside ribcage) === */}
                  <g style={{ animation: `human-breathe ${breathDuration}s ease-in-out infinite`, transformOrigin: "150px 140px" }}>
                    <ellipse cx="132" cy="140" rx="16" ry="24" strokeWidth={MW} opacity="0.35" />
                    <ellipse cx="168" cy="140" rx="16" ry="24" strokeWidth={MW} opacity="0.35" />
                    {/* Lung internal mesh */}
                    <path d="M126,128 L138,130 M124,138 L140,140 M126,148 L138,150 M130,158 L136,158" strokeWidth={DW} opacity="0.22" />
                    <path d="M174,128 L162,130 M176,138 L160,140 M174,148 L162,150 M170,158 L164,158" strokeWidth={DW} opacity="0.22" />
                    {/* Bronchi */}
                    <path d="M150,120 L142,130 L136,142 M142,130 L140,135" strokeWidth={DW} opacity="0.3" />
                    <path d="M150,120 L158,130 L164,142 M158,130 L160,135" strokeWidth={DW} opacity="0.3" />
                  </g>

                  {/* === HEART — pulsing wireframe === */}
                  <g style={{ animation: `danger-aura ${Math.max(breathDuration * 0.45, 0.35)}s ease-in-out infinite`, transformOrigin: "150px 132px" }}>
                    <circle cx="150" cy="132" r="7" strokeWidth={MW} opacity="0.45" />
                    <circle cx="150" cy="132" r="3.5" strokeWidth={DW} opacity="0.3" />
                    <path d="M143,132 L157,132 M150,125 L150,139" strokeWidth={DW} opacity="0.2" />
                  </g>

                  {/* === PELVIS wireframe === */}
                  <path d="M120,254 C124,250 132,248 138,250 L142,258 L148,270 L150,278 L152,270 L158,258 L162,250 C168,248 176,250 180,254 L178,264 L174,272 L168,278 L150,282 L132,278 L126,272 L122,264 Z"
                    strokeWidth={MW} opacity={MO * 0.45} />
                  {/* Pelvis internal mesh */}
                  <path d="M138,250 L150,262 L162,250" strokeWidth={DW} opacity={MO * 0.25} />
                  <path d="M128,262 L150,272 L172,262" strokeWidth={DW} opacity={MO * 0.25} />
                  <path d="M130,270 L150,278 L170,270" strokeWidth={DW} opacity={MO * 0.2} />
                </g>
              </g>

              {/* ===== LEFT ARM — Wireframe mesh ===== */}
              <g stroke={color} fill="none">
                {/* Shoulder joint */}
                <circle cx="88" cy="114" r="8" strokeWidth={MW} opacity="0.5" />
                <circle cx="88" cy="114" r="4" strokeWidth={DW} opacity="0.3" />
                <path d="M80,114 L96,114 M88,106 L88,122" strokeWidth={DW} opacity="0.2" />

                {/* Upper arm contour */}
                <path d="M82,120 C78,138 72,158 67,178 C64,190 60,200 57,210" strokeWidth={CW} opacity="0.8" />
                <path d="M94,120 C90,138 84,158 79,178 C76,190 72,200 69,210" strokeWidth={CW} opacity="0.8" />

                {/* Upper arm cross-section rings */}
                {[132, 148, 164, 180, 196].map((y, idx) => {
                  const xOff = 88 - idx * 5;
                  return (
                    <ellipse key={`la-${y}`} cx={xOff} cy={y} rx="7" ry="3"
                      strokeWidth={DW} opacity={MO * 0.4}
                      transform={`rotate(-12, ${xOff}, ${y})`} />
                  );
                })}

                {/* Muscle topology lines */}
                <path d="M86,124 C84,142 80,160 76,178 C74,186 72,194 70,202" strokeWidth={DW} opacity={MO * 0.35} />
                <path d="M90,122 C86,142 80,162 76,182" strokeWidth={DW} opacity={MO * 0.25} />
                {/* Mesh triangulation diagonals */}
                <path d="M82,132 L88,148 M94,132 L88,148 M82,148 L78,164 M90,148 L84,164 M78,164 L73,180 M84,164 L79,180" strokeWidth={DW} opacity={MO * 0.18} />

                {/* Elbow joint */}
                <circle cx="63" cy="210" r="6" strokeWidth={MW} opacity="0.5" />
                <circle cx="63" cy="210" r="3" strokeWidth={DW} opacity="0.3" />

                {/* Forearm contour */}
                <path d="M57,215 C54,232 50,252 46,270 C44,280 42,290 40,298" strokeWidth={CW} opacity="0.8" />
                <path d="M69,215 C66,232 62,252 58,270 C56,280 54,290 52,298" strokeWidth={CW} opacity="0.8" />

                {/* Forearm cross-section rings */}
                {[224, 240, 256, 272, 286].map((y, idx) => {
                  const xOff = 63 - idx * 3.5;
                  return (
                    <ellipse key={`lfa-${y}`} cx={xOff} cy={y} rx="6.5" ry="2.5"
                      strokeWidth={DW} opacity={MO * 0.35}
                      transform={`rotate(-8, ${xOff}, ${y})`} />
                  );
                })}
                {/* Forearm muscle line */}
                <path d="M62,216 C58,235 54,255 50,275 C48,285 46,292 44,298" strokeWidth={DW} opacity={MO * 0.3} />
                {/* Radius/Ulna lines */}
                <path d="M60,216 C56,238 52,260 48,280" strokeWidth={DW} opacity={MO * 0.2} />
                <path d="M66,216 C62,238 58,260 54,280" strokeWidth={DW} opacity={MO * 0.2} />

                {/* Wrist joint */}
                <ellipse cx="46" cy="298" rx="6" ry="3" strokeWidth={MW} opacity="0.5" />

                {/* Left hand — palm forward, wireframe */}
                <path d="M40,301 L38,312 L39,322 L42,328 L46,330 L50,328 L53,322 L54,312 L52,301"
                  strokeWidth={MW} opacity="0.55" />
                {/* Palm mesh */}
                <line x1="46" y1="303" x2="46" y2="326" strokeWidth={DW} opacity="0.25" />
                <line x1="40" y1="310" x2="52" y2="310" strokeWidth={DW} opacity="0.25" />
                <line x1="40" y1="318" x2="52" y2="318" strokeWidth={DW} opacity="0.25" />
                {/* Palm triangulation */}
                <path d="M40,301 L46,310 L52,301" strokeWidth={DW} opacity="0.18" />
                <path d="M40,310 L46,318 L52,310" strokeWidth={DW} opacity="0.18" />
                <path d="M42,328 L46,318 L50,328" strokeWidth={DW} opacity="0.18" />

                {/* Fingers */}
                {/* Thumb */}
                <path d="M38,308 L34,314 L32,322 L33,326" strokeWidth={DW} opacity="0.5" />
                <circle cx="33" cy="326" r="1" strokeWidth={DW} opacity="0.4" />
                <ellipse cx="33" cy="318" rx="1.5" ry="1" strokeWidth={DW} opacity="0.3" />
                {/* Index */}
                <path d="M40,328 L38,337 L37,345 L38,350" strokeWidth={DW} opacity="0.5" />
                <circle cx="38" cy="350" r="0.8" strokeWidth={DW} opacity="0.4" />
                <ellipse cx="37.5" cy="337" rx="1.5" ry="1" strokeWidth={DW} opacity="0.25" />
                <ellipse cx="37" cy="345" rx="1.5" ry="1" strokeWidth={DW} opacity="0.25" />
                {/* Middle */}
                <path d="M43,330 L42,340 L41,349 L42,354" strokeWidth={DW} opacity="0.5" />
                <circle cx="42" cy="354" r="0.8" strokeWidth={DW} opacity="0.4" />
                <ellipse cx="42" cy="340" rx="1.5" ry="1" strokeWidth={DW} opacity="0.25" />
                <ellipse cx="41" cy="349" rx="1.5" ry="1" strokeWidth={DW} opacity="0.25" />
                {/* Ring */}
                <path d="M46,330 L46,340 L46,349 L46,354" strokeWidth={DW} opacity="0.5" />
                <circle cx="46" cy="354" r="0.8" strokeWidth={DW} opacity="0.4" />
                <ellipse cx="46" cy="340" rx="1.5" ry="1" strokeWidth={DW} opacity="0.25" />
                <ellipse cx="46" cy="349" rx="1.5" ry="1" strokeWidth={DW} opacity="0.25" />
                {/* Pinky */}
                <path d="M50,328 L51,336 L52,343 L51,348" strokeWidth={DW} opacity="0.5" />
                <circle cx="51" cy="348" r="0.8" strokeWidth={DW} opacity="0.4" />
                <ellipse cx="51.5" cy="336" rx="1.5" ry="1" strokeWidth={DW} opacity="0.25" />
              </g>

              {/* ===== RIGHT ARM — Wireframe mesh (mirror) ===== */}
              <g stroke={color} fill="none">
                <circle cx="212" cy="114" r="8" strokeWidth={MW} opacity="0.5" />
                <circle cx="212" cy="114" r="4" strokeWidth={DW} opacity="0.3" />
                <path d="M204,114 L220,114 M212,106 L212,122" strokeWidth={DW} opacity="0.2" />

                <path d="M218,120 C222,138 228,158 233,178 C236,190 240,200 243,210" strokeWidth={CW} opacity="0.8" />
                <path d="M206,120 C210,138 216,158 221,178 C224,190 228,200 231,210" strokeWidth={CW} opacity="0.8" />

                {[132, 148, 164, 180, 196].map((y, idx) => {
                  const xOff = 212 + idx * 5;
                  return (
                    <ellipse key={`ra-${y}`} cx={xOff} cy={y} rx="7" ry="3"
                      strokeWidth={DW} opacity={MO * 0.4}
                      transform={`rotate(12, ${xOff}, ${y})`} />
                  );
                })}

                <path d="M214,124 C216,142 220,160 224,178 C226,186 228,194 230,202" strokeWidth={DW} opacity={MO * 0.35} />
                <path d="M210,122 C214,142 220,162 224,182" strokeWidth={DW} opacity={MO * 0.25} />
                <path d="M218,132 L212,148 M206,132 L212,148 M218,148 L222,164 M210,148 L216,164 M222,164 L227,180 M216,164 L221,180" strokeWidth={DW} opacity={MO * 0.18} />

                <circle cx="237" cy="210" r="6" strokeWidth={MW} opacity="0.5" />
                <circle cx="237" cy="210" r="3" strokeWidth={DW} opacity="0.3" />

                <path d="M243,215 C246,232 250,252 254,270 C256,280 258,290 260,298" strokeWidth={CW} opacity="0.8" />
                <path d="M231,215 C234,232 238,252 242,270 C244,280 246,290 248,298" strokeWidth={CW} opacity="0.8" />

                {[224, 240, 256, 272, 286].map((y, idx) => {
                  const xOff = 237 + idx * 3.5;
                  return (
                    <ellipse key={`rfa-${y}`} cx={xOff} cy={y} rx="6.5" ry="2.5"
                      strokeWidth={DW} opacity={MO * 0.35}
                      transform={`rotate(8, ${xOff}, ${y})`} />
                  );
                })}
                <path d="M238,216 C242,235 246,255 250,275 C252,285 254,292 256,298" strokeWidth={DW} opacity={MO * 0.3} />
                <path d="M240,216 C244,238 248,260 252,280" strokeWidth={DW} opacity={MO * 0.2} />
                <path d="M234,216 C238,238 242,260 246,280" strokeWidth={DW} opacity={MO * 0.2} />

                <ellipse cx="254" cy="298" rx="6" ry="3" strokeWidth={MW} opacity="0.5" />

                {/* Right hand */}
                <path d="M260,301 L262,312 L261,322 L258,328 L254,330 L250,328 L247,322 L246,312 L248,301"
                  strokeWidth={MW} opacity="0.55" />
                <line x1="254" y1="303" x2="254" y2="326" strokeWidth={DW} opacity="0.25" />
                <line x1="248" y1="310" x2="260" y2="310" strokeWidth={DW} opacity="0.25" />
                <line x1="248" y1="318" x2="260" y2="318" strokeWidth={DW} opacity="0.25" />
                <path d="M260,301 L254,310 L248,301" strokeWidth={DW} opacity="0.18" />
                <path d="M260,310 L254,318 L248,310" strokeWidth={DW} opacity="0.18" />
                <path d="M258,328 L254,318 L250,328" strokeWidth={DW} opacity="0.18" />

                {/* Thumb */}
                <path d="M262,308 L266,314 L268,322 L267,326" strokeWidth={DW} opacity="0.5" />
                <circle cx="267" cy="326" r="1" strokeWidth={DW} opacity="0.4" />
                <ellipse cx="267" cy="318" rx="1.5" ry="1" strokeWidth={DW} opacity="0.3" />
                {/* Index */}
                <path d="M260,328 L262,337 L263,345 L262,350" strokeWidth={DW} opacity="0.5" />
                <circle cx="262" cy="350" r="0.8" strokeWidth={DW} opacity="0.4" />
                <ellipse cx="262.5" cy="337" rx="1.5" ry="1" strokeWidth={DW} opacity="0.25" />
                <ellipse cx="263" cy="345" rx="1.5" ry="1" strokeWidth={DW} opacity="0.25" />
                {/* Middle */}
                <path d="M257,330 L258,340 L259,349 L258,354" strokeWidth={DW} opacity="0.5" />
                <circle cx="258" cy="354" r="0.8" strokeWidth={DW} opacity="0.4" />
                <ellipse cx="258" cy="340" rx="1.5" ry="1" strokeWidth={DW} opacity="0.25" />
                <ellipse cx="259" cy="349" rx="1.5" ry="1" strokeWidth={DW} opacity="0.25" />
                {/* Ring */}
                <path d="M254,330 L254,340 L254,349 L254,354" strokeWidth={DW} opacity="0.5" />
                <circle cx="254" cy="354" r="0.8" strokeWidth={DW} opacity="0.4" />
                <ellipse cx="254" cy="340" rx="1.5" ry="1" strokeWidth={DW} opacity="0.25" />
                <ellipse cx="254" cy="349" rx="1.5" ry="1" strokeWidth={DW} opacity="0.25" />
                {/* Pinky */}
                <path d="M250,328 L249,336 L248,343 L249,348" strokeWidth={DW} opacity="0.5" />
                <circle cx="249" cy="348" r="0.8" strokeWidth={DW} opacity="0.4" />
                <ellipse cx="248.5" cy="336" rx="1.5" ry="1" strokeWidth={DW} opacity="0.25" />
              </g>

              {/* ===== LEFT LEG — Wireframe mesh ===== */}
              <g stroke={color} fill="none">
                {/* Hip joint */}
                <circle cx="132" cy="274" r="7" strokeWidth={MW} opacity="0.5" />
                <circle cx="132" cy="274" r="3.5" strokeWidth={DW} opacity="0.3" />

                {/* Thigh contour */}
                <path d="M124,280 C122,298 120,318 118,338 C117,350 116,360 115,368" strokeWidth={CW} opacity="0.8" />
                <path d="M140,280 C138,298 134,318 130,338 C128,350 126,360 126,368" strokeWidth={CW} opacity="0.8" />

                {/* Thigh cross-section rings */}
                {[290, 306, 322, 338, 354].map((y, idx) => {
                  const xOff = 132 - idx * 2;
                  return (
                    <ellipse key={`lt-${y}`} cx={xOff} cy={y} rx="9" ry="3.5"
                      strokeWidth={DW} opacity={MO * 0.35}
                      transform={`rotate(-3, ${xOff}, ${y})`} />
                  );
                })}

                {/* Quad muscle topology */}
                <path d="M132,282 L128,315 L124,345 L122,360" strokeWidth={DW} opacity={MO * 0.35} />
                <path d="M128,282 L124,315 L120,345 L118,362" strokeWidth={DW} opacity={MO * 0.25} />
                <path d="M136,282 L134,315 L130,345 L128,362" strokeWidth={DW} opacity={MO * 0.25} />
                {/* IT band */}
                <path d="M124,282 L122,315 L118,345 L116,365" strokeWidth={DW} opacity={MO * 0.2} />
                {/* Mesh triangulation */}
                <path d="M124,290 L132,306 M140,290 L132,306 M124,306 L128,322 M136,306 L130,322 M124,322 L122,338 M132,322 L128,338" strokeWidth={DW} opacity={MO * 0.15} />

                {/* Knee joint */}
                <ellipse cx="120" cy="370" rx="8" ry="6" strokeWidth={MW} opacity="0.5" />
                <circle cx="120" cy="370" r="4" strokeWidth={DW} opacity="0.3" />
                {/* Patella */}
                <path d="M117,367 L120,364 L123,367 L120,373 Z" strokeWidth={DW} opacity="0.4" />

                {/* Lower leg contour */}
                <path d="M114,376 C112,394 110,414 109,428 C108,438 108,446 107,452" strokeWidth={CW} opacity="0.8" />
                <path d="M128,376 C126,394 124,414 122,428 C120,438 119,446 118,452" strokeWidth={CW} opacity="0.8" />

                {/* Calf cross-section rings */}
                {[384, 398, 412, 426, 440].map((y, idx) => {
                  const xOff = 121 - idx * 2;
                  return (
                    <ellipse key={`lc-${y}`} cx={xOff} cy={y} rx="7.5" ry="3"
                      strokeWidth={DW} opacity={MO * 0.3}
                      transform={`rotate(-2, ${xOff}, ${y})`} />
                  );
                })}

                {/* Calf muscle lines */}
                <path d="M122,378 C120,394 118,410 116,426" strokeWidth={DW} opacity={MO * 0.3} />
                <path d="M118,378 C116,394 114,410 112,426" strokeWidth={DW} opacity={MO * 0.22} />
                {/* Tibia (shin) */}
                <path d="M116,376 L110,440 L108,452" strokeWidth={DW} opacity={MO * 0.35} />
                {/* Fibula */}
                <path d="M124,376 L120,440 L118,452" strokeWidth={DW} opacity={MO * 0.2} />

                {/* Ankle joint */}
                <ellipse cx="112" cy="452" rx="6" ry="4" strokeWidth={MW} opacity="0.5" />

                {/* Left foot */}
                <path d="M108,456 L104,458 L98,460 L92,462 L88,464 L86,467 L88,470 L94,472 L102,473 L112,472 L118,470 L120,466 L119,460 L118,456"
                  strokeWidth={MW} opacity="0.55" />
                {/* Foot mesh */}
                <line x1="102" y1="458" x2="102" y2="472" strokeWidth={DW} opacity="0.22" />
                <path d="M92,462 L118,462" strokeWidth={DW} opacity="0.22" />
                <path d="M90,467 L118,467" strokeWidth={DW} opacity="0.22" />
                {/* Toe wireframes */}
                <path d="M88,464 L85,466 M92,462 L88,464 M96,461 L92,463 M100,460 L96,462 M104,460 L100,461" strokeWidth={DW} opacity="0.32" />
                {/* Foot triangulation */}
                <path d="M108,456 L102,462 L118,456" strokeWidth={DW} opacity="0.15" />
                <path d="M92,462 L102,467 L112,462" strokeWidth={DW} opacity="0.15" />
              </g>

              {/* ===== RIGHT LEG — Wireframe mesh (mirror) ===== */}
              <g stroke={color} fill="none">
                <circle cx="168" cy="274" r="7" strokeWidth={MW} opacity="0.5" />
                <circle cx="168" cy="274" r="3.5" strokeWidth={DW} opacity="0.3" />

                <path d="M176,280 C178,298 180,318 182,338 C183,350 184,360 185,368" strokeWidth={CW} opacity="0.8" />
                <path d="M160,280 C162,298 166,318 170,338 C172,350 174,360 174,368" strokeWidth={CW} opacity="0.8" />

                {[290, 306, 322, 338, 354].map((y, idx) => {
                  const xOff = 168 + idx * 2;
                  return (
                    <ellipse key={`rt-${y}`} cx={xOff} cy={y} rx="9" ry="3.5"
                      strokeWidth={DW} opacity={MO * 0.35}
                      transform={`rotate(3, ${xOff}, ${y})`} />
                  );
                })}

                <path d="M168,282 L172,315 L176,345 L178,360" strokeWidth={DW} opacity={MO * 0.35} />
                <path d="M172,282 L176,315 L180,345 L182,362" strokeWidth={DW} opacity={MO * 0.25} />
                <path d="M164,282 L166,315 L170,345 L172,362" strokeWidth={DW} opacity={MO * 0.25} />
                <path d="M176,282 L178,315 L182,345 L184,365" strokeWidth={DW} opacity={MO * 0.2} />
                <path d="M176,290 L168,306 M160,290 L168,306 M176,306 L172,322 M164,306 L170,322 M176,322 L178,338 M168,322 L172,338" strokeWidth={DW} opacity={MO * 0.15} />

                <ellipse cx="180" cy="370" rx="8" ry="6" strokeWidth={MW} opacity="0.5" />
                <circle cx="180" cy="370" r="4" strokeWidth={DW} opacity="0.3" />
                <path d="M177,367 L180,364 L183,367 L180,373 Z" strokeWidth={DW} opacity="0.4" />

                <path d="M186,376 C188,394 190,414 191,428 C192,438 192,446 193,452" strokeWidth={CW} opacity="0.8" />
                <path d="M172,376 C174,394 176,414 178,428 C180,438 181,446 182,452" strokeWidth={CW} opacity="0.8" />

                {[384, 398, 412, 426, 440].map((y, idx) => {
                  const xOff = 179 + idx * 2;
                  return (
                    <ellipse key={`rc-${y}`} cx={xOff} cy={y} rx="7.5" ry="3"
                      strokeWidth={DW} opacity={MO * 0.3}
                      transform={`rotate(2, ${xOff}, ${y})`} />
                  );
                })}

                <path d="M178,378 C180,394 182,410 184,426" strokeWidth={DW} opacity={MO * 0.3} />
                <path d="M182,378 C184,394 186,410 188,426" strokeWidth={DW} opacity={MO * 0.22} />
                <path d="M184,376 L190,440 L192,452" strokeWidth={DW} opacity={MO * 0.35} />
                <path d="M176,376 L180,440 L182,452" strokeWidth={DW} opacity={MO * 0.2} />

                <ellipse cx="188" cy="452" rx="6" ry="4" strokeWidth={MW} opacity="0.5" />

                {/* Right foot */}
                <path d="M192,456 L196,458 L202,460 L208,462 L212,464 L214,467 L212,470 L206,472 L198,473 L188,472 L182,470 L180,466 L181,460 L182,456"
                  strokeWidth={MW} opacity="0.55" />
                <line x1="198" y1="458" x2="198" y2="472" strokeWidth={DW} opacity="0.22" />
                <path d="M182,462 L208,462" strokeWidth={DW} opacity="0.22" />
                <path d="M182,467 L210,467" strokeWidth={DW} opacity="0.22" />
                <path d="M212,464 L215,466 M208,462 L212,464 M204,461 L208,463 M200,460 L204,462 M196,460 L200,461" strokeWidth={DW} opacity="0.32" />
                <path d="M192,456 L198,462 L182,456" strokeWidth={DW} opacity="0.15" />
                <path d="M208,462 L198,467 L188,462" strokeWidth={DW} opacity="0.15" />
              </g>

              {/* ===== VERTEX DOTS at key mesh intersections ===== */}
              <g fill={color} stroke="none" filter="url(#vg)">
                {/* Head */}
                {[[150,20],[126,50],[174,50],[150,80],[138,22],[162,22],[128,28],[172,28],[150,26],[150,33],[150,40],[150,48],[150,56]].map(([x,y], i) => (
                  <circle key={`hv${i}`} cx={x} cy={y} r="1" opacity="0.55" />
                ))}
                {/* Shoulders/clavicle */}
                {[[88,114],[212,114],[98,108],[202,108],[130,102],[170,102],[150,101]].map(([x,y], i) => (
                  <circle key={`sv${i}`} cx={x} cy={y} r="1.2" opacity="0.6" />
                ))}
                {/* Torso contour */}
                {[[83,122],[217,122],[82,132],[218,132],[84,145],[216,145],[88,158],[212,158],[92,172],[208,172],[102,198],[198,198],[110,220],[190,220],[130,260],[170,260]].map(([x,y], i) => (
                  <circle key={`tv${i}`} cx={x} cy={y} r="0.9" opacity="0.45" />
                ))}
                {/* Elbow */}
                {[[63,210],[237,210]].map(([x,y], i) => (
                  <circle key={`ev${i}`} cx={x} cy={y} r="1.3" opacity="0.65" />
                ))}
                {/* Wrist */}
                {[[46,298],[254,298]].map(([x,y], i) => (
                  <circle key={`wv${i}`} cx={x} cy={y} r="1.1" opacity="0.55" />
                ))}
                {/* Hip/knee/ankle */}
                {[[132,274],[168,274],[120,370],[180,370],[112,452],[188,452]].map(([x,y], i) => (
                  <circle key={`lv${i}`} cx={x} cy={y} r="1.2" opacity="0.6" />
                ))}
                {/* Fingertips */}
                {[[33,326],[38,350],[42,354],[46,354],[51,348],[267,326],[262,350],[258,354],[254,354],[249,348]].map(([x,y], i) => (
                  <circle key={`fv${i}`} cx={x} cy={y} r="0.8" opacity="0.5" />
                ))}
              </g>

              {/* ===== GROUND PLANE GRID ===== */}
              <g stroke={color} fill="none" opacity="0.12">
                <line x1="65" y1="478" x2="235" y2="478" strokeWidth="0.5" />
                <line x1="75" y1="483" x2="225" y2="483" strokeWidth="0.3" />
                <line x1="85" y1="488" x2="215" y2="488" strokeWidth="0.2" />
                {[95, 115, 135, 150, 165, 185, 205].map((x) => (
                  <line key={`gp${x}`} x1={x} y1="476" x2={150 + (x - 150) * 0.5} y2="492" strokeWidth="0.2" opacity="0.5" />
                ))}
              </g>

            </g>

            {/* ===== HUD SCAN LINES ===== */}
            <g stroke={color} fill="none" opacity="0.1">
              {[50, 100, 150, 200, 250, 300, 350, 400, 450].map((y, i) => (
                <line key={`scan${i}`} x1="10" y1={y} x2="290" y2={y} strokeWidth="0.2" strokeDasharray="4 8" />
              ))}
              {/* Center axis */}
              <line x1="150" y1="5" x2="150" y2="495" strokeWidth="0.15" />
            </g>

            {/* ===== HUD DATA LABELS ===== */}
            <g>
              {/* Lung label */}
              <line x1="90" y1="140" x2="18" y2="140" stroke={color} strokeWidth="0.5" opacity="0.25" strokeDasharray="2 3" />
              <rect x="2" y="134" width="16" height="10" rx="1" fill="black" stroke={color} strokeWidth="0.4" opacity="0.35" />
              <text x="4" y="142" fill={color} opacity="0.55" fontSize="6" fontFamily="JetBrains Mono">LNG</text>

              {/* Heart label */}
              <line x1="157" y1="132" x2="282" y2="132" stroke={color} strokeWidth="0.5" opacity="0.25" strokeDasharray="2 3" />
              <rect x="282" y="126" width="14" height="10" rx="1" fill="black" stroke={color} strokeWidth="0.4" opacity="0.35" />
              <text x="284" y="134" fill={color} opacity="0.55" fontSize="6" fontFamily="JetBrains Mono">HR</text>

              {/* O2 label */}
              <line x1="56" y1="298" x2="18" y2="298" stroke={color} strokeWidth="0.5" opacity="0.25" strokeDasharray="2 3" />
              <rect x="2" y="292" width="14" height="10" rx="1" fill="black" stroke={color} strokeWidth="0.4" opacity="0.35" />
              <text x="4" y="300" fill={color} opacity="0.55" fontSize="6" fontFamily="JetBrains Mono">O2</text>

              {/* SpO2 label */}
              <line x1="218" y1="200" x2="282" y2="200" stroke={color} strokeWidth="0.5" opacity="0.25" strokeDasharray="2 3" />
              <rect x="282" y="194" width="14" height="10" rx="1" fill="black" stroke={color} strokeWidth="0.4" opacity="0.35" />
              <text x="283" y="202" fill={color} opacity="0.55" fontSize="6" fontFamily="JetBrains Mono">SP</text>
            </g>
          </svg>
        </div>
      </div>

      {/* AQI value + status */}
      <div className="text-center mt-2 space-y-1 relative z-10">
        <div className="flex items-center justify-center gap-2">
          <span className="text-2xl font-bold font-[Orbitron] tracking-wider"
            style={{ color, textShadow: `0 0 20px ${color}80, 0 0 40px ${color}30` }}>
            <AnimatedNumber value={aqi} />
          </span>
          <span className={`text-[9px] font-mono px-2 py-0.5 border ${level.color}`}
            style={{ borderColor: color + "40", backgroundColor: color + "08" }}>
            {level.label.toUpperCase()}
          </span>
        </div>
        <p className="text-[9px] font-mono tracking-[0.15em]" style={{ color: color + "cc" }}>
          {statusMsg}
        </p>
      </div>

      {/* Danger level segmented bar */}
      <div className="w-full mt-3 flex gap-0.5 relative z-10">
        {[
          { max: 50, label: "GOOD", c: "#00ff41" },
          { max: 100, label: "MOD", c: "#ffb800" },
          { max: 200, label: "UNH", c: "#ff6600" },
          { max: 300, label: "V.UNH", c: "#ff003c" },
          { max: 500, label: "HAZ", c: "#990000" },
        ].map((seg, i) => {
          const prevMax = [0, 50, 100, 200, 300][i];
          const active = aqi > prevMax;
          const full = aqi >= seg.max;
          return (
            <div key={seg.max} className="flex-1">
              <div className="h-1.5 relative overflow-hidden"
                style={{
                  backgroundColor: active ? seg.c : "#0a1a0a",
                  opacity: full ? 1 : active ? 0.5 : 0.12,
                  boxShadow: active ? `0 0 8px ${seg.c}50` : "none",
                }}>
                {active && !full && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-current opacity-30" style={{ color: seg.c }} />
                )}
              </div>
              <span className="text-[6px] font-mono block text-center mt-0.5"
                style={{ color: active ? seg.c + "aa" : "#1e2e1e" }}>
                {seg.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
