import { useEffect, useState } from "react";
import {
  Wind,
  Car,
  ShieldAlert,
  Camera,
  AlertTriangle,
  Activity,
} from "lucide-react";
import { StatCard } from "./StatCard";
import api from "@/lib/api";

interface DashboardStats {
  totalIncidents: number;
  avgAqi: number;
  activeCameras: number;
  crimeReports: number;
  avgCongestion: number;
  totalTraffic: number;
  aqiSparkline: number[];
  trafficSparkline: number[];
}

export function StatsGrid() {
  const [stats, setStats] = useState<DashboardStats>({
    totalIncidents: 0,
    avgAqi: 0,
    activeCameras: 0,
    crimeReports: 0,
    avgCongestion: 0,
    totalTraffic: 0,
    aqiSparkline: [],
    trafficSparkline: [],
  });

  useEffect(() => {
    async function fetchStats() {
      try {
        const [incidents, aqi, cameras, crime, traffic] = await Promise.all([
          api.get("/incidents", { params: { limit: 1 } }),
          api.get("/aqi", { params: { limit: 50 } }),
          api.get("/cameras", { params: { limit: 1, status: "online" } }),
          api.get("/crime", { params: { limit: 1 } }),
          api.get("/traffic", { params: { limit: 50 } }),
        ]);

        const aqiData = aqi.data.data || [];
        const avgAqi =
          aqiData.length > 0
            ? Math.round(
                aqiData.reduce(
                  (sum: number, r: { aqi: number }) => sum + r.aqi,
                  0
                ) / aqiData.length
              )
            : 0;

        const trafficData = traffic.data.data || [];
        const avgCongestion =
          trafficData.length > 0
            ? Math.round(
                trafficData.reduce(
                  (sum: number, r: { congestion_level: number }) =>
                    sum + r.congestion_level,
                  0
                ) / trafficData.length
              )
            : 0;

        setStats({
          totalIncidents: incidents.data.pagination?.total || 0,
          avgAqi,
          activeCameras: cameras.data.pagination?.total || 0,
          crimeReports: crime.data.pagination?.total || 0,
          avgCongestion,
          totalTraffic: traffic.data.pagination?.total || 0,
          aqiSparkline: aqiData.map((r: { aqi: number }) => r.aqi).reverse(),
          trafficSparkline: trafficData.map((r: { congestion_level: number }) => r.congestion_level).reverse(),
        });
      } catch (err) {
        console.error("Failed to fetch stats:", err);
      }
    }
    fetchStats();
  }, []);

  const cards = [
    {
      title: "Incidents",
      value: stats.totalIncidents,
      icon: <AlertTriangle className="h-4 w-4" />,
      color: "text-warning",
      accentColor: "rgba(255,184,0,0.2)",
    },
    {
      title: "Avg AQI",
      value: stats.avgAqi,
      icon: <Wind className="h-4 w-4" />,
      color: "text-aqi-moderate",
      accentColor: "rgba(255,184,0,0.15)",
      sparklineData: stats.aqiSparkline,
    },
    {
      title: "Cameras",
      value: stats.activeCameras,
      icon: <Camera className="h-4 w-4" />,
      color: "text-brand",
      accentColor: "rgba(0,255,65,0.15)",
    },
    {
      title: "Crime",
      value: stats.crimeReports,
      icon: <ShieldAlert className="h-4 w-4" />,
      color: "text-danger",
      accentColor: "rgba(255,0,60,0.15)",
    },
    {
      title: "Congestion",
      value: `${stats.avgCongestion}%`,
      icon: <Car className="h-4 w-4" />,
      color: "text-info",
      accentColor: "rgba(0,212,255,0.15)",
      sparklineData: stats.trafficSparkline,
    },
    {
      title: "Traffic",
      value: stats.totalTraffic,
      icon: <Activity className="h-4 w-4" />,
      color: "text-brand",
      accentColor: "rgba(0,255,65,0.1)",
    },
  ];

  return (
    <div
      className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
      aria-label="Dashboard statistics"
    >
      {cards.map((card, i) => (
        <div key={card.title} className="stagger-child" style={{ animationDelay: `${i * 0.1}s` }}>
          <StatCard {...card} />
        </div>
      ))}
    </div>
  );
}
