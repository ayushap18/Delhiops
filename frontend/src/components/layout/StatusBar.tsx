import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useSocket } from "@/hooks/useSocket";

export function StatusBar() {
  const { connected } = useSocket();
  const location = useLocation();
  const mountTime = useRef(Date.now());
  const [uptime, setUptime] = useState("0m 0s");

  useEffect(() => {
    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - mountTime.current) / 1000);
      const mins = Math.floor(elapsed / 60);
      const secs = elapsed % 60;
      setUptime(`${mins}m ${secs}s`);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="h-7 bg-gray-950 border-t border-brand/10 flex items-center justify-between px-3 text-[9px] font-mono tracking-wider select-none relative">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand/10 to-transparent" />

      {/* Left section */}
      <div className="flex items-center gap-4">
        {/* Socket status */}
        <div className="flex items-center gap-1.5">
          <span
            className={`inline-block h-1.5 w-1.5 rounded-full transition-colors ${
              connected ? "bg-[#00ff41] shadow-[0_0_4px_#00ff41]" : "bg-red-500 shadow-[0_0_4px_#ef4444]"
            }`}
          />
          <span className="text-gray-500">SOCKET:</span>
          <span className={connected ? "text-[#00ff41]" : "text-red-500"}>
            {connected ? "CONNECTED" : "OFFLINE"}
          </span>
        </div>

        <span className="text-gray-800">|</span>

        {/* Current route */}
        <div className="flex items-center gap-1.5">
          <span className="text-gray-500">PATH:</span>
          <span className="text-gray-400">{location.pathname.toUpperCase()}</span>
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-4">
        <span className="border border-brand/10 px-1.5 py-0.5 text-gray-600 hover:text-brand hover:border-brand/20 transition-colors cursor-default">
          CTRL+K
        </span>

        <span className="text-gray-800">|</span>

        <div className="flex items-center gap-1.5">
          <span className="text-gray-500">UP:</span>
          <span className="text-gray-400 tabular-nums">{uptime}</span>
        </div>

        <div className="hidden md:flex items-center gap-1.5">
          <span className="text-gray-700">v2.1.0</span>
        </div>
      </div>
    </div>
  );
}
