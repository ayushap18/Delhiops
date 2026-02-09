import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import {
  Terminal,
  Cpu,
  Wifi,
  Clock,
  ChevronRight,
  Loader2,
  Zap,
  Shield,
  Activity,
} from "lucide-react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import api from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import type { LayoutContext } from "@/components/layout/AppLayout";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type OutputLineType =
  | "input"
  | "system"
  | "error"
  | "ai"
  | "search"
  | "info"
  | "success"
  | "json";

interface OutputLine {
  id: string;
  timestamp: Date;
  text: string;
  type: OutputLineType;
  isStreaming?: boolean;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const AVAILABLE_COMMANDS = [
  "/agent",
  "/search",
  "/api",
  "/help",
  "/clear",
  "/history",
  "/system",
  "/whoami",
  "/exit",
];

const SESSION_START = Date.now();

const TYPE_COLORS: Record<OutputLineType, string> = {
  input: "text-brand",
  system: "text-gray-400",
  error: "text-danger",
  ai: "text-info",
  search: "text-warning",
  info: "text-gray-300",
  success: "text-brand",
  json: "text-gray-300",
};

const ASCII_WELCOME = `
  ██████╗ ███████╗██╗     ██╗  ██╗██╗     ██████╗ ██████╗ ███████╗
  ██╔══██╗██╔════╝██║     ██║  ██║██║    ██╔═══██╗██╔══██╗██╔════╝
  ██║  ██║█████╗  ██║     ███████║██║    ██║   ██║██████╔╝███████╗
  ██║  ██║██╔══╝  ██║     ██╔══██║██║    ██║   ██║██╔═══╝ ╚════██║
  ██████╔╝███████╗███████╗██║  ██║██║    ╚██████╔╝██║     ███████║
  ╚═════╝ ╚══════╝╚══════╝╚═╝  ╚═╝╚═╝     ╚═════╝ ╚═╝     ╚══════╝
`;

// ---------------------------------------------------------------------------
// Gemini Client — tries multiple models with auto-fallback + retry on 429
// ---------------------------------------------------------------------------

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const MODEL_FALLBACK_ORDER = [
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-1.5-flash-latest",
];

async function geminiGenerate(
  prompt: string,
  retries = 2
): Promise<string> {
  let lastError: Error | null = null;

  for (const modelName of MODEL_FALLBACK_ORDER) {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const m = genAI.getGenerativeModel({ model: modelName });
        const result = await m.generateContent(prompt);
        return result.response.text();
      } catch (err: unknown) {
        lastError = err instanceof Error ? err : new Error(String(err));
        const msg = lastError.message;

        // If rate-limited (429), wait and retry same model
        if (msg.includes("429") && attempt < retries) {
          const delayMatch = msg.match(/retry.*?(\d+(?:\.\d+)?)\s*s/i);
          const waitSec = delayMatch ? parseFloat(delayMatch[1]) : 10;
          await new Promise((r) => setTimeout(r, (waitSec + 1) * 1000));
          continue;
        }

        // If quota exhausted (limit: 0), skip to next model immediately
        if (msg.includes("limit: 0")) break;

        // For other errors, don't retry
        break;
      }
    }
  }

  throw lastError ?? new Error("All Gemini models failed");
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let lineIdCounter = 0;
function nextId(): string {
  return `line-${Date.now()}-${++lineIdCounter}`;
}

