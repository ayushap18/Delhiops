import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Terminal, X } from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

interface CommandTerminalProps {
  open: boolean;
  onClose: () => void;
}

interface OutputLine {
  text: string;
  type: "info" | "success" | "error" | "system";
}

const ROUTE_MAP: Record<string, string> = {
  dashboard: "/",
  home: "/",
  aqi: "/aqi",
  traffic: "/traffic",
  crime: "/crime",
  cameras: "/cameras",
  cams: "/cameras",
  incidents: "/incidents",
  reports: "/reports",
  admin: "/admin",
  login: "/login",
  "ai-terminal": "/ai-terminal",
  terminal: "/ai-terminal",
  ai: "/ai-terminal",
};

const COMMANDS = [
  "help",
  "clear",
  "status",
  "goto",
  "show",
  "search",
  "whoami",
  "uptime",
  "version",
  "exit",
];

const WELCOME_LINES: OutputLine[] = [
  { text: "CITYWATCH COMMAND TERMINAL v2.1.0", type: "success" },
  { text: "Type 'help' for available commands.", type: "system" },
  { text: "---", type: "system" },
];

const TYPE_COLORS: Record<OutputLine["type"], string> = {
  info: "text-gray-300",
  success: "text-brand",
  error: "text-danger",
  system: "text-gray-500",
};

function buildHelp(): OutputLine[] {
  return [
    { text: "Available commands:", type: "success" },
    { text: "", type: "system" },
    { text: "  help                  Show this help message", type: "info" },
    { text: "  clear                 Clear terminal output", type: "info" },
    { text: "  status                Show system status", type: "info" },
    {
      text: "  goto <page>           Navigate to a page",
      type: "info",
    },
    {
      text: "      Pages: dashboard, aqi, traffic, crime, cameras, incidents, reports, admin",
      type: "system",
    },
    {
      text: "  show <resource>       Fetch latest data summary",
      type: "info",
    },
    {
      text: "      Resources: incidents, cameras, aqi, crime, traffic",
      type: "system",
    },
    {
      text: "  search <query>        Search incidents by keyword",
      type: "info",
    },
    { text: "  whoami                Show current user info", type: "info" },
    { text: "  uptime                Show session uptime", type: "info" },
    { text: "  version               Show app version", type: "info" },
    { text: "  exit                  Close terminal", type: "info" },
  ];
}

const SESSION_START = Date.now();

