import { useState, useEffect } from "react";
import api from "@/lib/api";

interface SidebarStats {
  openIncidents: number;
  onlineCameras: number;
  latestAqi: number;
}

export function useSidebarStats() {
  const [stats, setStats] = useState<SidebarStats>({
    openIncidents: 0,
    onlineCameras: 0,
    latestAqi: 0,
  });

  useEffect(() => {
    async function fetchStats() {
      try {
        const [incidents, cameras, aqi] = await Promise.all([
          api.get("/incidents", { params: { limit: 1, status: "open" } }),
          api.get("/cameras", { params: { limit: 1, status: "online" } }),
          api.get("/aqi", { params: { limit: 1 } }),
        ]);
        setStats({
          openIncidents: incidents.data.pagination?.total || 0,
          onlineCameras: cameras.data.pagination?.total || 0,
          latestAqi: aqi.data.data?.[0]?.aqi || 0,
        });
      } catch (err) {
        console.error("Failed to fetch sidebar stats:", err);
      }
    }
    fetchStats();
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, []);

  return stats;
}