function formatTimestamp(date: Date): string {
  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function formatUptime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function prettyJson(data: unknown): string {
  try {
    return JSON.stringify(data, null, 2);
  } catch {
    return String(data);
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AiTerminalPage() {
  const navigate = useNavigate();
  const { user, isAdmin, canWrite } = useAuth();
  // consume layout context so it stays connected
  useOutletContext<LayoutContext>();

  // State
  const [output, setOutput] = useState<OutputLine[]>([]);
  const [input, setInput] = useState("");
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [ghost, setGhost] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [commandCount, setCommandCount] = useState(0);
  const [uptime, setUptime] = useState("00:00:00");
  const [connectionStatus, setConnectionStatus] = useState<"online" | "offline">("online");

  // Refs
  const inputRef = useRef<HTMLInputElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // ---------------------------------------------------------------------------
  // Uptime ticker
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const interval = setInterval(() => {
      setUptime(formatUptime(Date.now() - SESSION_START));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // ---------------------------------------------------------------------------
  // Connection status check
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const check = async () => {
      try {
        await api.get("/health");
        setConnectionStatus("online");
      } catch {
        try {
          await api.get("/incidents", { params: { limit: 1 } });
          setConnectionStatus("online");
        } catch {
          setConnectionStatus("offline");
        }
      }
    };
    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, []);

  // ---------------------------------------------------------------------------
  // Welcome message on mount
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const welcomeLines: OutputLine[] = [
      ...ASCII_WELCOME.split("\n").map((line) => ({
        id: nextId(),
        timestamp: new Date(),
        text: line,
        type: "success" as OutputLineType,
      })),
      {
        id: nextId(),
        timestamp: new Date(),
        text: "",
        type: "system",
      },
      {
        id: nextId(),
        timestamp: new Date(),
        text: "  DELHI_OPS_AI_TERMINAL v1.0 // POWERED BY GEMINI",
        type: "ai",
      },
      {
        id: nextId(),
        timestamp: new Date(),
        text: `  SESSION INITIALIZED // USER: ${user?.email ?? "UNKNOWN"} // ROLE: ${user?.role ?? "N/A"}`,
        type: "system",
      },
      {
        id: nextId(),
        timestamp: new Date(),
        text: `  BACKEND: ${api.defaults.baseURL ?? "DEFAULT"} // STATUS: CONNECTED`,
        type: "system",
      },
      {
        id: nextId(),
        timestamp: new Date(),
        text: "",
        type: "system",
      },
      {
        id: nextId(),
        timestamp: new Date(),
        text: "  Type /help to see available commands.",
        type: "info",
      },
      {
        id: nextId(),
        timestamp: new Date(),
        text: "  ──────────────────────────────────────────────",
        type: "system",
      },
    ];
    setOutput(welcomeLines);
    // Focus input after mount
    setTimeout(() => inputRef.current?.focus(), 100);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------------------------------------------------------------------------
  // Auto-scroll
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  // ---------------------------------------------------------------------------
  // Ghost autocomplete
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!input || !input.startsWith("/")) {
      setGhost("");
      return;
    }
    const lower = input.toLowerCase();
    const match = AVAILABLE_COMMANDS.find(
      (cmd) => cmd.startsWith(lower) && cmd !== lower
    );
    setGhost(match ? match.slice(input.length) : "");
  }, [input]);

  // ---------------------------------------------------------------------------
  // Output helpers
  // ---------------------------------------------------------------------------
  const appendLines = useCallback((...lines: Omit<OutputLine, "id">[]) => {
    setOutput((prev) => [
      ...prev,
      ...lines.map((l) => ({ ...l, id: nextId() })),
    ]);
  }, []);

  const appendLine = useCallback(
    (text: string, type: OutputLineType) => {
      appendLines({ timestamp: new Date(), text, type });
    },
    [appendLines]
  );

  // ---------------------------------------------------------------------------
  // Typing effect for AI responses
  // ---------------------------------------------------------------------------
  const streamText = useCallback(
    (fullText: string, type: OutputLineType): Promise<void> => {
      return new Promise((resolve) => {
        const streamId = nextId();
        // Add empty streaming line
        setOutput((prev) => [
          ...prev,
          {
            id: streamId,
            timestamp: new Date(),
            text: "",
            type,
            isStreaming: true,
          },
        ]);

        let charIndex = 0;
        const chars = [...fullText];
        // Adaptive speed: faster for longer texts
        const baseDelay = chars.length > 500 ? 5 : chars.length > 200 ? 10 : 15;

        const tick = () => {
          if (charIndex < chars.length) {
            // Batch multiple chars for speed
            const batchSize = chars.length > 500 ? 4 : chars.length > 200 ? 3 : 2;
            const nextBatch = chars
              .slice(charIndex, charIndex + batchSize)
              .join("");
            charIndex += batchSize;

            setOutput((prev) =>
              prev.map((line) =>
                line.id === streamId
                  ? { ...line, text: line.text + nextBatch }
                  : line
              )
            );
            setTimeout(tick, baseDelay);
          } else {
            // Mark streaming complete
            setOutput((prev) =>
              prev.map((line) =>
                line.id === streamId ? { ...line, isStreaming: false } : line
              )
            );
            resolve();
          }
        };

        tick();
      });
    },
    []
  );

  // ---------------------------------------------------------------------------
  // Command: /agent
  // ---------------------------------------------------------------------------
  const handleAgent = useCallback(
    async (prompt: string) => {
      if (!prompt.trim()) {
        appendLine("ERROR: Usage: /agent <question>", "error");
        return;
      }

      appendLine("[PROCESSING...] Querying Gemini AI...", "system");
      setIsProcessing(true);

      try {
        const response = await geminiGenerate(prompt);

        if (!response) {
          appendLine("ERROR: Empty response from Gemini.", "error");
        } else {
          appendLine("--- GEMINI RESPONSE ---", "ai");
          // Stream each line of the response
          const lines = response.split("\n");
          for (const line of lines) {
            await streamText(line, "ai");
          }
          appendLine("--- END RESPONSE ---", "ai");
        }
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Unknown error occurred";
        appendLine(`ERROR: Gemini request failed — ${message}`, "error");

        if (message.includes("API_KEY")) {
          appendLine(
            "HINT: Set VITE_GEMINI_API_KEY in your environment variables.",
            "system"
          );
        } else if (message.includes("429") || message.includes("quota")) {
          appendLine(
            "HINT: Free tier quota exhausted. Enable billing at https://aistudio.google.com or wait for quota reset.",
            "system"
          );
        }
      } finally {
        setIsProcessing(false);
      }
    },
    [appendLine, streamText]
  );

  // ---------------------------------------------------------------------------
  // Command: /search
  // ---------------------------------------------------------------------------
  const handleSearch = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        appendLine("ERROR: Usage: /search <query>", "error");
        return;
      }

      appendLine(`[PROCESSING...] Searching: "${query}"`, "system");
      setIsProcessing(true);

      try {
        const searchPrompt = `Search the web and tell me about: ${query}. Provide a concise, factual answer with key points. If this relates to Delhi, India operations, city management, or public safety, emphasize those aspects.`;
        const response = await geminiGenerate(searchPrompt);

        if (!response) {
          appendLine("ERROR: No search results returned.", "error");
        } else {
          appendLine(`--- SEARCH RESULTS: "${query}" ---`, "search");
          const lines = response.split("\n");
          for (const line of lines) {
            await streamText(line, "search");
          }
          appendLine("--- END RESULTS ---", "search");
        }
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Unknown error occurred";
        appendLine(`ERROR: Search failed — ${message}`, "error");

        if (message.includes("429") || message.includes("quota")) {
          appendLine(
            "HINT: Free tier quota exhausted. Enable billing at https://aistudio.google.com or wait for quota reset.",
            "system"
          );
        }
      } finally {
        setIsProcessing(false);
      }
    },
    [appendLine, streamText]
  );

  // ---------------------------------------------------------------------------
  // Command: /api
  // ---------------------------------------------------------------------------
  const handleApi = useCallback(
    async (argsStr: string) => {
      const parts = argsStr.trim().split(/\s+/);
      if (parts.length < 2 || !parts[0]) {
        appendLine(
          "ERROR: Usage: /api <METHOD> <endpoint> [body]",
          "error"
        );
        appendLine(
          '  Examples: /api GET /incidents, /api POST /incidents {"type":"theft"}',
          "system"
        );
        return;
      }

      const method = parts[0].toUpperCase();
      const endpoint = parts[1];
      const bodyStr = parts.slice(2).join(" ");

      const validMethods = ["GET", "POST", "PUT", "PATCH", "DELETE"];
      if (!validMethods.includes(method)) {
        appendLine(
          `ERROR: Invalid HTTP method "${method}". Use: ${validMethods.join(", ")}`,
          "error"
        );
        return;
      }

      let body: unknown = undefined;
      if (bodyStr) {
        try {
          body = JSON.parse(bodyStr);
        } catch {
          appendLine("ERROR: Invalid JSON body. Check your syntax.", "error");
          return;
        }
      }

      appendLine(
        `[PROCESSING...] ${method} ${endpoint}${body ? " + body" : ""}`,
        "system"
      );
      setIsProcessing(true);

      try {
        const config: Record<string, unknown> = {
          method: method.toLowerCase(),
          url: endpoint,
        };
        if (body && method !== "GET" && method !== "DELETE") {
          config.data = body;
        }
        if (body && method === "GET") {
          config.params = body;
        }

        const response = await api.request(
          config as Parameters<typeof api.request>[0]
        );

        appendLine(
          `--- RESPONSE [${response.status} ${response.statusText}] ---`,
          "success"
        );

        const formatted = prettyJson(response.data);
        const lines = formatted.split("\n");
        for (const line of lines) {
          appendLine(`  ${line}`, "json");
        }

        appendLine("--- END RESPONSE ---", "success");
      } catch (err: unknown) {
        if (
          err &&
          typeof err === "object" &&
          "response" in err
        ) {
          const axiosErr = err as {
            response?: { status?: number; statusText?: string; data?: unknown };
            message?: string;
          };
          const status = axiosErr.response?.status ?? "???";
          const statusText = axiosErr.response?.statusText ?? "";
          appendLine(`ERROR: ${status} ${statusText}`, "error");

          if (axiosErr.response?.data) {
            const errorData = prettyJson(axiosErr.response.data);
            errorData.split("\n").forEach((line) => {
              appendLine(`  ${line}`, "error");
            });
          }
        } else {
          const message =
            err instanceof Error ? err.message : "Request failed";
          appendLine(`ERROR: ${message}`, "error");
        }
      } finally {
        setIsProcessing(false);
      }
    },
    [appendLine]
  );

  // ---------------------------------------------------------------------------
  // Command: /help
  // ---------------------------------------------------------------------------
  const handleHelp = useCallback(() => {
    const helpLines: [string, OutputLineType][] = [
      ["", "system"],
      ["  AVAILABLE COMMANDS", "ai"],
      ["  ══════════════════════════════════════════════", "system"],
      ["", "system"],
      ["  /agent <question>        Ask Gemini AI anything", "info"],
      ["  /search <query>          Search the web via Gemini AI", "info"],
      ["  /api <METHOD> <url>      Hit backend API endpoint", "info"],
      ['       Example: /api GET /incidents', "system"],
      ['       Example: /api POST /incidents {"type":"theft"}', "system"],
      ["  /help                    Show this help message", "info"],
      ["  /clear                   Clear terminal output", "info"],
      ["  /history                 Show command history", "info"],
      ["  /system                  Show system status", "info"],
      ["  /whoami                  Show current user info", "info"],
      ["  /exit                    Return to dashboard", "info"],
      ["", "system"],
      ["  KEYBOARD SHORTCUTS", "ai"],
      ["  ──────────────────────────────────────────────", "system"],
      ["  Enter          Execute command", "system"],
      ["  Up/Down        Navigate command history", "system"],
      ["  Tab             Autocomplete command", "system"],
      ["", "system"],
    ];

    for (const [text, type] of helpLines) {
      appendLine(text, type);
    }
  }, [appendLine]);

  // ---------------------------------------------------------------------------
  // Command: /system
  // ---------------------------------------------------------------------------
  const handleSystem = useCallback(async () => {
    appendLine("[PROCESSING...] Fetching system status...", "system");
    setIsProcessing(true);

    try {
      // Try /health first, then fall back to checking various endpoints
      let healthData: Record<string, unknown> | null = null;

      try {
        const res = await api.get("/health");
        healthData = res.data;
      } catch {
        // Fall back: try /status
        try {
          const res = await api.get("/status");
          healthData = res.data;
        } catch {
          // Neither endpoint available, gather status manually
        }
      }

      const [incRes, camRes, aqiRes] = await Promise.allSettled([
        api.get("/incidents", { params: { limit: 1 } }),
        api.get("/cameras", { params: { limit: 1 } }),
        api.get("/aqi", { params: { limit: 1 } }),
      ]);

      const incTotal =
        incRes.status === "fulfilled"
          ? incRes.value.data?.pagination?.total ?? "N/A"
          : "ERR";
      const camTotal =
        camRes.status === "fulfilled"
          ? camRes.value.data?.pagination?.total ?? "N/A"
          : "ERR";
      const aqiTotal =
        aqiRes.status === "fulfilled"
          ? aqiRes.value.data?.pagination?.total ?? "N/A"
          : "ERR";

      appendLine("", "system");
      appendLine("  ┌──────────────────────────────────────────┐", "ai");
      appendLine("  │          SYSTEM STATUS REPORT            │", "ai");
      appendLine("  └──────────────────────────────────────────┘", "ai");
      appendLine("", "system");

      if (healthData) {
        appendLine(`  HEALTH CHECK:     ${prettyJson(healthData)}`, "success");
      }

      appendLine(
        `  API ENDPOINT:     ${api.defaults.baseURL ?? "DEFAULT"}`,
        "info"
      );
      appendLine(
        `  AUTH STATUS:      ${user ? "AUTHENTICATED" : "UNAUTHENTICATED"}`,
        user ? "success" : "error"
      );
      appendLine(`  USER:             ${user?.email ?? "N/A"}`, "info");
      appendLine(`  ROLE:             ${user?.role ?? "N/A"}`, "info");
      appendLine(`  SESSION UPTIME:   ${uptime}`, "info");
      appendLine(`  COMMANDS RUN:     ${commandCount}`, "info");
      appendLine("", "system");
      appendLine("  DATA INVENTORY:", "ai");
      appendLine(`    Incidents:      ${incTotal}`, "info");
      appendLine(`    Cameras:        ${camTotal}`, "info");
      appendLine(`    AQI Readings:   ${aqiTotal}`, "info");
      appendLine("", "system");
      appendLine(
        `  GEMINI API:       ${import.meta.env.VITE_GEMINI_API_KEY ? "CONFIGURED" : "NOT CONFIGURED"}`,
        import.meta.env.VITE_GEMINI_API_KEY ? "success" : "error"
      );
      appendLine("", "system");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch status";
      appendLine(`ERROR: ${message}`, "error");
    } finally {
      setIsProcessing(false);
    }
  }, [appendLine, user, uptime, commandCount]);

  // ---------------------------------------------------------------------------
  // Command: /whoami
  // ---------------------------------------------------------------------------
  const handleWhoami = useCallback(() => {
    if (!user) {
      appendLine("ERROR: Not authenticated.", "error");
      return;
    }

    appendLine("", "system");
    appendLine("  ┌──────────────────────────────────────────┐", "ai");
    appendLine("  │            USER IDENTITY                 │", "ai");
    appendLine("  └──────────────────────────────────────────┘", "ai");
    appendLine("", "system");
    appendLine(`  ID:               ${user.id}`, "info");
    appendLine(`  EMAIL:            ${user.email}`, "info");
    appendLine(`  ROLE:             ${user.role}`, "info");
    appendLine(
      `  ADMIN ACCESS:     ${isAdmin ? "GRANTED" : "DENIED"}`,
      isAdmin ? "success" : "system"
    );
    appendLine(
      `  WRITE ACCESS:     ${canWrite ? "GRANTED" : "DENIED"}`,
      canWrite ? "success" : "system"
    );
    appendLine(`  SESSION UPTIME:   ${uptime}`, "info");
    appendLine("", "system");
  }, [appendLine, user, isAdmin, canWrite, uptime]);

  // ---------------------------------------------------------------------------
  // Command: /history
  // ---------------------------------------------------------------------------
  const handleHistory = useCallback(() => {
    if (commandHistory.length === 0) {
      appendLine("  No commands in history.", "system");
      return;
    }

    appendLine("", "system");
    appendLine("  COMMAND HISTORY", "ai");
    appendLine("  ──────────────────────────────────────────────", "system");
    commandHistory.forEach((cmd, i) => {
      appendLine(
        `  ${String(commandHistory.length - i).padStart(3, " ")}. ${cmd}`,
        "info"
      );
    });
    appendLine("", "system");
  }, [appendLine, commandHistory]);

  // ---------------------------------------------------------------------------
  // Execute command
  // ---------------------------------------------------------------------------
  const executeCommand = useCallback(
    async (raw: string) => {
      const trimmed = raw.trim();
      if (!trimmed) return;

      // Echo input
      appendLine(`>_ ${trimmed}`, "input");
      setCommandCount((prev) => prev + 1);

      // Commands must start with /
      if (!trimmed.startsWith("/")) {
        appendLine(
          'ERROR: Commands must start with "/". Type /help for available commands.',
          "error"
        );
        return;
      }

      const spaceIdx = trimmed.indexOf(" ");
      const cmd = (spaceIdx > -1 ? trimmed.slice(0, spaceIdx) : trimmed).toLowerCase();
      const args = spaceIdx > -1 ? trimmed.slice(spaceIdx + 1) : "";

      switch (cmd) {
        case "/agent":
          await handleAgent(args);
          break;

        case "/search":
          await handleSearch(args);
          break;

        case "/api":
          await handleApi(args);
          break;

        case "/help":
          handleHelp();
          break;

        case "/clear":
          setOutput([]);
          break;

        case "/history":
          handleHistory();
          break;

        case "/system":
          await handleSystem();
          break;

        case "/whoami":
          handleWhoami();
          break;

        case "/exit":
          appendLine("Navigating to dashboard...", "success");
          setTimeout(() => navigate("/"), 300);
          break;

        default:
          appendLine(`ERROR: Unknown command "${cmd}".`, "error");
          appendLine("  Type /help to see available commands.", "system");
          break;
      }
    },
    [
      appendLine,
      handleAgent,
      handleSearch,
      handleApi,
      handleHelp,
      handleHistory,
      handleSystem,
      handleWhoami,
      navigate,
    ]
  );

  // ---------------------------------------------------------------------------
  // Keyboard handler
  // ---------------------------------------------------------------------------
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      switch (e.key) {
        case "Enter": {
          e.preventDefault();
          if (isProcessing) return;
          const value = input.trim();
          if (value) {
            setCommandHistory((prev) => [value, ...prev]);
            setHistoryIndex(-1);
            executeCommand(value);
          }
          setInput("");
          setGhost("");
          break;
        }

        case "ArrowUp": {
          e.preventDefault();
          if (commandHistory.length === 0) break;
          const nextIdx = Math.min(
            historyIndex + 1,
            commandHistory.length - 1
          );
          setHistoryIndex(nextIdx);
          setInput(commandHistory[nextIdx]);
          break;
        }

        case "ArrowDown": {
          e.preventDefault();
          if (historyIndex <= 0) {
            setHistoryIndex(-1);
            setInput("");
            break;
          }
          const prevIdx = historyIndex - 1;
          setHistoryIndex(prevIdx);
          setInput(commandHistory[prevIdx]);
          break;
        }

        case "Tab": {
          e.preventDefault();
          if (ghost) {
            setInput((prev) => prev + ghost);
            setGhost("");
          }
          break;
        }

        default:
          break;
      }
    },
    [input, ghost, commandHistory, historyIndex, executeCommand, isProcessing]
  );

  // ---------------------------------------------------------------------------
  // Focus input on click anywhere in terminal body
  // ---------------------------------------------------------------------------
  const handleTerminalClick = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  // ---------------------------------------------------------------------------
  // Cleanup abort controller on unmount
  // ---------------------------------------------------------------------------
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Memoized processing indicator
  // ---------------------------------------------------------------------------
  const processingIndicator = useMemo(() => {
    if (!isProcessing) return null;
    return (
      <div className="flex items-center gap-2 px-4 py-1.5 border-t border-brand/5">
        <Loader2 className="h-3 w-3 text-info animate-spin" />
        <span className="text-[10px] font-mono text-info tracking-wider animate-pulse">
          [PROCESSING...]
        </span>
      </div>
    );
  }, [isProcessing]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="h-full flex flex-col gap-4">
      {/* PAGE HEADER */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Terminal className="h-4 w-4 text-brand" />
            <h1 className="text-lg font-bold text-brand font-[Orbitron] tracking-widest text-glow">
              AI TERMINAL
            </h1>
          </div>
          <p className="text-[10px] text-gray-600 font-mono tracking-[0.2em]">
            {">"} INTEGRATED AI OPERATIONS CONSOLE // GEMINI POWERED
          </p>
        </div>
        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-2 border border-info/15 bg-info/5 px-3 py-1.5">
            <Cpu className="h-3 w-3 text-info" />
            <span className="text-[9px] font-mono text-info tracking-wider">
              GEMINI 2.0 FLASH
            </span>
          </div>
          <div className="flex items-center gap-2 border border-brand/15 bg-brand/5 px-3 py-1.5">
            <Shield className="h-3 w-3 text-brand" />
            <span className="text-[9px] font-mono text-brand tracking-wider">
              {user?.role ?? "N/A"}
            </span>
          </div>
        </div>
      </div>

      {/* TERMINAL CONTAINER */}
      <div className="flex-1 min-h-0 bg-gray-950 border border-brand/10 corner-borders flex flex-col relative overflow-hidden">
        {/* Decorative top gradient */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand/30 to-transparent" />

        {/* TERMINAL HEADER BAR */}
        <div className="shrink-0 flex items-center justify-between px-4 py-2.5 border-b border-brand/10 bg-gray-950">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-danger" />
              <div className="h-2 w-2 rounded-full bg-warning" />
              <div className="h-2 w-2 rounded-full bg-brand" />
            </div>
            <div className="flex items-center gap-2">
              <Terminal className="h-3.5 w-3.5 text-brand" />
              <span className="text-[10px] font-mono font-bold text-brand tracking-wider">
                DELHI_OPS_AI_TERMINAL v1.0
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Connection status */}
            <div className="flex items-center gap-1.5">
              <Wifi
                className={`h-3 w-3 ${connectionStatus === "online" ? "text-brand" : "text-danger"}`}
              />
              <span
                className={`text-[9px] font-mono tracking-wider ${connectionStatus === "online" ? "text-brand" : "text-danger"}`}
              >
                {connectionStatus === "online" ? "CONNECTED" : "OFFLINE"}
              </span>
            </div>

            {/* Uptime */}
            <div className="hidden sm:flex items-center gap-1.5">
              <Clock className="h-3 w-3 text-gray-500" />
              <span className="text-[9px] font-mono text-gray-500 tracking-wider">
                {uptime}
              </span>
            </div>

            {/* Command count */}
            <div className="hidden sm:flex items-center gap-1.5">
              <Zap className="h-3 w-3 text-gray-500" />
              <span className="text-[9px] font-mono text-gray-500 tracking-wider">
                CMD:{commandCount}
              </span>
            </div>

            {/* Activity indicator */}
            <div className="flex items-center gap-1.5">
              <Activity
                className={`h-3 w-3 ${isProcessing ? "text-info animate-pulse" : "text-gray-700"}`}
              />
            </div>
          </div>
        </div>

        {/* OUTPUT AREA */}
        <div
          ref={outputRef}
          className="flex-1 min-h-0 overflow-y-auto px-4 py-3 font-mono text-[11px] leading-relaxed cursor-text data-stream-bg"
          onClick={handleTerminalClick}
        >
          {output.map((line) => (
            <div key={line.id} className="flex gap-3 group hover:bg-brand/[0.02]">
              {/* Timestamp */}
              <span className="text-gray-700 text-[9px] shrink-0 select-none leading-relaxed hidden sm:inline">
                [{formatTimestamp(line.timestamp)}]
              </span>
              {/* Content */}
              <span
                className={`${TYPE_COLORS[line.type]} whitespace-pre-wrap break-all`}
              >
                {line.text || "\u00A0"}
                {line.isStreaming && (
                  <span className="inline-block w-1.5 h-3 bg-current ml-0.5 animate-pulse" />
                )}
              </span>
            </div>
          ))}

          {/* Scroll anchor */}
          <div className="h-1" />
        </div>

        {/* Processing indicator */}
        {processingIndicator}

        {/* INPUT AREA */}
        <div className="shrink-0 flex items-center gap-2 px-4 py-3 border-t border-brand/10 bg-gray-950/80">
          <span className="text-brand text-xs font-mono font-bold select-none flex items-center gap-1">
            <ChevronRight className="h-3 w-3" />
            <span className="typing-cursor text-brand">{">"}</span>
          </span>
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full bg-transparent text-[12px] font-mono text-brand outline-none placeholder:text-gray-700 caret-brand"
              placeholder={
                isProcessing
                  ? "Processing... please wait"
                  : "Enter command... (start with /)"
              }
              autoComplete="off"
              spellCheck={false}
              disabled={isProcessing}
              aria-label="Terminal command input"
            />
            {/* Ghost autocomplete */}
            {ghost && !isProcessing && (
              <span
                className="absolute left-0 top-0 text-[12px] font-mono text-gray-700 pointer-events-none select-none"
                aria-hidden="true"
              >
                <span className="invisible">{input}</span>
                {ghost}
              </span>
            )}
          </div>
          <span className="text-[9px] font-mono text-gray-700 tracking-wider select-none hidden sm:inline">
            TAB: autocomplete | UP/DOWN: history
          </span>
        </div>
      </div>
    </div>
  );
}