export function CommandTerminal({ open, onClose }: CommandTerminalProps) {
  const navigate = useNavigate();
  const { user, isAdmin, canWrite } = useAuth();

  const [output, setOutput] = useState<OutputLine[]>(WELCOME_LINES);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [ghost, setGhost] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  // Auto-focus input when terminal opens
  useEffect(() => {
    if (open) {
      // Small delay to allow animation to begin
      const timer = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Auto-scroll output to bottom
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  // Compute ghost autocomplete text
  useEffect(() => {
    if (!input) {
      setGhost("");
      return;
    }
    const lower = input.toLowerCase();
    const match = COMMANDS.find((cmd) => cmd.startsWith(lower) && cmd !== lower);
    setGhost(match ? match.slice(input.length) : "");
  }, [input]);

  const appendOutput = useCallback((lines: OutputLine[]) => {
    setOutput((prev) => [...prev, ...lines]);
  }, []);

  const executeCommand = useCallback(
    async (raw: string) => {
      const trimmed = raw.trim();
      if (!trimmed) return;

      // Echo the command
      appendOutput([{ text: `> ${trimmed}`, type: "system" }]);

      const parts = trimmed.split(/\s+/);
      const cmd = parts[0].toLowerCase();
      const args = parts.slice(1);

      switch (cmd) {
        case "help": {
          appendOutput(buildHelp());
          break;
        }

        case "clear": {
          setOutput([]);
          break;
        }

        case "exit":
        case "quit":
        case "close": {
          onClose();
          break;
        }

        case "goto":
        case "go":
        case "nav":
        case "navigate": {
          const page = args[0]?.toLowerCase();
          if (!page) {
            appendOutput([
              { text: "Usage: goto <page>", type: "error" },
              {
                text: "Pages: " + Object.keys(ROUTE_MAP).join(", "),
                type: "system",
              },
            ]);
            break;
          }
          const route = ROUTE_MAP[page];
          if (!route) {
            appendOutput([
              { text: `Unknown page: ${page}`, type: "error" },
              {
                text: "Pages: " + Object.keys(ROUTE_MAP).join(", "),
                type: "system",
              },
            ]);
            break;
          }
          appendOutput([
            { text: `Navigating to /${page}...`, type: "success" },
          ]);
          navigate(route);
          onClose();
          break;
        }

        case "whoami": {
          if (!user) {
            appendOutput([{ text: "Not authenticated.", type: "error" }]);
          } else {
            appendOutput([
              { text: `User:  ${user.email}`, type: "info" },
              { text: `Role:  ${user.role}`, type: "info" },
              {
                text: `Admin: ${isAdmin ? "yes" : "no"}`,
                type: isAdmin ? "success" : "info",
              },
              {
                text: `Write: ${canWrite ? "yes" : "no"}`,
                type: canWrite ? "success" : "info",
              },
            ]);
          }
          break;
        }

        case "status": {
          appendOutput([
            { text: "Fetching system status...", type: "system" },
          ]);
          try {
            const [incRes, camRes] = await Promise.allSettled([
              api.get("/incidents", { params: { limit: 1 } }),
              api.get("/cameras", { params: { limit: 1 } }),
            ]);

            const incTotal =
              incRes.status === "fulfilled"
                ? incRes.value.data?.pagination?.total ?? "?"
                : "err";
            const camTotal =
              camRes.status === "fulfilled"
                ? camRes.value.data?.pagination?.total ?? "?"
                : "err";

            appendOutput([
              { text: "SYSTEM STATUS", type: "success" },
              { text: `  Incidents tracked:  ${incTotal}`, type: "info" },
              { text: `  Cameras registered: ${camTotal}`, type: "info" },
              {
                text: `  API endpoint:       ${api.defaults.baseURL}`,
                type: "info",
              },
              {
                text: `  Auth:               ${user ? "authenticated" : "unauthenticated"}`,
                type: user ? "success" : "error",
              },
            ]);
          } catch {
            appendOutput([
              { text: "Failed to fetch system status.", type: "error" },
            ]);
          }
          break;
        }

        case "show": {
          const resource = args[0]?.toLowerCase();
          if (!resource) {
            appendOutput([
              { text: "Usage: show <resource>", type: "error" },
              {
                text: "Resources: incidents, cameras, aqi, crime, traffic",
                type: "system",
              },
            ]);
            break;
          }

          const resourceEndpoints: Record<string, string> = {
            incidents: "/incidents",
            cameras: "/cameras",
            aqi: "/aqi",
            crime: "/crime",
            traffic: "/traffic",
          };

          const endpoint = resourceEndpoints[resource];
          if (!endpoint) {
            appendOutput([
              { text: `Unknown resource: ${resource}`, type: "error" },
              {
                text: "Resources: " + Object.keys(resourceEndpoints).join(", "),
                type: "system",
              },
            ]);
            break;
          }

          appendOutput([
            { text: `Fetching ${resource}...`, type: "system" },
          ]);

          try {
            const { data } = await api.get(endpoint, {
              params: { limit: 5 },
            });
            const items = data.data ?? data;
            const total = data.pagination?.total;

            if (Array.isArray(items) && items.length > 0) {
              appendOutput([
                {
                  text: `${resource.toUpperCase()} (latest ${items.length}${total ? ` of ${total}` : ""})`,
                  type: "success",
                },
              ]);
              items.forEach((item: Record<string, unknown>, i: number) => {
                const id = item.id ?? i;
                const type = item.type ?? item.status ?? "";
                const severity = item.severity ?? "";
                const summary = [type, severity].filter(Boolean).join(" | ");
                appendOutput([
                  {
                    text: `  [${id}] ${summary}`,
                    type: "info",
                  },
                ]);
              });
            } else {
              appendOutput([
                { text: `No ${resource} data found.`, type: "info" },
              ]);
            }
          } catch {
            appendOutput([
              { text: `Failed to fetch ${resource}.`, type: "error" },
            ]);
          }
          break;
        }

        case "search": {
          const query = args.join(" ");
          if (!query) {
            appendOutput([
              { text: "Usage: search <query>", type: "error" },
            ]);
            break;
          }

          appendOutput([
            { text: `Searching incidents for "${query}"...`, type: "system" },
          ]);

          try {
            const { data } = await api.get("/incidents", {
              params: { search: query, limit: 10 },
            });
            const items = data.data ?? data;
            if (Array.isArray(items) && items.length > 0) {
              appendOutput([
                {
                  text: `Found ${items.length} result(s):`,
                  type: "success",
                },
              ]);
              items.forEach((item: Record<string, unknown>) => {
                const desc =
                  typeof item.description === "string"
                    ? item.description.slice(0, 80)
                    : item.type ?? "—";
                appendOutput([
                  {
                    text: `  [${item.id}] ${desc}`,
                    type: "info",
                  },
                ]);
              });
            } else {
              appendOutput([
                { text: `No results for "${query}".`, type: "info" },
              ]);
            }
          } catch {
            appendOutput([{ text: "Search failed.", type: "error" }]);
          }
          break;
        }

        case "uptime": {
          const elapsed = Date.now() - SESSION_START;
          const mins = Math.floor(elapsed / 60000);
          const secs = Math.floor((elapsed % 60000) / 1000);
          appendOutput([
            {
              text: `Session uptime: ${mins}m ${secs}s`,
              type: "info",
            },
          ]);
          break;
        }

        case "version": {
          appendOutput([
            { text: "CityWatch Dashboard v2.1.0", type: "success" },
            { text: "Build: production", type: "info" },
          ]);
          break;
        }

        default: {
          appendOutput([
            {
              text: `Unknown command: ${cmd}`,
              type: "error",
            },
            {
              text: "Type 'help' for available commands.",
              type: "system",
            },
          ]);
        }
      }
    },
    [appendOutput, navigate, onClose, user, isAdmin, canWrite]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      switch (e.key) {
        case "Enter": {
          e.preventDefault();
          const value = input.trim();
          if (value) {
            setHistory((prev) => [value, ...prev]);
            setHistoryIndex(-1);
            executeCommand(value);
          }
          setInput("");
          setGhost("");
          break;
        }

        case "Escape": {
          e.preventDefault();
          onClose();
          break;
        }

        case "ArrowUp": {
          e.preventDefault();
          if (history.length === 0) break;
          const nextIdx = Math.min(historyIndex + 1, history.length - 1);
          setHistoryIndex(nextIdx);
          setInput(history[nextIdx]);
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
          setInput(history[prevIdx]);
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
    [input, ghost, history, historyIndex, onClose, executeCommand]
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16"
      role="dialog"
      aria-modal="true"
      aria-label="Command terminal"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Terminal window */}
      <div className="relative z-10 w-full max-w-2xl bg-gray-950 border border-brand/20 shadow-[0_0_40px_rgba(0,255,65,0.08)] corner-borders animate-slide-down">
        {/* Top accent */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand/30 to-transparent" />

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-brand/10">
          <div className="flex items-center gap-2">
            <Terminal className="h-3.5 w-3.5 text-brand" />
            <span className="text-[10px] font-mono font-bold text-brand tracking-wider uppercase">
              Command Terminal
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-400 transition-colors"
            aria-label="Close terminal"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Output area */}
        <div
          ref={outputRef}
          className="h-72 overflow-y-auto px-4 py-3 font-mono text-[11px] leading-relaxed"
        >
          {output.map((line, i) => (
            <div key={i} className={TYPE_COLORS[line.type]}>
              {line.text || "\u00A0"}
            </div>
          ))}
        </div>

        {/* Input area */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-t border-brand/10">
          <span className="text-brand text-[11px] font-mono font-bold select-none">
            {">"}
          </span>
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full bg-transparent text-[11px] font-mono text-gray-100 outline-none placeholder:text-gray-700 caret-brand"
              placeholder="Enter command..."
              autoComplete="off"
              spellCheck={false}
            />
            {/* Ghost autocomplete */}
            {ghost && (
              <span
                className="absolute left-0 top-0 text-[11px] font-mono text-gray-700 pointer-events-none select-none"
                aria-hidden="true"
              >
                <span className="invisible">{input}</span>
                {ghost}
              </span>
            )}
          </div>
          <span className="text-[9px] font-mono text-gray-700 tracking-wider select-none">
            ESC to close
          </span>
        </div>
      </div>
    </div>
  );
}
