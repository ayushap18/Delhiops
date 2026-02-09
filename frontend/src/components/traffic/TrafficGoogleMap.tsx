import { useCallback, useMemo, useState } from "react";
import {
  GoogleMap,
  useJsApiLoader,
  TrafficLayer,
  Marker,
  InfoWindow,
} from "@react-google-maps/api";
import type { TrafficData } from "@/lib/api";

interface TrafficGoogleMapProps {
  data: TrafficData[];
}

const DELHI_CENTER = { lat: 28.6139, lng: 77.209 };

const darkMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#0a1215" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0a1215" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#1a5a6a" }] },
  { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#0d2a35" }] },
  { featureType: "administrative.land_parcel", elementType: "labels.text.fill", stylers: [{ color: "#0d3a4a" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#0c1a20" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#0d3a4a" }] },
  { featureType: "poi.park", elementType: "geometry.fill", stylers: [{ color: "#0a1f15" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#112025" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#0a1518" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#153040" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#0d2028" }] },
  { featureType: "road.highway.controlled_access", elementType: "geometry", stylers: [{ color: "#1a3848" }] },
  { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#122830" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#0d2028" }] },
  { featureType: "transit.station", elementType: "labels.text.fill", stylers: [{ color: "#1a6a7a" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#081820" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#0d4a5a" }] },
];

const containerStyle = { width: "100%", height: "100%" };

// 25 signal intersections matching TrafficSignalMonitor
const SIGNAL_LOCATIONS = [
  { id: "SIG-001", name: "ITO Junction", lat: 28.6304, lng: 77.2505, priority: "critical" },
  { id: "SIG-002", name: "Kashmere Gate", lat: 28.6667, lng: 77.2273, priority: "critical" },
  { id: "SIG-003", name: "AIIMS Flyover", lat: 28.5672, lng: 77.2100, priority: "critical" },
  { id: "SIG-005", name: "Ashram Chowk", lat: 28.5697, lng: 77.2586, priority: "critical" },
  { id: "SIG-007", name: "Dhaula Kuan", lat: 28.5921, lng: 77.1562, priority: "critical" },
  { id: "SIG-010", name: "Connaught Place", lat: 28.6315, lng: 77.2167, priority: "critical" },
  { id: "SIG-014", name: "Sarai Kale Khan", lat: 28.5895, lng: 77.2568, priority: "critical" },
  { id: "SIG-004", name: "Moolchand", lat: 28.5713, lng: 77.2378, priority: "high" },
  { id: "SIG-006", name: "Rajouri Garden", lat: 28.6492, lng: 77.1224, priority: "high" },
  { id: "SIG-008", name: "Pragati Maidan", lat: 28.6238, lng: 77.2467, priority: "high" },
  { id: "SIG-009", name: "Nehru Place", lat: 28.5491, lng: 77.2533, priority: "high" },
  { id: "SIG-012", name: "Anand Vihar", lat: 28.6469, lng: 77.3161, priority: "high" },
  { id: "SIG-015", name: "Peeragarhi", lat: 28.6769, lng: 77.0939, priority: "high" },
  { id: "SIG-019", name: "Saket", lat: 28.5244, lng: 77.2090, priority: "high" },
  { id: "SIG-023", name: "Badarpur", lat: 28.5072, lng: 77.3029, priority: "high" },
  { id: "SIG-025", name: "Wazirabad", lat: 28.7146, lng: 77.2299, priority: "high" },
] as const;

type SignalHealth = "operational" | "fault" | "offline" | "degraded";

function getSignalHealth(seed: number, avgCongestion: number): SignalHealth {
  const faultThreshold = 85 - avgCongestion * 0.3;
  const val = ((seed * 37 + 13) % 100);
  if (val > 95) return "offline";
  if (val > faultThreshold) return "fault";
  if (val > faultThreshold - 8) return "degraded";
  return "operational";
}

const HEALTH_MARKER_COLORS: Record<SignalHealth, string> = {
  operational: "#00ff41",
  degraded: "#ffb800",
  fault: "#ff6600",
  offline: "#ff003c",
};

interface SelectedSignal {
  signal: typeof SIGNAL_LOCATIONS[number];
  health: SignalHealth;
  congestion: number;
}

export function TrafficGoogleMap({ data }: TrafficGoogleMapProps) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
  });

  const [selected, setSelected] = useState<SelectedSignal | null>(null);
  const [showTraffic, setShowTraffic] = useState(true);
  const [showSignals, setShowSignals] = useState(true);

  const avgCongestion = useMemo(() => {
    if (!data.length) return 40;
    return Math.round(data.reduce((s, d) => s + d.congestion_level, 0) / data.length);
  }, [data]);

  const signalMarkers = useMemo(() => {
    return SIGNAL_LOCATIONS.map((sig, i) => {
      const health = getSignalHealth(i, avgCongestion);
      const localCongestion = Math.max(5, Math.min(95, Math.round(
        avgCongestion + ((i * 19 + 11) % 40) - 20
      )));
      return { signal: sig, health, congestion: localCongestion };
    });
  }, [avgCongestion]);

  const onMapClick = useCallback(() => setSelected(null), []);

  if (!isLoaded) {
    return (
      <div className="bg-[#0a1215] border border-info/10 p-5 corner-borders relative flex items-center justify-center"
        style={{ minHeight: "460px" }}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-info status-dot" />
          <span className="text-[10px] font-mono text-info tracking-widest">LOADING MAP ENGINE...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0a1215] border border-info/10 corner-borders relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-info/20 to-transparent z-20" />

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 relative z-20 bg-black/60 backdrop-blur-sm">
        <div>
          <h3 className="text-[10px] font-mono text-info tracking-wider">
            {">"} GOOGLE_MAPS // LIVE TRAFFIC LAYER
          </h3>
          <p className="text-[7px] font-mono text-gray-700 tracking-wider">
            REAL-TIME ROAD CONDITIONS — DELHI NCR
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTraffic((p) => !p)}
            className={`px-2 py-0.5 text-[7px] font-mono tracking-wider border transition-all ${
              showTraffic
                ? "border-info/30 bg-info/10 text-info"
                : "border-gray-800 bg-gray-950 text-gray-600"
            }`}>
            TRAFFIC
          </button>
          <button
            onClick={() => setShowSignals((p) => !p)}
            className={`px-2 py-0.5 text-[7px] font-mono tracking-wider border transition-all ${
              showSignals
                ? "border-warning/30 bg-warning/10 text-warning"
                : "border-gray-800 bg-gray-950 text-gray-600"
            }`}>
            SIGNALS
          </button>
          <div className="flex items-center gap-1 ml-1">
            <div className="w-1.5 h-1.5 bg-info rounded-full status-dot" />
            <span className="text-[7px] font-mono text-info tracking-widest">LIVE</span>
          </div>
        </div>
      </div>

      {/* Map */}
      <div style={{ height: "420px" }}>
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={DELHI_CENTER}
          zoom={11}
          onClick={onMapClick}
          options={{
            styles: darkMapStyle,
            disableDefaultUI: true,
            zoomControl: true,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
            scaleControl: false,
            rotateControl: false,
          }}
        >
          {showTraffic && <TrafficLayer />}

          {showSignals &&
            signalMarkers.map(({ signal, health, congestion }) => (
              <Marker
                key={signal.id}
                position={{ lat: signal.lat, lng: signal.lng }}
                icon={{
                  path: google.maps.SymbolPath.CIRCLE,
                  scale: signal.priority === "critical" ? 9 : 7,
                  fillColor: HEALTH_MARKER_COLORS[health],
                  fillOpacity: health === "operational" ? 0.7 : 0.9,
                  strokeColor: health === "offline" ? "#ff003c" : "#fff",
                  strokeWeight: health === "offline" || health === "fault" ? 2 : 1,
                }}
                onClick={() => setSelected({ signal, health, congestion })}
              />
            ))}

          {selected && (
            <InfoWindow
              position={{ lat: selected.signal.lat, lng: selected.signal.lng }}
              onCloseClick={() => setSelected(null)}
            >
              <div className="bg-gray-900 text-gray-100 p-2.5 min-w-[180px] font-mono" style={{ fontSize: "10px" }}>
                <p className="font-bold tracking-wider text-[11px]" style={{ color: HEALTH_MARKER_COLORS[selected.health] }}>
                  {selected.signal.name.toUpperCase()}
                </p>
                <p className="text-gray-500 text-[8px] mt-0.5">{selected.signal.id} | {selected.signal.priority.toUpperCase()}</p>
                <div className="mt-2 space-y-1 text-[9px]">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Status:</span>
                    <span style={{ color: HEALTH_MARKER_COLORS[selected.health] }}>
                      {selected.health.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Congestion:</span>
                    <span style={{ color: selected.congestion > 60 ? "#ff003c" : selected.congestion > 40 ? "#ffb800" : "#00ff41" }}>
                      {selected.congestion}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Impact:</span>
                    <span style={{ color: selected.health === "offline" ? "#ff003c" : selected.health === "fault" ? "#ff6600" : "#00ff41" }}>
                      {selected.health === "offline" ? "SEVERE BACKUP" :
                       selected.health === "fault" ? "CAUSING DELAY" :
                       selected.health === "degraded" ? "MINOR DELAY" : "NORMAL FLOW"}
                    </span>
                  </div>
                </div>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </div>

      {/* Bottom bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-black/60 backdrop-blur-sm relative z-20">
        <div className="flex items-center gap-3">
          {[
            { c: "#00ff41", l: "OK" },
            { c: "#ffb800", l: "DEGR" },
            { c: "#ff6600", l: "FAULT" },
            { c: "#ff003c", l: "DOWN" },
          ].map((item) => (
            <div key={item.l} className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.c, opacity: 0.8 }} />
              <span className="text-[5px] font-mono text-gray-600 tracking-wider">{item.l}</span>
            </div>
          ))}
        </div>
        <span className="text-[6px] font-mono text-gray-700 tracking-wider">
          {signalMarkers.filter((s) => s.health !== "operational").length} ALERTS |{" "}
          {SIGNAL_LOCATIONS.length} SIGNALS
        </span>
      </div>
    </div>
  );
}
