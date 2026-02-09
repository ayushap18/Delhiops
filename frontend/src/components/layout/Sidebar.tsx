import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Wind,
  Car,
  ShieldAlert,
  Camera,
  AlertTriangle,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Terminal,
  Hexagon,
  BotMessageSquare,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSidebarStats } from "@/hooks/useSidebarStats";
import { cn } from "@/lib/utils";
import { useState } from "react";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard", code: "DASH" },
  { to: "/aqi", icon: Wind, label: "Air Quality", code: "AQI_" },
  { to: "/traffic", icon: Car, label: "Traffic", code: "TRFC" },
  { to: "/crime", icon: ShieldAlert, label: "Crime", code: "CRIM" },
  { to: "/cameras", icon: Camera, label: "Cameras", code: "CAMS" },
  { to: "/incidents", icon: AlertTriangle, label: "Incidents", code: "INCD" },
  { to: "/reports", icon: BarChart3, label: "Reports", code: "RPRT" },
  { to: "/ai-terminal", icon: BotMessageSquare, label: "AI Terminal", code: "AI_T" },
];

const adminItems = [
  { to: "/admin", icon: Settings, label: "System Admin", code: "ADMN" },
];

export function Sidebar() {
  const { isAdmin } = useAuth();
  const stats = useSidebarStats();
  const [collapsed, setCollapsed] = useState(false);
  const items = isAdmin ? [...navItems, ...adminItems] : navItems;

  const getBadge = (to: string): React.ReactNode => {
    if (collapsed) return null;
    if (to === "/incidents" && stats.openIncidents > 0) {
      return (
        <span className="ml-auto text-[8px] font-mono px-1.5 py-0.5 border border-danger/20 bg-danger/5 text-danger tabular-nums">
          {stats.openIncidents}
        </span>
      );
    }
    if (to === "/cameras" && stats.onlineCameras > 0) {
      return (
        <span className="ml-auto text-[8px] font-mono px-1.5 py-0.5 border border-brand/20 bg-brand/5 text-brand tabular-nums">
          {stats.onlineCameras}
        </span>
      );
    }
    if (to === "/aqi" && stats.latestAqi > 0) {
      const aqiColor = stats.latestAqi <= 50 ? "bg-brand" : stats.latestAqi <= 100 ? "bg-warning" : "bg-danger";
      return (
        <span className="ml-auto flex items-center gap-1">
          <span className={cn("h-1.5 w-1.5 rounded-full", aqiColor)} />
          <span className="text-[8px] font-mono text-gray-600 tabular-nums">{stats.latestAqi}</span>
        </span>
      );
    }
    return null;
  };

  return (
    <aside
      className={cn(
        "flex flex-col bg-gray-950 border-r border-brand/10 transition-all duration-300 relative overflow-hidden",
        collapsed ? "w-16" : "w-64"
      )}
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Right edge gradient */}
      <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-brand/30 to-transparent" />

      {/* Logo section */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-brand/10 relative">
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-brand/20 via-brand/5 to-transparent" />
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <div className="relative pulse-glow" style={{ borderRadius: "50%" }}>
              <Hexagon className="h-8 w-8 text-brand" strokeWidth={1.5} />
              <Terminal className="h-4 w-4 text-brand absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" strokeWidth={2} />
            </div>
            <div>
              <h1 className="text-sm font-bold text-brand font-[Orbitron] tracking-wider text-glow">
                DELHI OPS
              </h1>
              <p className="text-[10px] text-gray-500 tracking-[0.2em] uppercase">
                Command Center
              </p>
            </div>
          </div>
        ) : (
          <div className="mx-auto relative pulse-glow" style={{ borderRadius: "50%" }}>
            <Hexagon className="h-8 w-8 text-brand" strokeWidth={1.5} />
            <Terminal className="h-3.5 w-3.5 text-brand absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" strokeWidth={2} />
          </div>
        )}
      </div>

      {!collapsed && (
        <div className="px-4 pt-4 pb-2">
          <p className="text-[9px] text-gray-600 tracking-[0.3em] uppercase font-mono">
            {"// modules"}
          </p>
        </div>
      )}

      <nav className="flex-1 py-2 space-y-0.5 px-2">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              cn(
                "group flex items-center gap-3 px-3 py-2.5 text-xs font-medium transition-all duration-200 relative",
                isActive
                  ? "text-brand bg-brand/5 border-l-2 border-brand"
                  : "text-gray-500 hover:text-brand/80 hover:bg-brand/[0.03] border-l-2 border-transparent"
              )
            }
          >
            {({ isActive }) => (
              <>
                {/* Active glow indicator */}
                {isActive && (
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: "linear-gradient(90deg, rgba(0,255,65,0.06), transparent)",
                    }}
                  />
                )}
                <item.icon className={cn("h-4 w-4 shrink-0 transition-transform duration-200", isActive && "drop-shadow-[0_0_4px_rgba(0,255,65,0.5)]")} />
                {!collapsed && (
                  <>
                    <span className="flex-1">{item.label}</span>
                    {getBadge(item.to) || (
                      <span className={cn("text-[9px] font-mono tracking-wider transition-colors", isActive ? "text-brand/40" : "text-gray-700")}>
                        {item.code}
                      </span>
                    )}
                  </>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {!collapsed && (
        <div className="px-4 py-3 border-t border-brand/10 relative">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-brand/15 via-transparent to-transparent" />
          <div className="flex items-center gap-2 text-[9px] text-gray-600">
            <div className="h-1.5 w-1.5 rounded-full bg-brand status-dot" />
            <span className="tracking-wider font-mono">SYS.STATUS: ONLINE</span>
          </div>
          <div className="mt-1.5 h-px shimmer-line" />
        </div>
      )}

      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center p-3 border-t border-brand/10 text-gray-600 hover:text-brand hover:bg-brand/5 transition-all duration-200"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>
    </aside>
  );
}
