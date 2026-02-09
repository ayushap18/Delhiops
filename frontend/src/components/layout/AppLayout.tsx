import { useState, useEffect, useCallback } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { StatusBar } from "./StatusBar";
import { CommandTerminal } from "@/components/shared/CommandTerminal";
import { DetailPanel } from "@/components/shared/DetailPanel";
import { ToastContainer } from "@/components/shared/NotificationToast";
import { useToast } from "@/hooks/useToast";
import { useSocketEvent } from "@/hooks/useSocket";

export interface LayoutContext {
  openDetailPanel: (data: Record<string, unknown>, type: "incident" | "camera" | "aqi" | "crime" | "traffic", title: string) => void;
  closeDetailPanel: () => void;
}

export function AppLayout() {
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [detailPanel, setDetailPanel] = useState<{
    open: boolean;
    data: Record<string, unknown> | null;
    type: "incident" | "camera" | "aqi" | "crime" | "traffic";
    title: string;
  }>({ open: false, data: null, type: "incident", title: "" });

  const { toasts, addToast, dismissToast } = useToast();

  // Ctrl+K keyboard shortcut for terminal
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setTerminalOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Socket event → toast notifications
  useSocketEvent("incident:new", (data: unknown) => {
    const d = data as Record<string, unknown>;
    addToast({
      type: "critical",
      title: "NEW INCIDENT",
      message: String(d.type || "Unknown") + " — " + String(d.severity || ""),
      autoDismiss: 8000,
    });
  });

  useSocketEvent("aqi:alert", (data: unknown) => {
    const d = data as Record<string, unknown>;
    addToast({
      type: "warning",
      title: "AQI ALERT",
      message: `AQI level: ${d.aqi || "N/A"}`,
      autoDismiss: 6000,
    });
  });

  useSocketEvent("crime:report", (data: unknown) => {
    const d = data as Record<string, unknown>;
    addToast({
      type: "warning",
      title: "CRIME REPORT",
      message: String(d.type || "New report filed"),
      autoDismiss: 6000,
    });
  });

  const openDetailPanel = useCallback(
    (
      data: Record<string, unknown>,
      type: "incident" | "camera" | "aqi" | "crime" | "traffic",
      title: string
    ) => {
      setDetailPanel({ open: true, data, type, title });
    },
    []
  );

  const closeDetailPanel = useCallback(() => {
    setDetailPanel({ open: false, data: null, type: "incident", title: "" });
  }, []);

  const layoutContext: LayoutContext = { openDetailPanel, closeDetailPanel };

  return (
    <div className="flex h-screen overflow-hidden relative">
      <div className="scanline-overlay" />
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header onTerminalToggle={() => setTerminalOpen((prev) => !prev)} />
        <main
          id="main-content"
          className="flex-1 overflow-y-auto p-6 pb-14 grid-lines-bg relative"
          role="main"
        >
          <div className="scan-line" />
          <Outlet context={layoutContext} />
        </main>
        <StatusBar />
      </div>

      {/* Overlays */}
      <CommandTerminal
        open={terminalOpen}
        onClose={() => setTerminalOpen(false)}
      />
      <DetailPanel
        open={detailPanel.open}
        onClose={closeDetailPanel}
        title={detailPanel.title}
        entityType={detailPanel.type}
        data={detailPanel.data}
      />
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
