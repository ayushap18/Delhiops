import { useState, useCallback, useEffect } from "react";
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  InfoWindow,
} from "@react-google-maps/api";
import api, {
  type Incident,
  type Camera,
  type CrimeReport,
  type AqiReading,
} from "@/lib/api";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { getAqiLevel, formatDate } from "@/lib/utils";

const DELHI_CENTER = { lat: 28.6139, lng: 77.209 };

const darkMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#021a02" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#021a02" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#2d6a2d" }] },
  { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#0a300a" }] },
  { featureType: "administrative.land_parcel", elementType: "labels.text.fill", stylers: [{ color: "#1a4a1a" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#031f03" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#1a4a1a" }] },
  { featureType: "poi.park", elementType: "geometry.fill", stylers: [{ color: "#052805" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#0a2a0a" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#041504" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#0f350f" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#082008" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#082008" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#010d01" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#1a3a1a" }] },
];

const containerStyle = { width: "100%", height: "100%" };

type MarkerType = "incident" | "camera" | "crime" | "aqi";

interface MapData {
  incidents: Incident[];
  cameras: Camera[];
  crimes: CrimeReport[];
  aqiReadings: AqiReading[];
}

interface SelectedMarker {
  type: MarkerType;
  data: Incident | Camera | CrimeReport | AqiReading;
  position: { lat: number; lng: number };
}

interface DelhiMapProps {
  height?: string;
  showControls?: boolean;
}

export function DelhiMap({ height = "500px", showControls = true }: DelhiMapProps) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
  });

  const [mapData, setMapData] = useState<MapData>({
    incidents: [],
    cameras: [],
    crimes: [],
    aqiReadings: [],
  });
  const [layers, setLayers] = useState({
    incident: true,
    camera: true,
    crime: true,
    aqi: true,
  });
  const [selected, setSelected] = useState<SelectedMarker | null>(null);

  useEffect(() => {
    async function fetchMapData() {
      try {
        const [inc, cam, crm, aqi] = await Promise.all([
          api.get("/incidents", { params: { limit: 100, sort_order: "desc" } }),
          api.get("/cameras", { params: { limit: 200 } }),
          api.get("/crime", { params: { limit: 100, sort_order: "desc" } }),
          api.get("/aqi", { params: { limit: 100, sort_order: "desc" } }),
        ]);
        setMapData({
          incidents: inc.data.data || [],
          cameras: cam.data.data || [],
          crimes: crm.data.data || [],
          aqiReadings: aqi.data.data || [],
        });
      } catch (err) {
        console.error("Failed to fetch map data:", err);
      }
    }
    fetchMapData();
  }, []);

  const toggleLayer = (layer: MarkerType) => {
    setLayers((prev) => ({ ...prev, [layer]: !prev[layer] }));
  };

  const onMapClick = useCallback(() => setSelected(null), []);

  if (!isLoaded) return <LoadingSpinner />;

  return (
    <div className="relative overflow-hidden border border-brand/10" style={{ height }}>
      {showControls && (
        <div className="absolute top-3 left-3 z-10 flex gap-1.5 flex-wrap">
          {(["incident", "camera", "crime", "aqi"] as MarkerType[]).map((layer) => (
            <button
              key={layer}
              onClick={() => toggleLayer(layer)}
              className={`px-2.5 py-1 text-[9px] font-mono tracking-wider border transition-all ${
                layers[layer]
                  ? layer === "incident"
                    ? "bg-warning/10 text-warning border-warning/30"
                    : layer === "camera"
                    ? "bg-brand/10 text-brand border-brand/30"
                    : layer === "crime"
                    ? "bg-danger/10 text-danger border-danger/30"
                    : "bg-info/10 text-info border-info/30"
                  : "bg-gray-950/80 text-gray-700 border-gray-800"
              }`}
              aria-pressed={layers[layer]}
              aria-label={`Toggle ${layer} layer`}
            >
              {layer.charAt(0).toUpperCase() + layer.slice(1)}
            </button>
          ))}
        </div>
      )}

      <GoogleMap
        mapContainerStyle={containerStyle}
        center={DELHI_CENTER}
        zoom={11}
        onClick={onMapClick}
        options={{
          styles: darkMapStyle,
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
        }}
      >
        {layers.incident &&
          mapData.incidents.map((inc) =>
            inc.location ? (
              <Marker
                key={`inc-${inc.id}`}
                position={{ lat: inc.location.lat, lng: inc.location.lng }}
                icon={{
                  path: google.maps.SymbolPath.CIRCLE,
                  scale: 8,
                  fillColor: inc.severity === "critical" ? "#ef4444" : "#f97316",
                  fillOpacity: 0.9,
                  strokeColor: "#fff",
                  strokeWeight: 1,
                }}
                onClick={() =>
                  setSelected({
                    type: "incident",
                    data: inc,
                    position: { lat: inc.location.lat, lng: inc.location.lng },
                  })
                }
              />
            ) : null
          )}

        {layers.camera &&
          mapData.cameras.map((cam) =>
            cam.location ? (
              <Marker
                key={`cam-${cam.id}`}
                position={{ lat: cam.location.lat, lng: cam.location.lng }}
                icon={{
                  path: google.maps.SymbolPath.CIRCLE,
                  scale: 6,
                  fillColor: cam.status === "online" ? "#22c55e" : cam.status === "maintenance" ? "#f59e0b" : "#ef4444",
                  fillOpacity: 0.9,
                  strokeColor: "#fff",
                  strokeWeight: 1,
                }}
                onClick={() =>
                  setSelected({
                    type: "camera",
                    data: cam,
                    position: { lat: cam.location.lat, lng: cam.location.lng },
                  })
                }
              />
            ) : null
          )}

        {layers.crime &&
          mapData.crimes.map((crm) =>
            crm.location ? (
              <Marker
                key={`crm-${crm.id}`}
                position={{ lat: crm.location.lat, lng: crm.location.lng }}
                icon={{
                  path: google.maps.SymbolPath.CIRCLE,
                  scale: 7,
                  fillColor: "#3b82f6",
                  fillOpacity: 0.8,
                  strokeColor: "#fff",
                  strokeWeight: 1,
                }}
                onClick={() =>
                  setSelected({
                    type: "crime",
                    data: crm,
                    position: { lat: crm.location.lat, lng: crm.location.lng },
                  })
                }
              />
            ) : null
          )}

        {layers.aqi &&
          mapData.aqiReadings.map((aqi) =>
            aqi.location ? (
              <Marker
                key={`aqi-${aqi.id}`}
                position={{ lat: aqi.location.lat, lng: aqi.location.lng }}
                icon={{
                  path: google.maps.SymbolPath.CIRCLE,
                  scale: 10,
                  fillColor:
                    aqi.aqi <= 50
                      ? "#22c55e"
                      : aqi.aqi <= 100
                      ? "#f59e0b"
                      : aqi.aqi <= 200
                      ? "#f97316"
                      : "#ef4444",
                  fillOpacity: 0.7,
                  strokeColor: "#fff",
                  strokeWeight: 1,
                }}
                onClick={() =>
                  setSelected({
                    type: "aqi",
                    data: aqi,
                    position: { lat: aqi.location.lat, lng: aqi.location.lng },
                  })
                }
              />
            ) : null
          )}

        {selected && (
          <InfoWindow
            position={selected.position}
            onCloseClick={() => setSelected(null)}
          >
            <div className="bg-gray-900 text-gray-100 p-2 min-w-48 rounded">
              {selected.type === "incident" && (() => {
                const d = selected.data as Incident;
                return (
                  <div>
                    <p className="font-semibold text-sm">{d.type}</p>
                    <p className="text-xs text-gray-400 mt-1">{d.description}</p>
                    <div className="flex gap-2 mt-2">
                      <StatusBadge status={d.status} />
                      <span className="text-xs text-gray-500">{d.severity}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{formatDate(d.timestamp)}</p>
                  </div>
                );
              })()}
              {selected.type === "camera" && (() => {
                const d = selected.data as Camera;
                return (
                  <div>
                    <p className="font-semibold text-sm">Camera #{d.id}</p>
                    <StatusBadge status={d.status} />
                    <p className="text-xs text-gray-500 mt-1">{d.feed_url}</p>
                  </div>
                );
              })()}
              {selected.type === "crime" && (() => {
                const d = selected.data as CrimeReport;
                return (
                  <div>
                    <p className="font-semibold text-sm">{d.type}</p>
                    <div className="flex gap-2 mt-1">
                      <StatusBadge status={d.status} />
                      <span className="text-xs text-gray-500">{d.severity}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{formatDate(d.timestamp)}</p>
                  </div>
                );
              })()}
              {selected.type === "aqi" && (() => {
                const d = selected.data as AqiReading;
                const level = getAqiLevel(d.aqi);
                return (
                  <div>
                    <p className="font-semibold text-sm">AQI: {d.aqi}</p>
                    <p className={`text-xs font-medium ${level.color}`}>{level.label}</p>
                    <div className="text-xs text-gray-400 mt-1 space-y-0.5">
                      {d.pm2_5 != null && <p>PM2.5: {d.pm2_5}</p>}
                      {d.pm10 != null && <p>PM10: {d.pm10}</p>}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{formatDate(d.timestamp)}</p>
                  </div>
                );
              })()}
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
}
