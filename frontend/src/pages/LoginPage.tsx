import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type FormEvent,
} from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

/* ------------------------------------------------------------------ */
/*  BOOT SEQUENCE DATA                                                 */
/* ------------------------------------------------------------------ */

const bootLines = [
  { text: "[BIOS]  POST check .................... OK", delay: 0 },
  { text: "[BIOS]  CPU: Intel Xeon E5-2698v4 x2 .. OK", delay: 60 },
  { text: "[BIOS]  RAM: 256 GB ECC DDR4 .......... OK", delay: 60 },
  { text: "[KERN]  Loading kernel 6.8.0-ops ....... OK", delay: 80 },
  { text: "[KERN]  Initializing crypto subsystem .. OK", delay: 70 },
  { text: "[INIT]  Mounting encrypted rootfs ....... OK", delay: 90 },
  { text: "[INIT]  Starting system logger .......... OK", delay: 50 },
  { text: "[NET ]  Bringing up interface eth0 ...... OK", delay: 80 },
  { text: "[NET ]  Acquiring IPv4 via DHCP ......... OK", delay: 100 },
  { text: "[NET ]  Establishing VPN tunnel ......... OK", delay: 120 },
  { text: "[SEC ]  Loading firewall rules .......... OK", delay: 60 },
  { text: "[SEC ]  Verifying TLS certificates ....... OK", delay: 70 },
  { text: "[SEC ]  Intrusion detection active ....... OK", delay: 60 },
  { text: "[DATA]  Connecting to threat intel DB .... OK", delay: 110 },
  { text: "[DATA]  Loading geospatial indices ....... OK", delay: 90 },
  { text: "[DATA]  Syncing incident registry ........ OK", delay: 80 },
  { text: "[SYS ]  Allocating shared memory pool .... OK", delay: 60 },
  { text: "[SYS ]  Starting websocket daemon ........ OK", delay: 70 },
  { text: "[MON ]  Network scan: 14 nodes online .... OK", delay: 100 },
  { text: "[MON ]  Camera feeds: 847/847 active ..... OK", delay: 80 },
  { text: "[MON ]  AQI sensors: 312/312 reporting ... OK", delay: 70 },
  { text: "[THRT]  Current threat level: ELEVATED", delay: 90 },
  { text: "[THRT]  Active incidents: 23 in progress", delay: 60 },
  { text: "[BOOT]  Delhi Ops Command Center v2.4.1", delay: 80 },
  { text: "[BOOT]  All subsystems nominal.", delay: 100 },
  { text: "", delay: 200 },
  { text: "[AUTH]  Awaiting operator credentials ...", delay: 0 },
];

const ASCII_HEADER = `
 ____  _____ _     _   _ ___    ___  ____  ____
|  _ \\| ____| |   | | | |_ _|  / _ \\|  _ \\/ ___|
| | | |  _| | |   | |_| || |  | | | | |_) \\___ \\
| |_| | |___| |___|  _  || |  | |_| |  __/ ___) |
|____/|_____|_____|_| |_|___|  \\___/|_|   |____/
`;

/* ------------------------------------------------------------------ */
/*  MATRIX RAIN CANVAS                                                 */
/* ------------------------------------------------------------------ */

function MatrixRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const chars =
      "01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン";
    const fontSize = 14;
    const columns = Math.floor(canvas.width / fontSize);
    const drops = new Array(columns).fill(0).map(() => Math.random() * -100);

    const draw = () => {
      ctx.fillStyle = "rgba(2, 10, 2, 0.06)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "#00ff4115";
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const char = chars[Math.floor(Math.random() * chars.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        // head of the drop is brighter
        if (Math.random() > 0.96) {
          ctx.fillStyle = "#00ff4140";
        } else {
          ctx.fillStyle = "#00ff4112";
        }

        ctx.fillText(char, x, y);

        if (y > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i] += 0.5 + Math.random() * 0.5;
      }

      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0"
      style={{ background: "#020a02" }}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  PROGRESS BAR COMPONENT                                             */
/* ------------------------------------------------------------------ */

function BootProgressBar({ progress }: { progress: number }) {
  const width = 40;
  const filled = Math.round((progress / 100) * width);
  const empty = width - filled;
  const bar = "\u2588".repeat(filled) + "\u2591".repeat(empty);

  return (
    <div className="font-mono text-[11px] mt-1 select-none">
      <span className="text-gray-600">[</span>
      <span className="text-brand" style={{ textShadow: "0 0 6px #00ff4160" }}>
        {bar}
      </span>
      <span className="text-gray-600">]</span>
      <span className="text-brand ml-2">{progress.toFixed(0)}%</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  GLITCH TITLE COMPONENT                                             */
/* ------------------------------------------------------------------ */

function GlitchTitle() {
  return (
    <div className="relative inline-block select-none">
      {/* Glitch layers */}
      <pre
        className="font-mono text-brand text-[10px] sm:text-xs leading-tight absolute top-0 left-0"
        style={{
          textShadow: "0 0 10px #00ff4180, 0 0 40px #00ff4130",
          animation: "glitch-layer-1 4s infinite",
          clipPath: "inset(0 0 65% 0)",
          color: "#00d4ff",
          opacity: 0.8,
        }}
        aria-hidden="true"
      >
        {ASCII_HEADER}
      </pre>
      <pre
        className="font-mono text-brand text-[10px] sm:text-xs leading-tight absolute top-0 left-0"
        style={{
          textShadow: "0 0 10px #00ff4180, 0 0 40px #00ff4130",
          animation: "glitch-layer-2 4s infinite",
          clipPath: "inset(60% 0 0 0)",
          color: "#ff003c",
          opacity: 0.8,
        }}
        aria-hidden="true"
      >
        {ASCII_HEADER}
      </pre>
      {/* Main layer */}
      <pre
        className="font-mono text-brand text-[10px] sm:text-xs leading-tight relative"
        style={{
          textShadow:
            "0 0 10px #00ff4180, 0 0 40px #00ff4130, 0 0 80px #00ff4110",
        }}
      >
        {ASCII_HEADER}
      </pre>
      {/* Inline keyframes for glitch layers */}
      <style>{`
        @keyframes glitch-layer-1 {
          0%, 88%, 100% { transform: translate(0); opacity: 0; }
          89% { transform: translate(-3px, -1px); opacity: 0.7; }
          90% { transform: translate(2px, 1px); opacity: 0.7; }
          91% { transform: translate(-1px, 2px); opacity: 0.7; }
          92% { transform: translate(0); opacity: 0; }
        }
        @keyframes glitch-layer-2 {
          0%, 93%, 100% { transform: translate(0); opacity: 0; }
          94% { transform: translate(3px, 1px); opacity: 0.6; }
          95% { transform: translate(-2px, -1px); opacity: 0.6; }
          96% { transform: translate(1px, -2px); opacity: 0.6; }
          97% { transform: translate(0); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  ACCESS GRANTED OVERLAY                                             */
/* ------------------------------------------------------------------ */

function AccessGrantedOverlay() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Green flash */}
      <div
        className="absolute inset-0"
        style={{
          animation: "green-flash 1.8s ease-out forwards",
          background: "radial-gradient(ellipse at center, #00ff4130, transparent 70%)",
        }}
      />
      <div className="relative text-center">
        <div
          className="font-mono text-4xl sm:text-6xl font-bold tracking-[0.3em] text-brand"
          style={{
            textShadow:
              "0 0 20px #00ff41, 0 0 60px #00ff4180, 0 0 120px #00ff4140",
            animation: "access-text-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards",
          }}
        >
          ACCESS GRANTED
        </div>
        <div
          className="font-mono text-xs text-brand/60 mt-4 tracking-[0.5em]"
          style={{
            animation: "access-text-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.3s both",
          }}
        >
          INITIALIZING SESSION ...
        </div>
      </div>
      <style>{`
        @keyframes green-flash {
          0% { background: radial-gradient(ellipse at center, #00ff4160, #00ff4110 40%, transparent 70%); }
          15% { background: radial-gradient(ellipse at center, #00ff4140, #00ff4108 40%, transparent 70%); }
          100% { background: radial-gradient(ellipse at center, #00ff4110, transparent 50%); }
        }
        @keyframes access-text-in {
          0% { opacity: 0; transform: scale(0.8) translateY(10px); filter: blur(4px); }
          100% { opacity: 1; transform: scale(1) translateY(0); filter: blur(0); }
        }
      `}</style>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  MAIN LOGIN PAGE                                                    */
/* ------------------------------------------------------------------ */

type Phase = "booting" | "header_reveal" | "login_prompt" | "access_granted";

export default function LoginPage() {
  const { user, login, loading } = useAuth();
  const navigate = useNavigate();

  /* ---- form state ---- */
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  /* ---- animation state ---- */
  const [phase, setPhase] = useState<Phase>("booting");
  const [typedLines, setTypedLines] = useState<string[]>([]);
  const [currentLineText, setCurrentLineText] = useState("");
  const [bootProgress, setBootProgress] = useState(0);
  const [headerVisible, setHeaderVisible] = useState(false);
  const [loginVisible, setLoginVisible] = useState(false);
  const [focusedField, setFocusedField] = useState<"email" | "password" | null>(null);

  /* ---- refs ---- */
  const terminalRef = useRef<HTMLDivElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const mountedRef = useRef(true);

  /* ---- keep terminal scrolled to bottom ---- */
  const scrollToBottom = useCallback(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, []);

  /* ---- character-by-character typing engine ---- */
  useEffect(() => {
    mountedRef.current = true;

    let cancelled = false;

    async function runBoot() {
      for (let lineIdx = 0; lineIdx < bootLines.length; lineIdx++) {
        if (cancelled) return;

        const { text, delay } = bootLines[lineIdx];

        // Pre-line pause
        if (delay > 0) {
          await sleep(delay);
        }
        if (cancelled) return;

        // Type each character
        const charDelay = text.length > 0 ? Math.max(6, 18 - text.length / 5) : 0;
        for (let charIdx = 0; charIdx <= text.length; charIdx++) {
          if (cancelled) return;
          setCurrentLineText(text.slice(0, charIdx));
          scrollToBottom();
          if (charIdx < text.length) {
            await sleep(charDelay);
          }
        }

        if (cancelled) return;

        // Commit the finished line
        setTypedLines((prev) => [...prev, text]);
        setCurrentLineText("");

        // Update progress
        const progress = ((lineIdx + 1) / bootLines.length) * 100;
        setBootProgress(progress);

        scrollToBottom();
      }

      if (cancelled) return;

      // Boot complete -- reveal header
      setPhase("header_reveal");
      await sleep(400);
      if (cancelled) return;
      setHeaderVisible(true);

      await sleep(1200);
      if (cancelled) return;

      // Show login prompt
      setPhase("login_prompt");
      await sleep(300);
      if (cancelled) return;
      setLoginVisible(true);

      // Focus the email field
      await sleep(200);
      if (!cancelled && emailRef.current) {
        emailRef.current.focus();
      }
    }

    runBoot();

    return () => {
      cancelled = true;
      mountedRef.current = false;
    };
  }, [scrollToBottom]);

  /* ---- auth guards (same as original) ---- */
  if (loading) return null;
  if (user && phase !== "access_granted") return <Navigate to="/" replace />;

  /* ---- handle submit ---- */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
      // Show ACCESS GRANTED overlay, then redirect
      setPhase("access_granted");
      setTimeout(() => {
        navigate("/", { replace: true });
      }, 2200);
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const axiosErr = err as {
          response?: { data?: { error?: { message?: string } } };
        };
        setError(axiosErr.response?.data?.error?.message || "ACCESS DENIED");
      } else {
        setError("CONNECTION FAILED. RETRY.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  /* ---- handle field navigation like a terminal ---- */
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    field: "email" | "password"
  ) => {
    if (e.key === "Enter" && field === "email" && email.trim()) {
      e.preventDefault();
      passwordRef.current?.focus();
    }
  };

  /* ---- render ---- */
  return (
    <div className="fixed inset-0 overflow-hidden" style={{ background: "#020a02" }}>
      {/* Matrix Rain Background */}
      <MatrixRain />

      {/* Scanline + Grid overlays */}
      <div className="scanline-overlay" />
      <div className="grid-lines-bg fixed inset-0 opacity-30" />
      <div className="scan-line" />

      {/* ACCESS GRANTED overlay */}
      {phase === "access_granted" && <AccessGrantedOverlay />}

      {/* Main Terminal Container */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-3xl">
          {/* Terminal Window Chrome */}
          <div
            className="border border-brand/20 relative"
            style={{
              boxShadow:
                "0 0 30px rgba(0,255,65,0.08), 0 0 60px rgba(0,255,65,0.03), inset 0 0 30px rgba(0,255,65,0.02)",
              background: "rgba(2, 10, 2, 0.92)",
              backdropFilter: "blur(8px)",
            }}
          >
            {/* Title bar */}
            <div className="flex items-center gap-2 px-4 py-2 border-b border-brand/15 bg-brand/[0.03]">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-danger/70" />
                <div className="w-2.5 h-2.5 rounded-full bg-warning/70" />
                <div className="w-2.5 h-2.5 rounded-full bg-brand/70" />
              </div>
              <div className="flex-1 text-center">
                <span className="text-[9px] text-gray-500 font-mono tracking-[0.3em] uppercase">
                  delhi-ops-terminal -- secure shell -- 132x48
                </span>
              </div>
              <div className="w-12" />
            </div>

            {/* Terminal body */}
            <div
              ref={terminalRef}
              className="p-4 sm:p-6 font-mono overflow-y-auto"
              style={{ maxHeight: "calc(100vh - 120px)" }}
            >
              {/* Completed boot lines */}
              {typedLines.map((line, i) => (
                <div key={i} className="leading-relaxed">
                  {renderBootLine(line)}
                </div>
              ))}

              {/* Currently typing line */}
              {phase === "booting" && (
                <div className="leading-relaxed">
                  {renderBootLine(currentLineText)}
                  <span
                    className="inline-block w-[7px] h-[13px] ml-px align-middle"
                    style={{
                      background: "#00ff41",
                      animation: "blink-cursor 1s step-end infinite",
                      boxShadow: "0 0 6px #00ff4180",
                    }}
                  />
                </div>
              )}

              {/* Progress bar (during boot) */}
              {phase === "booting" && (
                <div className="mt-2">
                  <BootProgressBar progress={bootProgress} />
                </div>
              )}

              {/* ASCII Art Header (after boot) */}
              {(phase === "header_reveal" ||
                phase === "login_prompt" ||
                phase === "access_granted") && (
                <div
                  className="mt-4 mb-2 overflow-hidden"
                  style={{
                    opacity: headerVisible ? 1 : 0,
                    transform: headerVisible
                      ? "translateY(0)"
                      : "translateY(10px)",
                    transition: "opacity 0.8s ease-out, transform 0.8s ease-out",
                  }}
                >
                  <GlitchTitle />
                  <div className="mt-1 flex items-center gap-3">
                    <span className="text-[10px] text-gray-500 tracking-[0.4em] uppercase font-[Orbitron]">
                      Command Center
                    </span>
                    <span className="text-[9px] text-gray-600">|</span>
                    <span className="text-[9px] text-info tracking-wider">
                      ENCRYPTED CONNECTION
                    </span>
                    <span className="text-[9px] text-gray-600">|</span>
                    <span className="text-[9px] text-gray-600 tracking-wider">
                      TLS 1.3 // AES-256-GCM
                    </span>
                  </div>
                  <div className="mt-2 h-px bg-gradient-to-r from-brand/40 via-brand/15 to-transparent" />
                </div>
              )}

              {/* Login Prompt (terminal-style) */}
              {(phase === "login_prompt" || phase === "access_granted") && (
                <div
                  style={{
                    opacity: loginVisible ? 1 : 0,
                    transform: loginVisible
                      ? "translateY(0)"
                      : "translateY(8px)",
                    transition:
                      "opacity 0.5s ease-out, transform 0.5s ease-out",
                  }}
                >
                  <form onSubmit={handleSubmit}>
                    {/* Section label */}
                    <div className="text-[10px] text-warning tracking-wider mb-4 flex items-center gap-2">
                      <span className="inline-block w-1.5 h-1.5 bg-warning rounded-full status-dot" />
                      <span>AUTHENTICATION REQUIRED</span>
                    </div>

                    {/* Error display */}
                    {error && (
                      <div className="mb-4 py-2 px-3 border border-danger/30 bg-danger/5 glow-red">
                        <div className="flex items-start gap-2">
                          <span className="text-danger text-[10px] font-bold mt-px">
                            [ERR]
                          </span>
                          <div>
                            <span className="text-danger text-xs">
                              {error}
                            </span>
                            <div className="text-[9px] text-danger/50 mt-0.5">
                              Authentication failed. Verify credentials and
                              retry.
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Operator ID field */}
                    <div className="mb-3 flex items-center gap-0">
                      <span className="text-xs text-gray-500 whitespace-nowrap shrink-0">
                        {focusedField === "email" || email ? (
                          <span className="text-brand">{">"}</span>
                        ) : (
                          <span className="text-gray-600">{">"}</span>
                        )}{" "}
                        <span
                          className={
                            focusedField === "email" || email
                              ? "text-info"
                              : "text-gray-500"
                          }
                        >
                          operator_id
                        </span>
                        <span className="text-gray-600 mx-1">{":"}</span>
                      </span>
                      <input
                        ref={emailRef}
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onFocus={() => setFocusedField("email")}
                        onBlur={() => setFocusedField(null)}
                        onKeyDown={(e) => handleKeyDown(e, "email")}
                        required
                        autoComplete="email"
                        placeholder="admin@delhiops.local"
                        disabled={submitting || phase === "access_granted"}
                        className="flex-1 bg-transparent border-none outline-none text-xs text-brand font-mono placeholder-gray-700 caret-brand focus:ring-0 p-0 disabled:opacity-40"
                        style={{
                          caretColor: "#00ff41",
                          textShadow:
                            focusedField === "email"
                              ? "0 0 8px #00ff4140"
                              : "none",
                        }}
                      />
                      {focusedField === "email" && (
                        <span
                          className="inline-block w-[7px] h-[13px] ml-px shrink-0"
                          style={{
                            background: "#00ff41",
                            animation: "blink-cursor 1s step-end infinite",
                            boxShadow: "0 0 4px #00ff4180",
                          }}
                        />
                      )}
                    </div>

                    {/* Access Key field */}
                    <div className="mb-5 flex items-center gap-0">
                      <span className="text-xs text-gray-500 whitespace-nowrap shrink-0">
                        {focusedField === "password" || password ? (
                          <span className="text-brand">{">"}</span>
                        ) : (
                          <span className="text-gray-600">{">"}</span>
                        )}{" "}
                        <span
                          className={
                            focusedField === "password" || password
                              ? "text-info"
                              : "text-gray-500"
                          }
                        >
                          access_key
                        </span>
                        <span className="text-gray-600 mx-1">{":"}</span>
                      </span>
                      <input
                        ref={passwordRef}
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onFocus={() => setFocusedField("password")}
                        onBlur={() => setFocusedField(null)}
                        required
                        autoComplete="current-password"
                        minLength={8}
                        placeholder="enter access key"
                        disabled={submitting || phase === "access_granted"}
                        className="flex-1 bg-transparent border-none outline-none text-xs text-brand font-mono placeholder-gray-700 caret-brand focus:ring-0 p-0 disabled:opacity-40"
                        style={{
                          caretColor: "#00ff41",
                          textShadow:
                            focusedField === "password"
                              ? "0 0 8px #00ff4140"
                              : "none",
                        }}
                      />
                      {focusedField === "password" && (
                        <span
                          className="inline-block w-[7px] h-[13px] ml-px shrink-0"
                          style={{
                            background: "#00ff41",
                            animation: "blink-cursor 1s step-end infinite",
                            boxShadow: "0 0 4px #00ff4180",
                          }}
                        />
                      )}
                    </div>

                    {/* Submit row */}
                    <div className="flex items-center gap-3">
                      <button
                        type="submit"
                        disabled={submitting || phase === "access_granted"}
                        className="group flex items-center gap-2 border border-brand/30 bg-brand/5 px-5 py-2 text-[11px] font-bold text-brand tracking-[0.2em] uppercase font-mono hover:bg-brand/15 hover:border-brand/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        style={{
                          boxShadow: submitting
                            ? "0 0 20px rgba(0,255,65,0.15)"
                            : "none",
                        }}
                      >
                        {submitting ? (
                          <>
                            <span
                              className="inline-block w-3 h-3 border border-brand/50 border-t-brand rounded-full"
                              style={{ animation: "spin 0.8s linear infinite" }}
                            />
                            <span>AUTHENTICATING</span>
                            <span className="typing-cursor" />
                          </>
                        ) : (
                          <>
                            <span className="text-brand/60 group-hover:text-brand transition-colors">
                              [ENTER]
                            </span>
                            <span>INITIALIZE SESSION</span>
                          </>
                        )}
                      </button>

                      {submitting && (
                        <span className="text-[9px] text-gray-500 animate-pulse">
                          Verifying credentials against secure directory...
                        </span>
                      )}
                    </div>
                  </form>

                  {/* Footer info */}
                  <div className="mt-6 pt-3 border-t border-brand/10">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[9px] text-gray-600 tracking-wider">
                      <span>
                        SESSION:{" "}
                        <span className="text-gray-500">
                          {generateSessionId()}
                        </span>
                      </span>
                      <span>
                        NODE:{" "}
                        <span className="text-gray-500">
                          OPS-TERMINAL-01
                        </span>
                      </span>
                      <span>
                        CLEARANCE:{" "}
                        <span className="text-warning">RESTRICTED</span>
                      </span>
                      <span>
                        UPTIME:{" "}
                        <span className="text-gray-500">47d 13h 22m</span>
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Global inline styles for custom animations */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  HELPERS                                                            */
/* ------------------------------------------------------------------ */

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Render a boot line with color-coded prefix tags */
function renderBootLine(text: string) {
  if (!text) return <span>&nbsp;</span>;

  // Match lines like [TAG ] message ... STATUS
  const tagMatch = text.match(/^(\[[A-Z ]+\])\s*/);
  if (!tagMatch) {
    return <span className="text-[11px] text-gray-400">{text}</span>;
  }

  const tag = tagMatch[1];
  const rest = text.slice(tagMatch[0].length);

  // Color the tag based on prefix
  let tagColor = "text-gray-500";
  if (tag.includes("BOOT")) tagColor = "text-info";
  else if (tag.includes("KERN")) tagColor = "text-gray-400";
  else if (tag.includes("INIT")) tagColor = "text-gray-400";
  else if (tag.includes("NET")) tagColor = "text-info";
  else if (tag.includes("SEC")) tagColor = "text-warning";
  else if (tag.includes("DATA")) tagColor = "text-brand";
  else if (tag.includes("SYS")) tagColor = "text-gray-400";
  else if (tag.includes("MON")) tagColor = "text-info";
  else if (tag.includes("THRT")) tagColor = "text-danger";
  else if (tag.includes("AUTH")) tagColor = "text-warning";
  else if (tag.includes("BIOS")) tagColor = "text-gray-500";

  // Color the status at the end (OK, ELEVATED, etc.)
  let mainText = rest;
  let statusText = "";
  let statusColor = "";

  if (rest.endsWith(" OK")) {
    mainText = rest.slice(0, -3);
    statusText = " OK";
    statusColor = "text-brand";
  } else if (rest.includes("ELEVATED")) {
    const parts = rest.split("ELEVATED");
    mainText = parts[0];
    statusText = "ELEVATED";
    statusColor = "text-warning";
  }

  return (
    <span className="text-[11px]">
      <span className={tagColor}>{tag}</span>
      <span className="text-gray-500"> {mainText}</span>
      {statusText && (
        <span className={statusColor} style={{ textShadow: statusColor === "text-brand" ? "0 0 6px #00ff4140" : undefined }}>
          {statusText}
        </span>
      )}
    </span>
  );
}

/** Generate a realistic-looking session ID */
function generateSessionId(): string {
  const hex = "0123456789abcdef";
  let id = "";
  for (let i = 0; i < 8; i++) {
    id += hex[Math.floor(Math.random() * 16)];
  }
  return id;
}
