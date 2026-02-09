import { LogOut, Wifi, WifiOff, Shield, Radio, Cpu, Terminal } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSocket } from "@/hooks/useSocket";
import { useState, useEffect } from "react";

interface HeaderProps {
  onTerminalToggle?: () => void;
}

export function Header({ onTerminalToggle }: HeaderProps) {
  const { user, logout } = useAuth();
  const { connected } = useSocket();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeStr = time.toLocaleTimeString("en-IN", { hour12: false });
  const dateStr = time.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <header className="flex items-center justify-between px-6 py-2.5 bg-gray-950/80 border-b border-brand/10 relative backdrop-blur-sm">
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand/20 to-transparent" />

      <div className="flex items-center gap-6">
        {/* CONNECTION STATUS */}
        <div
          className="flex items-center gap-2 text-[10px] tracking-wider font-mono"
          aria-live="polite"
          aria-label={connected ? "Connected to server" : "Disconnected from server"}
        >
          {connected ? (
            <div className="relative flex items-center gap-1.5 border border-brand/15 bg-brand/5 px-2 py-0.5">
              <Wifi className="h-3 w-3 text-brand" />
              <span className="text-brand">CONNECTED</span>
              <div className="h-1.5 w-1.5 rounded-full bg-brand status-dot ml-0.5" />
            </div>
          ) : (
            <div className="flex items-center gap-1.5 border border-danger/15 bg-danger/5 px-2 py-0.5">
              <WifiOff className="h-3 w-3 text-danger" />
              <span className="text-danger">OFFLINE</span>
            </div>
          )}
        </div>

        {/* UPLINK */}
        <div className="hidden md:flex items-center gap-1.5 text-[10px] text-gray-600 font-mono tracking-wider">
          <Radio className="h-3 w-3" />
          <span>UPLINK.ACTIVE</span>
        </div>

        {/* CPU */}
        <div className="hidden lg:flex items-center gap-1.5 text-[10px] text-gray-600 font-mono tracking-wider">
          <Cpu className="h-3 w-3" />
          <span>NODE.READY</span>
        </div>
      </div>

      <div className="flex items-center gap-5">
        {/* CLOCK */}
        <div className="hidden sm:flex flex-col items-end text-right">
          <span className="text-xs font-bold text-brand font-[Orbitron] tracking-widest text-glow tabular-nums">
            {timeStr}
          </span>
          <span className="text-[9px] text-gray-600 font-mono tracking-wider">
            {dateStr.toUpperCase()}
          </span>
        </div>

        <div className="h-6 w-px bg-gradient-to-b from-transparent via-brand/15 to-transparent" />

        {/* TERMINAL TOGGLE */}
        {onTerminalToggle && (
          <button
            onClick={onTerminalToggle}
            className="flex items-center gap-1.5 p-1.5 text-gray-600 hover:text-brand transition-all duration-200 hover:bg-brand/10 group"
            aria-label="Open command terminal (Ctrl+K)"
            title="Command Terminal (Ctrl+K)"
          >
            <Terminal className="h-4 w-4 group-hover:drop-shadow-[0_0_4px_rgba(0,255,65,0.5)]" />
            <span className="text-[8px] font-mono tracking-wider hidden lg:inline text-gray-700 group-hover:text-brand/60">CTRL+K</span>
          </button>
        )}

        <div className="h-6 w-px bg-gradient-to-b from-transparent via-brand/15 to-transparent" />

        {/* USER */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-[10px] font-medium text-gray-300 font-mono tracking-wider">
              {user?.email?.split("@")[0]?.toUpperCase()}
            </p>
          </div>
          <div className="flex items-center gap-1.5 bg-brand/10 border border-brand/20 px-2 py-1">
            <Shield className="h-3 w-3 text-brand" />
            <span className="text-[9px] font-bold text-brand tracking-wider font-mono">
              {user?.role?.toUpperCase()}
            </span>
          </div>
          <button
            onClick={logout}
            className="p-1.5 text-gray-600 hover:text-danger transition-all duration-200 hover:bg-danger/10"
            aria-label="Log out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
